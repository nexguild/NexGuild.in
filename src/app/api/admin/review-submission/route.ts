import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // ── Auth check ───────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Parse body ───────────────────────────────────────────────
    const { submissionId, action, feedback, coinsOverride } = await req.json() as {
      submissionId: string;
      action: "approve" | "reject";
      feedback?: string;
      coinsOverride?: number;
    };

    // ── Fetch submission + task ──────────────────────────────────
    const { data: sub, error: subFetchErr } = await admin
      .from("submissions")
      .select("id, contributor_id, tasks(pay_per_task, title)")
      .eq("id", submissionId)
      .single();

    if (subFetchErr || !sub) {
      console.error("[review-submission] fetch submission:", subFetchErr?.message);
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const taskMeta = sub.tasks as unknown as { pay_per_task: number | null; title: string } | null;
    const taskTitle = taskMeta?.title ?? "a task";

    // ── APPROVE ──────────────────────────────────────────────────
    if (action === "approve") {
      const coins: number = coinsOverride ?? taskMeta?.pay_per_task ?? 0;

      // 1. Mark submission approved
      const { error: e1 } = await admin
        .from("submissions")
        .update({
          status:       "approved",
          coins_awarded: coins,
          feedback:     feedback ?? null,
          reviewed_by:  user.id,
          reviewed_at:  now,
        })
        .eq("id", submissionId);

      if (e1) {
        console.error("[review-submission] update submission:", e1.message);
        return NextResponse.json({ error: "Failed to update submission: " + e1.message }, { status: 500 });
      }

      // 2. Atomic nexcoins increment via SQL function
      //    UPDATE profiles SET nexcoins = COALESCE(nexcoins, 0) + coins WHERE id = contributor_id
      const { error: e2 } = await admin.rpc("increment_nexcoins", {
        p_contributor_id: sub.contributor_id,
        p_coins:          coins,
      });

      if (e2) {
        console.error("[review-submission] increment_nexcoins:", e2.message);
        // RPC missing — fall back to fetch-then-update
        const { data: p } = await admin
          .from("profiles")
          .select("nexcoins")
          .eq("id", sub.contributor_id)
          .single();

        const current = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
        const { error: e2b } = await admin
          .from("profiles")
          .update({ nexcoins: current + coins })
          .eq("id", sub.contributor_id);

        if (e2b) {
          console.error("[review-submission] fallback nexcoins update:", e2b.message);
          return NextResponse.json({ error: "Failed to credit coins: " + e2b.message }, { status: 500 });
        }
      }

      // 3. Log coin transaction
      const { error: e3 } = await admin.from("coin_transactions").insert({
        contributor_id: sub.contributor_id,
        amount:         coins,
        type:           "earned",
        source:         "task",
        description:    `Task approved: ${taskTitle}`,
      });

      if (e3) console.error("[review-submission] coin_transactions insert:", e3.message);

      // 4. Notify contributor (non-critical)
      const { error: e4 } = await admin.from("notifications").insert({
        user_id: sub.contributor_id,
        title:   "Submission Approved!",
        message: `Your submission for "${taskTitle}" was approved. +${coins} NexCoins added.`,
        type:    "submission_approved",
      });

      if (e4) console.error("[review-submission] notification insert:", e4.message);

      return NextResponse.json({ success: true, coins_awarded: coins });
    }

    // ── REJECT ───────────────────────────────────────────────────
    if (action === "reject") {
      const { error: e1 } = await admin.from("submissions").update({
        status:      "rejected",
        feedback:    feedback ?? null,
        reviewed_by: user.id,
        reviewed_at: now,
      }).eq("id", submissionId);

      if (e1) {
        console.error("[review-submission] reject submission:", e1.message);
        return NextResponse.json({ error: "Failed to reject submission: " + e1.message }, { status: 500 });
      }

      const { error: e2 } = await admin.from("notifications").insert({
        user_id: sub.contributor_id,
        title:   "Submission Rejected",
        message: `Your submission for "${taskTitle}" was not approved.${feedback ? ` Reason: ${feedback}` : ""} You can re-submit.`,
        type:    "submission_rejected",
      });

      if (e2) console.error("[review-submission] reject notification:", e2.message);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("[review-submission] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
