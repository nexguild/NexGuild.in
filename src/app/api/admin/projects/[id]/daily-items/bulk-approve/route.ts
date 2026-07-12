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

// POST /api/admin/projects/[id]/daily-items/bulk-approve?date=YYYY-MM-DD
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await params;
  const { admin, user } = ctx;

  const url  = new URL(req.url);
  const date = url.searchParams.get("date") ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  // Fetch all submitted/pending items for this day
  const { data: items, error: fetchErr } = await admin
    .from("daily_work_items")
    .select("id, contributor_id, file_name, tasks(title, pay_per_unit_nc)")
    .eq("project_id", projectId)
    .eq("assigned_date", date)
    .in("status", ["submitted", "pending"])
    .not("contributor_id", "is", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!items?.length) return NextResponse.json({ ok: true, approved: 0 });

  const now = new Date().toISOString();
  let approved = 0, errors = 0;

  for (const item of items as unknown as {
    id: string; contributor_id: string; file_name: string | null;
    tasks: { title: string; pay_per_unit_nc: number | null } | null;
  }[]) {
    const taskMeta   = item.tasks;
    const payPerUnit = taskMeta?.pay_per_unit_nc ?? 0;
    let contributorCoins = payPerUnit;

    try {
      if (payPerUnit > 0) {
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

      await admin.from("daily_work_items").update({
        status:        "approved",
        reviewed_at:   now,
        reviewer_id:   user.id,
        coins_awarded: contributorCoins > 0 ? contributorCoins : null,
      }).eq("id", item.id);

      if (payPerUnit > 0) {
        await admin.from("notifications").insert({
          user_id: item.contributor_id,
          title:   "Daily Work Approved",
          message: `Your work on "${item.file_name ?? "an item"}" was approved. +${contributorCoins} NexCoins added.`,
          type:    "submission_approved",
        });
      }

      approved++;
    } catch (err) {
      console.error(`[bulk-approve] error for item ${item.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, approved, errors });
}
