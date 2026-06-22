import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { SupabaseClient } from "@supabase/supabase-js";

// finance role can read and manage the voucher catalog
const ALLOWED_ROLES = ["owner", "admin", "finance"];

async function verifyAdmin(req: NextRequest): Promise<SupabaseClient | null> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !ALLOWED_ROLES.includes(role)) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("voucher_inventory")
    .select("id, brand_name, description, value_inr, value_usd, coins_required, category, emoji, is_available, created_at")
    .order("brand_name", { ascending: true })
    .order("coins_required", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vouchers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    action: "create" | "update" | "delete" | "toggle";
    id?: string;
    brand_name?: string;
    description?: string;
    value_inr?: number;
    value_usd?: number;
    coins_required?: number;
    category?: string;
    emoji?: string;
    is_available?: boolean;
  };

  if (body.action === "create") {
    const { brand_name, description, value_inr, value_usd, coins_required, category, emoji } = body;
    if (!brand_name?.trim()) return NextResponse.json({ error: "Brand name is required." }, { status: 400 });

    const hasInr = typeof value_inr === "number" && value_inr > 0;
    const hasUsd = typeof value_usd === "number" && value_usd > 0;
    if (!hasInr && !hasUsd) {
      return NextResponse.json({ error: "Enter a price in INR or USD." }, { status: 400 });
    }
    if (!coins_required || coins_required <= 0) {
      return NextResponse.json({ error: "NexCoins required must be positive." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("voucher_inventory")
      .insert({
        brand_name:     brand_name.trim(),
        description:    description?.trim() ?? "",
        value_inr:      hasInr ? value_inr : null,
        value_usd:      hasUsd ? value_usd : null,
        coins_required,
        category:       category ?? "shopping",
        emoji:          emoji?.trim() || "🎁",
        is_available:   true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ voucher: data });
  }

  if (body.action === "update") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const hasInr = typeof body.value_inr === "number" && body.value_inr > 0;
    const hasUsd = typeof body.value_usd === "number" && body.value_usd > 0;
    if (!hasInr && !hasUsd) {
      return NextResponse.json({ error: "Enter a price in INR or USD." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.brand_name     !== undefined) updates.brand_name     = body.brand_name.trim();
    if (body.description    !== undefined) updates.description    = body.description.trim();
    updates.value_inr      = hasInr ? body.value_inr : null;
    updates.value_usd      = hasUsd ? body.value_usd : null;
    if (body.coins_required !== undefined) updates.coins_required = body.coins_required;
    if (body.category       !== undefined) updates.category       = body.category;
    if (body.emoji          !== undefined) updates.emoji          = body.emoji.trim() || "🎁";

    const { data, error } = await admin
      .from("voucher_inventory")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ voucher: data });
  }

  if (body.action === "toggle") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { data, error } = await admin
      .from("voucher_inventory")
      .update({ is_available: body.is_available })
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ voucher: data });
  }

  if (body.action === "delete") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await admin.from("voucher_inventory").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
