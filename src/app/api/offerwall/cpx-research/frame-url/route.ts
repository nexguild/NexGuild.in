import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error: providerError } = await admin
    .from("offerwall_providers")
    .select("custom_config, is_active")
    .eq("slug", "cpx_research")
    .single();

  if (providerError) {
    console.error("[offerwall/cpx_research] provider lookup failed:", providerError.message);
    return NextResponse.json({ error: "Unable to load CPX Research configuration" }, { status: 500 });
  }
  if (!provider?.is_active) {
    return NextResponse.json({ error: "CPX Research is disabled" }, { status: 503 });
  }

  const customConfig = provider.custom_config as Record<string, unknown> | null;
  const configuredAppId = customConfig?.app_id;
  const appId = typeof configuredAppId === "string" && configuredAppId.trim()
    ? configuredAppId.trim()
    : process.env.NEXT_PUBLIC_CPX_APP_ID;
  if (!appId) {
    console.error("[offerwall/cpx_research] CPX app ID is not configured");
    return NextResponse.json({ error: "CPX Research app ID is not configured" }, { status: 503 });
  }

  const params = new URLSearchParams({
    app_id: appId,
    ext_user_id: user.id,
  });

  return NextResponse.json(
    { iframeUrl: `https://offers.cpx-research.com/index.php?${params.toString()}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
