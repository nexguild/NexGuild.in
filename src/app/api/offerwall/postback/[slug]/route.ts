import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function handlePostback(req: NextRequest, slug: string): Promise<Response> {
  const admin = createServerClient();

  // 1. Look up provider
  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id, name, postback_secret, contributor_share_pct")
    .eq("slug", slug)
    .single();

  if (provErr || !provider) return new Response("Unknown provider", { status: 404 });
  if (!provider.postback_secret) return new Response("Provider not configured", { status: 403 });

  // 2. Parse payload — check query string first, then body (supports GET + POST providers)
  const url = new URL(req.url);
  const q   = url.searchParams;

  let userId         = q.get("user_id")        ?? q.get("uid")      ?? null;
  let transactionId  = q.get("transaction_id") ?? q.get("offer_id") ?? null;
  let grossAmount    = parseFloat(q.get("amount") ?? q.get("reward") ?? "0");
  let incomingSecret = q.get("secret") ?? q.get("api_key")          ?? null;

  // Fallback to request body if any field is still missing
  const rawBody = await req.text().catch(() => "");
  if (!userId || !transactionId || !grossAmount) {
    try {
      const contentType = req.headers.get("content-type") ?? "";
      let parsed: Record<string, unknown> = {};
      if (contentType.includes("application/json") && rawBody) {
        parsed = JSON.parse(rawBody) as Record<string, unknown>;
      } else if (rawBody) {
        new URLSearchParams(rawBody).forEach((v, k) => { parsed[k] = v; });
      }
      if (!userId)         userId         = String(parsed.user_id ?? parsed.uid ?? "").trim() || null;
      if (!transactionId)  transactionId  = String(parsed.transaction_id ?? parsed.offer_id ?? "").trim() || null;
      if (!grossAmount)    grossAmount    = parseFloat(String(parsed.amount ?? parsed.reward ?? "0"));
      if (!incomingSecret) incomingSecret = String(parsed.secret ?? parsed.api_key ?? "").trim() || null;
    } catch { /* ignore */ }
  }

  // 3. Validate secret
  if (incomingSecret !== provider.postback_secret) {
    console.warn(`[postback/${slug}] invalid secret`);
    return new Response("Forbidden", { status: 403 });
  }

  if (!userId || !transactionId || grossAmount <= 0) {
    console.warn(`[postback/${slug}] missing fields`, { userId, transactionId, grossAmount });
    return new Response("Bad Request", { status: 400 });
  }

  // 4. Compute NexCoins to award
  const nexcoinsAwarded = Math.max(1, Math.floor(grossAmount * (Number(provider.contributor_share_pct) / 100)));

  // 5. Insert transaction — UNIQUE(provider_id, provider_transaction_id) prevents double-credit
  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: transactionId,
    gross_amount:            grossAmount,
    nexcoins_awarded:         nexcoinsAwarded,
    status:                  "credited",
    raw_payload:             { body: rawBody.slice(0, 2000), query: Object.fromEntries(q.entries()) },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Idempotent — already processed
      console.log(`[postback/${slug}] duplicate tx ${transactionId} — skipping`);
      return new Response("OK", { status: 200 });
    }
    console.error(`[postback/${slug}] insert error:`, insertErr.message);
    return new Response("Internal Server Error", { status: 500 });
  }

  // 6. Credit NexCoins via RPC (with direct-update fallback)
  const { error: rpcErr } = await admin.rpc("increment_nexcoins", {
    p_contributor_id: userId,
    p_coins:          nexcoinsAwarded,
  });
  if (rpcErr) {
    console.error(`[postback/${slug}] increment_nexcoins:`, rpcErr.message);
    const { data: p } = await admin.from("profiles").select("nexcoins").eq("id", userId).single();
    const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: cur + nexcoinsAwarded }).eq("id", userId);
  }

  // 7. Log coin transaction
  const { error: txErr } = await admin.from("coin_transactions").insert({
    contributor_id: userId,
    amount:         nexcoinsAwarded,
    type:           "earned",
    source:         "offerwall",
    description:    `${provider.name} offer completed`,
  });
  if (txErr) console.error(`[postback/${slug}] coin_transactions:`, txErr.message);

  // 8. Update streak counters — Fix 3b: offerwall completions count toward daily streak
  const today = new Date().toISOString().split("T")[0];
  const { data: sp } = await admin
    .from("profiles")
    .select("last_task_approved_date, tasks_approved_today")
    .eq("id", userId)
    .single();
  const streakP = sp as { last_task_approved_date: string | null; tasks_approved_today: number | null } | null;
  const newCount = streakP?.last_task_approved_date === today
    ? (streakP.tasks_approved_today ?? 0) + 1
    : 1;
  const { error: streakErr } = await admin.from("profiles")
    .update({ last_task_approved_date: today, tasks_approved_today: newCount })
    .eq("id", userId);
  if (streakErr) console.error(`[postback/${slug}] streak update:`, streakErr.message);

  // 9. In-app notification
  const { error: notifErr } = await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${nexcoinsAwarded} NexCoins from ${provider.name}`,
    type:    "bonus_coins",
  });
  if (notifErr) console.error(`[postback/${slug}] notification:`, notifErr.message);

  console.log(`[postback/${slug}] credited ${nexcoinsAwarded} coins → ${userId}`);
  return new Response("OK", { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handlePostback(req, slug);
}

// Some providers send GET postbacks
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handlePostback(req, slug);
}
