import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET /api/daily-work?taskId=X&date=YYYY-MM-DD
// Returns contributor's daily_work_items for today (or given date).
// For pool-mode projects: auto-assigns unassigned items up to the daily quota.
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url    = new URL(req.url);
  const taskId = url.searchParams.get("taskId");
  const date   = url.searchParams.get("date")
    ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

  // Fetch task + project settings
  const { data: task } = await db
    .from("tasks")
    .select("id, project_id, pay_per_unit_nc, projects(is_daily_target, daily_quota, daily_unit_name, file_delivery_method)")
    .eq("id", taskId)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const project = task.projects as unknown as {
    is_daily_target: boolean | null;
    daily_quota: number | null;
    daily_unit_name: string | null;
    file_delivery_method: string | null;
  } | null;

  if (!project?.is_daily_target) {
    return NextResponse.json({ isDailyTarget: false });
  }

  const projectId      = task.project_id as string;
  const quota          = project.daily_quota ?? 10;
  const deliveryMethod = project.file_delivery_method ?? "admin_upload";

  // Fetch already-assigned items for this contributor today
  const { data: existingItems } = await db
    .from("daily_work_items")
    .select("*")
    .eq("project_id", projectId)
    .eq("contributor_id", user.id)
    .eq("assigned_date", date)
    .order("created_at", { ascending: true });

  let items = existingItems ?? [];

  // Pool mode: auto-assign more items if under quota
  if (deliveryMethod === "pool" && items.length < quota) {
    const needed = quota - items.length;

    // Fetch unassigned pool items (contributor_id IS NULL)
    const { data: poolItems } = await db
      .from("daily_work_items")
      .select("id")
      .eq("project_id", projectId)
      .eq("assigned_date", date)
      .is("contributor_id", null)
      .limit(needed);

    if (poolItems && poolItems.length > 0) {
      const idsToAssign = (poolItems as { id: string }[]).map((p) => p.id);
      const { data: assigned } = await db
        .from("daily_work_items")
        .update({ contributor_id: user.id })
        .in("id", idsToAssign)
        .is("contributor_id", null)  // guard: re-check null to prevent race
        .select("*");

      if (assigned) items = [...items, ...assigned];
    }
  }

  const completedCount = items.filter((i: { status: string }) => ["submitted", "approved"].includes(i.status)).length;

  return NextResponse.json({
    isDailyTarget:  true,
    quota,
    unitName:       project.daily_unit_name ?? "item",
    items,
    completedCount,
    deliveryMethod,
  });
}
