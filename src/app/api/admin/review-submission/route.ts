import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FROM_NOREPLY, getResend, taskApprovedHtml, taskRejectedHtml, resubmissionRequestedHtml } from "@/lib/email";
import { syncSheetStatus } from "@/lib/google-drive";
import { creditWithCommission } from "@/lib/nexleader-commission";

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

    if (!["admin", "owner", "reviewer"].includes(callerProfile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Parse body ───────────────────────────────────────────────
    const { submissionId, action, feedback, coinsOverride } = await req.json() as {
      submissionId: string;
      action: "approve" | "reject" | "request_resubmit";
      feedback?: string;
      coinsOverride?: number;
    };

    // ── Fetch submission + task ──────────────────────────────────
    const { data: sub, error: subFetchErr } = await admin
      .from("submissions")
      .select("id, contributor_id, tasks(id, pay_per_task, title, xp_reward, drive_sheet_id)")
      .eq("id", submissionId)
      .single();

    if (subFetchErr || !sub) {
      console.error("[review-submission] fetch submission:", subFetchErr?.message);
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const taskMeta = sub.tasks as unknown as { id: string; pay_per_task: number | null; title: string; xp_reward: number | null; drive_sheet_id: string | null } | null;
    const taskTitle = taskMeta?.title ?? "a task";

    // ── APPROVE ──────────────────────────────────────────────────
    if (action === "approve") {
      const grossCoins: number = coinsOverride ?? taskMeta?.pay_per_task ?? 0;

      // 1. Apply NexLeader commission split — contributor gets 66%, NexLeader gets 8%
      let contributorCoins = grossCoins;
      try {
        const result = await creditWithCommission(
          admin,
          sub.contributor_id,
          grossCoins,
          "task",
          `Task approved: ${taskTitle}`,
        );
        contributorCoins = result.contributorCredit;
      } catch (commErr) {
        console.error("[review-submission] creditWithCommission failed:", commErr);
        // Fall back to direct crediting if commission logic fails
        await admin.rpc("increment_nexcoins", {
          p_contributor_id: sub.contributor_id,
          p_coins:          grossCoins,
        });
        await admin.from("coin_transactions").insert({
          contributor_id: sub.contributor_id,
          amount:         grossCoins,
          type:           "earned",
          source:         "task",
          description:    `Task approved: ${taskTitle}`,
        });
        contributorCoins = grossCoins;
      }

      // 2. Mark submission approved (store what contributor actually received)
      const { error: e1 } = await admin
        .from("submissions")
        .update({
          status:        "approved",
          coins_awarded: contributorCoins,
          feedback:      feedback ?? null,
          reviewed_by:   user.id,
          reviewed_at:   now,
        })
        .eq("id", submissionId);

      if (e1) {
        console.error("[review-submission] update submission:", e1.message);
        return NextResponse.json({ error: "Failed to update submission: " + e1.message }, { status: 500 });
      }

      // 3. Award XP
      const xpToAward = taskMeta?.xp_reward ?? 0;
      if (xpToAward > 0) {
        const { error: xpErr } = await admin.rpc("award_xp", {
          p_contributor_id: sub.contributor_id,
          p_xp: xpToAward,
        });
        if (xpErr) console.error("[review-submission] award_xp:", xpErr.message);
      }

      // 4. Update streak eligibility
      const today = new Date().toISOString().split("T")[0];
      const { data: streakProfile } = await admin
        .from("profiles")
        .select("last_task_approved_date, tasks_approved_today")
        .eq("id", sub.contributor_id)
        .single();
      const sp = streakProfile as { last_task_approved_date: string | null; tasks_approved_today: number | null } | null;
      const newCount = sp?.last_task_approved_date === today ? (sp?.tasks_approved_today ?? 0) + 1 : 1;
      const { error: dateErr } = await admin
        .from("profiles")
        .update({ last_task_approved_date: today, tasks_approved_today: newCount })
        .eq("id", sub.contributor_id);
      if (dateErr) console.error("[review-submission] streak update:", dateErr.message);

      // 5. Notify contributor (in-app)
      const { error: e4 } = await admin.from("notifications").insert({
        user_id: sub.contributor_id,
        title:   "Submission Approved!",
        message: `Your submission for "${taskTitle}" was approved. +${contributorCoins} NexCoins added.`,
        type:    "submission_approved",
      });
      if (e4) console.error("[review-submission] notification insert:", e4.message);

      // 6. Email (non-critical)
      const resend = getResend();
      if (resend) {
        const { data: contrib } = await admin
          .from("profiles")
          .select("full_name, email, nexcoins")
          .eq("id", sub.contributor_id)
          .single();

        const p = contrib as { full_name: string | null; email: string | null; nexcoins: number | null } | null;
        if (p?.email) {
          const { error: emailErr } = await resend.emails.send({
            from:    FROM_NOREPLY,
            to:      p.email,
            subject: `Your submission was approved! +${contributorCoins} NexCoins`,
            html:    taskApprovedHtml(
              p.full_name ?? "Contributor",
              taskTitle,
              contributorCoins,
              p.nexcoins ?? contributorCoins,
            ),
          });
          if (emailErr) console.error("[review-submission] email error:", emailErr);
        }
      }

      // Sync Sheet status (non-blocking)
      if (taskMeta?.drive_sheet_id) {
        syncSheetStatus(taskMeta.drive_sheet_id, submissionId, "approved", now)
          .catch((err) => console.error("[review-submission] sheet sync failed:", err));
      }

      return NextResponse.json({ success: true, coins_awarded: contributorCoins });
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

      // Sync Sheet status (non-blocking)
      if (taskMeta?.drive_sheet_id) {
        syncSheetStatus(taskMeta.drive_sheet_id, submissionId, "rejected", now)
          .catch((err) => console.error("[review-submission] sheet sync failed:", err));
      }

      // Email (non-critical)
      const resend = getResend();
      if (resend) {
        const { data: contrib } = await admin
          .from("profiles")
          .select("full_name, email")
          .eq("id", sub.contributor_id)
          .single();

        const p = contrib as { full_name: string | null; email: string | null } | null;
        if (p?.email) {
          const { error: emailErr } = await resend.emails.send({
            from:    FROM_NOREPLY,
            to:      p.email,
            subject: `Submission feedback — ${taskTitle}`,
            html:    taskRejectedHtml(p.full_name ?? "Contributor", taskTitle, feedback ?? null),
          });
          if (emailErr) console.error("[review-submission] reject email error:", emailErr);
        }
      }

      return NextResponse.json({ success: true });
    }

    // ── REQUEST RESUBMISSION ─────────────────────────────────────────
    if (action === "request_resubmit") {
      if (!feedback?.trim()) {
        return NextResponse.json({ error: "Feedback is required when requesting resubmission" }, { status: 400 });
      }

      const { error: e1 } = await admin.from("submissions").update({
        status:      "resubmit_requested",
        feedback:    feedback.trim(),
        reviewed_by: user.id,
        reviewed_at: now,
      }).eq("id", submissionId);

      if (e1) {
        console.error("[review-submission] resubmit update:", e1.message);
        return NextResponse.json({ error: "Failed to update submission: " + e1.message }, { status: 500 });
      }

      await admin.from("notifications").insert({
        user_id: sub.contributor_id,
        title:   "Changes Requested",
        message: `Admin requested changes to your submission for "${taskTitle}". Tap to resubmit.`,
        type:    "resubmit_requested",
      });

      const resend = getResend();
      if (resend) {
        const { data: contrib } = await admin
          .from("profiles")
          .select("full_name, email")
          .eq("id", sub.contributor_id)
          .single();

        const p = contrib as { full_name: string | null; email: string | null } | null;
        if (p?.email) {
          const { error: emailErr } = await resend.emails.send({
            from:    FROM_NOREPLY,
            to:      p.email,
            subject: `Changes requested for your submission — ${taskTitle}`,
            html:    resubmissionRequestedHtml(p.full_name ?? "Contributor", taskTitle, feedback.trim()),
          });
          if (emailErr) console.error("[review-submission] resubmit email error:", emailErr);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err) {
    console.error("[review-submission] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
