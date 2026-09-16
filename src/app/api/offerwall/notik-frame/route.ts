import { NextRequest } from "next/server";
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
  const appId = String(config.app_id ?? "");
  const publisherId = String(config.publisher_id ?? "");
  if (!appId || !publisherId) return new Response("Notik app configuration is incomplete", { status: 503 });

  const iframeUrl = new URL("https://notik.me/coins");
  iframeUrl.searchParams.set("api_key", provider.api_key);
  iframeUrl.searchParams.set("pub_id", publisherId);
  iframeUrl.searchParams.set("app_id", appId);
  iframeUrl.searchParams.set("user_id", user.id);

  const escapedUrl = iframeUrl.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><iframe src="${escapedUrl}" style="height:100vh;width:100%;margin:0;padding:0;border:0" allow="fullscreen" title="Notik Offerwall"></iframe></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
