import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await admin.from("profiles").update({ is_active: false }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate all sessions for this user immediately
  await admin.auth.admin.signOut(user.id, "global").catch(() => {});

  console.log(`[account/deactivate] user ${user.id} deactivated`);
  return NextResponse.json({ ok: true });
}
