import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "admin" && role !== "owner") return null;
  return { admin };
}

// GET — list all active tasks not yet linked to any project (for "Link existing task" dropdown)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode"); // "available" = unlinked tasks

  if (mode === "available") {
    const { data, error } = await ctx.admin
      .from("tasks")
      .select("id, title, task_type, status")
      .is("project_id", null)
      .is("deleted_at", null)
      .neq("status", "archived")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tasks: data ?? [] });
  }

  // Default: tasks already linked to this project (with submission stats)
  const { data: tasks, error } = await ctx.admin
    .from("tasks")
    .select("id, title, task_type, status, pay_per_task, total_slots, filled_slots, drive_sheet_id")
    .eq("project_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tasks?.length) return NextResponse.json({ tasks: [] });

  const taskIds = tasks.map((t: { id: string }) => t.id);
  const { data: subs } = await ctx.admin
    .from("submissions")
    .select("task_id, status, coins_awarded")
    .in("task_id", taskIds);

  const enriched = tasks.map((t: Record<string, unknown>) => {
    const taskSubs = (subs ?? []).filter((s: { task_id: string }) => s.task_id === t.id);
    const approved = taskSubs.filter((s: { status: string }) => s.status === "approved");
    return {
      ...t,
      submission_count: taskSubs.length,
      approved_count:   approved.length,
      nc_paid:          approved.reduce((sum: number, s: { coins_awarded: number | null }) => sum + (s.coins_awarded ?? 0), 0),
    };
  });

  return NextResponse.json({ tasks: enriched });
}

// POST — link an existing task to this project
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { task_id } = await req.json().catch(() => ({})) as { task_id?: string };
  if (!task_id) return NextResponse.json({ error: "task_id required" }, { status: 400 });

  const { error } = await ctx.admin.from("tasks").update({ project_id: id }).eq("id", task_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
