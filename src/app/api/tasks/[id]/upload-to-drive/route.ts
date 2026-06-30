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
  const buffer   = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const fileName = `${user.id}_step${stepIndex ?? "x"}_${Date.now()}_${file.name}`;

  // ── Upload via Apps Script (Drive) or fall back to Supabase Storage ───────
  if (driveImagesFolderId && isDriveConfigured()) {
    let driveResult: { id: string; viewUrl: string; previewUrl: string } | null = null;
    try {
      driveResult = await uploadFile(buffer, fileName, mimeType, driveImagesFolderId);
    } catch (err) {
      console.error("[upload-to-drive] Drive upload failed, falling back to Supabase:", err);
    }

    if (driveResult) {
      return NextResponse.json({
        url:        driveResult.viewUrl,
        previewUrl: driveResult.previewUrl,
        driveId:    driveResult.id,
        name:       file.name,
        size:       file.size,
      });
    }
  }

  // ── Supabase Storage fallback ─────────────────────────────────────────────
  const storagePath = `task-submissions/${taskId}/${user.id}/${Date.now()}_${file.name}`;
  const { data: storageData, error: storageErr } = await admin.storage
    .from("submissions")
    .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

  if (storageErr || !storageData) {
    console.error("[upload-to-drive] Supabase Storage fallback failed:", storageErr?.message);
    return NextResponse.json({ error: "Upload failed — Drive and storage both unavailable" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("submissions").getPublicUrl(storagePath);

  return NextResponse.json({
    url:        publicUrl,
    previewUrl: publicUrl,
    driveId:    null,
    name:       file.name,
    size:       file.size,
  });
}
