import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

function computeHash(secret: string, urlStr: string): string {
  const raw = createHmac("sha1", secret).update(urlStr).digest("base64");
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function verifyHash(req: NextRequest, incomingHash: string): boolean {
  const secret = process.env.THEOREMREACH_SECRET_KEY;
  if (!secret) return true; // not configured — skip in dev

  const url = new URL(req.url);
  url.searchParams.delete("hash");
  return computeHash(secret, url.toString()) === incomingHash;
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const q   = url.searchParams;

  // TheoremReach debug/test callbacks — must return 200 and NOT credit anything
  if (q.get("debug") === "true" || q.get("debug") === "1") {
    console.log("[postback/theoremreach] debug callback — ignoring");
    return new Response("OK", { status: 200 });
  }

  const hash = q.get("hash") ?? "";
  if (hash && !verifyHash(req, hash)) {
    console.warn("[postback/theoremreach] hash validation failed");
    return new Response("Forbidden", { status: 403 });
  }

  const userId     = q.get("user_id")  ?? "";
  const reward     = parseInt(q.get("reward") ?? "0", 10); // NexCoins (exchange_rate=700 applied by TR)
  const txId       = q.get("tx_id")    ?? ""; // TheoremReach's unique ID — use for idempotency
  const isReversal = q.get("reversal") === "true" || q.get("reversal") === "1";
  const screenout  = q.get("screenout") === "1";

  if (!userId || !txId) {
    console.warn("[postback/theoremreach] missing user_id or tx_id", { userId, txId });
    return new Response("Bad Request", { status: 400 });
  }

  console.log("[postback/theoremreach]", {
    userId, txId, reward, isReversal, screenout,
    hash_prefix: hash.slice(0, 8) + "...",
  });

  const admin = createServerClient();

  // ─── Reversal ─────────────────────────────────────────────────────────────
  if (isReversal) {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_transaction_id", txId)
      .single();

    if (!existing || existing.status !== "credited") {
      console.log(`[postback/theoremreach] reversal: tx ${txId} not found or already reversed`);
      return new Response("OK", { status: 200 });
    }

    const coinsToReverse = existing.nexcoins_awarded as number;
    const contributorId  = existing.contributor_id  as string;

    await admin.from("offerwall_transactions").update({ status: "reversed" }).eq("id", existing.id);

    const { data: profile } = await admin.from("profiles").select("nexcoins").eq("id", contributorId).single();
    const cur = (profile as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: Math.max(0, cur - coinsToReverse) }).eq("id", contributorId);

    await admin.from("coin_transactions").insert({
      contributor_id: contributorId,
      amount:         -coinsToReverse,
      type:           "reversed",
      source:         "offerwall",
      description:    `TheoremReach reversal (tx: ${txId})`,
    });

    await admin.from("notifications").insert({
      user_id: contributorId,
      title:   "Earning Reversed",
      message: `A TheoremReach reward of ${coinsToReverse} NexCoins was reversed.`,
      type:    "system",
    });

    console.log(`[postback/theoremreach] reversed ${coinsToReverse} coins from ${contributorId} (tx=${txId})`);
    return new Response("OK", { status: 200 });
  }

  // ─── Completion ──────────────────────────────────────────────────────────
  if (reward <= 0) {
    console.log(`[postback/theoremreach] zero reward — ignoring (tx=${txId}, screenout=${screenout})`);
    return new Response("OK", { status: 200 });
  }

  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id")
    .eq("slug", "theoremreach")
    .single();

  if (provErr || !provider) {
    console.error("[postback/theoremreach] provider row not found:", provErr?.message);
    return new Response("Provider not found", { status: 404 });
  }

  // Idempotent insert — unique constraint on provider_transaction_id
  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: txId,
    gross_amount:            reward,
    nexcoins_awarded:        reward,
    status:                  "credited",
    raw_payload: {
      query:    Object.fromEntries(q.entries()),
      screenout,
    },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log(`[postback/theoremreach] duplicate tx ${txId} — skipping`);
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
    description:    `TheoremReach${screenout ? " (screenout)" : ""} (tx: ${txId})`,
  });

  await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${reward} NexCoins from TheoremReach`,
    type:    "bonus_coins",
  });

  console.log(`[postback/theoremreach] ✓ credited ${reward} coins → ${userId} (tx=${txId})`);
  return new Response("OK", { status: 200 });
}

export const GET  = (req: NextRequest) => handlePostback(req);
export const POST = (req: NextRequest) => handlePostback(req);
