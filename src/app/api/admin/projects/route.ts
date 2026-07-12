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
  return { admin, userId: user.id };
}

export async function GET(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: projects, error } = await ctx.admin
    .from("projects")
    .select("id, name, client_name, description, project_type, status, start_date, deadline, total_budget_nc, client_payment_amount, client_payment_received, is_daily_target, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!projects?.length) return NextResponse.json({ projects: [] });

  // Fetch task counts + NC paid per project
  const projectIds = projects.map((p: { id: string }) => p.id);
  const { data: tasks } = await ctx.admin
    .from("tasks")
    .select("id, project_id, status")
    .in("project_id", projectIds);

  const { data: submissions } = await ctx.admin
    .from("submissions")
    .select("task_id, status, coins_awarded")
    .eq("status", "approved")
    .in("task_id", (tasks ?? []).map((t: { id: string }) => t.id));

  // Build maps
  const tasksByProject: Record<string, { id: string; status: string }[]> = {};
  for (const t of tasks ?? []) {
    const pid = (t as { project_id: string }).project_id;
    if (!tasksByProject[pid]) tasksByProject[pid] = [];
    tasksByProject[pid].push(t as { id: string; status: string });
  }
  const ncByTask: Record<string, number> = {};
  for (const s of submissions ?? []) {
    const sub = s as { task_id: string; coins_awarded: number | null };
    ncByTask[sub.task_id] = (ncByTask[sub.task_id] ?? 0) + (sub.coins_awarded ?? 0);
  }

  const enriched = projects.map((p: Record<string, unknown>) => {
    const ptasks = tasksByProject[p.id as string] ?? [];
    const ncPaid = ptasks.reduce((sum, t) => sum + (ncByTask[t.id] ?? 0), 0);
    return { ...p, task_count: ptasks.length, nc_paid: ncPaid };
  });

  return NextResponse.json({ projects: enriched });
}

export async function POST(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) return NextResponse.json({ error: "Project name is required." }, { status: 400 });

  const { data, error } = await ctx.admin.from("projects").insert({
    name:                     body.name.trim(),
    client_name:              body.client_name?.trim() || null,
    description:              body.description?.trim() || null,
    project_type:             body.project_type?.trim() || null,
    status:                   body.status || "draft",
    start_date:               body.start_date || null,
    deadline:                 body.deadline || null,
    payment_timeline:         body.payment_timeline?.trim() || null,
    total_budget_nc:          body.total_budget_nc ? parseInt(body.total_budget_nc) : 0,
    client_payment_amount:    body.client_payment_amount?.trim() || null,
    client_payment_received:  body.client_payment_received ?? false,
    internal_notes:           body.internal_notes?.trim() || null,
    created_by:               ctx.userId,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: (data as { id: string }).id });
}
