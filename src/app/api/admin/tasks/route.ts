import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FROM_NOREPLY, getResend, newTaskHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // ── Auth check ───────────────────────────────────────────────────────────
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "admin" && caller?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      title, task_type, description, requirements,
      pay_per_task, total_slots, deadline,
      assignment_required, assignment_type, status,
    } = body as {
      title: string;
      task_type: string;
      description: string;
      requirements?: string;
      pay_per_task?: number;
      total_slots?: number;
      deadline?: string;
      assignment_required?: boolean;
      assignment_type?: string;
      status: "active" | "draft";
    };

    if (!title?.trim() || !task_type || !description?.trim()) {
      return NextResponse.json({ error: "title, task_type, and description are required." }, { status: 400 });
    }

    // ── Insert task ───────────────────────────────────────────────────────────
    const { data: task, error: insertErr } = await admin
      .from("tasks")
      .insert({
        title: title.trim(),
        task_type,
        description: description.trim(),
        requirements: requirements?.trim() || null,
        pay_per_task: pay_per_task ?? null,
        total_slots: total_slots ?? null,
        deadline: deadline || null,
        assignment_required: assignment_required ?? false,
        assignment_type: assignment_required ? (assignment_type ?? "quiz") : null,
        status,
      })
      .select("id, title, task_type, pay_per_task, total_slots")
      .single();

    if (insertErr || !task) {
      console.error("[admin/tasks] insert error:", insertErr?.message);
      return NextResponse.json({ error: insertErr?.message ?? "Failed to create task" }, { status: 500 });
    }

    // ── Email blast for active tasks ──────────────────────────────────────────
    if (status === "active") {
      const resend = getResend();
      if (resend) {
        // Fetch all contributor profiles with email
        const { data: contributors } = await admin
          .from("profiles")
          .select("full_name, email")
          .eq("role", "contributor")
          .not("email", "is", null);

        const profiles = (contributors ?? []) as { full_name: string | null; email: string }[];

        if (profiles.length > 0) {
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

          // Resend batch allows up to 100 per call
          const CHUNK = 100;
          for (let i = 0; i < emails.length; i += CHUNK) {
            const chunk = emails.slice(i, i + CHUNK);
            const { error: batchErr } = await resend.batch.send(chunk);
            if (batchErr) console.error("[admin/tasks] batch email error:", batchErr);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, task });

  } catch (err) {
    console.error("[admin/tasks] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
