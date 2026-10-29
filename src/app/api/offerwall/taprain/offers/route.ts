import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import { createServerClient } from "@/lib/supabase-server";

interface TapRainOffer {
  id?: string;
  name?: string;
  description?: string;
  payout?: number;
  displayPayout?: string;
  picture?: string;
  url?: string;
  countries?: string[];
  devices?: string[];
}

function getClientIp(req: NextRequest): string | null {
  const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedIp || req.headers.get("x-real-ip")?.trim();
  return ip && isIP(ip) ? ip : null;
}

function getTapRainUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const isAllowedHost = ["taprkr.com", "raintrkr.com"].some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
    return url.protocol === "https:" && isAllowedHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function getImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const [{ data: { user }, error: authError }, { data: provider, error: providerError }] =
    await Promise.all([
      admin.auth.getUser(token),
      admin
        .from("offerwall_providers")
        .select("is_active, custom_config, contributor_share_pct")
        .eq("slug", "taprain")
        .maybeSingle(),
    ]);

  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (providerError) {
    console.error("[offerwall/taprain] Provider lookup failed:", providerError.message);
    return NextResponse.json({ error: "Unable to load TapRain configuration" }, { status: 503 });
  }
  if (!provider?.is_active) {
    return NextResponse.json({ error: "TapRain is not enabled" }, { status: 503 });
  }

  const customConfig = provider.custom_config as Record<string, unknown> | null;
  const offerwallId = customConfig?.offerwall_id;
  if (typeof offerwallId !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(offerwallId)) {
    return NextResponse.json({ error: "TapRain offerwall ID is not configured" }, { status: 503 });
  }

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  if (!ip || !userAgent || userAgent.length > 512) {
    return NextResponse.json({ error: "TapRain requires the visitor IP address and browser information" }, { status: 400 });
  }

  const feedUrl = new URL(
    `https://taprain.com/api/offerwalls/${encodeURIComponent(offerwallId)}/feed`,
  );
  feedUrl.searchParams.set("s1", user.id);
  feedUrl.searchParams.set("ip", ip);
  feedUrl.searchParams.set("user_agent", userAgent);

  let response: Response;
  try {
    response = await fetch(feedUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    console.error("[offerwall/taprain] Feed request failed:", error);
    return NextResponse.json({ error: "TapRain offers are temporarily unavailable" }, { status: 502 });
  }

  if (!response.ok) {
    console.error(`[offerwall/taprain] Feed returned HTTP ${response.status}`);
    return NextResponse.json({ error: "TapRain offers are temporarily unavailable" }, { status: 502 });
  }

  let feed: { offers?: TapRainOffer[]; offerwall?: { title?: string } };
  try {
    feed = await response.json() as typeof feed;
  } catch (error) {
    console.error("[offerwall/taprain] Feed returned invalid JSON:", error);
    return NextResponse.json({ error: "TapRain returned an invalid offer list" }, { status: 502 });
  }
  if (!Array.isArray(feed.offers)) {
    console.error("[offerwall/taprain] Feed response did not contain an offers list");
    return NextResponse.json({ error: "TapRain returned an invalid offer list" }, { status: 502 });
  }

  const coinRate = Number(customConfig?.currency_conversion_rate ?? 1000);
  const payoutMultiplier = Number(customConfig?.payout_multiplier ?? 1);
  const contributorShare = Number(provider.contributor_share_pct ?? 66);
  if (!Number.isFinite(coinRate) || coinRate <= 0
    || !Number.isFinite(payoutMultiplier) || payoutMultiplier <= 0
    || !Number.isFinite(contributorShare) || contributorShare < 0 || contributorShare > 100) {
    console.error("[offerwall/taprain] Invalid reward conversion configuration");
    return NextResponse.json({ error: "TapRain reward conversion is not configured correctly" }, { status: 503 });
  }
  const offers = feed.offers.flatMap((offer) => {
    const entryUrl = getTapRainUrl(offer.url);
    const payout = Number(offer.payout);
    if (typeof offer.id !== "string" || !offer.id.trim()
      || typeof offer.name !== "string" || !offer.name.trim()
      || !entryUrl || !Number.isFinite(payout) || payout <= 0) return [];
    const grossCoins = Math.round(payout * coinRate);
    return [{
      id: offer.id,
      name: offer.name,
      description: typeof offer.description === "string" ? offer.description : null,
      imageUrl: getImageUrl(offer.picture),
      estimatedRewardCoins: Math.max(1, Math.round(grossCoins * payoutMultiplier * contributorShare / 100)),
      entryUrl,
    }];
  });

  return NextResponse.json(
    { title: feed.offerwall?.title ?? "TapRain offers", offers },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
