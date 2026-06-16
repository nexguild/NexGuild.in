"use client";

import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  submitted:           "bg-yellow-500/10 text-yellow-400",
  resubmit_requested:  "bg-orange-500/10 text-orange-400",
  approved:            "bg-green-500/10 text-green-400",
  rejected:            "bg-red-500/10 text-red-400",
};

export default function TasksPage() {
  const [activeTab, setActiveTab]   = useState("in_progress");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchErr } = await supabase
        .from("submissions")
        .select("id, task_id, status, submitted_at, coins_awarded, feedback, tasks(title, task_type, pay_per_task)")
        .eq("contributor_id", user.id)
        .order("submitted_at", { ascending: false });

      if (fetchErr) console.error("submissions fetch error:", fetchErr.message);
      setSubmissions((data as unknown as Submission[]) ?? []);
      setLoading(false);
    }
    fetchSubmissions();
  }, []);

  const filtered = submissions.filter((s) => s.status === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">My Tasks</h1>
        <p className="text-sm text-[var(--text-secondary)]">Track all your submissions and their review status.</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === tab.status
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
            <p className="font-semibold text-[var(--text-primary)] mb-1">No tasks here</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {activeTab === "in_progress"
                ? "Start a task and it will appear here."
                : `No ${TABS.find((t) => t.status === activeTab)?.label.toLowerCase()} tasks yet.`}
            </p>
          </div>
          {activeTab === "in_progress" && (
            <Button asChild size="sm">
              <Link href="/dashboard/opportunities">Browse Opportunities</Link>
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
            <li
              key={s.id}
              className={`rounded-xl border bg-[var(--surface-card)] px-5 py-4 space-y-3 ${
                s.status === "resubmit_requested"
                  ? "border-orange-500/25"
                  : s.status === "rejected"
                  ? "border-red-500/20"
                  : "border-[var(--border-default)]"
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {s.tasks?.title ?? "Unknown task"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {s.tasks?.task_type ?? "Task"} ·{" "}
                    {new Date(s.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {s.status === "approved" && s.coins_awarded != null ? (
                    <span className="text-xs font-medium text-green-400 hidden sm:block">
                      +{s.coins_awarded} coins
                    </span>
                  ) : s.tasks?.pay_per_task != null ? (
                    <span className="text-xs font-medium text-[var(--text-muted)] hidden sm:block">
                      {s.tasks.pay_per_task} coins
                    </span>
                  ) : null}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[s.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
                    {TABS.find((t) => t.status === s.status)?.label ?? s.status}
                  </span>
                </div>
              </div>

              {/* Feedback block for rejected / resubmit_requested */}
              {(s.status === "rejected" || s.status === "resubmit_requested") && s.feedback && (
                <div className={`rounded-lg px-3 py-2.5 text-sm ${
                  s.status === "resubmit_requested"
                    ? "bg-orange-500/10 border border-orange-500/20 text-orange-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${s.status === "resubmit_requested" ? "text-orange-400" : "text-red-400"}`}>
                    {s.status === "resubmit_requested" ? "What needs to be fixed:" : "Rejection reason:"}
                  </p>
                  {s.feedback}
                </div>
              )}

              {/* Action buttons */}
              {s.status === "resubmit_requested" && (
                <div>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/tasks/${s.task_id}/work`}>
                      <RefreshCw className="h-3.5 w-3.5" /> Resubmit →
                    </Link>
                  </Button>
                </div>
              )}
              {s.status === "in_progress" && (
                <div>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/dashboard/tasks/${s.task_id}/work`}>Continue Working →</Link>
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
