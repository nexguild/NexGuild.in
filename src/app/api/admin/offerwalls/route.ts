import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyOwnerOrAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "owner" && role !== "admin") return null;
  return { admin };
}

export async function GET(req: NextRequest) {
  const ctx = await verifyOwnerOrAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: providers, error } = await ctx.admin
    .from("offerwall_providers")
    .select("id, name, slug, is_ad_network, api_key, postback_secret, embed_url_template, contributor_share_pct, notes, updated_at")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ providers: providers ?? [] });
}

export async function PATCH(req: NextRequest) {
  const ctx = await verifyOwnerOrAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    id: string;
    api_key?: string;
    postback_secret?: string;
    embed_url_template?: string;
    contributor_share_pct?: number | string;
    notes?: string;
  };

  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.api_key !== undefined)            update.api_key            = body.api_key.trim() || null;
  if (body.postback_secret !== undefined)    update.postback_secret    = body.postback_secret.trim() || null;
  if (body.embed_url_template !== undefined) update.embed_url_template = body.embed_url_template.trim() || null;
  if (body.notes !== undefined)              update.notes              = body.notes.trim() || null;
  if (body.contributor_share_pct !== undefined) {
    const pct = parseFloat(String(body.contributor_share_pct));
    if (!isNaN(pct) && pct >= 0 && pct <= 100) update.contributor_share_pct = pct;
  }

  const { data: provider, error } = await ctx.admin
    .from("offerwall_providers")
    .update(update)
    .eq("id", body.id)
    .select("id, name, slug, is_ad_network, api_key, postback_secret, embed_url_template, contributor_share_pct, notes, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider });
}
