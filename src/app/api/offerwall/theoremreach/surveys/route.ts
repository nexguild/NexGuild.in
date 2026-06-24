import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

const EXCHANGE_RATE = 700; // $1 = 700 NexCoins

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

  // Read env vars directly — no intermediate variable for the secret key
  // to ensure THEOREMREACH_SECRET_KEY is never confused with THEOREMREACH_API_KEY
  const THEOREMREACH_API_KEY    = process.env.THEOREMREACH_API_KEY    ?? "";
  const THEOREMREACH_SECRET_KEY = process.env.THEOREMREACH_SECRET_KEY ?? "";
  const placementId             = process.env.NEXT_PUBLIC_THEOREMREACH_PLACEMENT_ID ?? "e1870419-681e-4792-b66b-c59deb5479fe";

  if (!THEOREMREACH_API_KEY || !THEOREMREACH_SECRET_KEY) {
    return NextResponse.json({ error: "TheoremReach not configured" }, { status: 503 });
  }

  const ip = getClientIp(req);

  // Documented params only: api_key, user_id, ip, country_code
  const base = "https://api.theoremreach.com/api/publishers/v1/surveys";
  const params = new URLSearchParams({
    api_key:      THEOREMREACH_API_KEY,
    user_id:      user.id,
    ip,
    country_code: "IN",
  });
  const urlWithoutHash = `${base}?${params.toString()}`;

  // HMAC-SHA1 with UTF-8 string key, output as URL-safe base64 (no padding)
  const rawHash   = createHmac("sha1", THEOREMREACH_SECRET_KEY).update(urlWithoutHash).digest("base64");
  const hash      = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const finalUrl  = `${urlWithoutHash}&hash=${hash}`;

  console.log("[theoremreach/surveys] hash_debug", {
    api_key_prefix:    THEOREMREACH_API_KEY.slice(0, 6) + "****",
    secret_key_prefix: THEOREMREACH_SECRET_KEY.slice(0, 4) + "****",
    hash_b64url:       hash,
    hmac_input:        urlWithoutHash.replace(THEOREMREACH_API_KEY, "[redacted]"),
  });

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
    const rawHash   = createHmac("sha1", THEOREMREACH_SECRET_KEY).update(entryUrl).digest("base64");
    const entryHash = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

    return {
      campaign_id:    s.campaign_id,
      loi:            s.loi,
      cpi:            s.cpi,
      rank:           s.rank,
      average_rating: s.average_rating,
      rating_count:   s.rating_count,
      nexcoins:       Math.floor(s.cpi * EXCHANGE_RATE),
      entry_link:     `${entryUrl}&hash=${entryHash}`,
    };
  });

  return NextResponse.json({ surveys });
}
