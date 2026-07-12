import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { creditWithCommission } from "@/lib/nexleader-commission";

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!["admin", "owner", "reviewer"].includes(role ?? "")) return null;
  return { admin, user };
}

// PATCH /api/admin/daily-items/[itemId]  — approve or reject a single item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { itemId } = await params;
  const { admin, user } = ctx;

  const body = await req.json() as { action: "approve" | "reject"; feedback?: string };
  const { action, feedback } = body;

  const { data: item } = await admin
    .from("daily_work_items")
    .select("id, contributor_id, project_id, task_id, status, file_name, tasks(title, pay_per_unit_nc)")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const now    = new Date().toISOString();
  const taskMeta = item.tasks as unknown as { title: string; pay_per_unit_nc: number | null } | null;

  if (action === "approve") {
    const payPerUnit   = taskMeta?.pay_per_unit_nc ?? 0;
    let contributorCoins = payPerUnit;

    if (payPerUnit > 0 && item.contributor_id) {
      try {
        const result = await creditWithCommission(
          admin,
          item.contributor_id,
          payPerUnit,
          "task",
          `Daily work approved: ${item.file_name ?? "item"} (${taskMeta?.title ?? "task"})`,
        );
        contributorCoins = result.contributorCredit;
      } catch {
        await admin.rpc("increment_nexcoins", { p_contributor_id: item.contributor_id, p_coins: payPerUnit });
        await admin.from("coin_transactions").insert({
          contributor_id: item.contributor_id,
          amount:         payPerUnit,
          type:           "earned",
          source:         "task",
          description:    `Daily work approved: ${item.file_name ?? "item"} (${taskMeta?.title ?? "task"})`,
        });
      }
    }

    const { error } = await admin.from("daily_work_items").update({
      status:        "approved",
      reviewed_at:   now,
      reviewer_id:   user.id,
      coins_awarded: contributorCoins > 0 ? contributorCoins : null,
      feedback:      feedback ?? null,
    }).eq("id", itemId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (item.contributor_id) {
      await admin.from("notifications").insert({
        user_id: item.contributor_id,
        title:   "Daily Work Approved",
        message: `Your work on "${item.file_name ?? "an item"}" was approved.${payPerUnit > 0 ? ` +${contributorCoins} NexCoins added.` : ""}`,
        type:    "submission_approved",
      });
    }

    return NextResponse.json({ ok: true, coins_awarded: contributorCoins });
  }

  if (action === "reject") {
    const { error } = await admin.from("daily_work_items").update({
      status:      "rejected",
      reviewed_at: now,
      reviewer_id: user.id,
      feedback:    feedback ?? null,
    }).eq("id", itemId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (item.contributor_id) {
      await admin.from("notifications").insert({
        user_id: item.contributor_id,
        title:   "Daily Work Rejected",
        message: `Your work on "${item.file_name ?? "an item"}" was rejected.${feedback ? ` Reason: ${feedback}` : ""}`,
        type:    "submission_rejected",
      });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
