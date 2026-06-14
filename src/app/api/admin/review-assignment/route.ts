import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json() as {
      assignmentId: string;
      action: "approve" | "reject";
      feedback?: string;
    };
    const { assignmentId, action, feedback } = body;

    const { data: assignment, error: aErr } = await admin
      .from("assignments")
      .select("*, tasks(title)")
      .eq("id", assignmentId)
      .single();

    if (aErr || !assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const taskTitle = (assignment.tasks as { title: string })?.title ?? "a task";
    const now = new Date().toISOString();

    await admin.from("assignments").update({
      status: action === "approve" ? "approved" : "rejected",
      feedback: feedback ?? null,
      reviewed_by: user.id,
      reviewed_at: now,
    }).eq("id", assignmentId);

    if (action === "approve") {
      await admin.from("notifications").insert({
        user_id: assignment.contributor_id,
        title: "Assignment Approved!",
        message: `Your assignment for "${taskTitle}" was approved. You can now submit your work.`,
        type: "assignment_approved",
      });
    } else {
      await admin.from("notifications").insert({
        user_id: assignment.contributor_id,
        title: "Assignment Rejected",
        message: `Your assignment for "${taskTitle}" was not approved.${feedback ? ` Reason: ${feedback}` : ""} You can re-submit.`,
        type: "assignment_rejected",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
