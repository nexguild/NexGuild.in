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

  const { status } = await req.json() as { status: string };
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });

  // Fetch current task to detect draft → active transition
  const { data: task } = await admin
    .from("tasks")
    .select("id, title, task_type, pay_per_task, total_slots, status, is_private")
    .eq("id", taskId)
    .is("deleted_at", null)
    .single();

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const prevStatus = (task as { status: string }).status;
  const isPrivate  = (task as { is_private: boolean | null }).is_private ?? false;

  const { error: updateErr } = await admin
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Send contributor email blast only when publishing a draft (and not private)
  if (prevStatus === "draft" && status === "active" && !isPrivate) {
    sendNewTaskEmails(task as typeof task).catch((err) =>
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
