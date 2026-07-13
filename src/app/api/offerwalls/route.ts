import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Select api_key server-side to derive isLive — NEVER return the value to the client
  const { data: providers, error } = await admin
    .from("offerwall_providers")
    .select("id, name, slug, is_ad_network, embed_url_template, api_key, integration_type, is_active, display_order, description, logo_url, custom_config")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const safeProviders = (providers ?? []).map((p: {
    id: string; name: string; slug: string; is_ad_network: boolean;
    embed_url_template: string | null; api_key: string | null;
    integration_type: string | null; is_active: boolean;
    display_order: number; description: string | null; logo_url: string | null;
    custom_config: Record<string, unknown> | null;
  }) => ({
    id:                 p.id,
    name:               p.name,
    slug:               p.slug,
    is_ad_network:      p.is_ad_network,
    embed_url_template: p.embed_url_template,
    integration_type:   p.integration_type ?? "iframe",
    description:        p.description,
    logo_url:           p.logo_url,
    feature_tags:       Array.isArray(p.custom_config?.feature_tags) ? p.custom_config?.feature_tags as string[] : [],
    available_countries: Array.isArray(p.custom_config?.available_countries) ? p.custom_config?.available_countries as string[] : [],
    isLive:             !!(p.api_key && p.api_key.trim().length > 0),
  }));

  return NextResponse.json({ providers: safeProviders });
}
