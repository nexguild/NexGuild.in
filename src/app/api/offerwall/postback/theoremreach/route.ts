import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";

type AdminClient = ReturnType<typeof createServerClient>;

// Dedicated service-role client for postback_logs writes — guaranteed to bypass RLS
const logAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

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

async function logPostback(
  rawParams: Record<string, string>,
  hashValid: boolean | null,
  actionTaken: string,
  errorMessage?: string,
) {
  const { error } = await logAdmin.from("postback_logs").insert({
    provider:      "theoremreach",
    raw_params:    rawParams,
    hash_valid:    hashValid,
    action_taken:  actionTaken,
    error_message: errorMessage ?? null,
  });
  if (error) {
    console.error("[postback/theoremreach] postback_logs insert failed:", error.code, error.message, error.details);
  }
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const url       = new URL(req.url);
  const q         = url.searchParams;
  const rawParams = Object.fromEntries(q.entries());

  // Completely empty — no params at all, nothing to log
  if (Object.keys(rawParams).length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const admin = createServerClient();

  // TheoremReach debug/test callbacks — log and return 200, no credit
  if (q.get("debug") === "true" || q.get("debug") === "1") {
    console.log("[postback/theoremreach] debug callback — ignoring");
    await logPostback(rawParams, null, "debug_ignored");
    return new Response("OK", { status: 200 });
  }

  const hash      = q.get("hash") ?? "";
  const hashValid = hash ? verifyHash(req, hash) : null; // null = hash not provided

  if (hashValid === false) {
    // Log the suspicious callback but always return 200 — TheoremReach won't retry on 200
    console.warn("[postback/theoremreach] hash validation failed");
    await logPostback(rawParams, false, "hash_invalid");
    return new Response("OK", { status: 200 });
  }

  const userId     = q.get("user_id")  ?? "";
  const reward     = parseInt(q.get("reward") ?? "0", 10);
  const txId       = q.get("tx_id")    ?? "";
  const isReversal = q.get("reversal") === "true" || q.get("reversal") === "1";
  const screenout  = q.get("screenout") === "1";

  if (!userId || !txId) {
    console.warn("[postback/theoremreach] missing user_id or tx_id");
    await logPostback(rawParams, hashValid, "error", "missing user_id or tx_id");
    return new Response("OK", { status: 200 });
  }

  // Confirm hash validation outcome — visible in Vercel logs for every real postback
  console.log("[postback/theoremreach]", {
    userId, txId, reward, isReversal, screenout,
    hash_valid: hashValid,         // true = validated, null = no hash param sent
    hash_prefix: hash.slice(0, 8) + "...",
  });

  // Screenout logic: TheoremReach sends reward > 0 for partial screenouts → credit it.
  // Zero-reward screenouts are caught by the reward <= 0 check below and not credited.

  // ─── Reversal ─────────────────────────────────────────────────────────────
  if (isReversal) {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_transaction_id", txId)
      .single();

    if (!existing || existing.status !== "credited") {
      console.log(`[postback/theoremreach] reversal: tx ${txId} not found or already reversed`);
      await logPostback(rawParams, hashValid, "reversed", `tx not found or already reversed: ${txId}`);
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
    await logPostback(rawParams, hashValid, "reversed");
    return new Response("OK", { status: 200 });
  }

  // ─── Completion ──────────────────────────────────────────────────────────
  if (reward <= 0) {
    console.log(`[postback/theoremreach] zero reward — ignoring (tx=${txId}, screenout=${screenout})`);
    await logPostback(rawParams, hashValid, "error", "zero reward");
    return new Response("OK", { status: 200 });
  }

  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id")
    .eq("slug", "theoremreach")
    .single();

  if (provErr || !provider) {
    console.error("[postback/theoremreach] provider row not found:", provErr?.message);
    await logPostback(rawParams, hashValid, "error", `provider lookup failed: ${provErr?.message}`);
    return new Response("OK", { status: 200 });
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
      query: rawParams,
      screenout,
    },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log(`[postback/theoremreach] duplicate tx ${txId} — skipping`);
      await logPostback(rawParams, hashValid, "duplicate");
      return new Response("OK", { status: 200 });
    }
    console.error("[postback/theoremreach] insert error:", insertErr.message);
    await logPostback(rawParams, hashValid, "error", `tx insert failed: ${insertErr.message}`);
    return new Response("OK", { status: 200 });
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
  await logPostback(rawParams, hashValid, "credited");
  return new Response("OK", { status: 200 });
}

export const GET  = (req: NextRequest) => handlePostback(req);
export const POST = (req: NextRequest) => handlePostback(req);
