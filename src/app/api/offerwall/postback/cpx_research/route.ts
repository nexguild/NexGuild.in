import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

// CPX calling server IPs — logged if unexpected (hash is the primary guard)
const CPX_IPS = new Set(["188.40.3.73", "157.90.97.92"]);
// IPv6: 2a01:4f8:d0a:30ff::2 also valid but may not match after forwarding normalization

function verifyHash(transId: string, incoming: string): boolean {
  const secret = process.env.CPX_APP_SECURE_HASH;
  if (!secret) {
    console.warn("[postback/cpx_research] CPX_APP_SECURE_HASH not set — skipping hash validation");
    return true;
  }
  // CPX postback hash: md5(trans_id + "-" + app_secure_hash)
  const expected = createHash("md5").update(`${transId}-${secret}`).digest("hex");
  return expected === incoming;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

async function handleCpxPostback(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams;

  // All params from the registered postback URL (including subid_1, subid_2, ip_click)
  const status       = q.get("status");       // "1" = completion, "2" = fraud reversal
  const transId      = q.get("trans_id");
  const userId       = q.get("user_id");      // ext_user_id (contributor UUID)
  const type         = q.get("type");         // "complete" | "out" | "bonus"
  const amountLocal  = parseFloat(q.get("amount_local") ?? "0");
  const amountUsd    = parseFloat(q.get("amount_usd") ?? "0");
  const offerId      = q.get("offer_id") ?? "";
  const incomingHash = q.get("hash") ?? "";
  const subid1       = q.get("subid_1") ?? "";
  const subid2       = q.get("subid_2") ?? "";
  const ipClick      = q.get("ip_click") ?? "";

  if (!transId || !userId || !status) {
    console.warn("[postback/cpx_research] missing required fields");
    return new Response("Bad Request", { status: 400 });
  }

  // Primary security: hash validation — md5(trans_id + "-" + secret)
  if (!verifyHash(transId, incomingHash)) {
    console.warn(`[postback/cpx_research] invalid hash trans_id=${transId}`);
    return new Response("Forbidden", { status: 403 });
  }

  // Optional: log unexpected source IPs (non-blocking)
  const sourceIp = getClientIp(req);
  if (sourceIp && !CPX_IPS.has(sourceIp)) {
    console.warn(`[postback/cpx_research] unexpected source IP: ${sourceIp} (trans_id=${transId})`);
  }

  const admin = createServerClient();

  // ─── STATUS 2: Fraud reversal ─────────────────────────────────────────────
  if (status === "2") {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_transaction_id", transId)
      .single();

    if (!existing || existing.status !== "credited") {
      return new Response("OK", { status: 200 }); // nothing to reverse
    }

    const coinsToReverse = existing.nexcoins_awarded as number;
    const contributorId  = existing.contributor_id as string;

    await admin
      .from("offerwall_transactions")
      .update({ status: "reversed" })
      .eq("id", existing.id);

    const { data: profile } = await admin
      .from("profiles")
      .select("nexcoins")
      .eq("id", contributorId)
      .single();

    const currentBalance = (profile as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    // Allows negative balance — contributors with spent coins go negative and
    // are blocked from further redemptions until repaid. (Confirmed: option a)
    await admin
      .from("profiles")
      .update({ nexcoins: currentBalance - coinsToReverse })
      .eq("id", contributorId);

    await admin.from("coin_transactions").insert({
      contributor_id: contributorId,
      amount:         -coinsToReverse,
      type:           "reversed",
      source:         "offerwall",
      description:    `CPX Research fraud reversal (trans: ${transId})`,
    });

    await admin.from("notifications").insert({
      user_id: contributorId,
      title:   "Earning Reversed",
      message: `A CPX Research survey reward of ${coinsToReverse} NexCoins was reversed due to quality flags.`,
      type:    "system",
    });

    console.log(`[postback/cpx_research] reversed ${coinsToReverse} coins from ${contributorId}`);
    return new Response("OK", { status: 200 });
  }

  // ─── STATUS 1: Completion ──────────────────────────────────────────────────
  if (status === "1") {
    // Screen-outs: log, no coins
    if (type === "out") {
      console.log(`[postback/cpx_research] screen-out user=${userId} offer=${offerId} ip=${ipClick}`);
      return new Response("OK", { status: 200 });
    }

    if (type !== "complete" && type !== "bonus") {
      console.log(`[postback/cpx_research] unhandled type=${type}`);
      return new Response("OK", { status: 200 });
    }

    const { data: provider } = await admin
      .from("offerwall_providers")
      .select("id, name, contributor_share_pct")
      .eq("slug", "cpx_research")
      .single();

    if (!provider) {
      console.error("[postback/cpx_research] cpx_research row not found in offerwall_providers");
      return new Response("Provider not found", { status: 404 });
    }

    // contributor_share_pct should be 100 for CPX — the 30% margin is already
    // baked into CPX's Currency Factor (700). Admin must set this to 100 in
    // /admin/offerwalls → Configure → Contributor Share (%).
    const sharePct = Number(provider.contributor_share_pct);
    const gross    = amountLocal > 0 ? amountLocal : amountUsd;
    const nexcoinsAwarded = Math.max(1, Math.floor(gross * (sharePct / 100)));

    // UNIQUE(provider_id, provider_transaction_id) prevents double-credit
    const { error: insertErr } = await admin.from("offerwall_transactions").insert({
      provider_id:             provider.id,
      contributor_id:          userId,
      provider_transaction_id: transId,
      gross_amount:            gross,
      nexcoins_awarded:        nexcoinsAwarded,
      status:                  "credited",
      raw_payload: {
        query:    Object.fromEntries(q.entries()),
        subid_1:  subid1,
        subid_2:  subid2,
        ip_click: ipClick,
        offer_id: offerId,
        amount_usd: amountUsd,
      },
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        console.log(`[postback/cpx_research] duplicate trans ${transId} — skipping`);
        return new Response("OK", { status: 200 });
      }
      console.error("[postback/cpx_research] insert:", insertErr.message);
      return new Response("Internal Server Error", { status: 500 });
    }

    // Credit NexCoins
    const { error: rpcErr } = await admin.rpc("increment_nexcoins", {
      p_contributor_id: userId,
      p_coins:          nexcoinsAwarded,
    });
    if (rpcErr) {
      const { data: p } = await admin.from("profiles").select("nexcoins").eq("id", userId).single();
      const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
      await admin.from("profiles").update({ nexcoins: cur + nexcoinsAwarded }).eq("id", userId);
    }

    // Coin transaction log
    await admin.from("coin_transactions").insert({
      contributor_id: userId,
      amount:         nexcoinsAwarded,
      type:           "earned",
      source:         "offerwall",
      description:    `CPX Research ${type} (trans: ${transId})`,
    });

    // Update daily streak
    const today = new Date().toISOString().split("T")[0];
    const { data: sp } = await admin
      .from("profiles")
      .select("last_task_approved_date, tasks_approved_today")
      .eq("id", userId)
      .single();
    const spr = sp as { last_task_approved_date: string | null; tasks_approved_today: number | null } | null;
    await admin.from("profiles").update({
      last_task_approved_date: today,
      tasks_approved_today:    spr?.last_task_approved_date === today ? (spr.tasks_approved_today ?? 0) + 1 : 1,
    }).eq("id", userId);

    // In-app notification
    await admin.from("notifications").insert({
      user_id: userId,
      title:   "NexCoins Earned!",
      message: `+${nexcoinsAwarded} NexCoins from CPX Research`,
      type:    "bonus_coins",
    });

    console.log(`[postback/cpx_research] credited ${nexcoinsAwarded} coins → ${userId} (trans=${transId})`);
    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}

export async function GET(req: NextRequest) {
  return handleCpxPostback(req);
}

export async function POST(req: NextRequest) {
  return handleCpxPostback(req);
}
