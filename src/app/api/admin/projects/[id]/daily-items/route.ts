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
  if (!["admin", "owner", "reviewer"].includes(role ?? "")) return null;
  return { admin, user };
}

// GET /api/admin/projects/[id]/daily-items?date=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;
  const { admin } = ctx;

  const url  = new URL(req.url);
  const date = url.searchParams.get("date") ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const { data, error } = await admin
    .from("daily_work_items")
    .select("*, profiles:contributor_id(full_name, email), tasks(title, pay_per_unit_nc)")
    .eq("project_id", projectId)
    .eq("assigned_date", date)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [], date });
}

// POST /api/admin/projects/[id]/daily-items  — upload files for a day
// Body: { date, taskId, fileEntries: [{url, name}], deliveryMethod }
// deliveryMethod = 'admin_upload' → round-robin assign to active contributors
// deliveryMethod = 'pool'        → store with contributor_id = null
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;
  const { admin } = ctx;

  const body = await req.json() as {
    date: string;
    taskId: string;
    fileEntries: { url: string; name: string }[];
    deliveryMethod: "admin_upload" | "pool";
  };

  const { date, taskId, fileEntries, deliveryMethod } = body;
  if (!date || !taskId || !fileEntries?.length) {
    return NextResponse.json({ error: "date, taskId, and fileEntries are required" }, { status: 400 });
  }

  // Verify task belongs to this project
  const { data: task } = await admin
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .single();
  if (!task) return NextResponse.json({ error: "Task not found in this project" }, { status: 404 });

  if (deliveryMethod === "pool") {
    // Add to pool — no contributor assignment
    const rows = fileEntries.map((f) => ({
      project_id:    projectId,
      task_id:       taskId,
      contributor_id: null,
      assigned_date: date,
      file_url:      f.url || null,
      file_name:     f.name || null,
      status:        "pending",
    }));

    const { error } = await admin.from("daily_work_items").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, created: rows.length, mode: "pool" });
  }

  // admin_upload: round-robin distribute to active contributors
  // Active = contributors with in_progress/submitted submissions for linked tasks
  const { data: taskIds } = await admin
    .from("tasks")
    .select("id")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  const allTaskIds = (taskIds ?? []).map((t: { id: string }) => t.id);
  if (allTaskIds.length === 0) return NextResponse.json({ error: "No tasks in project" }, { status: 400 });

  const { data: activeSubs } = await admin
    .from("submissions")
    .select("contributor_id")
    .in("task_id", allTaskIds)
    .in("status", ["in_progress", "submitted", "approved"]);

  // Deduplicate contributors
  const contributorIds = [...new Set((activeSubs ?? []).map((s: { contributor_id: string }) => s.contributor_id))];
  if (contributorIds.length === 0) {
    return NextResponse.json({ error: "No active contributors found for this project" }, { status: 400 });
  }

  // Round-robin assign
  const rows = fileEntries.map((f, i) => ({
    project_id:    projectId,
    task_id:       taskId,
    contributor_id: contributorIds[i % contributorIds.length],
    assigned_date: date,
    file_url:      f.url || null,
    file_name:     f.name || null,
    status:        "pending",
  }));

  const { error } = await admin.from("daily_work_items").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: rows.length, contributors: contributorIds.length, mode: "admin_upload" });
}
