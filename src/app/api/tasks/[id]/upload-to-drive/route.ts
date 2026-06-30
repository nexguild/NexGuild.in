import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadFile } from "@/lib/google-drive";

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
    return NextResponse.json({ error: "Drive folder not configured for this task" }, { status: 503 });
  }

  // ── Upload file to Drive ──────────────────────────────────────────────────
  const buffer   = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const fileName = `${user.id}_step${stepIndex ?? "x"}_${Date.now()}_${file.name}`;

  let driveResult: { id: string; viewUrl: string; previewUrl: string } | null = null;
  try {
    driveResult = await uploadFile(buffer, fileName, mimeType, driveImagesFolderId);
  } catch (err) {
    console.error("[upload-to-drive] Drive upload failed:", err);
    return NextResponse.json({ error: "Drive upload failed" }, { status: 500 });
  }

  if (!driveResult) {
    return NextResponse.json({ error: "Drive not configured" }, { status: 503 });
  }

  // Sheet row is written ONCE when the full submission is complete (via /api/submissions/notify),
  // not on each individual file upload step.

  return NextResponse.json({
    url:        driveResult.viewUrl,
    previewUrl: driveResult.previewUrl,
    driveId:    driveResult.id,
    name:       file.name,
    size:       file.size,
  });
}
