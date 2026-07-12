import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { creditWithCommission } from "@/lib/nexleader-commission";

// ── Auth helper ───────────────────────────────────────────────────────────────
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

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let field = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      } else {
        field += ch;
      }
    }
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

// ── Types ──────────────────────────────────────────────────────────────────────
type DbSub = {
  id: string;
  contributor_id: string;
  status: string;
  task_id: string;
  tasks: { title: string; pay_per_task: number | null } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type CsvRow = {
  submissionId: string;
  clientStatus: "valid" | "invalid" | "unrecognized";
  reason: string | null;
};

// ── POST /api/admin/projects/[id]/bulk-validate ────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { admin } = ctx;

  const body = await req.json() as {
    action: "preview" | "apply";
    csvText: string;
    submissionIdCol: string;
    statusCol: string;
    reasonCol: string | null;
    validValue: string;
    invalidValue: string;
  };

  const { action, csvText, submissionIdCol, statusCol, reasonCol, validValue, invalidValue } = body;

  if (!csvText?.trim()) return NextResponse.json({ error: "No CSV data provided" }, { status: 400 });

  // ── Parse CSV ───────────────────────────────────────────────────────────────
  const rows = parseCSV(csvText.trim());
  if (rows.length < 2) return NextResponse.json({ error: "CSV needs a header row and at least one data row" }, { status: 400 });

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const submissionIdIdx = headers.indexOf(submissionIdCol);
  const statusIdx       = headers.indexOf(statusCol);
  const reasonIdx       = reasonCol ? headers.indexOf(reasonCol) : -1;

  if (submissionIdIdx === -1) return NextResponse.json({ error: `Column "${submissionIdCol}" not found in CSV` }, { status: 400 });
  if (statusIdx === -1)       return NextResponse.json({ error: `Column "${statusCol}" not found in CSV` }, { status: 400 });

  const csvRows: CsvRow[] = dataRows
    .map((row) => {
      const subId     = (row[submissionIdIdx] ?? "").trim();
      const rawStatus = (row[statusIdx] ?? "").trim().toLowerCase();
      const reason    = reasonIdx >= 0 ? (row[reasonIdx] ?? "").trim() || null : null;
      const clientStatus: CsvRow["clientStatus"] =
        rawStatus === validValue.trim().toLowerCase()   ? "valid"
        : rawStatus === invalidValue.trim().toLowerCase() ? "invalid"
        : "unrecognized";
      return { submissionId: subId, clientStatus, reason };
    })
    .filter((r) => r.submissionId.length > 0);

  if (csvRows.length === 0) return NextResponse.json({ error: "No submission IDs found in CSV column" }, { status: 400 });

  // ── Verify project tasks ────────────────────────────────────────────────────
  const { data: projectTasks } = await admin
    .from("tasks")
    .select("id")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  const taskIds = (projectTasks ?? []).map((t: { id: string }) => t.id);
  if (taskIds.length === 0) return NextResponse.json({ error: "No tasks found for this project" }, { status: 400 });

  // ── Fetch matching submissions from DB ─────────────────────────────────────
  const submissionIds = [...new Set(csvRows.map((r) => r.submissionId))];
  const { data: dbSubs } = await admin
    .from("submissions")
    .select("id, contributor_id, status, task_id, tasks(title, pay_per_task), profiles(full_name, email)")
    .in("id", submissionIds)
    .in("task_id", taskIds);

  const dbSubMap = new Map<string, DbSub>();
  for (const s of (dbSubs ?? []) as unknown as DbSub[]) {
    dbSubMap.set(s.id, s);
  }

  // ── Build preview rows ──────────────────────────────────────────────────────
  const previewRows = csvRows.map((row, i) => {
    const db = dbSubMap.get(row.submissionId);
    return {
      rowNum:        i + 2,
      submissionId:  row.submissionId,
      contributor:   db?.profiles?.full_name ?? (db ? "Unknown" : null),
      task:          db?.tasks?.title ?? null,
      currentStatus: db?.status ?? null,
      clientStatus:  row.clientStatus,
      reason:        row.reason,
      found:         !!db,
    };
  });

  if (action === "preview") {
    return NextResponse.json({
      rows:         previewRows,
      valid:        previewRows.filter((r) => r.found && r.clientStatus === "valid").length,
      invalid:      previewRows.filter((r) => r.found && r.clientStatus === "invalid").length,
      notFound:     previewRows.filter((r) => !r.found).length,
      unrecognized: previewRows.filter((r) => r.found && r.clientStatus === "unrecognized").length,
      headers,
    });
  }

  // ── APPLY ───────────────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  let approved = 0, rejected = 0, skipped = 0, errors = 0;

  for (const row of csvRows) {
    const db = dbSubMap.get(row.submissionId);
    if (!db || row.clientStatus === "unrecognized") { skipped++; continue; }

    try {
      const taskTitle = db.tasks?.title ?? "a task";

      if (row.clientStatus === "valid") {
        const grossCoins = db.tasks?.pay_per_task ?? 0;
        let contributorCoins = grossCoins;

        try {
          const result = await creditWithCommission(
            admin,
            db.contributor_id,
            grossCoins,
            "task",
            `Client validation approved: ${taskTitle}`,
          );
          contributorCoins = result.contributorCredit;
        } catch {
          await admin.rpc("increment_nexcoins", { p_contributor_id: db.contributor_id, p_coins: grossCoins });
          await admin.from("coin_transactions").insert({
            contributor_id: db.contributor_id,
            amount:         grossCoins,
            type:           "earned",
            source:         "task",
            description:    `Client validation approved: ${taskTitle}`,
          });
        }

        await admin.from("submissions").update({
          status:                    "approved",
          coins_awarded:             contributorCoins,
          feedback:                  row.reason ?? null,
          reviewed_at:               now,
          client_validation_status:  "valid",
          client_validation_reason:  row.reason ?? null,
          client_validated_at:       now,
        }).eq("id", row.submissionId);

        await admin.from("notifications").insert({
          user_id: db.contributor_id,
          title:   "Submission Approved",
          message: `Your submission for "${taskTitle}" was validated by the client. +${contributorCoins} NexCoins added.`,
          type:    "submission_approved",
        });

        approved++;

      } else {
        const reason = row.reason ?? "Rejected during client validation.";

        await admin.from("submissions").update({
          status:                    "rejected",
          feedback:                  reason,
          reviewed_at:               now,
          client_validation_status:  "invalid",
          client_validation_reason:  reason,
          client_validated_at:       now,
        }).eq("id", row.submissionId);

        await admin.from("notifications").insert({
          user_id: db.contributor_id,
          title:   "Submission Rejected",
          message: `Your submission for "${taskTitle}" was rejected during client validation.${row.reason ? ` Reason: ${row.reason}` : ""}`,
          type:    "submission_rejected",
        });

        rejected++;
      }
    } catch (err) {
      console.error(`[bulk-validate] error for ${row.submissionId}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ success: true, approved, rejected, skipped, errors });
}
