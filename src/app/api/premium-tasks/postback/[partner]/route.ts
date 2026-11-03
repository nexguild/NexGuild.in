import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

type Partner = "gemiad" | "notik";

function secureEquals(expected: string, incoming: string | null) {
  if (!incoming) return false;
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  const incomingBuffer = Buffer.from(incoming.toLowerCase(), "utf8");
  return expectedBuffer.length === incomingBuffer.length && timingSafeEqual(expectedBuffer, incomingBuffer);
}

function redact(params: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(params).filter(([key]) => !["hash", "secret", "api_key", "key", "pwd"].includes(key.toLowerCase())),
  );
}

function getValue(params: URLSearchParams, body: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const fromQuery = params.get(name)?.trim();
    if (fromQuery) return fromQuery;
    for (const [key, value] of Object.entries(body)) {
      if (key.toLowerCase() === name.toLowerCase() && value != null) {
        const fromBody = String(value).trim();
        if (fromBody) return fromBody;
      }
    }
  }
  return null;
}

function verifyNotikSignature(requestUrl: string, secret: string) {
  const hashMarker = "&hash=";
  const markerIndex = requestUrl.indexOf(hashMarker);
  if (markerIndex < 0) return false;
  const hash = new URL(requestUrl).searchParams.get("hash");
  if (!hash) return false;
  const expected = createHmac("sha1", secret).update(requestUrl.slice(0, markerIndex)).digest("hex");
  return secureEquals(expected, hash);
}

async function writeLog(
  admin: ReturnType<typeof createServerClient>,
  partner: Partner,
  payload: Record<string, string>,
  action: string,
  hashValid: boolean,
  errorMessage?: string,
) {
  const { error } = await admin.from("postback_logs").insert({
    provider: partner,
    raw_params: redact(payload),
    action_taken: action,
    hash_valid: hashValid,
    error_message: errorMessage ?? null,
  });
  if (error) console.warn(`[premium-task/postback/${partner}] log write failed:`, error.message);
}

async function handlePostback(
  req: NextRequest,
  partner: Partner,
): Promise<Response> {
  const admin = createServerClient();
  const query = req.nextUrl.searchParams;
  let body: Record<string, unknown> = {};

  if (req.method === "POST") {
    const raw = await req.text();
    if (raw) {
      try {
        const contentType = req.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const parsed: unknown = JSON.parse(raw);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return new Response("Bad Request", { status: 400 });
          }
          body = parsed as Record<string, unknown>;
        } else {
          body = Object.fromEntries(new URLSearchParams(raw));
        }
      } catch (error) {
        console.warn(`[premium-task/postback/${partner}] invalid callback body:`, error);
        return new Response("Bad Request", { status: 400 });
      }
    }
  }

  const callbackValues = {
    userId: getValue(query, body, "userId", "user_id"),
    offerId: getValue(query, body, "offerId", "offer_id"),
    eventId: getValue(query, body, "eventId", "event_id"),
    transactionId: getValue(query, body, "txid", "txId", "trans_id", "transaction_id"),
    rewardedTransactionId: getValue(query, body, "rewarded_txn_id"),
    clickId: getValue(query, body, "s1"),
    amount: getValue(query, body, "amount", "user_payout"),
    payout: getValue(query, body, "payout"),
    status: getValue(query, body, "status"),
    hash: getValue(query, body, "hash"),
  };
  const safePayload: Record<string, string> = Object.fromEntries(
    Object.entries(callbackValues)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
  if (partner === "gemiad" && callbackValues.transactionId
    && /^(test|test_)/i.test(callbackValues.transactionId) && !callbackValues.hash) {
    await writeLog(admin, partner, safePayload, "debug_ignored", false, "Unsigned partner test callback; no credit issued");
    return new Response("Test callback received; no credit issued", { status: 200 });
  }

  const { data: provider, error: providerError } = await admin
    .from("offerwall_providers")
    .select("postback_secret")
    .eq("slug", partner)
    .maybeSingle();
  if (providerError || !provider?.postback_secret?.trim()) {
    console.error(`[premium-task/postback/${partner}] Callback secret is unavailable:`, providerError?.message ?? "not configured");
    return new Response("Callback is not configured", { status: 503 });
  }

  if (partner === "gemiad") {
    if (!callbackValues.userId || !callbackValues.offerId || !callbackValues.transactionId || !callbackValues.hash) {
      await writeLog(admin, partner, safePayload, "error", false, "Missing signed callback fields");
      return new Response("Bad Request", { status: 400 });
    }
    const expected = createHash("sha256")
      .update(`${callbackValues.userId}${callbackValues.offerId}${callbackValues.transactionId}${provider.postback_secret}`)
      .digest("hex");
    if (!secureEquals(expected, callbackValues.hash)) {
      await writeLog(admin, partner, safePayload, "hash_invalid", false, "Invalid callback signature");
      return new Response("Forbidden", { status: 403 });
    }
  } else {
    if (!verifyNotikSignature(req.url, provider.postback_secret)) {
      await writeLog(admin, partner, safePayload, "hash_invalid", false, "Invalid callback signature");
      return new Response("Forbidden", { status: 403 });
    }
    if (!callbackValues.userId || !callbackValues.offerId || !callbackValues.transactionId || !callbackValues.clickId) {
      await writeLog(admin, partner, safePayload, "error", true, "Missing user, offer, transaction, or click reference");
      return new Response("Bad Request", { status: 400 });
    }
  }

  const clickId = partner === "gemiad" ? callbackValues.userId : callbackValues.clickId;
  if (!clickId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clickId)) {
    await writeLog(admin, partner, safePayload, "error", true, "Invalid click reference");
    return new Response("Bad Request", { status: 400 });
  }

  const { data: click, error: clickError } = await admin
    .from("premium_task_clicks")
    .select("click_id, contributor_id, partner_offer_id")
    .eq("click_id", clickId)
    .eq("partner_slug", partner)
    .maybeSingle();
  if (clickError || !click) {
    await writeLog(admin, partner, safePayload, "error", true, "Click reference was not found");
    return new Response("Not Found", { status: 404 });
  }
  if (click.partner_offer_id !== callbackValues.offerId
    || (partner === "notik" && click.contributor_id !== callbackValues.userId)) {
    await writeLog(admin, partner, safePayload, "error", true, "Callback did not match the stored click");
    return new Response("Forbidden", { status: 403 });
  }

  const status = callbackValues.status?.trim().toLowerCase() ?? "";
  const isReversal = partner === "gemiad" ? status === "rejected" : status === "2";
  const isNotikChargeback = partner === "notik"
    && Boolean(callbackValues.rewardedTransactionId ?? callbackValues.transactionId)
    && (Number(callbackValues.amount) < 0 || Number(callbackValues.payout) < 0);
  const isCompletion = partner === "gemiad" ? status === "completed" : status === "1";
  if (isReversal || isNotikChargeback) {
    const originalTransactionId = callbackValues.rewardedTransactionId ?? callbackValues.transactionId;
    const { data: reversed, error } = await admin.rpc("reverse_premium_task_conversion", {
      p_partner_slug: partner,
      p_partner_transaction_id: originalTransactionId,
      p_click_id: clickId,
    });
    if (error) {
      console.error(`[premium-task/postback/${partner}] Reversal failed:`, error.message);
      await writeLog(admin, partner, safePayload, "error", true, error.message);
      return new Response("Internal Server Error", { status: 500 });
    }
    await writeLog(admin, partner, safePayload, reversed ? "reversed" : "reversal_ignored", true);
    return new Response("OK", { status: 200 });
  }

  if (!isCompletion) {
    await writeLog(admin, partner, safePayload, "debug_ignored", true);
    return new Response("OK", { status: 200 });
  }

  const { data: credited, error: creditError } = await admin.rpc("credit_premium_task_conversion", {
    p_partner_slug: partner,
    p_partner_transaction_id: callbackValues.transactionId,
    p_click_id: clickId,
    p_partner_offer_id: callbackValues.offerId,
    p_event_id: callbackValues.eventId,
    p_raw_payload: redact(safePayload),
  });
  if (creditError) {
    console.error(`[premium-task/postback/${partner}] Credit failed:`, creditError.message);
    await writeLog(admin, partner, safePayload, "error", true, creditError.message);
    return new Response("Internal Server Error", { status: 500 });
  }

  if (credited) {
    const { data: clickedOffer } = await admin
      .from("premium_task_clicks")
      .select("contributor_id, advertiser_name, offer_name")
      .eq("click_id", clickId)
      .single();
    if (clickedOffer) {
      const { error: notificationError } = await admin.from("notifications").insert({
        user_id: clickedOffer.contributor_id,
        title: "NexCoins Earned!",
        message: `Your ${clickedOffer.advertiser_name} offer was completed. NexCoins have been added to your balance.`,
        type: "bonus_coins",
      });
      if (notificationError) console.warn("[premium-task/postback] Notification insert failed:", notificationError.message);
    }
  }

  await writeLog(admin, partner, safePayload, credited ? "credited" : "duplicate", true);
  return new Response("OK", { status: 200 });
}

async function resolvePartner(params: Promise<{ partner: string }>): Promise<Partner | null> {
  const { partner } = await params;
  return partner === "gemiad" || partner === "notik" ? partner : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partner: string }> },
) {
  const partner = await resolvePartner(params);
  return partner ? handlePostback(req, partner) : new Response("Unknown partner", { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partner: string }> },
) {
  const partner = await resolvePartner(params);
  return partner ? handlePostback(req, partner) : new Response("Unknown partner", { status: 404 });
}
