import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error: providerError } = await admin
    .from("offerwall_providers")
    .select("custom_config")
    .eq("slug", "cpx_research")
    .single();

  if (providerError) {
    console.error("[offerwall/cpx_research] provider lookup failed:", providerError.message);
    return NextResponse.json({ error: "Unable to load CPX Research configuration" }, { status: 500 });
  }

  const customConfig = provider.custom_config as Record<string, unknown> | null;
  const configuredAppId = customConfig?.app_id;
  const appId = typeof configuredAppId === "string" && configuredAppId.trim()
    ? configuredAppId.trim()
    : process.env.NEXT_PUBLIC_CPX_APP_ID;
  if (!appId) {
    console.error("[offerwall/cpx_research] NEXT_PUBLIC_CPX_APP_ID is not configured");
    return NextResponse.json({ error: "CPX Research app ID is not configured" }, { status: 503 });
  }

  const params = new URLSearchParams({
    app_id: appId,
    ext_user_id: user.id,
  });
  const secureHash = process.env.CPX_APP_SECURE_HASH;
  if (secureHash) {
    params.set("secure_hash", createHash("md5").update(`${user.id}${secureHash}`).digest("hex"));
  }

  return NextResponse.json(
    { iframeUrl: `https://offers.cpx-research.com/index.php?${params.toString()}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
