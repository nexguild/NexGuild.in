import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey    = process.env.THEOREMREACH_API_KEY    ?? "";
  const secretKey = process.env.THEOREMREACH_SECRET_KEY ?? "";
  const partnerId = process.env.NEXT_PUBLIC_THEOREMREACH_PLACEMENT_ID ?? "e1870419-681e-4792-b66b-c59deb5479fe";

  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: "TheoremReach not configured" }, { status: 503 });
  }

  // Unique transaction_id per page load
  const transactionId = `${user.id}-${Date.now()}`;

  const base = "https://theoremreach.com/respondent_entry/direct";
  const params = new URLSearchParams({
    api_key:                apiKey,
    user_id:                user.id,
    transaction_id:         transactionId,
    currency_name_plural:   "NexCoins",
    currency_name_singular: "NexCoin",
    exchange_rate:          "700",
    external_id:            user.id,
    partner_id:             partnerId,
  });
  const urlWithoutHash = `${base}?${params.toString()}`;

  // Base64 URL-safe HMAC-SHA1 (same format as postback validation)
  const rawHash   = createHmac("sha1", secretKey).update(urlWithoutHash).digest("base64");
  const hash      = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const iframeUrl = `${urlWithoutHash}&hash=${hash}`;

  return NextResponse.json({ iframeUrl });
}
