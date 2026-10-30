import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { myLeadCoinsPerCurrency } from "@/lib/mylead-campaigns";

const logAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function logPostback(
  rawParams: Record<string, string>,
  hashValid: boolean | null,
  actionTaken: string,
  errorMessage?: string,
) {
  const { error } = await logAdmin.from("postback_logs").insert({
    provider:      "mylead",
    raw_params:    rawParams,
    hash_valid:    hashValid,
    action_taken:  actionTaken,
    error_message: errorMessage ?? null,
  });
  if (error) console.error("[postback/mylead] postback_logs insert failed:", error.message);
}

// MyLead hash: HMAC-SHA256(key=security_key, message=postback_url)
function verifyHash(secret: string, urlStr: string, incomingHash: string): boolean {
  if (!/^[\da-f]{64}$/i.test(incomingHash)) return false;
  const expected = createHmac("sha256", secret).update(urlStr).digest();
  const received = Buffer.from(incomingHash, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const url        = new URL(req.url);
  const q          = url.searchParams;
  const rawParams  = Object.fromEntries(q.entries());

  const isCampaignConversion = Boolean(q.get("ml_sub1")?.trim() || q.has("payout_decimal") || q.has("campaign_id"));
  const userId = (isCampaignConversion
    ? q.get("ml_sub1")?.trim() || q.get("user_id")?.trim()
    : q.get("user_id")?.trim() || q.get("ml_sub1")?.trim())
    || q.get("player_id")?.trim()
    || "";
  const txId = q.get("tx_id")?.trim() || q.get("transaction_id")?.trim() || "";
  const amount = Number(
    isCampaignConversion
      ? q.get("payout_decimal") ?? q.get("amount") ?? "0"
      : q.get("amount") ?? q.get("virtual_amount") ?? "0",
  ) || 0;
  const currency = q.get("currency")?.trim().toUpperCase() ?? "";
  const status  = q.get("status")?.trim().toLowerCase() ?? "";

  const admin = createServerClient();

  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id, name, postback_secret, contributor_share_pct, is_active")
    .eq("slug", "mylead")
    .single();

  if (provErr || !provider) {
    console.error("[postback/mylead] provider not found:", provErr?.message);
    await logPostback(rawParams, null, "error", "provider not found");
    return new Response("OK", { status: 200 });
  }

  if (!provider.is_active) {
    await logPostback(rawParams, null, "error", "provider disabled");
    return new Response("OK", { status: 200 });
  }

  const securityKey = provider.postback_secret?.trim();
  if (!securityKey) {
    await logPostback(rawParams, null, "error", "MyLead security key is not configured");
    return new Response("MyLead security key is not configured", { status: 503 });
  }

  // Verify X-MyLead-Security-Hash header
  const incomingHash = req.headers.get("x-mylead-security-hash");
  if (!incomingHash) {
    console.warn("[postback/mylead] missing X-MyLead-Security-Hash header");
    await logPostback(rawParams, false, "hash_invalid", "missing security header");
    return new Response("Missing MyLead security hash", { status: 403 });
  }
  const hashValid = verifyHash(securityKey, req.url, incomingHash);
  if (!hashValid) {
    console.warn("[postback/mylead] hash validation failed");
    await logPostback(rawParams, false, "hash_invalid");
    return new Response("Invalid MyLead security hash", { status: 403 });
  }

  if (!userId || !txId) {
    console.warn("[postback/mylead] missing user_id or tx_id", rawParams);
    await logPostback(rawParams, hashValid, "error", `missing user_id or tx_id`);
    return new Response("OK", { status: 200 });
  }

  // Rejected → reverse any prior credit
  if (status === "rejected") {
    const { data: reversed, error: reversalError } = await admin.rpc("reverse_offerwall_conversion", {
      p_provider_id: provider.id,
      p_provider_transaction_id: txId,
    });
    if (reversalError) {
      console.error("[postback/mylead] atomic reversal failed:", reversalError.message);
      await logPostback(rawParams, hashValid, "error", reversalError.message);
      return new Response("Internal Server Error", { status: 500 });
    }
    if (!reversed) {
      await logPostback(rawParams, hashValid, "reversal_ignored", "tx not found or already reversed");
      return new Response("OK", { status: 200 });
    }

    await admin.from("notifications").insert({
      user_id: userId,
      title:   "Earning Reversed",
      message: "A MyLead reward was reversed.",
      type:    "system",
    });

    console.log(`[postback/mylead] reversed tx=${txId}`);
    await logPostback(rawParams, hashValid, "reversed");
    return new Response("OK", { status: 200 });
  }

  // MyLead documents pending, pre_approved, approved, and rejected statuses.
  if (status !== "approved") {
    console.log(`[postback/mylead] status="${status}" — not crediting yet (tx=${txId})`);
    await logPostback(rawParams, hashValid, `skipped_${status || "unknown"}`);
    return new Response("OK", { status: 200 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn(`[postback/mylead] invalid reward amount (tx=${txId})`);
    await logPostback(rawParams, hashValid, "error", "invalid reward amount");
    return new Response("OK", { status: 200 });
  }

  const conversionRate = isCampaignConversion ? myLeadCoinsPerCurrency(currency) : null;
  if (isCampaignConversion && !conversionRate) {
    await logPostback(rawParams, hashValid, "error", `unsupported campaign currency: ${currency || "missing"}`);
    return new Response("OK", { status: 200 });
  }
  const userCoins = Math.max(1, Math.floor(amount * (conversionRate ?? 1)));
  const grossAmount = isCampaignConversion ? Math.max(1, Math.round(amount * 100)) : Math.round(amount);

  const { data: credited, error: creditError } = await admin.rpc("credit_offerwall_conversion", {
    p_provider_id: provider.id,
    p_contributor_id: userId,
    p_provider_transaction_id: txId,
    p_gross_amount: grossAmount,
    p_nexcoins_awarded: userCoins,
    p_raw_payload: { query: rawParams },
    p_provider_name: provider.name,
  });
  if (creditError) {
    console.error("[postback/mylead] atomic credit failed:", creditError.message);
    await logPostback(rawParams, hashValid, "error", creditError.message);
    return new Response("Internal Server Error", { status: 500 });
  }
  if (!credited) {
    await logPostback(rawParams, hashValid, "duplicate");
    return new Response("OK", { status: 200 });
  }
  const contributorCredit = userCoins;

  // Streak
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const { data: strTarget } = await admin.from("platform_settings").select("value").eq("key", "streak_tasks_required_per_day").single();
  const streakTarget = parseInt((strTarget as { value: string } | null)?.value ?? "5") || 5;
  const { error: sdErr } = await admin.rpc("increment_streak_day", {
    p_contributor_id: userId,
    p_day_date:       todayIST,
    p_target:         streakTarget,
  });
  if (sdErr) console.error("[postback/mylead] increment_streak_day:", sdErr.message);

  await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${contributorCredit} NexCoins from MyLead`,
    type:    "bonus_coins",
  });

  console.log(`[postback/mylead] ✓ credited ${contributorCredit} coins → ${userId} (tx=${txId})`);
  await logPostback(rawParams, hashValid, "credited");
  return new Response("OK", { status: 200 });
}

export const GET  = (req: NextRequest) => handlePostback(req);
export const POST = (req: NextRequest) => handlePostback(req);
