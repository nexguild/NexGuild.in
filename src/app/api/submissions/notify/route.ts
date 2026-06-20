import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyAdmins } from "@/lib/email";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { taskId } = await req.json() as { taskId: string };

    const [{ data: profile }, { data: task }] = await Promise.all([
      admin.from("profiles").select("full_name").eq("id", user.id).single(),
      admin.from("tasks").select("id, title").eq("id", taskId).single(),
    ]);

    const contributorName = (profile as { full_name: string | null } | null)?.full_name ?? "A contributor";
    const taskTitle = (task as { title: string } | null)?.title ?? "a task";

    // Fire-and-forget admin emails — don't await
    notifyAdmins(admin, "new_submission", {
      contributorName,
      detail:     taskTitle,
      actionUrl:  `https://nexguild.in/admin/submissions`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[submissions/notify]", e);
    return NextResponse.json({ ok: true }); // never block the submitter
  }
}
