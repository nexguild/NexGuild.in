"use client";

import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw, Search, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface Submission {
  id: string;
  task_id: string;
  status: string;
  submitted_at: string;
  coins_awarded: number | null;
  feedback: string | null;
  tasks: {
    title: string;
    task_type: string | null;
    pay_per_task: number | null;
    validation_time: string | null;
  } | null;
}

const TABS = [
  { label: "In Progress", status: "in_progress" },
  { label: "Submitted",   status: "submitted" },
  { label: "Approved",    status: "approved" },
  { label: "Rejected",    status: "rejected" },
];

const STATUS_STYLES: Record<string, string> = {
  in_progress:         "bg-blue-500/10 text-blue-400",
  resubmit_requested:  "bg-orange-500/10 text-orange-400",
  submitted:           "bg-yellow-500/10 text-yellow-400",
  approved:            "bg-green-500/10 text-green-400",
  rejected:            "bg-red-500/10 text-red-400",
};

function statusInTab(status: string, tabStatus: string): boolean {
  if (tabStatus === "in_progress") return status === "in_progress" || status === "resubmit_requested";
  return status === tabStatus;
}

export default function TasksPage() {
  const [activeTab, setActiveTab]     = useState("in_progress");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchErr } = await supabase
        .from("submissions")
        .select("id, task_id, status, submitted_at, coins_awarded, feedback, tasks(title, task_type, pay_per_task, validation_time)")
        .eq("contributor_id", user.id)
        .order("submitted_at", { ascending: false });

      if (fetchErr) console.error("submissions fetch error:", fetchErr.message);

      // Deduplicate by task_id: keep the row with the highest-priority status.
      // This guards against duplicate in_progress rows created by multiple visits.
      const STATUS_PRIORITY: Record<string, number> = {
        approved: 5, rejected: 4, submitted: 3, resubmit_requested: 2, in_progress: 1,
      };
      const byTask: Record<string, Submission> = {};
      for (const s of (data as unknown as Submission[]) ?? []) {
        const existing = byTask[s.task_id];
        const cur = STATUS_PRIORITY[s.status] ?? 0;
        const prev = existing ? (STATUS_PRIORITY[existing.status] ?? 0) : -1;
        if (!existing || cur > prev) byTask[s.task_id] = s;
      }
      setSubmissions(Object.values(byTask));
      setLoading(false);
    }
    fetchSubmissions();
  }, []);

  function tabCount(tabStatus: string) {
    return submissions.filter((s) => statusInTab(s.status, tabStatus)).length;
  }

  const filtered = submissions.filter((s) => {
    if (!statusInTab(s.status, activeTab)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.tasks?.title?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">My Tasks</h1>
        <p className="text-sm text-[var(--text-secondary)]">Track all your submissions and their review status.</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => {
          const count = tabCount(tab.status);
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
                activeTab === tab.status
                  ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${
                  activeTab === tab.status
                    ? "bg-[var(--brand-500)] text-white"
                    : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by task name…"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-4">
          <ClipboardList className="h-10 w-10 text-[var(--text-muted)]" />
          <div className="text-center">
            <p className="font-semibold text-[var(--text-primary)] mb-1">
              {search ? "No matches found" : "No tasks here"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {search
                ? `No tasks match "${search}"`
                : activeTab === "in_progress"
                ? "Start a task and it will appear here."
                : `No ${TABS.find((t) => t.status === activeTab)?.label.toLowerCase()} tasks yet.`}
            </p>
          </div>
          {activeTab === "in_progress" && !search && (
            <Button asChild size="sm">
              <Link href="/dashboard/opportunities">Browse Opportunities</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => {
            const isResubmit  = s.status === "resubmit_requested";
            const isRejected  = s.status === "rejected";
            const payout      = s.status === "approved" && s.coins_awarded != null
              ? s.coins_awarded
              : s.tasks?.pay_per_task != null ? Math.floor(s.tasks.pay_per_task * 0.66) : null;
            const displayLabel = isResubmit
              ? "Needs Resubmission"
              : TABS.find((t) => t.status === s.status)?.label ?? s.status;

            return (
              <li
                key={s.id}
                className={`rounded-xl border bg-[var(--surface-card)] px-5 py-4 space-y-3 ${
                  isResubmit
                    ? "border-orange-500/25"
                    : isRejected
                    ? "border-red-500/20"
                    : "border-[var(--border-default)]"
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {s.tasks?.title ?? "Unknown task"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {s.tasks?.task_type ?? "Task"} ·{" "}
                      {new Date(s.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {s.status === "submitted" && s.tasks?.validation_time && (
                      <p className="text-xs mt-1 text-blue-400">⏱ Review within {s.tasks.validation_time}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    {/* Payout */}
                    {payout != null && (
                      <span className={`hidden sm:flex items-center gap-1 text-xs font-semibold ${
                        s.status === "approved" ? "text-green-400" : "text-[var(--text-muted)]"
                      }`}>
                        {s.status === "approved" && "+"}
                        <NexCoinIcon size={12} />
                        {payout.toLocaleString()}
                      </span>
                    )}
                    {/* Status badge */}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[s.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
                      {displayLabel}
                    </span>
                  </div>
                </div>

                {/* Feedback block */}
                {(isResubmit || isRejected) && s.feedback && (
                  <div className={`rounded-lg px-3 py-2.5 text-sm ${
                    isResubmit
                      ? "bg-orange-500/10 border border-orange-500/20 text-orange-300"
                      : "bg-red-500/10 border border-red-500/20 text-red-300"
                  }`}>
                    <p className={`text-xs font-semibold mb-1 ${isResubmit ? "text-orange-400" : "text-red-400"}`}>
                      {isResubmit ? "What needs to be fixed:" : "Rejection reason:"}
                    </p>
                    {s.feedback}
                  </div>
                )}

                {/* Action row */}
                {isResubmit && (
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/tasks/${s.task_id}/work`}>
                      <RefreshCw className="h-3.5 w-3.5" /> Resubmit →
                    </Link>
                  </Button>
                )}
                {isRejected && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
                      <XCircle className="h-3.5 w-3.5" />
                      Final — Not Retryable
                    </span>
                  </div>
                )}
                {s.status === "in_progress" && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/dashboard/tasks/${s.task_id}/work`}>Continue Working →</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
