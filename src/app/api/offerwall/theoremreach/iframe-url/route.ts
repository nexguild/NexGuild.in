import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
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
    console.error("[offerwall/theoremreach/iframe-url] Provider lookup failed:", error.message);
    return NextResponse.json({ error: "TheoremReach configuration unavailable" }, { status: 503 });
  }

  const apiKey = provider?.api_key?.trim();
  const secretKey = provider?.postback_secret?.trim();
  if (!provider?.is_active || !apiKey || !secretKey) {
    return NextResponse.json({ error: "TheoremReach is not fully configured" }, { status: 503 });
  }
  const customConfig = provider.custom_config as Record<string, unknown> | null;
  const partnerId = typeof customConfig?.placement_id === "string" && customConfig.placement_id.trim()
    ? customConfig.placement_id.trim()
    : "e1870419-681e-4792-b66b-c59deb5479fe";

  // Unique transaction_id per page load
  const transactionId = `${user.id}-${Date.now()}`;

  const base = "https://theoremreach.com/respondent_entry/direct";
  const params = new URLSearchParams({
    api_key:                apiKey,
    user_id:                user.id,
    transaction_id:         transactionId,
    currency_name_plural:   "NexCoins",
    currency_name_singular: "NexCoin",
    exchange_rate:          "660",
    external_id:            user.id,
    partner_id:             partnerId,
  });
  const urlWithoutHash = `${base}?${params.toString()}`;

  // Base64 URL-safe HMAC-SHA1 (same format as postback validation)
  const rawHash   = createHmac("sha1", secretKey).update(urlWithoutHash).digest("base64");
  const hash      = rawHash.replace(/\+/g, "-").replace(/\//g, "_").replace(/[=\r\n]/g, "");
  const iframeUrl = `${urlWithoutHash}&hash=${hash}`;

  return NextResponse.json({ iframeUrl });
}
