import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { creditOfferwallUserShare } from "@/lib/nexleader-commission";

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

function verifyUrlHash(req: NextRequest, incomingHash: string): boolean {
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

/**
 * Merge URL query params with POST body params.
 * TheoremReach survey completions use GET/URL-params;
 * offer/offerwall completions often use POST with a JSON or form-encoded body.
 */
async function extractParams(req: NextRequest): Promise<Record<string, string>> {
  const url    = new URL(req.url);
  const merged: Record<string, string> = Object.fromEntries(url.searchParams.entries());

  // If this is a POST and the URL has no params (or is missing critical fields),
  // also try to parse the body so offer postbacks aren't silently dropped.
  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      let bodyParams: Record<string, string> = {};

      if (contentType.includes("application/json")) {
        const body = await req.json() as Record<string, unknown>;
        if (body && typeof body === "object") {
          bodyParams = Object.fromEntries(
            Object.entries(body).map(([k, v]) => [k, String(v)])
          );
        }
      } else {
        // form-encoded or plain text — try URLSearchParams
        const text = await req.text();
        if (text.trim()) {
          try {
            bodyParams = Object.fromEntries(new URLSearchParams(text).entries());
          } catch {
            // last resort: try JSON in text/plain
            try {
              const parsed = JSON.parse(text) as Record<string, unknown>;
              if (parsed && typeof parsed === "object") {
                bodyParams = Object.fromEntries(
                  Object.entries(parsed).map(([k, v]) => [k, String(v)])
                );
              }
            } catch { /* ignore */ }
          }
        }
      }

      // Body params fill in; URL params take precedence on conflict
      Object.assign(merged, bodyParams, merged);
    } catch (err) {
      console.error("[postback/theoremreach] failed to parse POST body:", err);
    }
  }

  return merged;
}

/**
 * TheoremReach uses different field names across their survey vs offer products.
 * Resolve the canonical value by checking all known aliases.
 */
function resolveField(params: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (params[k] !== undefined && params[k] !== "") return params[k];
  }
  return "";
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const rawParams = await extractParams(req);

  // Completely empty — log a minimal entry so we at least have a trace
  if (Object.keys(rawParams).length === 0) {
    console.warn("[postback/theoremreach] received empty params (method:", req.method, ")");
    await logPostback({}, null, "error", `empty params (${req.method})`);
    return new Response("Bad Request", { status: 400 });
  }

  const admin = createServerClient();

  // Debug/test callbacks — log and return 200, no credit
  if (rawParams.debug === "true" || rawParams.debug === "1") {
    console.log("[postback/theoremreach] debug callback — ignoring", rawParams);
    await logPostback(rawParams, null, "debug_ignored");
    return new Response("OK", { status: 200 });
  }

  // Hash verification — only for URL-based hashes (survey postbacks).
  // Offer postbacks via POST body typically don't include a URL hash.
  const hash      = rawParams.hash ?? "";
  let   hashValid: boolean | null = null;
  if (hash) {
    hashValid = verifyUrlHash(req, hash);
    if (!hashValid) {
      console.warn("[postback/theoremreach] hash validation failed", rawParams);
      await logPostback(rawParams, false, "hash_invalid");
      return new Response("OK", { status: 200 });
    }
  }

  // Resolve field names — TheoremReach uses different names for surveys vs offers
  const userId     = resolveField(rawParams, "user_id", "uid", "publisher_user_id");
  const txId       = resolveField(rawParams, "tx_id", "trans_id", "transaction_id", "tid", "offer_transaction_id");
  const rewardStr  = resolveField(rawParams, "reward", "payout", "amount", "coins");
  const reward     = parseInt(rewardStr || "0", 10);
  const isReversal = rawParams.reversal === "true" || rawParams.reversal === "1";
  const screenout  = rawParams.screenout === "1";

  if (!userId || !txId) {
    console.warn("[postback/theoremreach] missing user_id/tx_id — params:", JSON.stringify(rawParams));
    await logPostback(rawParams, hashValid, "error", `missing user_id or tx_id (resolved: uid='${userId}' txid='${txId}')`);
    return new Response("OK", { status: 200 });
  }

  console.log("[postback/theoremreach]", {
    userId, txId, reward, isReversal, screenout,
    hash_valid: hashValid,
    method: req.method,
    paramKeys: Object.keys(rawParams).join(","),
  });

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
    await logPostback(rawParams, hashValid, "error", `zero reward (resolved reward='${rewardStr}')`);
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

  // Exchange rate in TheoremReach dashboard = 660, so reward IS the user's coin amount
  const userCoins = Math.max(1, reward);

  // Idempotent insert — unique constraint on provider_transaction_id
  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: txId,
    gross_amount:            reward,
    nexcoins_awarded:        userCoins,
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

  // Credit user their exact share; NexLeader gets 10/66 on top automatically
  const { contributorCredit } = await creditOfferwallUserShare(
    admin as unknown as AdminClient,
    userId,
    userCoins,
    `TheoremReach${screenout ? " (screenout)" : ""} (tx: ${txId})`,
  ).catch((err) => {
    console.error("[postback/theoremreach] creditOfferwallUserShare failed:", err);
    return { contributorCredit: userCoins };
  });

  // Increment daily streak counter
  {
    const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const { data: strTarget } = await admin.from("platform_settings").select("value").eq("key", "streak_tasks_required_per_day").single();
    const streakTarget = parseInt((strTarget as { value: string } | null)?.value ?? "5") || 5;
    const { error: sdErr } = await admin.rpc("increment_streak_day", {
      p_contributor_id: userId,
      p_day_date:       todayIST,
      p_target:         streakTarget,
    });
    if (sdErr) console.error("[postback/theoremreach] increment_streak_day:", sdErr.message);
  }

  await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${contributorCredit} NexCoins from TheoremReach`,
    type:    "bonus_coins",
  });

  console.log(`[postback/theoremreach] ✓ credited ${contributorCredit} coins → ${userId} (tx=${txId})`);
  await logPostback(rawParams, hashValid, "credited");
  return new Response("OK", { status: 200 });
}

export const GET  = (req: NextRequest) => handlePostback(req);
export const POST = (req: NextRequest) => handlePostback(req);
