import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Verify caller is authenticated admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json() as {
      submissionId: string;
      action: "approve" | "reject";
      feedback?: string;
      coinsOverride?: number;
    };
    const { submissionId, action, feedback, coinsOverride } = body;

    // Fetch the submission + task
    const { data: sub, error: subErr } = await admin
      .from("submissions")
      .select("*, tasks(pay_per_task, title)")
      .eq("id", submissionId)
      .single();

    if (subErr || !sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const now = new Date().toISOString();

    if (action === "approve") {
      const coins = coinsOverride ?? (sub.tasks as { pay_per_task: number | null })?.pay_per_task ?? 0;
      const taskTitle = (sub.tasks as { title: string })?.title ?? "a task";

      // 1. Update submission
      await admin.from("submissions").update({
        status: "approved",
        coins_awarded: coins,
        feedback: feedback ?? null,
        reviewed_by: user.id,
        reviewed_at: now,
      }).eq("id", submissionId);

      // 2. Credit NexCoins to contributor
      const { data: contributorProfile } = await admin
        .from("profiles")
        .select("nexcoins")
        .eq("id", sub.contributor_id)
        .single();

      const currentCoins = (contributorProfile as { nexcoins: number } | null)?.nexcoins ?? 0;
      await admin.from("profiles").update({ nexcoins: currentCoins + coins }).eq("id", sub.contributor_id);

      // 3. Log coin transaction
      await admin.from("coin_transactions").insert({
        contributor_id: sub.contributor_id,
        amount: coins,
        type: "earned",
        source: "task",
        description: `Task approved: ${taskTitle}`,
      });

      // 4. Notify contributor
      await admin.from("notifications").insert({
        user_id: sub.contributor_id,
        title: "Submission Approved!",
        message: `Your submission for "${taskTitle}" was approved. +${coins} NexCoins added.`,
        type: "submission_approved",
      });

      return NextResponse.json({ success: true, coins_awarded: coins });
    }

    if (action === "reject") {
      const taskTitle = (sub.tasks as { title: string })?.title ?? "a task";

      await admin.from("submissions").update({
        status: "rejected",
        feedback: feedback ?? null,
        reviewed_by: user.id,
        reviewed_at: now,
      }).eq("id", submissionId);

      await admin.from("notifications").insert({
        user_id: sub.contributor_id,
        title: "Submission Rejected",
        message: `Your submission for "${taskTitle}" was not approved.${feedback ? ` Reason: ${feedback}` : ""} You can re-submit.`,
        type: "submission_rejected",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
