import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";

// Set CPX_POSTBACK_DEBUG=true in Vercel env vars to bypass hash validation
// and confirm the rest of the pipeline works. Remove after debugging.
const DEBUG = process.env.CPX_POSTBACK_DEBUG === "true";

// Dedicated service-role client for postback_logs writes — guaranteed to bypass RLS
const logAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const CPX_IPS = new Set(["188.40.3.73", "157.90.97.92"]);
const CPX_COINS_PER_USD = 660;

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
    const { data: provider, error: providerError } = await admin
      .from("offerwall_providers")
      .select("id")
      .eq("slug", "cpx_research")
      .single();
    if (providerError || !provider) {
      await logPostback(rawParams, hashValid, "error", providerError?.message ?? "provider not found");
      return new Response("Internal Server Error", { status: 500 });
    }

    const { data: reversed, error: reversalError } = await admin.rpc("reverse_offerwall_conversion", {
      p_provider_id: provider.id,
      p_provider_transaction_id: transId,
    });
    if (reversalError) {
      console.error("[postback/cpx_research] atomic reversal failed:", reversalError.message);
      await logPostback(rawParams, hashValid, "error", reversalError.message);
      return new Response("Internal Server Error", { status: 500 });
    }
    if (!reversed) {
      await logPostback(rawParams, hashValid, "reversal_ignored", `trans not found or already reversed: ${transId}`);
      return new Response("OK", { status: 200 });
    }

    await admin.from("notifications").insert({
      user_id: userId,
      title:   "Earning Reversed",
      message: "A CPX Research reward was reversed due to quality flags.",
      type:    "system",
    });

    console.log(`[postback/cpx_research] reversed trans=${transId}`);
    await logPostback(rawParams, hashValid, "reversed");
    return new Response("OK", { status: 200 });
  }

  // ─── STATUS 1: Completion ─────────────────────────────────────────────────
  if (status === "1") {
    if (type === "out" || type === "out_quality") {
      if (amountLocal <= 0 && amountUsd <= 0) {
        console.log(`[postback/cpx_research] screen-out without a reward user=${userId} offer=${offerId}`);
        await logPostback(rawParams, hashValid, "screenout_no_reward", `screen-out without reward (offer: ${offerId})`);
        return new Response("OK", { status: 200 });
      }
    }

    if (type !== "complete" && type !== "bonus" && type !== "out" && type !== "out_quality") {
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

    // Prefer CPX's local-currency payout; use its configured 660:1 USD rate as fallback.
    const gross     = amountLocal > 0 ? amountLocal : amountUsd * CPX_COINS_PER_USD;
    if (gross <= 0) {
      console.warn(`[postback/cpx_research] zero reward amount for ${type} (trans=${transId})`);
      await logPostback(rawParams, hashValid, "error", `zero reward amount for ${type}`);
      return new Response("OK", { status: 200 });
    }
    const userCoins = Math.max(1, Math.floor(gross));

    console.log("[postback/cpx_research] crediting", {
      user_id: userId, trans_id: transId, type,
      gross, user_coins: userCoins,
    });

    const { data: credited, error: creditError } = await admin.rpc("credit_offerwall_conversion", {
      p_provider_id: provider.id,
      p_contributor_id: userId,
      p_provider_transaction_id: transId,
      p_gross_amount: Math.round(gross),
      p_nexcoins_awarded: userCoins,
      p_raw_payload: {
        query:      rawParams,
        subid_1:    subid1,
        subid_2:    subid2,
        ip_click:   ipClick,
        offer_id:   offerId,
        amount_usd: amountUsd,
        debug:      DEBUG,
      },
      p_provider_name: provider.name,
    });

    if (creditError) {
      console.error("[postback/cpx_research] atomic credit failed:", creditError.message);
      await logPostback(rawParams, hashValid, "error", creditError.message);
      return new Response("Internal Server Error", { status: 500 });
    }
    if (!credited) {
      await logPostback(rawParams, hashValid, "duplicate");
      return new Response("OK", { status: 200 });
    }
    const contributorCredit = userCoins;

    // Increment daily streak counter (status=2 reversals and screen-outs returned early above)
    {
      const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const { data: strTarget } = await admin.from("platform_settings").select("value").eq("key", "streak_tasks_required_per_day").single();
      const streakTarget = parseInt((strTarget as { value: string } | null)?.value ?? "5") || 5;
      const { error: sdErr } = await admin.rpc("increment_streak_day", {
        p_contributor_id: userId,
        p_day_date:       todayIST,
        p_target:         streakTarget,
      });
      if (sdErr) console.error("[postback/cpx_research] increment_streak_day:", sdErr.message);
    }

    await admin.from("notifications").insert({
      user_id: userId,
      title:   "NexCoins Earned!",
      message: `+${contributorCredit} NexCoins from CPX Research`,
      type:    "bonus_coins",
    });

    console.log(`[postback/cpx_research] ✓ credited ${contributorCredit} coins → ${userId} (trans=${transId})`);
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
