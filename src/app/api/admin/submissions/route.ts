import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
    const ALLOWED_ROLES = ["owner", "admin", "reviewer"];
    if (!ALLOWED_ROLES.includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await admin
      .from("submissions")
      .select(`
        id,
        contributor_id,
        status,
        notes,
        files,
        coins_awarded,
        feedback,
        submitted_at,
        suspicious,
        reviewed,
        tasks ( id, title, pay_per_task, steps ),
        profiles ( full_name, email, nexleader_id )
      `)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("[admin/submissions] query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const submissions = data ?? [];

    // Batch-resolve NexLeader names
    const nlIds = [
      ...new Set(
        submissions
          .map((s) => (s.profiles as unknown as { nexleader_id: string | null } | null)?.nexleader_id)
          .filter((id): id is string => !!id)
      ),
    ];
    const nlNameMap = new Map<string, string>();
    if (nlIds.length > 0) {
      const { data: nlProfiles } = await admin
        .from("profiles").select("id, full_name").in("id", nlIds);
      for (const p of (nlProfiles ?? []) as { id: string; full_name: string | null }[]) {
        nlNameMap.set(p.id, p.full_name ?? "Unknown");
      }
    }

    // Fetch step submissions for all task IDs in this result set
    const taskIds = [
      ...new Set(
        submissions
          .map((s) => (s.tasks as unknown as { id: string } | null)?.id)
          .filter((id): id is string => !!id)
      ),
    ];

    // key → sorted list of step subs
    const byKey = new Map<string, object[]>();

    if (taskIds.length > 0) {
      const { data: stepSubs } = await admin
        .from("task_step_submissions")
        .select("task_id, contributor_id, step_index, submission_type, text_value, file_url, submitted_at")
        .in("task_id", taskIds)
        .order("step_index", { ascending: true });

      for (const ss of stepSubs ?? []) {
        const key = `${ss.task_id}::${ss.contributor_id}`;
        const arr = byKey.get(key) ?? [];
        arr.push(ss);
        byKey.set(key, arr);
      }
    }

    const enriched = submissions.map((sub) => {
      const taskId    = (sub.tasks as unknown as { id: string } | null)?.id ?? "";
      const key       = `${taskId}::${sub.contributor_id}`;
      const nlId      = (sub.profiles as unknown as { nexleader_id: string | null } | null)?.nexleader_id ?? null;
      const nlName    = nlId ? (nlNameMap.get(nlId) ?? "Unknown") : null;
      return { ...sub, step_submissions: byKey.get(key) ?? [], nexleader_id: nlId, nexleader_name: nlName };
    });

    return NextResponse.json({ submissions: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
