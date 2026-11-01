import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { getContributorActivityDate } from "@/lib/contributor-activity";

const MAX_ROWS = 500;

function getIndiaDayStart(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return new Date(`${values.get("year")}-${values.get("month")}-${values.get("day")}T00:00:00+05:30`);
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: roleError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (roleError) {
    console.error("[admin/contributor-activity] role lookup failed:", roleError.message);
    return NextResponse.json({ error: "Unable to verify admin role." }, { status: 500 });
  }
  if (!ADMIN_ROLES.UPPER.some((role) => role === profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const todayDate = getContributorActivityDate();
  const todayStart = getIndiaDayStart(new Date());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDate = getContributorActivityDate(yesterdayStart);
  const select = "contributor_id, activity_date, last_active_at, profiles!contributor_activity_contributor_id_fkey(full_name, email, country, status)";

  const [todayResult, yesterdayResult] = await Promise.all([
    admin.from("contributor_activity")
      .select(select, { count: "exact" })
      .eq("activity_date", todayDate)
      .order("last_active_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    admin.from("contributor_activity")
      .select(select, { count: "exact" })
      .eq("activity_date", yesterdayDate)
      .order("last_active_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
  ]);

  if (todayResult.error || yesterdayResult.error) {
    const message = todayResult.error?.message ?? yesterdayResult.error?.message ?? "Activity query failed.";
    console.error("[admin/contributor-activity] activity query failed:", message);
    return NextResponse.json({ error: "Failed to load contributor activity." }, { status: 500 });
  }

  return NextResponse.json({
    timezone: "Asia/Kolkata",
    today: {
      date: todayDate,
      count: todayResult.count ?? 0,
      contributors: todayResult.data ?? [],
      truncated: (todayResult.count ?? 0) > MAX_ROWS,
    },
    yesterday: {
      date: yesterdayDate,
      count: yesterdayResult.count ?? 0,
      contributors: yesterdayResult.data ?? [],
      truncated: (yesterdayResult.count ?? 0) > MAX_ROWS,
    },
  });
}
