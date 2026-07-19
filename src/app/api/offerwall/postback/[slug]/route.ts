import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { creditOfferwallUserShare } from "@/lib/nexleader-commission";

type ParamMap = Record<string, string>;

function extractParams(q: URLSearchParams, body: Record<string, unknown>, paramMap: ParamMap) {
  function get(internalKey: string): string | null {
    const providerKey = paramMap[internalKey] ?? internalKey;
    const fromQuery = q.get(providerKey) ?? q.get(internalKey);
    if (fromQuery !== null) return fromQuery;
    const fromBody = String((body[providerKey] ?? body[internalKey]) ?? "").trim();
    return fromBody || null;
  }
  return {
    userId:         get("user_id"),
    transId:        get("trans_id") ?? get("transaction_id"),
    amount:         parseFloat(get("amount") ?? "0") || 0,
    status:         get("status"),
    type:           get("type"),
    hash:           get("hash"),
    incomingSecret: get("secret") ?? get("api_key"),
  };
}

function verifyByHashFormat(hashFormat: string, secret: string, vars: Record<string, string>, incoming: string | null): boolean {
  if (!incoming) return false;
  const template = hashFormat.replace(/\{(\w+)\}/g, (_, key: string) =>
    key === "secret" ? secret : (vars[key] ?? "")
  );
  const expected = createHash("md5").update(template).digest("hex");
  return expected === incoming;
}

async function handlePostback(req: NextRequest, slug: string): Promise<Response> {
  const admin = createServerClient();

  // 1. Look up provider
  const { data: provider, error: provErr } = await admin
    .from("offerwall_providers")
    .select("id, name, postback_secret, contributor_share_pct, postback_param_map, hash_format, custom_config, is_active")
    .eq("slug", slug)
    .single();

  if (provErr || !provider) return new Response("Unknown provider", { status: 404 });
  if (!provider.is_active) return new Response("Provider disabled", { status: 403 });
  if (!provider.postback_secret) return new Response("Provider not configured", { status: 403 });

  // 2. Parse request
  const url     = new URL(req.url);
  const q       = url.searchParams;
  const rawBody = await req.text().catch(() => "");

  let bodyObj: Record<string, unknown> = {};
  if (rawBody) {
    try {
      const ct = req.headers.get("content-type") ?? "";
      bodyObj  = ct.includes("application/json")
        ? JSON.parse(rawBody) as Record<string, unknown>
        : Object.fromEntries(new URLSearchParams(rawBody));
    } catch { /* ignore */ }
  }

  const paramMap: ParamMap = (provider.postback_param_map as ParamMap | null) ?? {};
  const { userId, transId, amount, status, type, hash, incomingSecret } = extractParams(q, bodyObj, paramMap);
  // TEMP DEBUG — remove after identifying ClixWall param names
  if (slug === "clixwall") {
    console.log(`[postback/clixwall] DEBUG query:`, Object.fromEntries(q.entries()), `body:`, bodyObj);
  }

  // 3. Auth — hash-format or simple secret
  const hashFormat = (provider.hash_format as string | null) ?? null;

  if (hashFormat) {
    const templateVars: Record<string, string> = {
      user_id:  userId  ?? "",
      trans_id: transId ?? "",
      amount:   String(amount),
      status:   status  ?? "",
      type:     type    ?? "",
    };
    if (!verifyByHashFormat(hashFormat, provider.postback_secret, templateVars, hash)) {
      console.warn(`[postback/${slug}] hash mismatch`);
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    if (incomingSecret !== provider.postback_secret) {
      console.warn(`[postback/${slug}] invalid secret`);
      return new Response("Forbidden", { status: 403 });
    }
  }

  // 4. Validate required fields
  if (!userId || !transId) {
    console.warn(`[postback/${slug}] missing user_id or trans_id`, { userId, transId });
    return new Response("Bad Request", { status: 400 });
  }

  // 5. status=2 → fraud reversal
  if (status === "2") {
    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_id", provider.id)
      .eq("provider_transaction_id", transId)
      .single();

    if (!existing || existing.status === "reversed") {
      return new Response("OK", { status: 200 });
    }

    const tx = existing as { id: string; nexcoins_awarded: number; contributor_id: string; status: string };
    await admin.from("offerwall_transactions").update({ status: "reversed" }).eq("id", tx.id);

    const { data: p } = await admin.from("profiles").select("nexcoins").eq("id", tx.contributor_id).single();
    const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: Math.max(0, cur - tx.nexcoins_awarded) }).eq("id", tx.contributor_id);
    await admin.from("coin_transactions").insert({
      contributor_id: tx.contributor_id,
      amount:         -tx.nexcoins_awarded,
      type:           "reversed",
      source:         "offerwall",
      description:    `${provider.name} fraud reversal (tx: ${transId})`,
    });

    return new Response("OK", { status: 200 });
  }

  // 6. Skip non-credit statuses
  if (status && status !== "1") {
    return new Response("OK", { status: 200 });
  }
  if (type === "out") {
    return new Response("OK", { status: 200 });
  }

  // 7. Compute userCoins — what the user actually receives.
  //
  //  S1 — rate_is_user_share=true  (e.g. ClixWall, percentage=66%):
  //       postback sends the user's coin amount directly → userCoins = amount × payoutMult
  //  S2 — rate_is_user_share=false (default, e.g. CPAGrip, sends USD):
  //       userCoins = amount × payoutMult × 0.66
  //       Exchange rate in CPAGrip dashboard must be set to 660 so widget matches.
  if (amount <= 0) {
    console.warn(`[postback/${slug}] zero amount tx ${transId}`);
    return new Response("Bad Request", { status: 400 });
  }
  const customCfg       = (provider.custom_config as Record<string, unknown> | null) ?? {};
  const payoutMult      = Number(customCfg.payout_multiplier ?? 1) || 1;
  const rateIsUserShare = customCfg.rate_is_user_share === true;
  const userCoins       = rateIsUserShare
    ? Math.max(1, Math.round(amount * payoutMult))
    : Math.max(1, Math.round(amount * payoutMult * 0.66));

  // 8. Insert transaction (UNIQUE guard prevents double-credit)
  const { error: insertErr } = await admin.from("offerwall_transactions").insert({
    provider_id:             provider.id,
    contributor_id:          userId,
    provider_transaction_id: transId,
    gross_amount:            amount,
    nexcoins_awarded:        userCoins,
    status:                  "credited",
    raw_payload:             { query: Object.fromEntries(q.entries()), body: rawBody.slice(0, 2000) },
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log(`[postback/${slug}] duplicate tx ${transId} — skipping`);
      return new Response("OK", { status: 200 });
    }
    console.error(`[postback/${slug}] insert error:`, insertErr.message);
    return new Response("Internal Server Error", { status: 500 });
  }

  // 9. Credit user their exact share; NexLeader gets 10/66 on top automatically
  const { contributorCredit } = await creditOfferwallUserShare(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admin as any,
    userId,
    userCoins,
    `${provider.name} offer completed`,
  ).catch((err) => {
    console.error(`[postback/${slug}] creditOfferwallUserShare failed:`, err);
    return { contributorCredit: userCoins };
  });

  // 10. Streak update
  const today = new Date().toISOString().split("T")[0];
  const { data: sp } = await admin
    .from("profiles")
    .select("last_task_approved_date, tasks_approved_today")
    .eq("id", userId)
    .single();
  const sp2     = sp as { last_task_approved_date: string | null; tasks_approved_today: number | null } | null;
  const newCount = sp2?.last_task_approved_date === today ? (sp2.tasks_approved_today ?? 0) + 1 : 1;
  await admin.from("profiles")
    .update({ last_task_approved_date: today, tasks_approved_today: newCount })
    .eq("id", userId);

  // 11. Notification
  await admin.from("notifications").insert({
    user_id: userId,
    title:   "NexCoins Earned!",
    message: `+${contributorCredit} NexCoins from ${provider.name}`,
    type:    "bonus_coins",
  });

  console.log(`[postback/${slug}] credited ${contributorCredit} coins → ${userId} (tx=${transId})`);
  return new Response("OK", { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handlePostback(req, slug);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handlePostback(req, slug);
}
