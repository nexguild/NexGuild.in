import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractSheetId,
  writeSheetHeader,
  getServiceAccountEmail,
} from "@/lib/google-drive";

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

  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!["owner", "admin"].includes(caller?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const { sheetInput } = await req.json() as { sheetInput: string };
  if (!sheetInput?.trim()) {
    return NextResponse.json({ error: "Sheet URL or ID is required" }, { status: 400 });
  }

  const sheetId = extractSheetId(sheetInput.trim());
  if (!sheetId) {
    return NextResponse.json({ error: "Could not extract a valid Sheet ID from the input" }, { status: 400 });
  }

  // ── Fetch task for step count ─────────────────────────────────────────────
  const { data: task, error: taskErr } = await admin
    .from("tasks")
    .select("id, title, steps")
    .eq("id", taskId)
    .single();

  if (taskErr || !task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const steps = (task.steps as { title: string; submitType: string }[] | null) ?? [];

  // ── Test write access + write header row ──────────────────────────────────
  try {
    await writeSheetHeader(sheetId, steps);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[link-sheet] header write failed:", message);
    return NextResponse.json(
      {
        error: `Could not access this Sheet — make sure it was created inside this task's Drive folder, or share it directly with the service account: ${getServiceAccountEmail()}`,
        detail: message,
      },
      { status: 422 },
    );
  }

  // ── Save sheetId to task ──────────────────────────────────────────────────
  const { error: saveErr } = await admin
    .from("tasks")
    .update({ drive_sheet_id: sheetId })
    .eq("id", taskId);

  if (saveErr) {
    return NextResponse.json({ error: "Failed to save Sheet ID: " + saveErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sheetId });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: taskId } = await params;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (!["owner", "admin"].includes(caller?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await admin.from("tasks").update({ drive_sheet_id: null }).eq("id", taskId);
  return NextResponse.json({ ok: true });
}
