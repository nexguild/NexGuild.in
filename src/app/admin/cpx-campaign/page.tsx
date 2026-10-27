"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, RefreshCw, Users, Coins, Gift, ClipboardCheck } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface CampaignContributor {
  id: string;
  name: string;
  email: string;
  eligibleCoins: number;
  transactions: number;
  bonusDue: number;
}

interface CampaignReport {
  campaign: {
    startsAt: string;
    endsAt: string;
    milestoneCoins: number;
    bonusPerMilestone: number;
  };
  summary: {
    contributors: number;
    eligibleCoins: number;
    bonusDue: number;
    qualifyingTransactions: number;
  };
  contributors: CampaignContributor[];
}

function formatCoins(value: number) {
  return value.toLocaleString("en-IN");
}

function campaignDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function CpxCampaignPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setErrorMessage("Your admin session has expired. Sign in again to view the report.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/cpx-campaign", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json() as CampaignReport | { error?: string };
      if (!response.ok) {
        throw new Error(("error" in data && data.error) || "Failed to load the CPX campaign report.");
      }
      setReport(data as CampaignReport);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load the CPX campaign report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void loadReport();
  }, [allowed, loadReport]);

  function downloadCsv() {
    if (!report) return;
    const rows = [
      ["Contributor", "Email", "Contributor ID", "Qualifying CPX NexCoins", "Completed surveys", "Bonus due"],
      ...report.contributors.map((user) => [
        user.name,
        user.email,
        user.id,
        user.eligibleCoins,
        user.transactions,
        user.bonusDue,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cpx-research-bonus-eligibility.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!allowed) return null;

  const stats = report ? [
    { label: "Eligible contributors", value: formatCoins(report.summary.contributors), icon: Users },
    { label: "Qualifying CPX coins", value: formatCoins(report.summary.eligibleCoins), icon: Coins },
    { label: "Completed surveys", value: formatCoins(report.summary.qualifyingTransactions), icon: ClipboardCheck },
    { label: "Bonus liability", value: `${formatCoins(report.summary.bonusDue)} NC`, icon: Gift },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">CPX Research Bonus Campaign</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Automatic eligibility from completed CPX surveys, excluding reversed transactions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCsv}
            disabled={!report || loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={() => void loadReport()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {report && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Campaign window (IST): </span>
          {campaignDate(report.campaign.startsAt)} – {campaignDate(report.campaign.endsAt)}
          <span className="ml-2">· {formatCoins(report.campaign.bonusPerMilestone)} NC for every {formatCoins(report.campaign.milestoneCoins)} eligible NC</span>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" /></div>
      ) : report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-muted)]">{label}</p>
                  <Icon className="h-4 w-4 text-[var(--brand-500)]" />
                </div>
                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[var(--surface-subtle)] text-left text-xs text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Contributor</th>
                    <th className="px-4 py-3 font-medium">Eligible CPX coins</th>
                    <th className="px-4 py-3 font-medium">Completed surveys</th>
                    <th className="px-4 py-3 font-medium">Milestones</th>
                    <th className="px-4 py-3 font-medium">Bonus due</th>
                  </tr>
                </thead>
                <tbody>
                  {report.contributors.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-[var(--text-muted)]">No qualifying completed CPX surveys in this campaign window yet.</td></tr>
                  ) : report.contributors.map((user) => (
                    <tr key={user.id} className="border-t border-[var(--border-default)]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{user.email || user.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-primary)]">{formatCoins(user.eligibleCoins)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{formatCoins(user.transactions)}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{formatCoins(Math.floor(user.eligibleCoins / report.campaign.milestoneCoins))}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-400">{formatCoins(user.bonusDue)} NC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--border-default)] px-4 py-3 text-xs text-[var(--text-muted)]">
              Counts CPX postbacks with type <code>complete</code> during the campaign, using credited NexCoins and excluding transactions currently marked reversed. The report calculates bonus due; award bonuses separately after review.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
