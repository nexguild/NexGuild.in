import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyOwnerOrAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "owner" && role !== "admin") return null;
  return { admin };
}

export async function DELETE(req: NextRequest) {
  const ctx = await verifyOwnerOrAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ids?: unknown; action?: string };
  try {
    body = await req.json() as { ids?: unknown; action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.action === "clear_test") {
    const { error } = await ctx.admin.from("postback_logs").delete().contains("raw_params", { user_id: "TEST" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0 || !body.ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
  }

  const { error } = await ctx.admin.from("postback_logs").delete().in("id", body.ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
