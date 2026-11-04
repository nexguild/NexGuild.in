import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import { createServerClient } from "@/lib/supabase-server";

interface AdBlueMediaOffer {
  id?: string | number;
  offer_id?: string | number;
  title?: string;
  name?: string;
  anchor?: string;
  description?: string;
  conversion?: string;
  url?: string;
}

function getText(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function getOfferUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

function getClientIp(req: NextRequest): string | null {
  const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedIp || req.headers.get("x-real-ip")?.trim();
  return ip && isIP(ip) ? ip : null;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const [{ data: { user }, error: authError }, { data: provider, error: providerError }] = await Promise.all([
    admin.auth.getUser(token),
    admin
      .from("offerwall_providers")
      .select("api_key, postback_secret, custom_config, is_active, is_ad_network, integration_type")
      .eq("slug", "adbluemedia")
      .maybeSingle(),
  ]);

  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (providerError) {
    console.error("[offerwall/adbluemedia] Provider lookup failed:", providerError.message);
    return NextResponse.json({ error: "Unable to load AdBlueMedia configuration" }, { status: 503 });
  }
  if (!provider?.is_active || provider.is_ad_network !== false || provider.integration_type !== "api") {
    return NextResponse.json({ error: "AdBlueMedia is not enabled" }, { status: 503 });
  }

  const customConfig = provider.custom_config as Record<string, unknown> | null;
  const publisherId = String(customConfig?.publisher_id ?? "").trim();
  const apiKey = provider.api_key?.trim();
  if (!apiKey || !provider.postback_secret?.trim() || !/^\d{1,20}$/.test(publisherId)) {
    return NextResponse.json({ error: "AdBlueMedia is not fully configured" }, { status: 503 });
  }

  const feedUrl = new URL("https://d3r33tlb373kwk.cloudfront.net/public/offers/feed.php");
  feedUrl.searchParams.set("user_id", publisherId);
  feedUrl.searchParams.set("api_key", apiKey);
  feedUrl.searchParams.set("s1", user.id);
  feedUrl.searchParams.set("s2", "");

  const ip = getClientIp(req);
  if (ip) feedUrl.searchParams.set("ip", ip);
  const userAgent = req.headers.get("user-agent");
  if (userAgent && userAgent.length <= 512) feedUrl.searchParams.set("user_agent", userAgent);

  let response: Response;
  try {
    response = await fetch(feedUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    console.error("[offerwall/adbluemedia] Feed request failed:", error);
    return NextResponse.json({ error: "AdBlueMedia offers are temporarily unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    console.error(`[offerwall/adbluemedia] Feed returned HTTP ${response.status}`);
    return NextResponse.json({ error: "AdBlueMedia offers are temporarily unavailable" }, { status: 502 });
  }

  let feed: unknown;
  try {
    feed = await response.json();
  } catch (error) {
    console.error("[offerwall/adbluemedia] Feed returned invalid JSON:", error);
    return NextResponse.json({ error: "AdBlueMedia returned an invalid offer list" }, { status: 502 });
  }

  if (!Array.isArray(feed)) {
    console.error("[offerwall/adbluemedia] Feed response was not a JSON offer array");
    return NextResponse.json({ error: "AdBlueMedia returned an invalid offer list" }, { status: 502 });
  }

  const offers = feed.slice(0, 10).flatMap((rawOffer: AdBlueMediaOffer, index: number) => {
    if (!rawOffer || typeof rawOffer !== "object") return [];
    const entryUrl = getOfferUrl(rawOffer.url);
    const name = getText(rawOffer.title ?? rawOffer.name ?? rawOffer.anchor);
    if (!entryUrl || !name) return [];
    return [{
      id: getText(rawOffer.offer_id ?? rawOffer.id) || `offer-${index}`,
      name,
      description: getText(rawOffer.description ?? rawOffer.conversion) || null,
      entryUrl,
    }];
  });

  return NextResponse.json({ offers }, { headers: { "Cache-Control": "private, no-store" } });
}
