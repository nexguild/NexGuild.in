"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, ShieldAlert, CheckCircle2, ExternalLink } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface SuspiciousVisit {
  id:             string;
  contributor_id: string;
  site_slug:      string;
  ip_address:     string | null;
  task_id:        string | null;
  created_at:     string;
  reviewed:       boolean;
  profiles:       { full_name: string | null; email: string } | null;
}

interface SuspiciousSubmission {
  id:             string;
  contributor_id: string;
  task_id:        string;
  ip_address:     string | null;
  submitted_at:   string | null;
  reviewed:       boolean;
  profiles:       { full_name: string | null; email: string } | null;
  tasks:          { title: string } | null;
}

type Tab = "visits" | "submissions";

export default function SuspiciousVisitsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [tab, setTab]                   = useState<Tab>("visits");
  const [showReviewed, setShowReviewed] = useState(false);
  const [visits, setVisits]             = useState<SuspiciousVisit[]>([]);
  const [subs, setSubs]                 = useState<SuspiciousSubmission[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetchVisits = useCallback(async () => {
    const { data } = await supabase
      .from("proof_code_submissions")
      .select("id, contributor_id, site_slug, ip_address, task_id, created_at, reviewed, profiles(full_name, email)")
      .eq("suspicious", true)
      .eq("reviewed", showReviewed)
      .order("created_at", { ascending: false })
      .limit(200);
    setVisits((data as unknown as SuspiciousVisit[]) ?? []);
  }, [showReviewed]);

  const fetchSubs = useCallback(async () => {
    const { data } = await supabase
      .from("submissions")
      .select("id, contributor_id, task_id, ip_address, submitted_at, reviewed, profiles(full_name, email), tasks(title)")
      .eq("suspicious", true)
      .eq("reviewed", showReviewed)
      .order("submitted_at", { ascending: false })
      .limit(200);
    setSubs((data as unknown as SuspiciousSubmission[]) ?? []);
  }, [showReviewed]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchVisits(), fetchSubs()]);
    setLoading(false);
  }, [fetchVisits, fetchSubs]);

  useEffect(() => {
    if (allowed) fetchAll();
  }, [allowed, fetchAll]);

  async function markVisitReviewed(id: string) {
    await supabase.from("proof_code_submissions").update({ reviewed: true }).eq("id", id);
    setVisits((prev) => prev.filter((v) => v.id !== id));
  }

  async function markSubReviewed(id: string) {
    await supabase.from("submissions").update({ reviewed: true }).eq("id", id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  if (!allowed) return null;

  const totalPending = visits.filter((v) => !v.reviewed).length + subs.filter((s) => !s.reviewed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Suspicious Activity</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Same IP address used by multiple NexGuild accounts within 24 hours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReviewed((v) => !v)}
            className="text-sm px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.1)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            {showReviewed ? "Show Pending" : "Show Reviewed"}
          </button>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.1)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {!showReviewed && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            {loading ? "Loading…" : totalPending === 0
              ? "No suspicious activity pending review."
              : `${totalPending} flagged item${totalPending !== 1 ? "s" : ""} pending review.`}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(255,255,255,0.08)]">
        {(["visits", "submissions"] as Tab[]).map((t) => {
          const count = t === "visits" ? visits.length : subs.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-[var(--brand-500)] text-white"
                  : "border-transparent text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {t === "visits" ? "Website Visits" : "Task Submissions"}
              {count > 0 && (
                <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold px-1">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : tab === "visits" ? (
        visits.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm">
            {showReviewed ? "No reviewed visit flags." : "No pending suspicious visits."}
          </div>
        ) : (
          <div className="rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Site</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{v.profiles?.full_name ?? "Unknown"}</div>
                      <div className="text-xs text-[var(--text-muted)]">{v.profiles?.email ?? v.contributor_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[rgba(2,180,145,0.1)] text-[#02b491] text-xs font-semibold">
                        {v.site_slug}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-amber-300">{v.ip_address ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                      {new Date(v.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {v.task_id && (
                          <a href={`/admin/tasks/${v.task_id}`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
                            <ExternalLink className="h-3 w-3" /> Task
                          </a>
                        )}
                        <a href={`/admin/contributors/${v.contributor_id}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
                          <ExternalLink className="h-3 w-3" /> Profile
                        </a>
                        {!showReviewed && (
                          <button onClick={() => markVisitReviewed(v.id)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                            <CheckCircle2 className="h-3 w-3" /> Mark reviewed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        subs.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-sm">
            {showReviewed ? "No reviewed submission flags." : "No pending suspicious task submissions."}
          </div>
        ) : (
          <div className="rounded-lg border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Task</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">IP Address</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {subs.map((s) => (
                  <tr key={s.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-primary)]">{s.profiles?.full_name ?? "Unknown"}</div>
                      <div className="text-xs text-[var(--text-muted)]">{s.profiles?.email ?? s.contributor_id}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)] text-xs">
                      {s.tasks?.title ?? s.task_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-amber-300">{s.ip_address ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={`/admin/tasks/${s.task_id}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
                          <ExternalLink className="h-3 w-3" /> Task
                        </a>
                        <a href={`/admin/contributors/${s.contributor_id}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors">
                          <ExternalLink className="h-3 w-3" /> Profile
                        </a>
                        {!showReviewed && (
                          <button onClick={() => markSubReviewed(s.id)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                            <CheckCircle2 className="h-3 w-3" /> Mark reviewed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
