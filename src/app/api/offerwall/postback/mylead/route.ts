import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { creditWithCommission } from "@/lib/nexleader-commission";

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
    provider:      "mylead",
    raw_params:    rawParams,
    hash_valid:    hashValid,
    action_taken:  actionTaken,
    error_message: errorMessage ?? null,
  });
  if (error) console.error("[postback/mylead] postback_logs insert failed:", error.message);
}

// MyLead hash: MD5(postback_url + security_key)
function verifyHash(secret: string, urlStr: string, incomingHash: string): boolean {
  const expected = createHash("md5").update(urlStr + secret).digest("hex");
  return expected === incomingHash;
}

async function handlePostback(req: NextRequest): Promise<Response> {
  const url        = new URL(req.url);
  const q          = url.searchParams;
  const rawParams  = Object.fromEntries(q.entries());

  const userId  = q.get("user_id") ?? "";
  const txId    = q.get("tx_id")   ?? "";
  const amount  = parseFloat(q.get("amount") ?? "0") || 0;
  const status  = q.get("status")  ?? "";

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

  // Verify X-MyLead-Security-Hash header
  const incomingHash = req.headers.get("x-mylead-security-hash");
  let hashValid: boolean | null = null;

  if (provider.postback_secret) {
    if (!incomingHash) {
      console.warn("[postback/mylead] missing X-MyLead-Security-Hash header");
      await logPostback(rawParams, false, "hash_invalid", "missing security header");
      return new Response("OK", { status: 200 });
    }
    hashValid = verifyHash(provider.postback_secret as string, req.url, incomingHash);
    if (!hashValid) {
      console.warn("[postback/mylead] hash validation failed");
      await logPostback(rawParams, false, "hash_invalid");
      return new Response("OK", { status: 200 });
    }
  }

  if (!userId || !txId) {
    console.warn("[postback/mylead] missing user_id or tx_id", rawParams);
    await logPostback(rawParams, hashValid, "error", `missing user_id or tx_id`);
    return new Response("OK", { status: 200 });
  }

  // Rejected → reverse any prior credit
  if (status === "rejected") {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_id", provider.id)
      .eq("provider_transaction_id", txId)
      .single();

    if (!existing || existing.status === "reversed") {
      console.log(`[postback/mylead] rejection: tx ${txId} not found or already reversed`);
      await logPostback(rawParams, hashValid, "reversed", "tx not found or already reversed");
      return new Response("OK", { status: 200 });
    }

    const tx = existing as { id: string; nexcoins_awarded: number; contributor_id: string; status: string };
    await admin.from("offerwall_transactions").update({ status: "reversed" }).eq("id", tx.id);

    const { data: p } = await admin.from("profiles").select("nexcoins").eq("id", tx.contributor_id).single();
    const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles")
      .update({ nexcoins: Math.max(0, cur - tx.nexcoins_awarded) })
      .eq("id", tx.contributor_id);

    await admin.from("coin_transactions").insert({
      contributor_id: tx.contributor_id,
      amount:         -tx.nexcoins_awarded,
      type:           "reversed",
      source:         "offerwall",
      description:    `MyLead rejection (tx: ${txId})`,
    });

    await admin.from("notifications").insert({
      user_id: tx.contributor_id,
      title:   "Earning Reversed",
      message: `A MyLead reward of ${tx.nexcoins_awarded} NexCoins was reversed.`,
      type:    "system",
    });

    console.log(`[postback/mylead] reversed ${tx.nexcoins_awarded} coins ← ${tx.contributor_id} (tx=${txId})`);
    await logPostback(rawParams, hashValid, "reversed");
    return new Response("OK", { status: 200 });
  }

  // pending / pre_approved → log only, do not credit yet
  if (status !== "approved") {
    console.log(`[postback/mylead] status="${status}" — not crediting yet (tx=${txId})`);
    await logPostback(rawParams, hashValid, `skipped_${status || "unknown"}`);
    return new Response("OK", { status: 200 });
  }

  if (amount <= 0) {
    console.warn(`[postback/mylead] zero virtual_amount (tx=${txId})`);
    await logPostback(rawParams, hashValid, "error", "zero amount");
    return new Response("OK", { status: 200 });
  }

  const nexcoinsPreview = Math.floor(amount * (Number(provider.contributor_share_pct) / 100));

  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: txId,
    gross_amount:            amount,
    nexcoins_awarded:        nexcoinsPreview,
    status:                  "credited",
    raw_payload:             { query: rawParams },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log(`[postback/mylead] duplicate tx ${txId} — skipping`);
      await logPostback(rawParams, hashValid, "duplicate");
      return new Response("OK", { status: 200 });
    }
    console.error("[postback/mylead] insert error:", insertErr.message);
    await logPostback(rawParams, hashValid, "error", `tx insert failed: ${insertErr.message}`);
    return new Response("OK", { status: 200 });
  }

  const { contributorCredit } = await creditWithCommission(
    admin as unknown as AdminClient,
    userId,
    amount,
    "offerwall",
    `MyLead offer completed (tx: ${txId})`,
  ).catch((err) => {
    console.error("[postback/mylead] creditWithCommission failed:", err);
    return { contributorCredit: nexcoinsPreview };
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
