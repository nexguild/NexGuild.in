"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, History, Loader2 } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
  created_at: string;
  actor: { full_name: string | null; email: string | null } | null;
}

const ACTIONS = [
  ["", "All actions"],
  ["coins_sent", "Coins sent"],
  ["coins_deducted", "Coins deducted"],
  ["binance_redemption_updated", "Binance payout updated"],
  ["voucher_refunded", "Voucher refunded"],
  ["voucher_delivered", "Voucher delivered"],
  ["voucher_code_updated", "Voucher code updated"],
  ["submission_approved", "Submission approved"],
  ["submission_rejected", "Submission rejected"],
  ["submission_resubmission_requested", "Submission changes requested"],
  ["assignment_reviewed", "Assignment reviewed"],
  ["task_created", "Task created"],
  ["task_updated", "Task updated"],
  ["task_deleted", "Task archived"],
  ["contributor_deleted", "Contributor deleted"],
  ["contributor_profile_deleted", "Contributor profile deleted"],
  ["staff_role_changed", "Staff role changed"],
  ["maintenance_changed", "Maintenance changed"],
  ["settings_changed", "Settings changed"],
  ["coupon_created", "Coupon created"],
  ["coupon_deleted", "Coupon deleted"],
  ["coupon_toggled", "Coupon enabled/disabled"],
  ["project_created", "Project created"],
  ["project_updated", "Project updated"],
  ["project_deleted", "Project deleted"],
  ["job_created", "Job created"],
  ["job_updated", "Job updated"],
  ["job_deleted", "Job deleted"],
  ["backup_triggered", "Database backup triggered"],
] as const;

const PAGE_SIZE = 50;

export default function AdminAuditLogsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set("search", search.trim());
      if (action) params.set("action", action);
      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: session?.access_token ? { Authorization: "Bearer " + session.access_token } : {},
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({})) as { logs?: AuditLog[]; total?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load audit history.");
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (loadError) {
      console.error("[admin/audit-logs] load failed:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Failed to load audit history.");
    } finally {
      setLoading(false);
    }
  }, [action, page, search]);

  useEffect(() => {
    if (allowed) void loadLogs();
  }, [allowed, loadLogs]);

  if (!allowed) return null;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Operator Audit History</h1>
        <p className="text-sm text-[var(--text-secondary)]">Review sensitive admin actions, operators, and recorded reasons.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-9 min-w-64 items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search action summaries"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
          />
        </label>
        <select
          value={action}
          onChange={(event) => { setAction(event.target.value); setPage(1); }}
          className="h-9 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)]"
        >
          {ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span className="text-sm text-[var(--text-secondary)]">{total.toLocaleString()} records</span>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading audit history…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <History className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text-primary)]">No matching audit records</p>
            <p className="text-sm text-[var(--text-secondary)]">Sensitive admin actions will appear here.</p>
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--border-default)] text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Operator</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {logs.map((log) => (
                <tr key={log.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-secondary)]">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[var(--text-primary)]">{log.actor?.full_name ?? "Unknown operator"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{log.actor?.email ?? log.actor_id ?? "Account deleted"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--text-primary)]">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-xs text-[var(--text-muted)]">{log.target_type}{log.target_id ? " - " + log.target_id : ""}</p>
                  </td>
                  <td className="max-w-xl whitespace-pre-wrap px-4 py-3 text-[var(--text-secondary)]">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-[var(--border-default)] px-3 text-sm text-[var(--text-primary)] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button
            disabled={page >= pageCount || loading}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-[var(--border-default)] px-3 text-sm text-[var(--text-primary)] disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
