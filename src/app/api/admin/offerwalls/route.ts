import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const SELECT_COLS = `
  id, name, slug, is_ad_network, api_key, postback_secret, embed_url_template,
  contributor_share_pct, notes, updated_at,
  integration_type, postback_param_map, hash_format, custom_config,
  is_active, display_order, logo_url, description
`.trim();

async function verifyOwnerOrAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "owner" && role !== "admin") return null;
  return { admin, role };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export async function GET(req: NextRequest) {
  const ctx = await verifyOwnerOrAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: providers, error } = await ctx.admin
    .from("offerwall_providers")
    .select(SELECT_COLS)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ providers: providers ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await verifyOwnerOrAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // DELETE provider
  if (body.action === "delete") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await ctx.admin.from("offerwall_providers").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // CREATE new provider
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const rawSlug = String(body.slug ?? "").trim() || slugify(name);
  const slug    = rawSlug.replace(/[^a-z0-9_]/g, "");
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const insert: Record<string, unknown> = {
    name,
    slug,
    is_ad_network:         body.is_ad_network    === true,
    is_active:             body.is_active         !== false,
    integration_type:      String(body.integration_type ?? "iframe"),
    contributor_share_pct: parseFloat(String(body.contributor_share_pct ?? "70")) || 70,
    display_order:         parseInt(String(body.display_order ?? "0"), 10) || 0,
    api_key:               String(body.api_key               ?? "").trim() || null,
    postback_secret:       String(body.postback_secret        ?? "").trim() || null,
    embed_url_template:    String(body.embed_url_template     ?? "").trim() || null,
    logo_url:              String(body.logo_url               ?? "").trim() || null,
    description:           String(body.description            ?? "").trim() || null,
    notes:                 String(body.notes                  ?? "").trim() || null,
    hash_format:           String(body.hash_format            ?? "").trim() || null,
  };

  // JSON fields — accept object or stringified JSON
  for (const col of ["postback_param_map", "custom_config"] as const) {
    const raw = body[col];
    if (raw == null || raw === "") {
      insert[col] = {};
    } else if (typeof raw === "object") {
      insert[col] = raw;
    } else {
      try { insert[col] = JSON.parse(String(raw)); } catch { insert[col] = {}; }
    }
  }

  const { data: provider, error } = await ctx.admin
    .from("offerwall_providers")
    .insert(insert)
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider });
}

export async function PATCH(req: NextRequest) {
  const ctx = await verifyOwnerOrAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Simple string fields
  const strFields: Record<string, string> = {
    api_key: "api_key",
    postback_secret: "postback_secret",
    embed_url_template: "embed_url_template",
    notes: "notes",
    integration_type: "integration_type",
    logo_url: "logo_url",
    description: "description",
    hash_format: "hash_format",
    name: "name",
  };
  for (const [k, col] of Object.entries(strFields)) {
    if (body[k] !== undefined) {
      update[col] = String(body[k]).trim() || null;
      // integration_type must not be null if provided
      if (col === "integration_type" && !update[col]) update[col] = "iframe";
    }
  }

  // Numeric fields
  if (body.contributor_share_pct !== undefined) {
    const pct = parseFloat(String(body.contributor_share_pct));
    if (!isNaN(pct) && pct >= 0 && pct <= 100) update.contributor_share_pct = pct;
  }
  if (body.display_order !== undefined) {
    const ord = parseInt(String(body.display_order), 10);
    if (!isNaN(ord)) update.display_order = ord;
  }

  // Boolean fields
  if (body.is_active !== undefined) update.is_active = body.is_active === true;
  if (body.is_ad_network !== undefined) update.is_ad_network = body.is_ad_network === true;

  // JSON fields
  for (const col of ["postback_param_map", "custom_config"] as const) {
    if (body[col] !== undefined) {
      const raw = body[col];
      if (raw == null || raw === "") {
        update[col] = {};
      } else if (typeof raw === "object") {
        update[col] = raw;
      } else {
        try { update[col] = JSON.parse(String(raw)); } catch { /* skip malformed */ }
      }
    }
  }

  const { data: provider, error } = await ctx.admin
    .from("offerwall_providers")
    .update(update)
    .eq("id", body.id)
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider });
}
