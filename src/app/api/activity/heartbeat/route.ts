import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getContributorActivityDate } from "@/lib/contributor-activity";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[activity/heartbeat] profile lookup failed:", profileError.message);
    return NextResponse.json({ error: "Unable to verify contributor account." }, { status: 500 });
  }
  if ((profile.role && profile.role !== "contributor") || profile.is_active === false) {
    return NextResponse.json({ error: "Contributor account required." }, { status: 403 });
  }

  const { error: activityError } = await admin
    .from("contributor_activity")
    .upsert(
      {
        contributor_id: user.id,
        activity_date: getContributorActivityDate(),
        last_active_at: new Date().toISOString(),
      },
      { onConflict: "contributor_id,activity_date" },
    );

  if (activityError) {
    console.error("[activity/heartbeat] activity write failed:", activityError.message);
    return NextResponse.json({ error: "Unable to record contributor activity." }, { status: 500 });
  }
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { error: cleanupError } = await admin
    .from("contributor_activity")
    .delete()
    .eq("contributor_id", user.id)
    .lt("activity_date", getContributorActivityDate(yesterday));
  if (cleanupError) {
    console.error("[activity/heartbeat] old activity cleanup failed:", cleanupError.message);
  }
  return NextResponse.json({ ok: true });
}
