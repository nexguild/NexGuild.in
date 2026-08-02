import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { creditOfferwallUserShare } from "@/lib/nexleader-commission";

type AdminClient = ReturnType<typeof createServerClient>;

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
    provider:      "clickwall",
    raw_params:    rawParams,
    hash_valid:    hashValid,
    action_taken:  actionTaken,
    error_message: errorMessage ?? null,
  });
  if (error) console.error("[postback/clickwall] postback_logs insert failed:", error.message);
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const url       = new URL(req.url);
  const q         = url.searchParams;
  const rawParams = Object.fromEntries(q.entries());

  const userId        = q.get("user_id") ?? "";
  const txId          = q.get("txid")    ?? "";
  const amount        = parseFloat(q.get("amount") ?? "0") || 0;
  const incomingSecret = q.get("secret") ?? "";

  const admin = createServerClient();

  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id, name, postback_secret, is_active")
    .eq("slug", "clickwall")
    .single();

  if (provErr || !provider) {
    console.error("[postback/clickwall] provider not found:", provErr?.message);
    await logPostback(rawParams, null, "error", "provider not found");
    return new Response("OK", { status: 200 });
  }

  if (!provider.is_active) {
    await logPostback(rawParams, null, "error", "provider disabled");
    return new Response("OK", { status: 200 });
  }

  // Static secret check
  const expectedSecret = provider.postback_secret as string | null;
  const secretValid = expectedSecret ? incomingSecret === expectedSecret : true;

  if (!secretValid) {
    console.warn("[postback/clickwall] secret mismatch — possible spoofed postback");
    await logPostback(rawParams, false, "hash_invalid", "secret mismatch");
    return new Response("OK", { status: 200 });
  }

  if (!userId || !txId) {
    console.warn("[postback/clickwall] missing user_id or txid", rawParams);
    await logPostback(rawParams, true, "error", "missing user_id or txid");
    return new Response("OK", { status: 200 });
  }

  if (amount <= 0) {
    console.warn(`[postback/clickwall] zero amount (tx=${txId})`);
    await logPostback(rawParams, true, "error", "zero amount");
    return new Response("OK", { status: 200 });
  }

  // ClickWall exchange rate 660 → {amount} is payout × 660 = user's NexCoins directly
  const userCoins = Math.max(1, Math.floor(amount));

  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: txId,
    gross_amount:            amount,
    nexcoins_awarded:        userCoins,
    status:                  "credited",
    raw_payload:             { query: rawParams },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log(`[postback/clickwall] duplicate tx ${txId} — skipping`);
      await logPostback(rawParams, true, "duplicate");
      return new Response("OK", { status: 200 });
    }
    console.error("[postback/clickwall] insert error:", insertErr.message);
    await logPostback(rawParams, true, "error", `tx insert failed: ${insertErr.message}`);
    return new Response("OK", { status: 200 });
  }

  // Credit user their exact share; NexLeader gets 10/66 on top automatically
  const { contributorCredit } = await creditOfferwallUserShare(
    admin as unknown as AdminClient,
    userId,
    userCoins,
    `ClickWall offer completed (tx: ${txId})`,
  ).catch((err) => {
    console.error("[postback/clickwall] creditOfferwallUserShare failed:", err);
    return { contributorCredit: userCoins };
  });

  // Streak
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const { data: strTarget } = await admin.from("platform_settings").select("value").eq("key", "streak_tasks_required_per_day").single();
  const streakTarget = parseInt((strTarget as { value: string } | null)?.value ?? "5") || 5;
  const { error: sdErr } = await admin.rpc("increment_streak_day", {
    p_contributor_id: userId,
    p_day_date:       todayIST,
    p_target:         streakTarget,
  });
  if (sdErr) console.error("[postback/clickwall] increment_streak_day:", sdErr.message);

  await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${contributorCredit} NexCoins from ClickWall`,
    type:    "bonus_coins",
  });

  console.log(`[postback/clickwall] ✓ credited ${contributorCredit} coins → ${userId} (tx=${txId})`);
  await logPostback(rawParams, true, "credited");
  return new Response("OK", { status: 200 });
}

export const GET  = (req: NextRequest) => handlePostback(req);
export const POST = (req: NextRequest) => handlePostback(req);
