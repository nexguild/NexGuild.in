import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FROM_NOREPLY, getResend, newTaskHtml } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function requireAdmin(token: string | null | undefined) {
  if (!token) return null;
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!["owner", "admin"].includes(caller?.role ?? "")) return null;
  return user;
}

// PATCH /api/admin/tasks/[id]  — update status; sends emails when publishing draft→active
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user  = await requireAdmin(token);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    status?: string; project_id?: string | null;
    pay_per_task?: number | null; pay_per_task_inr?: number | null;
    required_task_ids?: string[]; excluded_task_ids?: string[];
  };

  const ALLOWED_KEYS = ["status", "project_id", "pay_per_task", "pay_per_task_inr", "required_task_ids", "excluded_task_ids", "external_tool_url", "external_tool_name", "external_tool_instructions", "external_proof_type", "allows_partial_payment", "unit_name", "total_units", "pay_per_unit_inr", "pay_per_unit_nc"];
  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) updates[key] = body[key as keyof typeof body];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  type TaskRow = { id: string; title: string; task_type: string | null; pay_per_task: number | null; total_slots: number | null; status: string; is_private: boolean | null };

  // Need current task state only when status changes (for email blast logic)
  let prevTask: TaskRow | null = null;
  if ("status" in updates) {
    const { data } = await admin
      .from("tasks")
      .select("id, title, task_type, pay_per_task, total_slots, status, is_private")
      .eq("id", taskId)
      .is("deleted_at", null)
      .single();
    prevTask = data as TaskRow | null;
    if (!prevTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { error: updateErr } = await admin.from("tasks").update(updates).eq("id", taskId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Email blast when publishing draft → active
  if (prevTask && updates.status === "active" && prevTask.status === "draft" && !prevTask.is_private) {
    sendNewTaskEmails(prevTask).catch((err) =>
      console.error("[tasks/[id]] publish email blast failed:", err)
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/tasks/[id]  — soft delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const user  = await requireAdmin(token);
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await admin
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

async function sendNewTaskEmails(
  task: { id: string; title: string; task_type: string | null; pay_per_task: number | null; total_slots: number | null },
) {
  const resend = getResend();
  if (!resend) return;

  const { data: contributors } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("role", "contributor")
    .not("email", "is", null);

  const profiles = (contributors ?? []) as { full_name: string | null; email: string }[];
  if (profiles.length === 0) return;

  const emails = profiles.map((p) => ({
    from:    FROM_NOREPLY,
    to:      p.email,
    subject: `New task available: ${task.title}`,
    html:    newTaskHtml(
      p.full_name ?? "Contributor",
      task.title,
      task.task_type ?? "",
      task.pay_per_task ?? 0,
      task.total_slots ?? null,
      task.id,
    ),
  }));

  const CHUNK = 100;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const { error } = await resend.batch.send(emails.slice(i, i + CHUNK));
    if (error) console.error("[tasks/[id]] batch email error:", error);
  }
}
