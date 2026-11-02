import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getVoucherCategoryEmoji, isVoucherCategory } from "@/lib/voucher-categories";
import { DEFAULT_VOUCHER_HOW_TO_USE, DEFAULT_VOUCHER_TERMS } from "@/lib/voucher-guidance";

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

function validateGuidanceList(value: unknown, label: string): { items: string[]; error?: string } {
  if (!Array.isArray(value) || value.length > 12) {
    return { items: [], error: `${label} must contain up to 12 items, each no longer than 300 characters.` };
  }
  const items: unknown[] = value;
  if (!items.every((item): item is string => typeof item === "string" && item.length <= 300)) {
    return { items: [], error: `${label} must contain up to 12 items, each no longer than 300 characters.` };
  }
  return { items: items.map((item) => item.trim()).filter(Boolean) };
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await admin
    .from("voucher_inventory")
    .select("id, brand_name, description, value_inr, coins_required, category, emoji, how_to_use, terms_and_conditions, is_available, created_at")
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
    coins_required?: number;
    denominations?: Array<{ value_inr?: number; coins_required?: number; is_available?: boolean }>;
    category?: string;
    how_to_use?: unknown;
    terms_and_conditions?: unknown;
    is_available?: boolean;
  };

  if (body.action === "create") {
    const { brand_name, description, value_inr, coins_required, category } = body;
    if (!brand_name?.trim()) return NextResponse.json({ error: "Brand name is required." }, { status: 400 });
    if (category !== undefined && !isVoucherCategory(category)) {
      return NextResponse.json({ error: "Select a valid voucher category." }, { status: 400 });
    }
    const howToUse = body.how_to_use === undefined
      ? { items: [...DEFAULT_VOUCHER_HOW_TO_USE] }
      : validateGuidanceList(body.how_to_use, "How to use");
    const terms = body.terms_and_conditions === undefined
      ? { items: [...DEFAULT_VOUCHER_TERMS] }
      : validateGuidanceList(body.terms_and_conditions, "Terms and Conditions");
    if (howToUse.error) return NextResponse.json({ error: howToUse.error }, { status: 400 });
    if (terms.error) return NextResponse.json({ error: terms.error }, { status: 400 });
    const requestedDenominations = body.denominations ?? [{ value_inr, coins_required }];
    if (!Array.isArray(requestedDenominations) || requestedDenominations.length === 0 || requestedDenominations.length > 20) {
      return NextResponse.json({ error: "Add between 1 and 20 voucher denominations." }, { status: 400 });
    }
    const normalizedDenominations: Array<{ value_inr: number; coins_required: number; is_available: boolean }> = [];
    for (const denomination of requestedDenominations) {
      if (!denomination || typeof denomination !== "object") {
        return NextResponse.json({ error: "Each denomination must include a value and NexCoins amount." }, { status: 400 });
      }
      if (typeof denomination.value_inr !== "number" || !Number.isSafeInteger(denomination.value_inr) || denomination.value_inr <= 0) {
        return NextResponse.json({ error: "Enter a valid whole-number value in INR for every denomination." }, { status: 400 });
      }
      if (typeof denomination.coins_required !== "number" || !Number.isSafeInteger(denomination.coins_required) || denomination.coins_required <= 0) {
        return NextResponse.json({ error: "NexCoins required must be a positive whole number for every denomination." }, { status: 400 });
      }
      if (denomination.is_available !== undefined && typeof denomination.is_available !== "boolean") {
        return NextResponse.json({ error: "Availability must be selected for every denomination." }, { status: 400 });
      }
      normalizedDenominations.push({
        value_inr: denomination.value_inr,
        coins_required: denomination.coins_required,
        is_available: denomination.is_available ?? true,
      });
    }
    if (new Set(normalizedDenominations.map(({ value_inr: value }) => value)).size !== normalizedDenominations.length) {
      return NextResponse.json({ error: "Each denomination value must be unique." }, { status: 400 });
    }

    const { data, error } = await admin
      .from("voucher_inventory")
      .insert(normalizedDenominations.map(({ value_inr: denominationValue, coins_required: denominationCoins, is_available }) => ({
        brand_name:     brand_name.trim(),
        description:    description?.trim() ?? "",
        value_inr:      denominationValue,
        value_usd:      null,
        coins_required: denominationCoins,
        category:       category ?? "shopping",
        emoji:          getVoucherCategoryEmoji(category ?? "shopping"),
        how_to_use:     howToUse.items,
        terms_and_conditions: terms.items,
        country_codes:  ["IN"],
        country_codes_verified: true,
        is_available,
      })))
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ vouchers: data ?? [], voucher: data?.[0] });
  }

  if (body.action === "update") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (body.is_available !== undefined && typeof body.is_available !== "boolean") {
      return NextResponse.json({ error: "Availability must be either in stock or out of stock." }, { status: 400 });
    }
    if (body.category !== undefined && !isVoucherCategory(body.category)) {
      return NextResponse.json({ error: "Select a valid voucher category." }, { status: 400 });
    }
    const howToUse = body.how_to_use === undefined ? undefined : validateGuidanceList(body.how_to_use, "How to use");
    const terms = body.terms_and_conditions === undefined
      ? undefined
      : validateGuidanceList(body.terms_and_conditions, "Terms and Conditions");
    if (howToUse?.error) return NextResponse.json({ error: howToUse.error }, { status: 400 });
    if (terms?.error) return NextResponse.json({ error: terms.error }, { status: 400 });
    if (typeof body.value_inr !== "number" || !Number.isSafeInteger(body.value_inr) || body.value_inr <= 0) {
      return NextResponse.json({ error: "Enter a valid voucher value in INR." }, { status: 400 });
    }
    if (body.coins_required !== undefined
      && (!Number.isSafeInteger(body.coins_required) || body.coins_required <= 0)) {
      return NextResponse.json({ error: "NexCoins required must be a positive whole number." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.brand_name     !== undefined) updates.brand_name     = body.brand_name.trim();
    if (body.description    !== undefined) updates.description    = body.description.trim();
    updates.value_inr      = body.value_inr;
    updates.value_usd      = null;
    updates.country_codes  = ["IN"];
    updates.country_codes_verified = true;
    if (body.is_available !== undefined) updates.is_available = body.is_available;
    if (body.coins_required !== undefined) updates.coins_required = body.coins_required;
    if (body.category !== undefined) {
      updates.category = body.category;
      updates.emoji = getVoucherCategoryEmoji(body.category);
    }
    if (howToUse) updates.how_to_use = howToUse.items;
    if (terms) updates.terms_and_conditions = terms.items;

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
