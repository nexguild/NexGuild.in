import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFile, isDriveConfigured } from "@/lib/google-drive";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;

  // ── Auth ─────────────────────────────────────────────────────────────────
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Apps Script must be configured ────────────────────────────────────────
  if (!isDriveConfigured()) {
    console.error("[upload-to-drive] Apps Script not configured — APPS_SCRIPT_WEB_APP_URL / APPS_SCRIPT_SHARED_SECRET missing");
    return NextResponse.json(
      { error: "File upload unavailable: Apps Script not configured (contact admin)" },
      { status: 503 },
    );
  }

  // ── Parse FormData ────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const stepIndex = formData.get("stepIndex");

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // ── Get task Drive Images folder ──────────────────────────────────────────
  const { data: task, error: taskErr } = await admin
    .from("tasks")
    .select("id, drive_images_folder_id")
    .eq("id", taskId)
    .single();

  if (taskErr || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const driveImagesFolderId = task.drive_images_folder_id as string | null;
  if (!driveImagesFolderId) {
    console.error(`[upload-to-drive] task ${taskId} has no drive_images_folder_id — task was created before Apps Script was configured`);
    return NextResponse.json(
      { error: "This task has no Drive folder — it was created before Drive integration was set up. Ask an admin to recreate the task." },
      { status: 503 },
    );
  }

  // ── Upload via Apps Script ────────────────────────────────────────────────
  const buffer   = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const fileName = `${user.id}_step${stepIndex ?? "x"}_${Date.now()}_${file.name}`;

  let driveResult: { id: string; viewUrl: string; previewUrl: string } | null = null;
  let driveError: string | null = null;

  try {
    console.log(`[upload-to-drive] calling Apps Script upload_file for task=${taskId} folder=${driveImagesFolderId} file=${fileName}`);
    driveResult = await uploadFile(buffer, fileName, mimeType, driveImagesFolderId);
    console.log(`[upload-to-drive] Apps Script returned:`, JSON.stringify(driveResult));
  } catch (err) {
    driveError = err instanceof Error ? err.message : String(err);
    console.error(`[upload-to-drive] Apps Script upload_file threw:`, driveError);
  }

  if (!driveResult) {
    return NextResponse.json(
      { error: `Drive upload failed — ${driveError ?? "no result returned"}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url:        driveResult.viewUrl,
    previewUrl: driveResult.previewUrl,
    driveId:    driveResult.id,
    name:       file.name,
    size:       file.size,
  });
}
