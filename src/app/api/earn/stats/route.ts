import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export async function GET() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const [membersRes, tasksRes] = await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "contributor"),
      db.from("submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
    ]);

    return NextResponse.json({
      members:         membersRes.count ?? 0,
      tasks_completed: tasksRes.count   ?? 0,
    });
  } catch {
    return NextResponse.json({ members: 0, tasks_completed: 0 });
  }
}
