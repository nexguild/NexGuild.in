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
  in_progress:         "bg-blue-100 text-blue-600",
  resubmit_requested:  "bg-orange-100 text-orange-600",
  submitted:           "bg-amber-100 text-amber-600",
  approved:            "bg-green-100 text-green-600",
  rejected:            "bg-red-100 text-red-600",
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-white/70" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">My Work</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">My Tasks</h1>
          <p className="text-sm text-white/75">Track all your submissions and their review status.</p>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => {
          const count   = tabCount(tab.status);
          const isActive = activeTab === tab.status;
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? "border-transparent text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600"
              }`}
              style={isActive ? { background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" } : undefined}
            >
              {tab.label}
              {count > 0 && (
                <span className={`min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none ${
                  isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SEARCH ───────────────────────────────────────────────── */}
      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
        <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by task name…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-400 transition-colors hover:text-slate-600">
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
          >
            <ClipboardList className="h-7 w-7 text-indigo-500" />
          </div>
          <div>
            <p className="mb-1 font-bold text-slate-800">
              {search ? "No matches found" : "No tasks here"}
            </p>
            <p className="text-sm text-slate-500">
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
            const isResubmit   = s.status === "resubmit_requested";
            const isRejected   = s.status === "rejected";
            const payout       = s.status === "approved" && s.coins_awarded != null
              ? s.coins_awarded
              : s.tasks?.pay_per_task != null ? Math.floor(s.tasks.pay_per_task * 0.66) : null;
            const displayLabel = isResubmit
              ? "Needs Resubmission"
              : TABS.find((t) => t.status === s.status)?.label ?? s.status;

            return (
              <li
                key={s.id}
                className={`space-y-3 rounded-2xl border bg-white px-5 py-4 shadow-sm ${
                  isResubmit ? "border-orange-200" : isRejected ? "border-red-200" : "border-slate-100"
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {s.tasks?.title ?? "Unknown task"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {s.tasks?.task_type ?? "Task"} ·{" "}
                      {new Date(s.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {s.status === "submitted" && s.tasks?.validation_time && (
                      <p className="mt-1 text-xs text-indigo-500">⏱ Review within {s.tasks.validation_time}</p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2.5">
                    {payout != null && (
                      <span className={`hidden items-center gap-1 text-xs font-bold sm:flex ${
                        s.status === "approved" ? "text-green-600" : "text-slate-400"
                      }`}>
                        {s.status === "approved" && "+"}
                        <NexCoinIcon size={12} />
                        {payout.toLocaleString()}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[s.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {displayLabel}
                    </span>
                  </div>
                </div>

                {/* Feedback block */}
                {(isResubmit || isRejected) && s.feedback && (
                  <div className={`rounded-xl px-3 py-2.5 text-sm ${
                    isResubmit
                      ? "border border-orange-100 bg-orange-50 text-orange-700"
                      : "border border-red-100 bg-red-50 text-red-700"
                  }`}>
                    <p className={`mb-1 text-xs font-bold ${isResubmit ? "text-orange-600" : "text-red-600"}`}>
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
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-500">
                    <XCircle className="h-3.5 w-3.5" />
                    Final — Not Retryable
                  </span>
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
