import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FROM_NOREPLY, getResend, assignmentApprovedHtml, assignmentRejectedHtml } from "@/lib/email";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && profile?.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json() as {
      assignmentId: string;
      action: "approve" | "reject";
      feedback?: string;
    };
    const { assignmentId, action, feedback } = body;

    const { data: assignment, error: aErr } = await admin
      .from("assignments")
      .select("*, tasks(id, title)")
      .eq("id", assignmentId)
      .single();

    if (aErr || !assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const taskMeta = assignment.tasks as unknown as { id: string; title: string } | null;
    const taskTitle = taskMeta?.title ?? "a task";
    const taskId    = taskMeta?.id ?? "";
    const now = new Date().toISOString();

    await admin.from("assignments").update({
      status:      action === "approve" ? "approved" : "rejected",
      feedback:    feedback ?? null,
      reviewed_by: user.id,
      reviewed_at: now,
    }).eq("id", assignmentId);

    if (action === "approve") {
      await admin.from("notifications").insert({
        user_id: assignment.contributor_id,
        title:   "Assignment Approved!",
        message: `Your assignment for "${taskTitle}" was approved. You can now submit your work.`,
        type:    "assignment_approved",
      });
    } else {
      await admin.from("notifications").insert({
        user_id: assignment.contributor_id,
        title:   "Assignment Rejected",
        message: `Your assignment for "${taskTitle}" was not approved.${feedback ? ` Reason: ${feedback}` : ""} You can re-submit.`,
        type:    "assignment_rejected",
      });
    }

    // ── Email (non-critical) ─────────────────────────────────────
    const resend = getResend();
    if (resend) {
      const { data: contrib } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", assignment.contributor_id)
        .single();

      const p = contrib as { full_name: string | null; email: string | null } | null;
      if (p?.email) {
        if (action === "approve") {
          await resend.emails.send({
            from:    FROM_NOREPLY,
            to:      p.email,
            subject: `Assignment approved! You can now start "${taskTitle}"`,
            html:    assignmentApprovedHtml(p.full_name ?? "Contributor", taskTitle, taskId),
          }).catch((e: unknown) => console.error("[review-assignment] email error:", e));
        } else {
          await resend.emails.send({
            from:    FROM_NOREPLY,
            to:      p.email,
            subject: `Assignment feedback — ${taskTitle}`,
            html:    assignmentRejectedHtml(p.full_name ?? "Contributor", taskTitle, feedback ?? null),
          }).catch((e: unknown) => console.error("[review-assignment] email error:", e));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
