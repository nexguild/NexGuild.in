import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { normalizeNexcoins } from "@/lib/nexcoins";
import { getTheoremReachExchangeRate } from "@/lib/theoremreach";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "1.1.1.1"
  );
}

export async function GET(req: NextRequest) {
  // Verify contributor session
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error } = await admin
    .from("offerwall_providers")
    .select("api_key, postback_secret, custom_config, is_active")
    .eq("slug", "theoremreach")
    .maybeSingle();
  if (error) {
    console.error("[theoremreach/surveys] Provider lookup failed:", error.message);
    return NextResponse.json({ error: "TheoremReach configuration unavailable" }, { status: 503 });
  }

  const apiKey = provider?.api_key?.trim();
  const secretKey = provider?.postback_secret?.trim();
  if (!provider?.is_active || !apiKey || !secretKey) {
    return NextResponse.json({ error: "TheoremReach is not fully configured" }, { status: 503 });
  }
  const customConfig = provider.custom_config as Record<string, unknown> | null;
  let exchangeRate: number;
  try {
    exchangeRate = getTheoremReachExchangeRate(customConfig);
  } catch (error) {
    console.error("[theoremreach/surveys] Invalid provider configuration:", error);
    return NextResponse.json({ surveys: [], error: "TheoremReach exchange rate is invalid" }, { status: 503 });
  }
  const placementId = typeof customConfig?.placement_id === "string" && customConfig.placement_id.trim()
    ? customConfig.placement_id.trim()
    : "e1870419-681e-4792-b66b-c59deb5479fe";

  const ip = getClientIp(req);

  // Documented params only: api_key, user_id, ip, country_code
  const base = "https://api.theoremreach.com/api/publishers/v1/surveys";
  const params = new URLSearchParams({
    api_key:      apiKey,
    user_id:      user.id,
    ip,
    country_code: "IN",
  });
  const urlWithoutHash = `${base}?${params.toString()}`;

  // HMAC-SHA1 with UTF-8 string key, output as URL-safe base64 (no padding)
  const rawHash   = createHmac("sha1", secretKey).update(urlWithoutHash).digest("base64");
  const hash      = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const finalUrl  = `${urlWithoutHash}&hash=${hash}`;

  let trResponse: Response;
  try {
    trResponse = await fetch(finalUrl);
  } catch (err) {
    console.error("[theoremreach/surveys] fetch error:", err);
    return NextResponse.json({ surveys: [], error: "upstream_timeout" });
  }

  const responseText = await trResponse.text();

  console.log("[theoremreach/surveys] response", {
    status: trResponse.status,
    body:   responseText.substring(0, 500),
  });

  if (!trResponse.ok) {
    return NextResponse.json({ surveys: [] });
  }

  let data: {
    result_count?: number;
    surveys?: {
      campaign_id:    string;
      loi:            number;
      cpi:            number;
      rank:           number;
      average_rating: number;
      rating_count:   number;
      entry_link:     string;
    }[];
  };

  try {
    data = JSON.parse(responseText);
  } catch {
    console.error("[theoremreach/surveys] failed to parse JSON response");
    return NextResponse.json({ surveys: [] });
  }

  const raw = data.surveys ?? [];

  // Sort by rank descending (higher rank = better match for user)
  const sorted = [...raw].sort((a, b) => b.rank - a.rank);

  // Enrich with NexCoin value; append user_id + placement_id, then sign with hash.
  // Secret key must stay server-side — pre-sign here so client opens the URL directly.
  const surveys = sorted.map((s) => {
    const url = new URL(s.entry_link);
    url.searchParams.set("user_id",      user.id);
    url.searchParams.set("placement_id", placementId);

    const entryUrl  = url.toString();
    const rawHash   = createHmac("sha1", secretKey).update(entryUrl).digest("base64");
    const entryHash = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    return {
      campaign_id:    s.campaign_id,
      loi:            s.loi,
      cpi:            s.cpi,
      rank:           s.rank,
      average_rating: s.average_rating,
      rating_count:   s.rating_count,
      nexcoins:       normalizeNexcoins(s.cpi * exchangeRate),
      entry_link:     `${entryUrl}&hash=${entryHash}`,
    };
  });

  return NextResponse.json({ surveys });
}
