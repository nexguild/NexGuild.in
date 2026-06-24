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

  const apiKey     = process.env.THEOREMREACH_API_KEY;
  const secretKey  = process.env.THEOREMREACH_SECRET_KEY;
  const placementId = process.env.NEXT_PUBLIC_THEOREMREACH_PLACEMENT_ID ?? "e1870419-681e-4792-b66b-c59deb5479fe";

  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: "TheoremReach not configured" }, { status: 503 });
  }

  const ip = getClientIp(req);

  // Build the URL without hash first
  const base = "https://api.theoremreach.com/api/publishers/v1/surveys";
  const params = new URLSearchParams({
    api_key:          apiKey,
    user_id:          user.id,
    ip,
    country_code:     "IN",
    placement_id:     placementId,
    max_result_count: "20",
  });
  const urlWithoutHash = `${base}?${params.toString()}`;

  // HMAC-SHA1 of the full URL (without hash param)
  const hash = createHmac("sha1", secretKey).update(urlWithoutHash).digest("hex");
  const finalUrl = `${urlWithoutHash}&hash=${hash}`;

  // Debug: log the URL (redact api_key, show hash so we can verify)
  console.log("[theoremreach/surveys] request", {
    user_id:       user.id,
    ip,
    placement_id:  placementId,
    api_key_prefix: apiKey.slice(0, 6) + "****",
    hash_prefix:   hash.slice(0, 8) + "...",
    url_without_hash: urlWithoutHash.replace(apiKey, apiKey.slice(0, 6) + "****"),
  });

  let trResponse: Response;
  try {
    trResponse = await fetch(finalUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error("[theoremreach/surveys] fetch error:", err);
    return NextResponse.json({ surveys: [], error: "upstream_timeout" });
  }

  const responseText = await trResponse.text().catch(() => "");

  // Always log status + raw body so we can diagnose issues
  console.log("[theoremreach/surveys] response", {
    status: trResponse.status,
    ok:     trResponse.ok,
    body:   responseText.slice(0, 1000), // first 1000 chars
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

  // Enrich with NexCoin value; append user_id + placement_id to entry_link
  const surveys = sorted.map((s) => {
    const url = new URL(s.entry_link);
    url.searchParams.set("user_id",      user.id);
    url.searchParams.set("placement_id", placementId);

    return {
      campaign_id:    s.campaign_id,
      loi:            s.loi,
      cpi:            s.cpi,
      rank:           s.rank,
      average_rating: s.average_rating,
      rating_count:   s.rating_count,
      nexcoins:       Math.floor(s.cpi * EXCHANGE_RATE),
      entry_link:     url.toString(),
    };
  });

  return NextResponse.json({ surveys });
}
