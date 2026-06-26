import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

function verifyHash(req: NextRequest, incomingHash: string): boolean {
  const secret = process.env.THEOREMREACH_SECRET_KEY;
  if (!secret) return true; // not configured — skip validation (dev only)

  // TheoremReach postback hash: HMAC-SHA1(UTF-8 key, URL without &hash=), base64 URL-safe no padding
  const url       = new URL(req.url);
  url.searchParams.delete("hash");
  const urlString = url.toString();
  const rawHash   = createHmac("sha1", secret).update(urlString).digest("base64");
  const expected  = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return expected === incomingHash;
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const q   = url.searchParams;

  const userId    = q.get("user_id")                ?? q.get("uid")     ?? "";
  const reward    = parseInt(q.get("reward")         ?? "0", 10);
  const offerId   = q.get("offer_id")               ?? q.get("campaign_id") ?? "";
  const sessionId = q.get("tx_id") ?? q.get("transaction_id") ?? q.get("session_id") ?? q.get("external_transaction_id") ?? "";
  const hash      = q.get("hash")                   ?? "";
  const isReversal = q.get("is_reversal") === "1"
    || q.get("reversal")  === "true"
    || q.get("reversal")  === "1"
    || q.get("status")    === "reversal";

  if (!userId || !sessionId || reward < 0) {
    console.warn("[postback/theoremreach] missing required fields", { userId, sessionId, reward });
    return new Response("Bad Request", { status: 400 });
  }

  if (hash && !verifyHash(req, hash)) {
    console.warn("[postback/theoremreach] hash validation failed", { sessionId });
    return new Response("Forbidden", { status: 403 });
  }

  const admin = createServerClient();

  // ─── Reversal ────────────────────────────────────────────────────────────────
  if (isReversal) {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_transaction_id", sessionId)
      .single();

    if (!existing || existing.status !== "credited") {
      console.log(`[postback/theoremreach] reversal for unknown/already-reversed trans ${sessionId}`);
      return new Response("OK", { status: 200 });
    }

    const coinsToReverse = existing.nexcoins_awarded as number;
    const contributorId  = existing.contributor_id as string;

    await admin.from("offerwall_transactions").update({ status: "reversed" }).eq("id", existing.id);

    const { data: profile } = await admin.from("profiles").select("nexcoins").eq("id", contributorId).single();
    const cur = (profile as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: cur - coinsToReverse }).eq("id", contributorId);

    await admin.from("coin_transactions").insert({
      contributor_id: contributorId,
      amount:         -coinsToReverse,
      type:           "reversed",
      source:         "offerwall",
      description:    `TheoremReach reversal (trans: ${sessionId})`,
    });

    await admin.from("notifications").insert({
      user_id: contributorId,
      title:   "Earning Reversed",
      message: `A TheoremReach survey reward of ${coinsToReverse} NexCoins was reversed.`,
      type:    "system",
    });

    console.log(`[postback/theoremreach] reversed ${coinsToReverse} coins from ${contributorId} (trans=${sessionId})`);
    return new Response("OK", { status: 200 });
  }

  // ─── Completion ───────────────────────────────────────────────────────────────
  if (reward <= 0) {
    console.log(`[postback/theoremreach] zero reward — ignoring (trans=${sessionId})`);
    return new Response("OK", { status: 200 });
  }

  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id, name")
    .eq("slug", "theoremreach")
    .single();

  if (provErr || !provider) {
    console.error("[postback/theoremreach] theoremreach row not found in offerwall_providers", provErr?.message);
    return new Response("Provider not found", { status: 404 });
  }

  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: sessionId,
    gross_amount:            reward,
    nexcoins_awarded:        reward,
    status:                  "credited",
    raw_payload: {
      query:      Object.fromEntries(q.entries()),
      offer_id:   offerId,
      reward_usd: q.get("reward_amount_in_dollars") ?? null,
    },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log(`[postback/theoremreach] duplicate trans ${sessionId} — skipping`);
      return new Response("OK", { status: 200 });
    }
    console.error("[postback/theoremreach] insert error:", insertErr.message);
    return new Response("Internal Server Error", { status: 500 });
  }

  // Credit NexCoins
  const { error: rpcErr } = await admin.rpc("increment_nexcoins", {
    p_contributor_id: userId,
    p_coins:          reward,
  });
  if (rpcErr) {
    console.warn("[postback/theoremreach] increment_nexcoins RPC failed, falling back:", rpcErr.message);
    const { data: p } = await admin.from("profiles").select("nexcoins").eq("id", userId).single();
    const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: cur + reward }).eq("id", userId);
  }

  await admin.from("coin_transactions").insert({
    contributor_id: userId,
    amount:         reward,
    type:           "earned",
    source:         "offerwall",
    description:    `TheoremReach survey (trans: ${sessionId})`,
  });

  // Streak update
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

  await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${reward} NexCoins from TheoremReach`,
    type:    "bonus_coins",
  });

  console.log(`[postback/theoremreach] ✓ credited ${reward} coins → ${userId} (trans=${sessionId})`);
  return new Response("OK", { status: 200 });
}

export async function GET(req: NextRequest) {
  return handlePostback(req);
}

export async function POST(req: NextRequest) {
  return handlePostback(req);
}
