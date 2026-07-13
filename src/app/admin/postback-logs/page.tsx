"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, AlertTriangle, RefreshCw, Activity, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface PostbackLog {
  id:            string;
  provider:      string;
  raw_params:    Record<string, string> | null;
  hash_valid:    boolean | null;
  action_taken:  string | null;
  error_message: string | null;
  created_at:    string;
}

const ACTION_STYLES: Record<string, string> = {
  credited:      "bg-green-500/15 text-green-400 border-green-500/20",
  duplicate:     "bg-blue-500/15  text-blue-400  border-blue-500/20",
  reversed:      "bg-amber-500/15 text-amber-400 border-amber-500/20",
  debug_ignored: "bg-stone-500/15 text-stone-400 border-stone-500/20",
  hash_invalid:  "bg-red-500/15   text-red-400   border-red-500/20",
  error:         "bg-red-500/15   text-red-400   border-red-500/20",
};

const PROVIDERS  = ["theoremreach", "cpx_research", "mylead"];
const ACTIONS    = ["credited", "duplicate", "reversed", "debug_ignored", "hash_invalid", "error"];

export default function PostbackLogsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [logs, setLogs]                       = useState<PostbackLog[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [filterProvider, setFilterProvider]   = useState("all");
  const [filterAction,   setFilterAction]     = useState("all");
  const [expandedId, setExpandedId]           = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [clearingTest, setClearingTest]       = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("postback_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterProvider !== "all") query = query.eq("provider",      filterProvider);
    if (filterAction   !== "all") query = query.eq("action_taken",  filterAction);

    const { data } = await query;
    setLogs((data as PostbackLog[]) ?? []);
    setLoading(false);
  }, [filterProvider, filterAction]);

  useEffect(() => {
    if (allowed) fetchLogs();
  }, [allowed, fetchLogs]);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function deleteLog(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    const token = await getToken();
    await fetch("/api/admin/postback-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: [id] }),
    });
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  async function clearTestLogs() {
    setClearingTest(true);
    const token = await getToken();
    await fetch("/api/admin/postback-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "clear_test" }),
    });
    await fetchLogs();
    setClearingTest(false);
  }

  if (!allowed) return null;

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function formatTs(ts: string) {
    return new Date(ts).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" });
  }

  const hashInvalidCount = logs.filter(l => l.action_taken === "hash_invalid").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Postback Logs</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Audit trail of every offerwall postback received — last 200 entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearTestLogs}
            disabled={clearingTest || loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {clearingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clear test entries
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-500)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert banner for hash_invalid entries */}
      {!loading && hashInvalidCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{hashInvalidCount} hash_invalid</span> postback{hashInvalidCount !== 1 ? "s" : ""} detected in current view — review raw params to investigate.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterProvider}
          onChange={e => setFilterProvider(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-500)]"
        >
          <option value="all">All providers</option>
          {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-500)]"
        >
          <option value="all">All actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {(filterProvider !== "all" || filterAction !== "all") && (
          <button
            onClick={() => { setFilterProvider("all"); setFilterAction("all"); }}
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center">
          <Activity className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="font-medium text-[var(--text-secondary)]">No postback logs found</p>
          <p className="text-xs text-[var(--text-muted)]">Logs appear here after the first real postback is received.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs whitespace-nowrap">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Provider</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Hash</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">User ID / TX ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Error</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isAlert  = log.action_taken === "hash_invalid" || log.action_taken === "error";
                  const expanded = expandedId === log.id;
                  const userId   = log.raw_params?.user_id ?? "";
                  const txId     = log.raw_params?.tx_id ?? log.raw_params?.trans_id ?? "";

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`border-b border-[var(--border-default)] transition-colors cursor-pointer ${
                          isAlert
                            ? "bg-red-500/5 hover:bg-red-500/10"
                            : "hover:bg-[var(--surface-subtle)]"
                        }`}
                        onClick={() => toggleExpand(log.id)}
                      >
                        {/* Time */}
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono whitespace-nowrap">
                          {formatTs(log.created_at)}
                        </td>

                        {/* Provider */}
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-[var(--text-secondary)]">{log.provider}</span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${ACTION_STYLES[log.action_taken ?? ""] ?? "bg-stone-500/15 text-stone-400 border-stone-500/20"}`}>
                            {isAlert && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                            {log.action_taken ?? "—"}
                          </span>
                        </td>

                        {/* Hash valid */}
                        <td className="px-4 py-3">
                          {log.hash_valid === null ? (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          ) : log.hash_valid ? (
                            <span className="text-xs text-green-400 font-mono">✓</span>
                          ) : (
                            <span className="text-xs text-red-400 font-semibold font-mono">✗ invalid</span>
                          )}
                        </td>

                        {/* User / TX */}
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                          {userId ? (
                            <div>
                              <div className="text-[var(--text-secondary)]" title={userId}>{userId.slice(0, 8)}…</div>
                              {txId && <div className="text-[var(--text-muted)]" title={txId}>{txId.slice(0, 12)}…</div>}
                            </div>
                          ) : "—"}
                        </td>

                        {/* Error message preview */}
                        <td className="px-4 py-3 text-xs text-red-400 max-w-[180px] truncate">
                          {log.error_message ?? ""}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => deleteLog(log.id, e)}
                              disabled={deletingId === log.id}
                              className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1"
                              title="Delete"
                            >
                              {deletingId === log.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                            {expanded
                              ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                              : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="border-b border-[var(--border-default)]">
                          <td colSpan={8} className="px-4 py-4 bg-[var(--surface-subtle)]">
                            {log.error_message && (
                              <p className="text-xs text-red-400 font-semibold mb-3">
                                Error: {log.error_message}
                              </p>
                            )}
                            <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Raw Params</p>
                            <pre className="text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-all overflow-x-auto max-h-64 bg-[var(--surface-page)] rounded-lg p-3 border border-[var(--border-default)]">
                              {JSON.stringify(log.raw_params, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[var(--border-default)] bg-[var(--surface-subtle)]">
            <p className="text-xs text-[var(--text-muted)]">{logs.length} entries shown (max 200) · click any row to expand raw params</p>
          </div>
        </div>
      )}
    </div>
  );
}
