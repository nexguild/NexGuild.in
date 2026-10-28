import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  DASHBOARD_PROMOTION_SETTING_KEY,
  DEFAULT_DASHBOARD_PROMOTION,
  parseDashboardPromotion,
} from "@/lib/dashboard-promotion";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = createServerClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", DASHBOARD_PROMOTION_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.error("[dashboard-promotion] load error:", error.message);
    return NextResponse.json({ error: "Could not load dashboard announcement." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(DEFAULT_DASHBOARD_PROMOTION, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  let value: unknown;
  try {
    value = JSON.parse((data as { value: string }).value);
  } catch {
    console.error("[dashboard-promotion] stored setting is not valid JSON");
    return NextResponse.json({ error: "Dashboard announcement settings are invalid." }, { status: 500 });
  }

  const promotion = parseDashboardPromotion(value);
  if (!promotion) {
    console.error("[dashboard-promotion] stored setting failed validation");
    return NextResponse.json({ error: "Dashboard announcement settings are invalid." }, { status: 500 });
  }

  return NextResponse.json(promotion, {
    headers: { "Cache-Control": "no-store" },
  });
}
