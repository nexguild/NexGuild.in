"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Coins,
  Download, Gift, Loader2, RefreshCw, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { formatNexcoins } from "@/lib/nexcoins";

interface FinanceStat {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}

interface MonthBucket {
  month: string;
  earned: number;
  redeemed: number;
}

interface FinanceSummary {
  totalCoinsEarned: number;
  totalCoinsRedeemed: number;
  totalVouchers: number;
  totalDelivered: number;
  activeContributors: number;
  pendingSubmissions: number;
  monthlyData: MonthBucket[];
}

interface LedgerEntry {
  id: string;
  contributor_id: string;
  created_at: string;
  transactionType: string;
  amount: number;
  source: string | null;
  description: string | null;
  contributorName: string | null;
  contributorEmail: string | null;
}

interface LedgerFilters {
  type: string;
  from: string;
  to: string;
}

interface LedgerResponse {
  rows: LedgerEntry[];
  nextCursor: string | null;
  summary?: FinanceSummary;
  error?: string;
}

const PAGE_SIZE = 25;

function ledgerUrl(filters: LedgerFilters, cursor: string | null): string {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    type: filters.type,
  });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (cursor) params.set("cursor", cursor);
  return `/api/admin/finance-ledger?${params.toString()}`;
}

async function fetchLedger(token: string, filters: LedgerFilters, cursor: string | null): Promise<LedgerResponse> {
  const response = await fetch(ledgerUrl(filters, cursor), {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
  });
  const data = await response.json() as LedgerResponse;
  if (!response.ok) throw new Error(data.error ?? "Unable to load finance ledger.");
  return data;
}

function csvCell(value: string | number | null): string {
  let text = value == null ? "" : String(value);
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function FinancesPage() {
  const allowed = usePageGuard(ADMIN_ROLES.FINANCE);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [filters, setFilters] = useState<LedgerFilters>({ type: "all", from: "", to: "" });
  const [draftFilters, setDraftFilters] = useState(filters);
  const cursor = cursorHistory[pageIndex] ?? null;

  const loadPage = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    setLedgerError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your admin session has expired. Please sign in again.");
      const data = await fetchLedger(session.access_token, filters, cursor);
      setEntries(data.rows);
      setNextCursor(data.nextCursor);
      if (data.summary) setSummary(data.summary);
    } catch (error) {
      console.error("[admin/finances] ledger load failed:", error);
      setLedgerError(error instanceof Error ? error.message : "Unable to load finance ledger.");
    } finally {
      setLoading(false);
    }
  }, [allowed, cursor, filters]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const stats: FinanceStat[] = summary ? [
    {
      label: "Total Coins Issued",
      value: formatNexcoins(summary.totalCoinsEarned),
      sub: "from all earned coin ledger entries",
      icon: <Coins className="h-5 w-5 text-[var(--brand-500)]" />,
    },
    {
      label: "Total Coins Redeemed",
      value: formatNexcoins(summary.totalCoinsRedeemed),
      sub: "from all redeemed coin ledger entries",
      icon: <Gift className="h-5 w-5 text-[var(--brand-500)]" />,
    },
    {
      label: "Vouchers Delivered",
      value: `${summary.totalDelivered} / ${summary.totalVouchers}`,
      sub: "delivered vs requested",
      icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
    },
    {
      label: "Active Contributors",
      value: summary.activeContributors.toLocaleString(),
      sub: `${summary.pendingSubmissions} submissions pending review`,
      icon: <Users className="h-5 w-5 text-[var(--brand-500)]" />,
    },
  ] : [];

  const monthlyData = summary?.monthlyData ?? [];
  const maxCoins = Math.max(...monthlyData.map((month) => Math.max(month.earned, month.redeemed)), 1);

  function applyFilters() {
    setFilters(draftFilters);
    setCursorHistory([null]);
    setPageIndex(0);
  }

  function updateDraftFilter(key: keyof LedgerFilters, value: string) {
    setDraftFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleNextPage() {
    if (!nextCursor) return;
    setCursorHistory((previous) => [...previous.slice(0, pageIndex + 1), nextCursor]);
    setPageIndex((previous) => previous + 1);
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your admin session has expired. Please sign in again.");
      const allEntries: LedgerEntry[] = [];
      const seenCursors = new Set<string>();
      let exportCursor: string | null = null;
      do {
        const page = await fetchLedger(session.access_token, filters, exportCursor);
        allEntries.push(...page.rows);
        exportCursor = page.nextCursor;
        if (exportCursor) {
          if (seenCursors.has(exportCursor)) throw new Error("Finance export stopped because the ledger cursor repeated.");
          seenCursors.add(exportCursor);
        }
      } while (exportCursor);

      const headers = [
        "Date",
        "Contributor",
        "Email",
        "Entry",
        "Amount",
        "Currency",
        "Source",
        "Description",
        "Record ID",
      ];
      const rows = allEntries.map((entry) => [
        entry.created_at,
        entry.contributorName,
        entry.contributorEmail,
        entry.transactionType,
        entry.amount,
        "NexCoins",
        entry.source,
        entry.description,
        entry.id,
      ]);
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nexguild-finance-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("[admin/finances] export failed:", error);
      setExportError(error instanceof Error ? error.message : "Unable to export finance ledger.");
    } finally {
      setExporting(false);
    }
  }

  if (!allowed) return null;
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Finances</h1>
          <p className="text-sm text-[var(--text-secondary)]">Review coin ledger activity and contributor rewards.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={loading || exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? "Preparing export…" : "Export filtered CSV"}
        </Button>
      </div>

      {ledgerError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{ledgerError}</span>
          <button type="button" onClick={() => void loadPage()} className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-red-500/10">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}
      {exportError && <p role="alert" className="text-sm text-red-400">{exportError}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">{stat.label}</p>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                {stat.sub && <p className="text-xs text-[var(--text-muted)]">{stat.sub}</p>}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
            <h2 className="mb-4 font-semibold text-[var(--text-primary)]">NexCoins Overview</h2>
            <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold text-[var(--brand-500)]">{formatNexcoins(summary.totalCoinsEarned)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Total Issued</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">{formatNexcoins(summary.totalCoinsRedeemed)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Total Redeemed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-400">{formatNexcoins(summary.totalCoinsEarned - summary.totalCoinsRedeemed)}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Net Issued</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
            <h2 className="mb-6 font-semibold text-[var(--text-primary)]">Monthly Coin Ledger Activity</h2>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Coins className="h-8 w-8 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">No coin ledger activity yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-5 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--brand-500)]" /> Coins Issued</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Coins Redeemed</span>
                </div>
                <div className="space-y-3">
                  {monthlyData.map((month) => (
                    <div key={month.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="w-24 flex-shrink-0">{month.month}</span>
                        <span className="text-[var(--brand-500)]">{formatNexcoins(month.earned)} issued</span>
                        <span className="text-red-400">{formatNexcoins(month.redeemed)} redeemed</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                          <div className="h-full rounded-full bg-[var(--brand-500)] transition-all" style={{ width: `${(month.earned / maxCoins) * 100}%` }} />
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                          <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${(month.redeemed / maxCoins) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <section className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">Finance transaction ledger</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Review and export NexCoin movements. Manage payout requests from Global Payouts.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs text-[var(--text-secondary)]">
            Entry type
            <select value={draftFilters.type} onChange={(event) => updateDraftFilter("type", event.target.value)} className="h-9 min-w-36 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] px-2 text-sm text-[var(--text-primary)]">
              <option value="all">All entries</option>
              <option value="earned">Coins earned</option>
              <option value="redeemed">Coins redeemed</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[var(--text-secondary)]">
            From
            <span className="flex h-9 items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] px-2">
              <CalendarDays className="h-4 w-4" />
              <input type="date" value={draftFilters.from} onChange={(event) => updateDraftFilter("from", event.target.value)} className="bg-transparent text-sm text-[var(--text-primary)]" />
            </span>
          </label>
          <label className="grid gap-1 text-xs text-[var(--text-secondary)]">
            To
            <span className="flex h-9 items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] px-2">
              <CalendarDays className="h-4 w-4" />
              <input type="date" value={draftFilters.to} onChange={(event) => updateDraftFilter("to", event.target.value)} className="bg-transparent text-sm text-[var(--text-primary)]" />
            </span>
          </label>
          <Button size="sm" onClick={applyFilters} disabled={loading}>Apply filters</Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
          <table className="w-full min-w-[850px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-left text-xs text-[var(--text-secondary)]">
                {["Date", "Contributor", "Entry", "Amount", "Source", "Description"].map((heading) => (
                  <th key={heading} className="px-3 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">No matching finance entries.</td></tr>
              ) : entries.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-[var(--text-secondary)]">{new Date(entry.created_at).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-[var(--text-primary)]">{entry.contributorName ?? "Unknown contributor"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{entry.contributorEmail ?? entry.contributor_id}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium capitalize text-[var(--text-primary)]">{entry.transactionType}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-[var(--text-primary)]">
                    {formatNexcoins(entry.amount)}
                  </td>
                  <td className="max-w-48 break-words px-3 py-3 text-xs text-[var(--text-secondary)]">
                    {entry.source ?? "—"}
                  </td>
                  <td className="max-w-64 break-words px-3 py-3 text-xs text-[var(--text-secondary)]">
                    {entry.description ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">Page {pageIndex + 1} · {entries.length} entries</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPageIndex((previous) => Math.max(0, previous - 1))} disabled={pageIndex === 0 || loading}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNextPage} disabled={!nextCursor || loading}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
