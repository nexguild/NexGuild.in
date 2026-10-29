import { createHash, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const THEOREMREACH_COINS_PER_USD = 660;
const SURVEY_LIMIT = 12;

interface OfferwallProvider {
  slug: string;
  name: string;
  is_active: boolean;
  integration_type: string;
  api_key: string | null;
  postback_secret: string | null;
  custom_config: Record<string, unknown> | null;
}

interface Survey {
  id: string;
  provider: "CPX Research" | "TheoremReach";
  durationMinutes: number;
  rewardCoins: number;
  rating: number | null;
  ratingCount: number;
  rankScore: number;
  recommended: boolean;
  entryUrl: string;
}

interface Offer {
  id: string;
  name: string;
  description: string | null;
  terms: string | null;
  confirmationTime: string | null;
  imageUrl: string | null;
  sourceName: string;
  providerName: string | null;
  kind: "diy" | "network";
  estimatedRewardCoins: number;
  rankScore: number;
  events: { name: string; estimatedRewardCoins: number }[];
  entryUrl: string;
}

function getClientIp(req: NextRequest): string | null {
  const forwardedIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedIp || req.headers.get("x-real-ip")?.trim();
  return ip && ip.length <= 64 ? ip : null;
}

function getCountryCode(req: NextRequest, profileCountry: string | null): string | null {
  const headerCountry =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country-code");
  for (const country of [headerCountry, profileCountry]) {
    if (country && /^[a-z]{2}$/i.test(country) && !["XX", "T1", "A1"].includes(country.toUpperCase())) {
      return country.toUpperCase();
    }
  }
  return null;
}

function getTheoremReachDevice(userAgent: string | null): "ios" | "android" | "web" {
  if (!userAgent) return "web";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "web";
}

function getHttpsUrl(value: unknown, providerDomain: string): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      (url.hostname !== providerDomain && !url.hostname.endsWith(`.${providerDomain}`))
    ) return null;
    return url;
  } catch {
    return null;
  }
}

function getAnyHttpsUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function toPositiveNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function cleanOfferText(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/&lt;br\s*\/?&gt;/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|li|div|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function interleaveOffers(first: Offer[], second: Offer[]): Offer[] {
  const offers: Offer[] = [];
  const count = Math.max(first.length, second.length);
  for (let index = 0; index < count; index += 1) {
    if (first[index]) offers.push(first[index]);
    if (second[index]) offers.push(second[index]);
  }
  return offers;
}

async function isTheoremReachOfferEligible(
  apiKey: string,
  secretKey: string,
  userId: string,
  ip: string,
  offerId: string,
  device: "ios" | "android" | "web",
): Promise<boolean> {
  const params = new URLSearchParams({
    api_key: apiKey,
    user_id: userId,
    ip,
    offer_id: offerId,
    device,
  });
  const unsignedUrl = `https://api.theoremreach.com/api/publishers/v1/user_eligibility?${params}`;
  const requestHash = createHmac("sha1", secretKey).update(unsignedUrl).digest("base64url");
  const response = await fetch(`${unsignedUrl}&hash=${encodeURIComponent(requestHash)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`TheoremReach offer eligibility check returned HTTP ${response.status}`);
  }
  const result = await response.json() as { eligible?: boolean };
  if (typeof result.eligible !== "boolean") {
    throw new Error("TheoremReach returned an invalid offer eligibility response");
  }
  return result.eligible;
}

async function getCpxSurveys(
  req: NextRequest,
  userId: string,
  provider: OfferwallProvider | undefined,
): Promise<Survey[]> {
  if (!provider?.is_active) return [];

  const config = provider.custom_config ?? {};
  const configuredAppId = config.app_id;
  const appId =
    (typeof configuredAppId === "string" || typeof configuredAppId === "number"
      ? String(configuredAppId)
      : null) ??
    process.env.NEXT_PUBLIC_CPX_APP_ID ??
    process.env.CPX_APP_ID;
  const secureSecret = process.env.CPX_APP_SECURE_HASH ?? provider.postback_secret;
  if (!appId || !secureSecret) throw new Error("CPX Research is not configured");

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  if (!ip || !userAgent) throw new Error("Survey request is missing required browser information");

  const params = new URLSearchParams({
    app_id: appId,
    ext_user_id: userId,
    output_method: "api",
    ip_user: ip,
    user_agent: userAgent,
    limit: String(SURVEY_LIMIT),
    secure_hash: createHash("md5").update(`${userId}-${secureSecret}`).digest("hex"),
  });
  const response = await fetch(`https://live-api.cpx-research.com/api/get-surveys.php?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`CPX Research returned HTTP ${response.status}`);

  const result = await response.json() as {
    status?: string;
    surveys?: Array<{
      id?: string | number;
      loi?: string | number;
      payout?: string | number;
      statistics_rating_avg?: string | number;
      statistics_rating_count?: string | number;
      score?: string | number;
      top?: number | string;
      href_new?: string;
      href?: string;
    }>;
  };
  if (result.status !== "success" || !Array.isArray(result.surveys)) {
    throw new Error("CPX Research returned an invalid survey list");
  }

  return result.surveys.flatMap((item): Survey[] => {
    const entryUrl = getHttpsUrl(item.href_new ?? item.href, "cpx-research.com");
    const minutes = toPositiveNumber(item.loi);
    const payout = toPositiveNumber(item.payout);
    const id = item.id === undefined ? "" : String(item.id);
    if (!entryUrl || !minutes || !payout || !id) return [];

    const rating = Number(item.statistics_rating_avg);
    const ratingCount = Number(item.statistics_rating_count);
    return [{
      id,
      provider: "CPX Research",
      durationMinutes: Math.ceil(minutes),
      rewardCoins: Math.floor(payout),
      rating: Number.isFinite(rating) && rating > 0 ? rating : null,
      ratingCount: Number.isFinite(ratingCount) && ratingCount > 0 ? Math.floor(ratingCount) : 0,
      rankScore: Number(item.score) || 0,
      recommended: item.top === 1 || item.top === "1",
      entryUrl: entryUrl.toString(),
    }];
  });
}

async function getTheoremReachSurveys(
  req: NextRequest,
  userId: string,
  profileCountry: string | null,
  provider: OfferwallProvider | undefined,
): Promise<Survey[]> {
  if (!provider?.is_active) return [];

  const apiKey = process.env.THEOREMREACH_API_KEY;
  const secretKey = process.env.THEOREMREACH_SECRET_KEY;
  const placementId = process.env.NEXT_PUBLIC_THEOREMREACH_PLACEMENT_ID;
  if (!apiKey || !secretKey || !placementId) throw new Error("TheoremReach is not configured");

  const ip = getClientIp(req);
  const countryCode = getCountryCode(req, profileCountry);
  if (!ip || !countryCode) throw new Error("Country and IP are required to find matching surveys");

  const base = "https://api.theoremreach.com/api/publishers/v1/surveys";
  const params = new URLSearchParams({
    api_key: apiKey,
    user_id: userId,
    ip,
    country_code: countryCode,
  });
  const unsignedUrl = `${base}?${params.toString()}`;
  const requestHash = createHmac("sha1", secretKey).update(unsignedUrl).digest("base64url");
  const response = await fetch(`${unsignedUrl}&hash=${encodeURIComponent(requestHash)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`TheoremReach returned HTTP ${response.status}`);

  const result = await response.json() as {
    surveys?: Array<{
      campaign_id?: string | number;
      loi?: number | string;
      cpi?: number | string;
      rank?: number | string;
      average_rating?: number | string;
      rating_count?: number | string;
      entry_link?: string;
    }>;
  };
  if (!Array.isArray(result.surveys)) throw new Error("TheoremReach returned an invalid survey list");

  return result.surveys.flatMap((item): Survey[] => {
    const entryUrl = getHttpsUrl(item.entry_link, "theoremreach.com");
    const minutes = toPositiveNumber(item.loi);
    const cpi = toPositiveNumber(item.cpi);
    const id = item.campaign_id === undefined ? "" : String(item.campaign_id);
    if (!entryUrl || !minutes || !cpi || !id) return [];

    entryUrl.searchParams.delete("hash");
    entryUrl.searchParams.set("user_id", userId);
    entryUrl.searchParams.set("placement_id", placementId);
    const unsignedEntryUrl = entryUrl.toString();
    entryUrl.searchParams.set(
      "hash",
      createHmac("sha1", secretKey).update(unsignedEntryUrl).digest("base64url"),
    );

    const rating = Number(item.average_rating);
    const ratingCount = Number(item.rating_count);
    return [{
      id,
      provider: "TheoremReach",
      durationMinutes: Math.ceil(minutes),
      rewardCoins: Math.ceil(cpi * THEOREMREACH_COINS_PER_USD),
      rating: Number.isFinite(rating) && rating > 0 ? rating : null,
      ratingCount: Number.isFinite(ratingCount) && ratingCount > 0 ? Math.floor(ratingCount) : 0,
      rankScore: Number(item.rank) || 0,
      recommended: Number(item.rank) > 0,
      entryUrl: entryUrl.toString(),
    }];
  });
}

async function getTheoremReachOffers(
  req: NextRequest,
  userId: string,
  profileCountry: string | null,
  provider: OfferwallProvider | undefined,
): Promise<Offer[]> {
  if (!provider?.is_active) return [];

  const apiKey = process.env.THEOREMREACH_API_KEY;
  const secretKey = process.env.THEOREMREACH_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("TheoremReach Offers API is not configured");

  const ip = getClientIp(req);
  if (!ip) throw new Error("Survey request is missing the user's IP address");
  const device = getTheoremReachDevice(req.headers.get("user-agent"));

  const params = new URLSearchParams({
    api_key: apiKey,
    user_id: userId,
    ip,
    device,
    max_result_count: String(SURVEY_LIMIT),
  });
  const countryCode = getCountryCode(req, profileCountry);
  if (countryCode) params.set("country_code", countryCode);

  const unsignedUrl = `https://api.theoremreach.com/api/publishers/v1/offers?${params}`;
  const requestHash = createHmac("sha1", secretKey).update(unsignedUrl).digest("base64url");
  const response = await fetch(`${unsignedUrl}&hash=${encodeURIComponent(requestHash)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (response.status === 403) {
    throw new Error("The Offers API is not enabled for this app. Ask your TheoremReach account manager to enable it.");
  }
  if (response.status === 401) throw new Error("TheoremReach rejected the Offers API credentials.");
  if (!response.ok) throw new Error(`TheoremReach Offers API returned HTTP ${response.status}`);

  const result = await response.json() as {
    offers?: Array<{
      offer_id?: string | number;
      type?: string;
      name?: string;
      description?: string;
      image_url?: string;
      provider_name?: string;
      rank?: number | string;
      payout?: number | string;
      terms?: string;
      confirmation_time?: string;
      devices?: string[] | null;
      events?: Array<{ name?: string; payout?: number | string }>;
      entry_link?: string;
    }>;
  };
  if (!Array.isArray(result.offers)) throw new Error("TheoremReach returned an invalid offer list");

  const eligibleOffers = await Promise.all(result.offers.map(async (item) => {
    if (Array.isArray(item.devices) && !item.devices.includes(device)) return null;
    if (item.type === "network") return item;
    const id = item.offer_id === undefined ? "" : String(item.offer_id);
    if (!id) return null;
    return await isTheoremReachOfferEligible(apiKey, secretKey, userId, ip, id, device)
      ? item
      : null;
  }));

  return eligibleOffers.flatMap((item): Offer[] => {
    if (!item) return [];
    const entryUrl = getHttpsUrl(item.entry_link, "theoremreach.com");
    const payout = toPositiveNumber(item.payout);
    const id = item.offer_id === undefined ? "" : String(item.offer_id);
    if (!entryUrl || !payout || !id || !item.name) return [];

    const linkedUserId = entryUrl.searchParams.get("user_id");
    if (linkedUserId && linkedUserId !== userId) return [];
    entryUrl.searchParams.set("user_id", userId);
    entryUrl.searchParams.delete("hash");
    const unsignedEntryUrl = entryUrl.toString();
    entryUrl.searchParams.set(
      "hash",
      createHmac("sha1", secretKey).update(unsignedEntryUrl).digest("base64url"),
    );

    const imageUrl = getAnyHttpsUrl(item.image_url);
    const events = (item.events ?? []).flatMap((event) => {
      const eventPayout = toPositiveNumber(event.payout);
      if (!event.name || !eventPayout) return [];
      return [{
        name: cleanOfferText(event.name),
        estimatedRewardCoins: Math.ceil(eventPayout * THEOREMREACH_COINS_PER_USD),
      }];
    });

    return [{
      id,
      name: cleanOfferText(item.name),
      description: typeof item.description === "string" ? cleanOfferText(item.description) : null,
      terms: typeof item.terms === "string" ? cleanOfferText(item.terms) : null,
      confirmationTime: typeof item.confirmation_time === "string" ? cleanOfferText(item.confirmation_time) : null,
      imageUrl: imageUrl?.toString() ?? null,
      sourceName: "TheoremReach",
      providerName: typeof item.provider_name === "string" ? item.provider_name : null,
      kind: item.type === "network" ? "network" : "diy",
      estimatedRewardCoins: Math.ceil(payout * THEOREMREACH_COINS_PER_USD),
      rankScore: Number(item.rank) || 0,
      events,
      entryUrl: entryUrl.toString(),
    }];
  });
}

async function getNotikOffers(
  req: NextRequest,
  userId: string,
  provider: OfferwallProvider | undefined,
): Promise<Offer[]> {
  if (!provider?.is_active || provider.integration_type === "disabled") return [];

  const config = provider.custom_config ?? {};
  const apiKey = provider.api_key?.trim();
  const appId = typeof config.app_id === "string" ? config.app_id.trim() : "";
  const publisherId = typeof config.publisher_id === "string" ? config.publisher_id.trim() : "";
  const postbackSecret = provider.postback_secret?.trim();
  if (!apiKey || !appId || !publisherId || !postbackSecret) {
    throw new Error("Notik Live Offers is not fully configured");
  }

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  if (!ip || !userAgent) throw new Error("Notik needs the visitor's IP address and browser information");

  const params = new URLSearchParams({
    api_key: apiKey,
    pub_id: publisherId,
    app_id: appId,
    user_id: userId,
    duration: "30d",
    page: "1",
  });
  const response = await fetch(`https://notik.me/api/v1/live-campaigns-for-user?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent,
      "X-Forwarded-For": ip,
      "X-Real-IP": ip,
    },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("Notik rejected the Live Offers API credentials or access");
  }
  if (!response.ok) throw new Error(`Notik Live Offers returned HTTP ${response.status}`);

  const result = await response.json() as {
    status?: string;
    data?: Array<{
      offer_id?: string | number;
      name?: string;
      categories?: unknown[];
      description1?: string | null;
      description2?: string | null;
      description3?: string | null;
      terms?: string;
      confirmation_time?: string;
      image_url?: string;
      payout?: number | string;
      click_url?: string;
      events?: Array<{ name?: string; payout?: number | string }>;
    }>;
  };
  if (result.status !== "success" || !Array.isArray(result.data)) {
    throw new Error("Notik returned an invalid Live Offers response");
  }

  const items = result.data;
  const conversionRate = toPositiveNumber(config.conversion_rate) ?? 660;
  return items.flatMap((item, index): Offer[] => {
    const entryUrl = getHttpsUrl(item.click_url, "notik.me");
    const payout = toPositiveNumber(item.payout);
    const id = item.offer_id === undefined ? "" : String(item.offer_id);
    if (!entryUrl || !payout || !id || !item.name?.trim()) return [];

    const imageUrl = getAnyHttpsUrl(item.image_url);
    const categories = Array.isArray(item.categories)
      ? item.categories.filter((category): category is string => typeof category === "string" && !!category.trim())
      : [];
    const description = [item.description1, item.description2, item.description3]
      .filter((part): part is string => typeof part === "string" && !!part.trim())
      .map(cleanOfferText)
      .join(" ");
    const events = (item.events ?? []).flatMap((event) => {
      const eventPayout = toPositiveNumber(event.payout);
      if (!event.name?.trim() || !eventPayout) return [];
      return [{
        name: cleanOfferText(event.name),
        estimatedRewardCoins: Math.ceil(eventPayout * conversionRate),
      }];
    });

    return [{
      id: `notik-${id}`,
      name: cleanOfferText(item.name.trim()),
      description: description || (categories.length ? cleanOfferText(categories.join(" · ")) : null),
      terms: typeof item.terms === "string" ? cleanOfferText(item.terms) : null,
      confirmationTime: typeof item.confirmation_time === "string" ? cleanOfferText(item.confirmation_time) : null,
      imageUrl: imageUrl?.toString() ?? null,
      sourceName: "Notik",
      providerName: "Notik",
      kind: "network",
      estimatedRewardCoins: Math.ceil(payout * conversionRate),
      rankScore: items.length - index,
      events,
      entryUrl: entryUrl.toString(),
    }];
  });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const [{ data: { user }, error: authError }, { data: providers, error: providerError }] =
    await Promise.all([
      admin.auth.getUser(token),
      admin
        .from("offerwall_providers")
        .select("slug, name, is_active, integration_type, api_key, postback_secret, custom_config")
        .in("slug", ["cpx_research", "theoremreach", "notik"]),
    ]);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (providerError) {
    console.error("[api/surveys] Provider lookup failed:", providerError.message);
    return NextResponse.json({ error: "Survey providers are temporarily unavailable" }, { status: 503 });
  }

  const providerRows = (providers ?? []) as OfferwallProvider[];
  const cpxProvider = providerRows.find(
    (provider) => provider.slug === "cpx_research" && provider.integration_type === "script_tag",
  );
  const theoremReachProvider = providerRows.find(
    (provider) => provider.slug === "theoremreach" && provider.integration_type !== "disabled",
  );
  const notikProvider = providerRows.find((provider) => provider.slug === "notik");
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("country_code")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) console.error("[api/surveys] Profile lookup failed:", profileError.message);

  const [cpxResult, theoremReachResult, theoremReachOffersResult, notikOffersResult] = await Promise.all([
    getCpxSurveys(req, user.id, cpxProvider).then(
      (surveys) => ({ surveys, error: null as string | null }),
      (error: unknown) => ({ surveys: [] as Survey[], error: error instanceof Error ? error.message : "Unable to load CPX Research surveys" }),
    ),
    getTheoremReachSurveys(req, user.id, profile?.country_code ?? null, theoremReachProvider).then(
      (surveys) => ({ surveys, error: null as string | null }),
      (error: unknown) => ({ surveys: [] as Survey[], error: error instanceof Error ? error.message : "Unable to load TheoremReach surveys" }),
    ),
    getTheoremReachOffers(req, user.id, profile?.country_code ?? null, theoremReachProvider).then(
      (offers) => ({ offers, error: null as string | null }),
      (error: unknown) => ({ offers: [] as Offer[], error: error instanceof Error ? error.message : "Unable to load TheoremReach offers" }),
    ),
    getNotikOffers(req, user.id, notikProvider).then(
      (offers) => ({ offers, error: null as string | null }),
      (error: unknown) => ({ offers: [] as Offer[], error: error instanceof Error ? error.message : "Unable to load Notik tasks" }),
    ),
  ]);

  const surveys = [...cpxResult.surveys, ...theoremReachResult.surveys]
    .sort((a, b) =>
      Number(b.recommended) - Number(a.recommended) ||
      b.rankScore - a.rankScore ||
      b.rewardCoins - a.rewardCoins,
    );
  const errors = {
    cpx_research: cpxProvider?.is_active ? cpxResult.error : null,
    theoremreach: theoremReachProvider?.is_active ? theoremReachResult.error : null,
    theoremreach_offers: theoremReachProvider?.is_active ? theoremReachOffersResult.error : null,
    notik_offers: notikProvider?.is_active ? notikOffersResult.error : null,
  };

  return NextResponse.json(
    {
      surveys,
      offers: interleaveOffers(
        theoremReachOffersResult.offers.sort((a, b) => b.rankScore - a.rankScore),
        notikOffersResult.offers,
      ),
      errors,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
