import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// POST /api/daily-work/[itemId]/submit
// Body: { content: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createServerClient();
  const { data: { user } } = await db.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const { content } = await req.json() as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  // Verify ownership
  const { data: item } = await db
    .from("daily_work_items")
    .select("id, contributor_id, status")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (item.contributor_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (item.status === "approved" || item.status === "rejected") {
    return NextResponse.json({ error: "Item already reviewed" }, { status: 400 });
  }

  const { error } = await db
    .from("daily_work_items")
    .update({
      submission_content: content.trim(),
      status:             "submitted",
      submitted_at:       new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
