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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data: project, error } = await ctx.admin
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Task stats for this project
  const { data: tasks } = await ctx.admin
    .from("tasks")
    .select("id, title, task_type, status, pay_per_task, total_slots, filled_slots, drive_sheet_id")
    .eq("project_id", id)
    .is("deleted_at", null);

  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);

  // Submission stats
  const { data: submissions } = taskIds.length
    ? await ctx.admin
        .from("submissions")
        .select("id, task_id, status, coins_awarded, nexleader_id")
        .in("task_id", taskIds)
    : { data: [] };

  const approved = (submissions ?? []).filter((s: { status: string }) => s.status === "approved");
  const ncPaid = approved.reduce((sum: number, s: { coins_awarded: number | null }) => sum + (s.coins_awarded ?? 0), 0);

  // Rough nexleader commission: approved submissions where nexleader_id is set, commission = coins_awarded * 0.10
  const nexleaderCommission = approved
    .filter((s: { nexleader_id: string | null }) => s.nexleader_id)
    .reduce((sum: number, s: { coins_awarded: number | null }) => sum + Math.floor((s.coins_awarded ?? 0) * 0.10), 0);

  const taskStats = (tasks ?? []).map((t: Record<string, unknown>) => {
    const taskSubs = (submissions ?? []).filter((s: { task_id: string }) => s.task_id === t.id);
    const approvedSubs = taskSubs.filter((s: { status: string }) => s.status === "approved");
    return {
      ...t,
      submission_count: taskSubs.length,
      approved_count:   approvedSubs.length,
      nc_paid:          approvedSubs.reduce((sum: number, s: { coins_awarded: number | null }) => sum + (s.coins_awarded ?? 0), 0),
    };
  });

  return NextResponse.json({
    project: {
      ...project,
      task_count:           (tasks ?? []).length,
      nc_paid:              ncPaid,
      nexleader_commission: nexleaderCommission,
      platform_cut:         Math.floor(ncPaid * 0.24),
      net_contributor_payout: Math.floor(ncPaid * 0.66),
    },
    tasks: taskStats,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const allowed = [
    "name", "client_name", "description", "project_type", "status",
    "start_date", "deadline", "payment_timeline", "total_budget_nc",
    "client_payment_amount", "client_payment_received", "client_payment_received_at",
    "internal_notes",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  // Auto-set received_at when marking received
  if (body.client_payment_received === true && !body.client_payment_received_at) {
    updates.client_payment_received_at = new Date().toISOString();
  }
  if (body.client_payment_received === false) {
    updates.client_payment_received_at = null;
  }

  const { error } = await ctx.admin.from("projects").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Unlink tasks before deleting
  await ctx.admin.from("tasks").update({ project_id: null }).eq("project_id", id);
  const { error } = await ctx.admin.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
