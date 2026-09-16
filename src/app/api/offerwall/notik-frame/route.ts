import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return new Response("Unauthorized", { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: provider, error } = await admin
    .from("offerwall_providers")
    .select("api_key, custom_config, is_active")
    .eq("slug", "notik")
    .single();

  if (error || !provider?.is_active || !provider.api_key) {
    return new Response("Notik is not configured", { status: 503 });
  }

  const config = (provider.custom_config ?? {}) as Record<string, unknown>;
  const appId = String(config.app_id ?? "N1A6qKCgr");
  const publisherId = String(config.publisher_id ?? "UEoeUU");
  if (!appId || !publisherId) return new Response("Notik app configuration is incomplete", { status: 503 });

  const iframeUrl = new URL("https://notik.me/coins");
  // Notik rejects UUID-shaped user_id values. Keep a short stable identifier
  // in user_id and carry the real contributor UUID in the optional s1 field.
  const notikUserId = `U${createHash("sha256").update(user.id).digest("hex").slice(0, 11)}`;
  iframeUrl.searchParams.set("api_key", provider.api_key);
  iframeUrl.searchParams.set("pub_id", publisherId);
  iframeUrl.searchParams.set("app_id", appId);
  iframeUrl.searchParams.set("user_id", notikUserId);
  iframeUrl.searchParams.set("s1", user.id);

  return NextResponse.json(
    { iframeUrl: iframeUrl.toString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
