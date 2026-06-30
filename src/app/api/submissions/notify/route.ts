import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@/lib/email";
import { writeSubmissionRow, type SubmissionRowData } from "@/lib/google-drive";

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = makeAdmin();

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { taskId } = await req.json() as { taskId: string };

    const [{ data: profile }, { data: task }, { data: sub }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", user.id).single(),
      admin.from("tasks").select("id, title, steps, drive_sheet_id").eq("id", taskId).single(),
      admin.from("submissions")
        .select("id, notes, files, submitted_at")
        .eq("task_id", taskId)
        .eq("contributor_id", user.id)
        .maybeSingle(),
    ]);

    const contributorName = (profile as { full_name: string | null } | null)?.full_name ?? "A contributor";
    const taskTitle       = (task as { title: string } | null)?.title ?? "a task";

    // Fire-and-forget admin emails
    notifyAdmins(admin, "new_submission", {
      contributorName,
      detail:    taskTitle,
      actionUrl: `https://nexguild.in/admin/submissions`,
    });

    // ── Write complete Sheet row (non-blocking) ───────────────────────────
    const sheetId = (task as { drive_sheet_id: string | null } | null)?.drive_sheet_id ?? null;
    if (sheetId && sub) {
      const taskSteps = (task as { steps: { title: string; submitType: string }[] | null } | null)?.steps ?? [];
      const hasSteps  = taskSteps.length > 0;

      buildAndWriteSheetRow({
        sheetId,
        submissionId:    sub.id,
        contributorId:   user.id,
        contributorName,
        submittedAt:     (sub as { submitted_at: string }).submitted_at,
        taskId,
        steps:           taskSteps,
        hasSteps,
        classicNotes:    (sub as { notes: string | null }).notes,
        classicFiles:    (sub as { files: { url: string }[] | null }).files,
      }).catch((err) => console.error("[submissions/notify] sheet write failed:", err));
    } else if (!sheetId) {
      console.log("[submissions/notify] no drive_sheet_id for task", taskId, "— skipping sheet row");
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[submissions/notify]", e);
    return NextResponse.json({ ok: true }); // never block the submitter
  }
}

async function buildAndWriteSheetRow({
  sheetId,
  submissionId,
  contributorId,
  contributorName,
  submittedAt,
  taskId,
  steps,
  hasSteps,
  classicNotes,
  classicFiles,
}: {
  sheetId: string;
  submissionId: string;
  contributorId: string;
  contributorName: string;
  submittedAt: string;
  taskId: string;
  steps: { title: string; submitType: string }[];
  hasSteps: boolean;
  classicNotes: string | null;
  classicFiles: { url: string }[] | null;
}) {
  const admin = makeAdmin();
  let stepContents: string[];

  if (hasSteps) {
    // Fetch all step submissions for this (task_id, contributor_id)
    const { data: stepSubs } = await admin
      .from("task_step_submissions")
      .select("step_index, submission_type, text_value, file_url")
      .eq("task_id", taskId)
      .eq("contributor_id", contributorId)
      .order("step_index", { ascending: true });

    const byIndex = new Map<number, { submission_type: string; text_value: string | null; file_url: string | null }>();
    for (const ss of stepSubs ?? []) {
      byIndex.set(ss.step_index, ss);
    }

    stepContents = steps.map((_, idx) => {
      const ss = byIndex.get(idx);
      if (!ss) return "";
      if (ss.submission_type === "text")        return ss.text_value ?? "";
      if (ss.submission_type === "file")        return ss.file_url ?? "";
      if (ss.submission_type === "proof_code")  return `Verified: ${ss.text_value ?? ""}`;
      if (ss.submission_type === "none")        return "✓ Complete";
      return ss.text_value ?? ss.file_url ?? "";
    });
  } else {
    // Classic mode: notes + file URLs
    const notes = classicNotes ?? "";
    const files = (classicFiles ?? []).map((f) => f.url).join(", ");
    stepContents = [notes, files];
  }

  const rowData: SubmissionRowData = {
    submissionId,
    contributorId,
    contributorName,
    submittedAt,
    stepContents,
  };

  await writeSubmissionRow(sheetId, rowData);
  console.log("[submissions/notify] sheet row written for submission", submissionId);
}
