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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");
  const taskFilter   = url.searchParams.get("task_id");

  // Get all tasks for this project
  const { data: tasks, error: taskErr } = await ctx.admin
    .from("tasks")
    .select("id, title")
    .eq("project_id", id)
    .is("deleted_at", null);

  if (taskErr) return NextResponse.json({ error: taskErr.message }, { status: 500 });
  if (!tasks?.length) return NextResponse.json({ submissions: [], tasks: [] });

  const taskIds = tasks.map((t: { id: string }) => t.id);
  const filteredTaskIds = taskFilter ? [taskFilter] : taskIds;

  let query = ctx.admin
    .from("submissions")
    .select("id, contributor_id, task_id, status, notes, coins_awarded, feedback, submitted_at, files, nexleader_id, nexleader_name, profiles(full_name, email)")
    .in("task_id", filteredTaskIds)
    .order("submitted_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: submissions, error: subErr } = await query;
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  // Attach task title to each submission
  const taskMap: Record<string, string> = {};
  for (const t of tasks) taskMap[(t as { id: string }).id] = (t as { title: string }).title;

  const enriched = (submissions ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    task_title: taskMap[s.task_id as string] ?? "Unknown",
  }));

  return NextResponse.json({ submissions: enriched, tasks });
}
