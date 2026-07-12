"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Search, Pause, X, Pencil, Eye, BarChart2, Loader2, Sheet, Trash2, Rocket } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import type { TaskStat } from "@/app/api/admin/task-analytics/route";

interface Task {
  id: string;
  title: string;
  task_type: string | null;
  pay_per_task: number | null;
  pay_per_task_inr: number | null;
  total_slots: number | null;
  filled_slots: number | null;
  status: string;
  created_at: string;
  drive_sheet_id: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  active:   "bg-green-500/10 text-green-400",
  paused:   "bg-yellow-500/10 text-yellow-400",
  draft:    "bg-blue-500/10 text-blue-400",
  archived: "bg-[var(--surface-subtle)] text-[var(--text-muted)]",
};

const TASK_TYPES = ["All Types", "Audio Recording", "Transcription", "Data Annotation", "App Testing", "Survey", "Content Task", "Micro-task", "External Tool Task"];
const STATUSES   = ["All Status", "active", "paused", "draft", "archived"];

export default function AdminTasksPage() {
  const tokenRef = useRef<string | null>(null);
  const allowed = usePageGuard(ADMIN_ROLES.CONTENT);

  const [tasks, setTasks]             = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [typeFilter, setTypeFilter]   = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [updating, setUpdating]       = useState<string | null>(null);
  const [view, setView]               = useState<"tasks" | "analytics">("tasks");
  const [analytics, setAnalytics]     = useState<TaskStat[] | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError]     = useState<string | null>(null);
  // Delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    async function fetchTasks() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      const { data } = await supabase
        .from("tasks")
        .select("id, title, task_type, pay_per_task, pay_per_task_inr, total_slots, filled_slots, status, created_at, drive_sheet_id")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setTasks(data ?? []);
      setLoading(false);
    }
    fetchTasks();
  }, []);

  async function loadAnalytics() {
    if (analytics !== null) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    const res = await fetch("/api/admin/task-analytics", {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setAnalyticsError(d.error ?? "Failed to load analytics.");
    } else {
      const { stats } = await res.json() as { stats: TaskStat[] };
      setAnalytics(stats);
    }
    setAnalyticsLoading(false);
  }

  function switchView(next: "tasks" | "analytics") {
    setView(next);
    if (next === "analytics") loadAnalytics();
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdating(id);
    // Use server-side API so publishing a draft (draft→active) triggers email notifications
    const res = await fetch(`/api/admin/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    setUpdating(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/tasks/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const filtered = tasks.filter((t) => {
    const matchSearch = search === "" || t.title.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "All Types" || t.task_type === typeFilter;
    const matchStatus = statusFilter === "All Status" || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tasks</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create and manage all contributor tasks.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] p-0.5 gap-0.5">
            <button
              onClick={() => switchView("tasks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === "tasks"
                  ? "bg-[var(--brand-500)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" /> Tasks
            </button>
            <button
              onClick={() => switchView("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                view === "analytics"
                  ? "bg-[var(--brand-500)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" /> Analytics
            </button>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/tasks/new"><Plus className="h-4 w-4" /> Post New Task</Link>
          </Button>
        </div>
      </div>

      {view === "analytics" ? (
        <AnalyticsView stats={analytics} loading={analyticsLoading} error={analyticsError} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] flex-1 min-w-[200px] max-w-xs">
              <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
              {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => <div key={i} className="h-16 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-4 text-center">
              <ClipboardList className="h-10 w-10 text-[var(--text-muted)]" />
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">
                  {tasks.length === 0 ? "No tasks yet" : "No results found"}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {tasks.length === 0 ? "Post your first task for contributors." : "Try adjusting your filters."}
                </p>
              </div>
              {tasks.length === 0 && (
                <Button asChild size="sm">
                  <Link href="/admin/tasks/new"><Plus className="h-4 w-4" /> Post New Task</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                    {["Title", "Type", "Coins/task", "Slots", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {filtered.map((task) => (
                    <tr key={task.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[220px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="truncate">{task.title}</p>
                          {!task.drive_sheet_id && (
                            <span title="Submissions Sheet not linked" className="flex-shrink-0 text-[var(--text-muted)] hover:text-yellow-400 transition-colors">
                              <Sheet className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{task.task_type ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.pay_per_task_inr != null ? (
                          <span className="font-semibold text-[var(--text-primary)]">₹{task.pay_per_task_inr.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-[var(--brand-500)] font-medium">{task.pay_per_task ?? "—"} NC</span>
                        )}
                        {task.pay_per_task != null && (
                          <span className="block text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                            {Math.floor(task.pay_per_task * 0.66)} NC to contributor
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                        {task.filled_slots ?? 0} / {task.total_slots ?? "∞"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[task.status] ?? ""}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/admin/tasks/${task.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/admin/tasks/${task.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {task.status === "draft" && (
                            <Button size="sm" disabled={updating === task.id}
                              onClick={() => updateStatus(task.id, "active")}
                              className="bg-[var(--brand-500)] hover:brightness-105 text-white">
                              {updating === task.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <><Rocket className="h-3.5 w-3.5" /> Publish</>}
                            </Button>
                          )}
                          {task.status === "active" && (
                            <Button variant="secondary" size="sm" disabled={updating === task.id}
                              onClick={() => updateStatus(task.id, "paused")}>
                              <Pause className="h-3.5 w-3.5" /> Pause
                            </Button>
                          )}
                          {task.status === "paused" && (
                            <Button variant="secondary" size="sm" disabled={updating === task.id}
                              onClick={() => updateStatus(task.id, "active")}>
                              ▶ Resume
                            </Button>
                          )}
                          {task.status !== "archived" && task.status !== "draft" && (
                            <Button variant="destructive" size="sm" disabled={updating === task.id}
                              onClick={() => updateStatus(task.id, "archived")}>
                              <X className="h-3.5 w-3.5" /> Close
                            </Button>
                          )}
                          <Button
                            variant="secondary" size="sm"
                            onClick={() => setDeleteTarget(task)}
                            className="text-red-400 hover:text-red-300 hover:border-red-500/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-2xl border border-[var(--border-default)] shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">Delete Task?</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">&ldquo;{deleteTarget.title}&rdquo;</span>{" "}
              will be hidden from the admin list and the public board. Submission and payment history is preserved in the database.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--text-secondary)] w-9 text-right">{rate}%</span>
    </div>
  );
}

function AnalyticsView({ stats, loading, error }: {
  stats: TaskStat[] | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-4">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-2 text-center">
        <BarChart2 className="h-10 w-10 text-[var(--text-muted)]" />
        <p className="font-semibold text-[var(--text-primary)]">No submissions yet</p>
        <p className="text-sm text-[var(--text-secondary)]">Analytics will appear once contributors start submitting tasks.</p>
      </div>
    );
  }

  const totalSubmissions = stats.reduce((s, t) => s + t.total, 0);
  const totalApproved    = stats.reduce((s, t) => s + t.approved, 0);
  const overallRate      = totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 0;
  const reviewedStats    = stats.filter((t) => t.avg_review_hours !== null);
  const avgReviewHrs     = reviewedStats.length > 0
    ? Math.round(reviewedStats.reduce((s, t) => s + (t.avg_review_hours ?? 0), 0) / reviewedStats.length * 10) / 10
    : null;

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Submissions", value: totalSubmissions.toLocaleString() },
          { label: "Total Approved",    value: totalApproved.toLocaleString() },
          { label: "Overall Approval Rate", value: `${overallRate}%` },
          { label: "Avg Review Time",   value: avgReviewHrs != null ? `${avgReviewHrs}h` : "—" },
        ].map((tile) => (
          <div key={tile.label} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">{tile.label}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{tile.value}</p>
          </div>
        ))}
      </div>

      {/* Per-task breakdown */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
              {["Task", "Type", "Submissions", "Approved", "Rejected", "Pending", "Approval Rate", "Avg Review"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {stats.map((s) => (
              <tr key={s.task_id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[180px]">
                  <p className="truncate">{s.task_title}</p>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap text-xs">{s.task_type ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{s.total}</td>
                <td className="px-4 py-3 text-green-400 font-medium">{s.approved}</td>
                <td className="px-4 py-3 text-red-400 font-medium">{s.rejected}</td>
                <td className="px-4 py-3 text-yellow-400 font-medium">{s.pending}</td>
                <td className="px-4 py-3 min-w-[130px]">
                  <ApprovalBar rate={s.approval_rate} />
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                  {s.avg_review_hours != null ? `${s.avg_review_hours}h` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
