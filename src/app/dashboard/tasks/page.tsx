"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Clock3, RefreshCw, Search, XCircle } from "lucide-react";
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
  valid_units: number | null;
  partial_payment_nc: number | null;
  tasks: {
    title: string;
    task_type: string | null;
    pay_per_task: number | null;
    validation_time: string | null;
    total_units: number | null;
    unit_name: string | null;
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
  "Partially Approved": "bg-teal-100 text-teal-700",
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
        .select("id, task_id, status, submitted_at, coins_awarded, feedback, valid_units, partial_payment_nc, tasks(title, task_type, pay_per_task, validation_time, total_units, unit_name)")
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
      <section className="animate-fade-slide-up relative isolate overflow-hidden rounded-[1.6rem] bg-[#103f38] p-5 text-white shadow-[0_18px_45px_rgba(15,76,69,0.14)] sm:p-7" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(214,182,110,0.2),transparent_34%),radial-gradient(ellipse_at_5%_100%,rgba(20,184,166,0.18),transparent_42%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-[#e4d3a8]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e4d3a8]">Your work</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Tasks</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Keep track of active work, submissions, and approved rewards.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "In progress", count: tabCount("in_progress"), icon: Clock3 },
              { label: "In review", count: tabCount("submitted"), icon: ClipboardList },
              { label: "Approved", count: tabCount("approved"), icon: CheckCircle2 },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-3 backdrop-blur-sm sm:min-w-28 sm:px-4">
                  <Icon className="h-4 w-4 text-[#e4d3a8]" />
                  <p className="mt-2 text-xl font-bold">{loading ? "—" : stat.count}</p>
                  <p className="truncate text-[10px] font-medium text-white/60 sm:text-xs">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", animationDelay: "80ms" }}>
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
                  : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-teal-300 hover:text-teal-700"
              }`}
              style={isActive ? { background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)" } : undefined}
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
      <div className="animate-fade-slide-up flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-100" style={{ animationDelay: "130ms" }}>
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
            const isPartial    = s.status === "approved" && s.valid_units != null;
            const payout       = s.status === "approved" && s.coins_awarded != null
              ? s.coins_awarded
              : s.tasks?.pay_per_task != null ? Math.floor(s.tasks.pay_per_task * 0.66) : null;
            const displayLabel = isResubmit
              ? "Needs Resubmission"
              : isPartial
              ? "Partially Approved"
              : TABS.find((t) => t.status === s.status)?.label ?? s.status;

            const accentColor =
              isPartial                           ? "#14b8a6"
              : s.status === "approved"            ? "#22c55e"
              : s.status === "resubmit_requested" ? "#f97316"
              : s.status === "rejected"           ? "#ef4444"
              : s.status === "submitted"          ? "#f59e0b"
              :                                     "#6366f1";

            return (
              <li
                key={s.id}
                className={`relative space-y-3 overflow-hidden rounded-2xl border bg-white py-4 pr-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isResubmit ? "border-orange-200" : isRejected ? "border-red-200" : "border-slate-100"
                }`}
                style={{ paddingLeft: "1.25rem" }}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
                  style={{ background: accentColor }}
                />

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
                    {isPartial && s.tasks?.total_units != null && (
                      <p className="mt-1 text-xs text-emerald-600">
                        {s.valid_units}/{s.tasks.total_units} {s.tasks.unit_name ?? "units"} validated
                      </p>
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
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isPartial ? STATUS_STYLES["Partially Approved"] : STATUS_STYLES[s.status] ?? "bg-slate-100 text-slate-500"}`}>
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
