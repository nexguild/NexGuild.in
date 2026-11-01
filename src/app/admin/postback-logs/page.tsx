"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Loader2, AlertTriangle, RefreshCw, Activity, ChevronDown, ChevronUp, Trash2, Download, Search } from "lucide-react";
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

const PROVIDERS  = ["theoremreach", "cpx_research", "mylead", "clixwall", "clickwall", "cpagrip", "monlix"];
const ACTIONS    = ["credited", "duplicate", "reversed", "debug_ignored", "hash_invalid", "error"];

function csvCell(value: unknown) {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function PostbackLogsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [logs, setLogs]                       = useState<PostbackLog[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [filterProvider, setFilterProvider]   = useState("all");
  const [filterAction,   setFilterAction]     = useState("all");
  const [dateRange, setDateRange]             = useState("7d");
  const [search, setSearch]                   = useState("");
  const [expandedId, setExpandedId]           = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [clearingTest, setClearingTest]       = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("postback_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterProvider !== "all") query = query.eq("provider",      filterProvider);
    if (filterAction   !== "all") query = query.eq("action_taken",  filterAction);
    if (dateRange !== "all") {
      const days = dateRange === "24h" ? 1 : Number.parseInt(dateRange, 10);
      query = query.gte("created_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
    }

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }
    setLogs((data as PostbackLog[]) ?? []);
    setLoading(false);
  }, [filterProvider, filterAction, dateRange]);

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
    setError(null);
    try {
    const token = await getToken();
    const response = await fetch("/api/admin/postback-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: [id] }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      setError(result.error ?? "Unable to delete postback log.");
      setDeletingId(null);
      return;
    }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete postback log.");
    } finally {
    setDeletingId(null);
    }
  }

  async function clearTestLogs() {
    if (!window.confirm("Delete only entries marked with user_id TEST? Invalid-hash production logs will be kept.")) return;
    setClearingTest(true);
    setError(null);
    try {
    const token = await getToken();
    const response = await fetch("/api/admin/postback-logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "clear_test" }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      setError(result.error ?? "Unable to clear test entries.");
      return;
    }
    await fetchLogs();
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : "Unable to clear test entries.");
    } finally {
    setClearingTest(false);
    }
  }

  if (!allowed) return null;

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function formatTs(ts: string) {
    return new Date(ts).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" });
  }

  function getActivity(log: PostbackLog) {
    const params = log.raw_params ?? {};
    const offerId = params.offer_id ?? "";
    const isCpxSurvey = log.provider === "cpx_research";
    const isOffer = !isCpxSurvey && (
      params.offer === "true" ||
      params.offer === "1" ||
      Boolean(params.offer_name || params.event_name) ||
      offerId.startsWith("campaign_") ||
      (log.provider !== "theoremreach" && Boolean(offerId))
    );
    const title = isOffer
      ? params.offer_name || params.event_name || (offerId ? `Offer ${offerId}` : "Offer completion")
      : log.provider === "theoremreach"
        ? "Survey completion"
        : "Survey activity";
    const eventName = isOffer && params.event_name && params.event_name !== title
      ? params.event_name
      : null;
    return { label: isOffer ? "Offer" : "Survey", title, eventName };
  }

  const hashInvalidCount = logs.filter(l => l.action_taken === "hash_invalid").length;
  const searchTerm = search.trim().toLocaleLowerCase();
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const params = log.raw_params ?? {};
    return [
      log.id,
      log.provider,
      log.action_taken,
      log.error_message,
      params.user_id,
      params.uid,
      params.publisher_user_id,
      params.tx_id,
      params.trans_id,
      params.transaction_id,
      params.tid,
      params.offer_transaction_id,
      params.offer_id,
      params.offer_name,
      params.event_name,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(searchTerm));
  });

  function exportLogs() {
    const rows = [
      ["Time", "Provider", "Action", "Hash valid", "User ID", "Transaction ID", "Error", "Raw params"],
      ...filteredLogs.map((log) => {
        const params = log.raw_params ?? {};
        return [
          log.created_at,
          log.provider,
          log.action_taken,
          log.hash_valid,
          params.user_id ?? params.uid ?? params.publisher_user_id ?? "",
          params.tx_id ?? params.trans_id ?? params.transaction_id ?? params.tid ?? params.offer_transaction_id ?? "",
          log.error_message,
          params,
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nexguild-postback-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Postback Logs</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Audit trail of survey completions, offer milestones, reversals, and errors — up to 200 matching entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0 || loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
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
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-500)]"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>

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

        <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3">
          <Search className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user, transaction, offer, or error…"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>

        {(filterProvider !== "all" || filterAction !== "all" || dateRange !== "7d" || search) && (
          <button
            onClick={() => { setFilterProvider("all"); setFilterAction("all"); setDateRange("7d"); setSearch(""); }}
            className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : filteredLogs.length === 0 ? (
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
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Activity</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Hash</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">User ID / TX ID</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] text-xs">Error</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isAlert  = log.action_taken === "hash_invalid" || log.action_taken === "error";
                  const expanded = expandedId === log.id;
                  const params   = log.raw_params ?? {};
                  const userId   = params.user_id ?? params.uid ?? params.publisher_user_id ?? "";
                  const txId     = params.tx_id ?? params.trans_id ?? params.transaction_id ?? params.tid ?? params.offer_transaction_id ?? "";
                  const activity = getActivity(log);

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

                        {/* Survey or offer event */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${activity.label === "Offer" ? "border-orange-500/20 bg-orange-500/10 text-orange-300" : "border-indigo-500/20 bg-indigo-500/10 text-indigo-300"}`}>
                            {activity.label}
                          </span>
                          <p className="mt-1 max-w-[190px] truncate text-xs text-[var(--text-secondary)]" title={activity.title}>{activity.title}</p>
                          {activity.eventName && <p className="max-w-[190px] truncate text-[10px] text-[var(--text-muted)]" title={activity.eventName}>{activity.eventName}</p>}
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
            <p className="text-xs text-[var(--text-muted)]">{filteredLogs.length} entries shown (max 200 per query) · click any row to expand raw params</p>
          </div>
        </div>
      )}
    </div>
  );
}
