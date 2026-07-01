import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@/lib/email";
import { writeSubmissionRow, type SubmissionRowData } from "@/lib/google-drive";
import { callAppsScript, isAppsScriptConfigured } from "@/lib/apps-script";

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  console.log("NOTIFY ROUTE HIT");

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    console.log("[submissions/notify] EARLY RETURN: no token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[submissions/notify] token present, calling auth.getUser");

  const admin = makeAdmin();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (!user) {
    console.log("[submissions/notify] EARLY RETURN: auth failed —", userErr?.message ?? "user null");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[submissions/notify] auth OK userId=" + user.id);

  let parsedBody: { taskId?: string } = {};
  try {
    parsedBody = await req.json() as { taskId?: string };
    console.log("[submissions/notify] body parsed:", JSON.stringify(parsedBody));
  } catch (parseErr) {
    console.error("[submissions/notify] EARLY RETURN: req.json() threw:", parseErr);
    return NextResponse.json({ ok: true });
  }

  const { taskId } = parsedBody;
  if (!taskId) {
    console.log("[submissions/notify] EARLY RETURN: taskId missing from body");
    return NextResponse.json({ ok: true });
  }

  try {
    console.log(`[submissions/notify] ▶ hit — taskId=${taskId} userId=${user.id}`);

    const [{ data: profile }, { data: task }, { data: sub }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", user.id).single(),
      admin.from("tasks").select("id, title, steps, drive_folder_id, drive_sheet_id").eq("id", taskId).single(),
      admin.from("submissions")
        .select("id, notes, files, submitted_at")
        .eq("task_id", taskId)
        .eq("contributor_id", user.id)
        .maybeSingle(),
    ]);

    const contributorName = (profile as { full_name: string | null } | null)?.full_name ?? "A contributor";
    const taskTitle       = (task as { title: string } | null)?.title ?? "a task";
    const driveFolderId   = (task as { drive_folder_id: string | null } | null)?.drive_folder_id ?? null;
    let   sheetId         = (task as { drive_sheet_id: string | null } | null)?.drive_sheet_id ?? null;

    console.log(`[submissions/notify] task="${taskTitle}" drive_folder_id=${driveFolderId ?? "null"} drive_sheet_id=${sheetId ?? "null"} sub_id=${sub?.id ?? "null"}`);

    // Fire-and-forget admin emails
    notifyAdmins(admin, "new_submission", {
      contributorName,
      detail:    taskTitle,
      actionUrl: `https://nexguild.in/admin/submissions`,
    });

    if (!sub) {
      console.error(`[submissions/notify] no submission found for task=${taskId} user=${user.id} — cannot write sheet row`);
      return NextResponse.json({ ok: true });
    }

    // ── Lazy sheet creation ───────────────────────────────────────────────
    // Task was created before Apps Script was set up, so drive_sheet_id is null
    // even though drive_folder_id exists. Create the sheet now, save it, then write.
    if (!sheetId && driveFolderId && isAppsScriptConfigured()) {
      console.log(`[submissions/notify] drive_sheet_id missing — calling create_sheet for folder=${driveFolderId}`);
      try {
        const taskSteps = (task as { steps: { title: string; submitType: string }[] | null } | null)?.steps ?? [];
        const res = await callAppsScript<{ sheetId: string }>("create_sheet", {
          folderId:  driveFolderId,
          sheetName: `${taskTitle} - Submissions`,
          steps:     taskSteps,
        });
        sheetId = res.sheetId;
        console.log(`[submissions/notify] created sheet=${sheetId} — saving to task`);
        await admin.from("tasks").update({ drive_sheet_id: sheetId }).eq("id", taskId);
      } catch (err) {
        console.error(`[submissions/notify] create_sheet failed:`, err);
      }
    }

    if (!sheetId) {
      console.warn(`[submissions/notify] drive_sheet_id is null and could not be created — skipping sheet row for task=${taskId}`);
      return NextResponse.json({ ok: true });
    }

    // ── Write complete Sheet row (non-blocking) ───────────────────────────
    const taskSteps = (task as { steps: { title: string; submitType: string }[] | null } | null)?.steps ?? [];
    const hasSteps  = taskSteps.length > 0;

    console.log(`[submissions/notify] ▶ calling write_submission_row — sheetId=${sheetId} submissionId=${sub.id} hasSteps=${hasSteps}`);

    // MUST be awaited — Vercel terminates the function when the response is sent,
    // killing any fire-and-forget .catch() before the sheet row is written.
    await buildAndWriteSheetRow({
      sheetId,
      submissionId:    sub.id,
      contributorId:   user.id,
      contributorName,
      submittedAt:     (sub as { submitted_at: string | null }).submitted_at ?? new Date().toISOString(),
      taskId,
      steps:           taskSteps,
      hasSteps,
      classicNotes:    (sub as { notes: string | null }).notes,
      classicFiles:    (sub as { files: { url: string }[] | null }).files,
    }).catch((err) => console.error("[submissions/notify] buildAndWriteSheetRow threw:", err));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[submissions/notify] unhandled error:", e);
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
    const { data: stepSubs } = await admin
      .from("task_step_submissions")
      .select("step_index, submission_type, text_value, file_url")
      .eq("task_id", taskId)
      .eq("contributor_id", contributorId)
      .order("step_index", { ascending: true });

    console.log(`[submissions/notify] fetched ${stepSubs?.length ?? 0} step submissions for taskId=${taskId} userId=${contributorId}`);

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
    const notes = classicNotes ?? "";
    const files = (classicFiles ?? []).map((f) => f.url).join(", ");
    stepContents = [notes, files];
  }

  console.log(`[submissions/notify] stepContents for submissionId=${submissionId}:`, JSON.stringify(stepContents));

  const rowData: SubmissionRowData = {
    submissionId,
    contributorId,
    contributorName,
    submittedAt,
    stepContents,
  };

  await writeSubmissionRow(sheetId, rowData);
  console.log(`[submissions/notify] ✓ write_submission_row complete for submissionId=${submissionId}`);
}
