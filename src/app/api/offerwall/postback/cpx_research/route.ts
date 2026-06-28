import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";

// Set CPX_POSTBACK_DEBUG=true in Vercel env vars to bypass hash validation
// and confirm the rest of the pipeline works. Remove after debugging.
const DEBUG = process.env.CPX_POSTBACK_DEBUG === "true";

type AdminClient = ReturnType<typeof createServerClient>;

// Dedicated service-role client for postback_logs writes — guaranteed to bypass RLS
const logAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const CPX_IPS = new Set(["188.40.3.73", "157.90.97.92"]);

function verifyHash(transId: string, incoming: string): { ok: boolean; detail: string } {
  const secret = process.env.CPX_APP_SECURE_HASH;

  if (!secret) {
    return { ok: true, detail: "CPX_APP_SECURE_HASH not set — skipping validation" };
  }

  const input    = `${transId}-${secret}`;
  const expected = createHash("md5").update(input).digest("hex");
  const ok       = expected === incoming;

  console.log("[postback/cpx_research] hash_check", {
    trans_id:      transId,
    secret_set:    true,
    secret_prefix: secret.slice(0, 4) + "****",
    hash_input:    input,
    hash_expected: expected,
    hash_received: incoming,
    match:         ok,
  });

  return { ok, detail: ok ? "ok" : `expected=${expected} got=${incoming}` };
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

async function logPostback(
  rawParams: Record<string, string>,
  hashValid: boolean | null,
  actionTaken: string,
  errorMessage?: string,
) {
  const { error } = await logAdmin.from("postback_logs").insert({
    provider:      "cpx_research",
    raw_params:    rawParams,
    hash_valid:    hashValid,
    action_taken:  actionTaken,
    error_message: errorMessage ?? null,
  });
  if (error) {
    console.error("[postback/cpx_research] postback_logs insert failed:", error.code, error.message, error.details);
  }
}

async function handleCpxPostback(req: NextRequest): Promise<Response> {
  const url       = new URL(req.url);
  const q         = url.searchParams;
  const rawParams = Object.fromEntries(q.entries());

  // Completely empty — nothing to log, just reject
  if (Object.keys(rawParams).length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const admin = createServerClient();

  const status       = q.get("status");
  const transId      = q.get("trans_id");
  const userId       = q.get("user_id");
  const type         = q.get("type");
  const amountLocal  = parseFloat(q.get("amount_local") ?? "0");
  const amountUsd    = parseFloat(q.get("amount_usd")   ?? "0");
  const offerId      = q.get("offer_id")  ?? "";
  const incomingHash = q.get("hash")      ?? "";
  const subid1       = q.get("subid_1")   ?? "";
  const subid2       = q.get("subid_2")   ?? "";
  const ipClick      = q.get("ip_click")  ?? "";
  const sourceIp     = getClientIp(req);

  if (!transId || !userId || !status) {
    console.warn("[postback/cpx_research] missing required fields", { transId, userId, status });
    await logPostback(rawParams, null, "error", "missing trans_id, user_id, or status");
    return new Response("OK", { status: 200 });
  }

  // ── Hash validation ──────────────────────────────────────────────────────
  const hashResult = verifyHash(transId, incomingHash);

  if (!hashResult.ok) {
    if (DEBUG) {
      console.warn(`[postback/cpx_research] DEBUG MODE — hash failed (${hashResult.detail}) but continuing`);
    } else {
      console.warn(`[postback/cpx_research] hash validation failed (${hashResult.detail})`);
      await logPostback(rawParams, false, "hash_invalid", hashResult.detail);
      // Always return 200 — CPX won't retry; we have the log to investigate
      return new Response("OK", { status: 200 });
    }
  }

  const hashValid = hashResult.ok;

  if (sourceIp && !CPX_IPS.has(sourceIp)) {
    console.warn(`[postback/cpx_research] unexpected source IP: ${sourceIp} (trans_id=${transId})`);
  }

  // ─── STATUS 2: Fraud reversal ────────────────────────────────────────────
  if (status === "2") {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_transaction_id", transId)
      .single();

    if (!existing || existing.status !== "credited") {
      console.log(`[postback/cpx_research] reversal for unknown/already-reversed trans ${transId}`);
      await logPostback(rawParams, hashValid, "reversed", `trans not found or already reversed: ${transId}`);
      return new Response("OK", { status: 200 });
    }

    const coinsToReverse = existing.nexcoins_awarded as number;
    const contributorId  = existing.contributor_id as string;

    await admin.from("offerwall_transactions").update({ status: "reversed" }).eq("id", existing.id);

    const { data: profile } = await admin.from("profiles").select("nexcoins").eq("id", contributorId).single();
    const currentBalance = (profile as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: Math.max(0, currentBalance - coinsToReverse) }).eq("id", contributorId);

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
    await logPostback(rawParams, hashValid, "reversed");
    return new Response("OK", { status: 200 });
  }

  // ─── STATUS 1: Completion ─────────────────────────────────────────────────
  if (status === "1") {
    if (type === "out") {
      console.log(`[postback/cpx_research] screen-out user=${userId} offer=${offerId}`);
      await logPostback(rawParams, hashValid, "error", `screen-out (offer: ${offerId})`);
      return new Response("OK", { status: 200 });
    }

    if (type !== "complete" && type !== "bonus") {
      console.log(`[postback/cpx_research] unhandled type=${type} — returning OK`);
      await logPostback(rawParams, hashValid, "error", `unhandled type: ${type}`);
      return new Response("OK", { status: 200 });
    }

    const { data: provider, error: provErr } = await admin
      .from("offerwall_providers")
      .select("id, name, contributor_share_pct")
      .eq("slug", "cpx_research")
      .single();

    if (provErr || !provider) {
      console.error("[postback/cpx_research] cpx_research row not found in offerwall_providers", provErr?.message);
      await logPostback(rawParams, hashValid, "error", `provider lookup failed: ${provErr?.message}`);
      return new Response("OK", { status: 200 });
    }

    const sharePct        = Number(provider.contributor_share_pct);
    const gross           = amountLocal > 0 ? amountLocal : amountUsd;
    const nexcoinsAwarded = Math.max(1, Math.floor(gross * (sharePct / 100)));

    console.log("[postback/cpx_research] crediting", {
      user_id: userId, trans_id: transId, type,
      gross, share_pct: sharePct, nexcoins: nexcoinsAwarded,
    });

    const { error: insertErr } = await admin.from("offerwall_transactions").insert({
      provider_id:             provider.id,
      contributor_id:          userId,
      provider_transaction_id: transId,
      gross_amount:            gross,
      nexcoins_awarded:        nexcoinsAwarded,
      status:                  "credited",
      raw_payload: {
        query:      rawParams,
        subid_1:    subid1,
        subid_2:    subid2,
        ip_click:   ipClick,
        offer_id:   offerId,
        amount_usd: amountUsd,
        debug:      DEBUG,
      },
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        console.log(`[postback/cpx_research] duplicate trans ${transId} — skipping`);
        await logPostback(rawParams, hashValid, "duplicate");
        return new Response("OK", { status: 200 });
      }
      console.error("[postback/cpx_research] insert error:", insertErr.message);
      await logPostback(rawParams, hashValid, "error", `tx insert failed: ${insertErr.message}`);
      return new Response("OK", { status: 200 });
    }

    // Credit NexCoins
    const { error: rpcErr } = await admin.rpc("increment_nexcoins", {
      p_contributor_id: userId,
      p_coins:          nexcoinsAwarded,
    });
    if (rpcErr) {
      console.warn("[postback/cpx_research] increment_nexcoins RPC failed, falling back:", rpcErr.message);
      const { data: p } = await admin.from("profiles").select("nexcoins").eq("id", userId).single();
      const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
      await admin.from("profiles").update({ nexcoins: cur + nexcoinsAwarded }).eq("id", userId);
    }

    await admin.from("coin_transactions").insert({
      contributor_id: userId,
      amount:         nexcoinsAwarded,
      type:           "earned",
      source:         "offerwall",
      description:    `CPX Research ${type} (trans: ${transId})`,
    });

    await admin.from("notifications").insert({
      user_id: userId,
      title:   "NexCoins Earned!",
      message: `+${nexcoinsAwarded} NexCoins from CPX Research`,
      type:    "bonus_coins",
    });

    console.log(`[postback/cpx_research] ✓ credited ${nexcoinsAwarded} coins → ${userId} (trans=${transId})`);
    await logPostback(rawParams, hashValid, "credited");
    return new Response("OK", { status: 200 });
  }

  console.log(`[postback/cpx_research] unhandled status=${status}`);
  await logPostback(rawParams, hashValid, "error", `unhandled status: ${status}`);
  return new Response("OK", { status: 200 });
}

export async function GET(req: NextRequest) {
  return handleCpxPostback(req);
}

export async function POST(req: NextRequest) {
  return handleCpxPostback(req);
}
