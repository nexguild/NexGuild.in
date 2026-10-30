export interface MyLeadCampaignOffer {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sourceName: string;
  providerName: string;
  kind: "network";
  estimatedRewardCoins: number;
  rankScore: number;
  terms: string | null;
  confirmationTime: string;
  events: { name: string; estimatedRewardCoins: number }[];
  entryUrl: string;
}

interface MyLeadPayment {
  title?: string;
  revenue?: number | string;
  currency?: string;
}

interface MyLeadCampaign {
  id?: number | string;
  name?: string;
  status?: string;
  preview_url?: string;
  logo?: string;
  cr?: number | string;
  epc?: number | string;
  description_lang?: Record<string, unknown>;
  short_description_lang?: Record<string, unknown>;
  countries?: Array<{ code?: string } | string>;
  payments?: MyLeadPayment[];
  restrictions?: Array<{ name_lang?: Record<string, unknown> }>;
  tracking_links?: Array<{ tracking_url?: string }>;
}

const API_BASE = "https://api.mylead.global/api/external/v1";
const CAMPAIGN_LIMIT = 500;
const MAX_CAMPAIGNS_PER_REQUEST = 5;
const CACHE_TTL_MS = 5 * 60 * 1000;

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let authentication: Promise<string> | null = null;

const offersCache = new Map<string, { expiresAt: number; offers: MyLeadCampaignOffer[] }>();
const offersInFlight = new Map<string, Promise<MyLeadCampaignOffer[]>>();

export function isMyLeadApiConfigured(): boolean {
  return Boolean(process.env.MYLEAD_API_USERNAME?.trim() && process.env.MYLEAD_API_PASSWORD);
}

export function myLeadCoinsPerCurrency(currency: string): number | null {
  const normalizedCurrency = currency.toUpperCase();
  if (normalizedCurrency !== "USD" && normalizedCurrency !== "EUR") return null;

  const configuredRate = Number(process.env[`MYLEAD_${normalizedCurrency}_TO_NEXCOINS_RATE`]);
  return Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 660;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLocalizedText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (!isRecord(value)) return null;

  const english = value.en;
  if (typeof english === "string" && english.trim()) return english.trim();
  const firstText = Object.values(value).find((item): item is string => typeof item === "string" && !!item.trim());
  return firstText?.trim() ?? null;
}

function parseCampaign(value: unknown): MyLeadCampaign | null {
  return isRecord(value) ? value as MyLeadCampaign : null;
}

function parseCampaignsResponse(value: unknown): MyLeadCampaign[] {
  if (!isRecord(value) || value.status !== "success" || !isRecord(value.data)) {
    throw new Error("MyLead returned an invalid campaigns response");
  }
  const campaigns = value.data.campaigns;
  if (!Array.isArray(campaigns)) throw new Error("MyLead returned no campaign list");
  return campaigns.flatMap((item) => {
    const campaign = parseCampaign(item);
    return campaign ? [campaign] : [];
  });
}

async function authenticate(force = false): Promise<string> {
  if (!force && accessToken && Date.now() < tokenExpiresAt) return accessToken;
  if (authentication) return authentication;

  const username = process.env.MYLEAD_API_USERNAME?.trim();
  const password = process.env.MYLEAD_API_PASSWORD;
  if (!username || !password) throw new Error("MyLead Publisher API credentials are not configured");

  authentication = (async () => {
    const form = new FormData();
    form.set("username", username);
    form.set("password", password);
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      body: form,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`MyLead API authentication returned HTTP ${response.status}`);

    const result: unknown = await response.json();
    const data = isRecord(result) && isRecord(result.data) ? result.data : null;
    const token = data?.access_token;
    const expiresIn = Number(data?.expires_in);
    if (typeof token !== "string" || !token.trim()) {
      throw new Error("MyLead API authentication did not return an access token");
    }

    accessToken = token;
    tokenExpiresAt = Date.now() + Math.max(0, (Number.isFinite(expiresIn) ? expiresIn : 0) - 30) * 1000;
    return token;
  })();

  try {
    return await authentication;
  } finally {
    authentication = null;
  }
}

async function myLeadGet(path: string, retryUnauthorized = true): Promise<unknown> {
  const token = await authenticate();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });

  if (response.status === 401 && retryUnauthorized) {
    accessToken = null;
    tokenExpiresAt = 0;
    await authenticate(true);
    return myLeadGet(path, false);
  }
  if (response.status === 403) throw new Error("MyLead API access is not enabled for this publisher account");
  if (response.status === 429) throw new Error("MyLead API rate limit reached; try again shortly");
  if (!response.ok) throw new Error(`MyLead campaigns API returned HTTP ${response.status}`);
  return response.json();
}

function isCountryEligible(campaign: MyLeadCampaign, countryCode: string | null): boolean {
  const countries = campaign.countries ?? [];
  if (!countryCode || countries.length === 0) return true;
  return countries.some((country) => {
    const code = typeof country === "string" ? country : country.code;
    return typeof code === "string" && code.toUpperCase() === countryCode;
  });
}

function getPayments(campaign: MyLeadCampaign): MyLeadPayment[] {
  return Array.isArray(campaign.payments) ? campaign.payments : [];
}

function toHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function loadMyLeadCampaignOffers(countryCode: string | null): Promise<MyLeadCampaignOffer[]> {
  const params = new URLSearchParams({ page: "1", limit: String(CAMPAIGN_LIMIT) });
  const listResponse = await myLeadGet(`/campaigns?${params.toString()}`);
  const campaigns = parseCampaignsResponse(listResponse)
    .filter((campaign) => campaign.id !== undefined && isCountryEligible(campaign, countryCode))
    .slice(0, MAX_CAMPAIGNS_PER_REQUEST);

  const detailedCampaigns = await Promise.all(campaigns.map(async (summary) => {
    const response = await myLeadGet(`/campaign/${encodeURIComponent(String(summary.id))}`);
    if (!isRecord(response) || response.status !== "success" || !isRecord(response.data)) {
      throw new Error(`MyLead returned invalid details for campaign ${summary.id}`);
    }
    const detail = parseCampaign(response.data.campaign);
    return detail ? { ...summary, ...detail } : summary;
  }));

  return detailedCampaigns.flatMap((campaign): MyLeadCampaignOffer[] => {
    const id = campaign.id === undefined ? "" : String(campaign.id);
    if (!id || !campaign.name?.trim()) return [];

    const trackingUrl = toHttpsUrl(campaign.tracking_links?.[0]?.tracking_url);
    if (!trackingUrl) return [];

    const payments = getPayments(campaign).flatMap((payment) => {
      const revenue = Number(payment.revenue);
      const currency = payment.currency?.toUpperCase();
      const rate = currency ? myLeadCoinsPerCurrency(currency) : null;
      if (!Number.isFinite(revenue) || revenue <= 0 || !rate) return [];
      return [{
        name: payment.title?.trim() || "Complete the campaign",
        reward: Math.max(1, Math.floor(revenue * rate)),
      }];
    });
    if (!payments.length) return [];

    const restrictions = (campaign.restrictions ?? [])
      .map((restriction) => getLocalizedText(restriction.name_lang))
      .filter((text): text is string => !!text);
    const logoUrl = toHttpsUrl(campaign.logo);

    return [{
      id: `mylead-${id}`,
      name: campaign.name.trim(),
      description: getLocalizedText(campaign.short_description_lang)
        ?? getLocalizedText(campaign.description_lang),
      imageUrl: logoUrl,
      sourceName: "MyLead",
      providerName: "MyLead",
      kind: "network",
      estimatedRewardCoins: Math.max(...payments.map((payment) => payment.reward)),
      rankScore: Number(campaign.epc ?? campaign.cr) || 0,
      terms: restrictions.length ? restrictions.join(" · ") : null,
      confirmationTime: "Credited after MyLead approves the conversion",
      events: payments.map((payment) => ({
        name: payment.name,
        estimatedRewardCoins: payment.reward,
      })),
      entryUrl: trackingUrl,
    }];
  });
}

export async function getMyLeadCampaignOffers(
  userId: string,
  countryCode: string | null,
): Promise<MyLeadCampaignOffer[]> {
  const cacheKey = countryCode ?? "all";
  const cached = offersCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return attachUserId(cached.offers, userId);

  const inFlight = offersInFlight.get(cacheKey);
  const request = inFlight ?? loadMyLeadCampaignOffers(countryCode);
  if (!inFlight) offersInFlight.set(cacheKey, request);

  try {
    const offers = await request;
    if (!inFlight) offersCache.set(cacheKey, { offers, expiresAt: Date.now() + CACHE_TTL_MS });
    return attachUserId(offers, userId);
  } finally {
    if (!inFlight) offersInFlight.delete(cacheKey);
  }
}

function attachUserId(offers: MyLeadCampaignOffer[], userId: string): MyLeadCampaignOffer[] {
  return offers.map((offer) => {
    const entryUrl = new URL(offer.entryUrl);
    entryUrl.searchParams.set("ml_sub1", userId);
    return { ...offer, entryUrl: entryUrl.toString() };
  });
}
