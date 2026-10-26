import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error } = await admin
    .from("offerwall_providers")
    .select("api_key, is_active")
    .eq("slug", "clixwall")
    .single();

  if (error) {
    console.error("[offerwall/clixwall] provider lookup failed:", error.message);
    return NextResponse.json({ error: "Unable to load ClixWall configuration" }, { status: 500 });
  }
  if (!provider?.is_active || !provider.api_key?.trim()) {
    return NextResponse.json({ error: "ClixWall is not configured" }, { status: 503 });
  }

  const wallUrl = new URL("https://clixwall.com/wall");
  wallUrl.searchParams.set("api", provider.api_key.trim());
  wallUrl.searchParams.set("user", user.id);

  return NextResponse.json(
    { wallUrl: wallUrl.toString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
