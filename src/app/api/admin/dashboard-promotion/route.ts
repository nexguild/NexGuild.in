import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  DASHBOARD_PROMOTION_SETTING_KEY,
  DEFAULT_DASHBOARD_PROMOTION,
  parseDashboardPromotion,
} from "@/lib/dashboard-promotion";

const ANNOUNCE_ROLES = ["owner", "admin", "support", "moderator"];

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!ANNOUNCE_ROLES.includes(role ?? "")) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", DASHBOARD_PROMOTION_SETTING_KEY)
    .maybeSingle();
  if (error) {
    console.error("[admin/dashboard-promotion] load error:", error.message);
    return NextResponse.json({ error: "Could not load dashboard announcement." }, { status: 500 });
  }

  if (!data) return NextResponse.json(DEFAULT_DASHBOARD_PROMOTION);

  let value: unknown;
  try {
    value = JSON.parse((data as { value: string }).value);
  } catch {
    console.error("[admin/dashboard-promotion] stored setting is not valid JSON");
    return NextResponse.json({ error: "Dashboard announcement settings are invalid." }, { status: 500 });
  }

  const promotion = parseDashboardPromotion(value);
  if (!promotion) {
    console.error("[admin/dashboard-promotion] stored setting failed validation");
    return NextResponse.json({ error: "Dashboard announcement settings are invalid." }, { status: 500 });
  }
  return NextResponse.json(promotion);
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await req.json().catch(() => null);
  const promotion = parseDashboardPromotion(body);
  if (!promotion) {
    return NextResponse.json({ error: "Please review the announcement fields and links." }, { status: 400 });
  }

  const { error } = await admin.from("platform_settings").upsert(
    {
      key: DASHBOARD_PROMOTION_SETTING_KEY,
      value: JSON.stringify(promotion),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) {
    console.error("[admin/dashboard-promotion] save error:", error.message);
    return NextResponse.json({ error: "Could not save dashboard announcement." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, promotion });
}
