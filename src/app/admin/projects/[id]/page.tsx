"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, FolderOpen, CheckCircle2, Clock, CreditCard,
  ClipboardList, BarChart2, Plus, Trash2, ExternalLink, Download,
  Eye, Pencil, AlertCircle, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Project {
  id: string; name: string; client_name: string | null; description: string | null;
  project_type: string | null; status: string; start_date: string | null;
  deadline: string | null; payment_timeline: string | null; total_budget_nc: number;
  client_payment_amount: string | null; client_payment_received: boolean;
  client_payment_received_at: string | null; internal_notes: string | null;
  created_at: string; updated_at: string | null;
  task_count: number; nc_paid: number; nexleader_commission: number;
  platform_cut: number; net_contributor_payout: number;
}

interface ProjectTask {
  id: string; title: string; task_type: string | null; status: string;
  pay_per_task: number | null; total_slots: number | null; filled_slots: number | null;
  drive_sheet_id: string | null; submission_count: number; approved_count: number; nc_paid: number;
}

interface Submission {
  id: string; contributor_id: string; task_id: string; task_title: string;
  status: string; coins_awarded: number | null; submitted_at: string;
  nexleader_name: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface AvailableTask { id: string; title: string; task_type: string | null; status: string; }

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:        { label: "Draft",        cls: "bg-slate-500/10 text-slate-400" },
  active:       { label: "Active",       cls: "bg-green-500/10 text-green-400" },
  under_review: { label: "Under Review", cls: "bg-amber-500/10 text-amber-400" },
  completed:    { label: "Completed",    cls: "bg-blue-500/10 text-blue-400" },
  paused:       { label: "Paused",       cls: "bg-red-500/10 text-red-400" },
};

const WORKFLOW: Record<string, { next: string; label: string } | undefined> = {
  draft:        { next: "active",       label: "Activate" },
  active:       { next: "under_review", label: "Mark Under Review" },
  under_review: { next: "completed",    label: "Mark Completed" },
};

const PROJECT_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "App Testing",
  "Survey", "Content Task", "Translation", "Micro-task", "Other",
];

const ic = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-colors";
const lc = "block text-sm font-semibold text-[var(--text-primary)] mb-1.5";
const tc = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function exportCSV(submissions: Submission[], projectName: string) {
  const header = ["Contributor Name", "Email", "NexLeader", "Task", "Status", "Coins Awarded", "Submitted At"];
  const rows = submissions.map((s) => [
    s.profiles?.full_name ?? "Unknown",
    s.profiles?.email ?? "—",
    s.nexleader_name ?? "—",
    s.task_title,
    s.status,
    s.coins_awarded ?? 0,
    new Date(s.submitted_at).toLocaleString("en-IN"),
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${projectName.replace(/[^a-z0-9]/gi, "_")}_submissions.csv`;
  a.click();
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const id           = params.id as string;
  const allowed      = usePageGuard(ADMIN_ROLES.REVIEW);

  const tokenRef = useRef<string | null>(null);
  const [tab, setTab]               = useState<"overview" | "tasks" | "submissions" | "financials">(
    (searchParams.get("tab") as "overview" | "tasks" | "submissions" | "financials") ?? "overview"
  );
  const [project, setProject]       = useState<Project | null>(null);
  const [tasks, setTasks]           = useState<ProjectTask[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Overview edit fields
  const [editName, setEditName]                     = useState("");
  const [editClientName, setEditClientName]         = useState("");
  const [editDescription, setEditDescription]       = useState("");
  const [editProjectType, setEditProjectType]       = useState("");
  const [editStartDate, setEditStartDate]           = useState("");
  const [editDeadline, setEditDeadline]             = useState("");
  const [editPaymentTimeline, setEditPaymentTimeline] = useState("");
  const [editBudgetNC, setEditBudgetNC]             = useState("");
  const [editClientPayment, setEditClientPayment]   = useState("");
  const [editInternalNotes, setEditInternalNotes]   = useState("");

  // Tasks tab
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [linkTaskId, setLinkTaskId]         = useState("");
  const [linking, setLinking]               = useState(false);

  // Submissions tab
  const [submissions, setSubmissions]       = useState<Submission[]>([]);
  const [subTasks, setSubTasks]             = useState<{ id: string; title: string }[]>([]);
  const [subLoading, setSubLoading]         = useState(false);
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subTaskFilter, setSubTaskFilter]   = useState("all");

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    tokenRef.current = session?.access_token ?? null;

    const res = await fetch(`/api/admin/projects/${id}`, {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (!res.ok) { setError("Failed to load project."); setLoading(false); return; }
    const { project: p, tasks: t } = await res.json() as { project: Project; tasks: ProjectTask[] };
    setProject(p);
    setTasks(t ?? []);

    // Populate edit fields
    setEditName(p.name);
    setEditClientName(p.client_name ?? "");
    setEditDescription(p.description ?? "");
    setEditProjectType(p.project_type ?? "");
    setEditStartDate(p.start_date ?? "");
    setEditDeadline(p.deadline ?? "");
    setEditPaymentTimeline(p.payment_timeline ?? "");
    setEditBudgetNC(String(p.total_budget_nc ?? 0));
    setEditClientPayment(p.client_payment_amount ?? "");
    setEditInternalNotes(p.internal_notes ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveOverview() {
    if (!editName.trim()) { setError("Name is required."); return; }
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        name: editName, client_name: editClientName || null,
        description: editDescription || null, project_type: editProjectType || null,
        start_date: editStartDate || null, deadline: editDeadline || null,
        payment_timeline: editPaymentTimeline || null,
        total_budget_nc: parseInt(editBudgetNC) || 0,
        client_payment_amount: editClientPayment || null,
        internal_notes: editInternalNotes || null,
      }),
    });
    if (res.ok) {
      setProject((p) => p ? { ...p, name: editName, client_name: editClientName || null,
        description: editDescription || null, project_type: editProjectType || null,
        start_date: editStartDate || null, deadline: editDeadline || null,
        payment_timeline: editPaymentTimeline || null,
        total_budget_nc: parseInt(editBudgetNC) || 0,
        client_payment_amount: editClientPayment || null,
        internal_notes: editInternalNotes || null } : p);
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? "Save failed.");
    }
    setSaving(false);
  }

  async function advanceStatus() {
    if (!project) return;
    const next = WORKFLOW[project.status]?.next;
    if (!next) return;
    setStatusUpdating(true);
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setProject((p) => p ? { ...p, status: next } : p);
    setStatusUpdating(false);
  }

  async function togglePaused() {
    if (!project) return;
    const newStatus = project.status === "paused" ? "active" : "paused";
    setStatusUpdating(true);
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setProject((p) => p ? { ...p, status: newStatus } : p);
    setStatusUpdating(false);
  }

  async function togglePaymentReceived() {
    if (!project) return;
    const newVal = !project.client_payment_received;
    const res = await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ client_payment_received: newVal }),
    });
    if (res.ok) setProject((p) => p ? { ...p, client_payment_received: newVal,
      client_payment_received_at: newVal ? new Date().toISOString() : null } : p);
  }

  async function loadAvailableTasks() {
    const res = await fetch(`/api/admin/projects/${id}/tasks?mode=available`, {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    const { tasks: t } = await res.json() as { tasks: AvailableTask[] };
    setAvailableTasks(t ?? []);
  }

  async function linkTask() {
    if (!linkTaskId) return;
    setLinking(true);
    const res = await fetch(`/api/admin/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ task_id: linkTaskId }),
    });
    if (res.ok) { await load(); setLinkTaskId(""); setAvailableTasks([]); }
    setLinking(false);
  }

  async function unlinkTask(taskId: string) {
    await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ project_id: null }),
    });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function loadSubmissions() {
    setSubLoading(true);
    const params = new URLSearchParams();
    if (subStatusFilter !== "all") params.set("status", subStatusFilter);
    if (subTaskFilter !== "all") params.set("task_id", subTaskFilter);
    const res = await fetch(`/api/admin/projects/${id}/submissions?${params}`, {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    const { submissions: s, tasks: t } = await res.json() as { submissions: Submission[]; tasks: { id: string; title: string }[] };
    setSubmissions(s ?? []);
    setSubTasks(t ?? []);
    setSubLoading(false);
  }

  useEffect(() => {
    if (tab === "submissions") loadSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, subStatusFilter, subTaskFilter]);

  if (!allowed) return null;
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
    </div>
  );
  if (!project) return (
    <div className="space-y-4">
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <p className="text-red-400">{error ?? "Project not found."}</p>
    </div>
  );

  const meta     = STATUS_META[project.status] ?? STATUS_META.draft;
  const workflow = WORKFLOW[project.status];
  const ncPct    = project.total_budget_nc > 0 ? Math.min(100, Math.round((project.nc_paid / project.total_budget_nc) * 100)) : 0;

  const TABS = [
    { id: "overview",     label: "Overview",    icon: <FolderOpen className="h-4 w-4" /> },
    { id: "tasks",        label: "Tasks",       icon: <ClipboardList className="h-4 w-4" /> },
    { id: "submissions",  label: "Submissions", icon: <Eye className="h-4 w-4" /> },
    { id: "financials",   label: "Financials",  icon: <BarChart2 className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/projects" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
            </div>
            {project.client_name && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{project.client_name}</p>}
          </div>
        </div>
        {/* Status workflow */}
        <div className="flex items-center gap-2 flex-wrap">
          {workflow && (
            <Button size="sm" disabled={statusUpdating} onClick={advanceStatus}
              className="bg-[var(--brand-500)] hover:brightness-105 text-white">
              {statusUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : workflow.label}
            </Button>
          )}
          {project.status !== "completed" && (
            <Button variant="secondary" size="sm" disabled={statusUpdating} onClick={togglePaused}>
              {project.status === "paused" ? "▶ Resume" : "⏸ Pause"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border-default)] overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── TAB: Overview ───────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tasks Linked",  value: project.task_count },
              { label: "NC Paid",       value: project.nc_paid.toLocaleString(), nc: true },
              { label: "NC Budget",     value: project.total_budget_nc.toLocaleString(), nc: true },
              { label: "NC Budget Used", value: `${ncPct}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3">
                <p className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-1">
                  {s.nc && <NexCoinIcon size={14} />} {s.value}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Editable project info */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-bold text-[var(--text-primary)]">Project Info</h2>
              <Button size="sm" disabled={saving} onClick={saveOverview}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save</>}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={lc}>Project Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={ic} />
              </div>
              <div>
                <label className={lc}>Client Name</label>
                <input type="text" value={editClientName} onChange={(e) => setEditClientName(e.target.value)} placeholder="—" className={ic} />
              </div>
            </div>
            <div>
              <label className={lc}>Description</label>
              <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={tc} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={lc}>Project Type</label>
                <select value={editProjectType} onChange={(e) => setEditProjectType(e.target.value)} className={ic}>
                  <option value="">—</option>
                  {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Payment Timeline</label>
                <input type="text" value={editPaymentTimeline} onChange={(e) => setEditPaymentTimeline(e.target.value)}
                  placeholder="e.g. 30 days after completion" className={ic} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={lc}>Start Date</label>
                <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className={ic} />
              </div>
              <div>
                <label className={lc}>Deadline</label>
                <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className={ic} />
              </div>
              <div>
                <label className={lc}>NC Budget</label>
                <input type="number" min="0" value={editBudgetNC} onChange={(e) => setEditBudgetNC(e.target.value)} className={ic} />
              </div>
            </div>
          </section>

          {/* Client payment tracking */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">Client Payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={lc}>Expected Amount</label>
                <input type="text" value={editClientPayment}
                  onChange={(e) => setEditClientPayment(e.target.value)}
                  placeholder="e.g. $70 USD" className={ic} />
              </div>
              <div className="flex flex-col justify-end">
                <button onClick={togglePaymentReceived}
                  className={`h-10 rounded-lg border px-4 text-sm font-semibold flex items-center gap-2 transition-colors ${
                    project.client_payment_received
                      ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  }`}>
                  {project.client_payment_received
                    ? <><CheckCircle2 className="h-4 w-4" /> Payment Received</>
                    : <><Clock className="h-4 w-4" /> Mark as Received</>}
                </button>
                {project.client_payment_received_at && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Received on {fmt(project.client_payment_received_at)}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Internal notes */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-bold text-[var(--text-primary)]">Internal Notes</h2>
              <Button size="sm" variant="secondary" disabled={saving} onClick={saveOverview}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save</>}
              </Button>
            </div>
            <textarea rows={5} value={editInternalNotes} onChange={(e) => setEditInternalNotes(e.target.value)}
              placeholder="Private notes, contacts, links, special requirements…" className={tc} />
            <p className="text-xs text-[var(--text-muted)]">Admin-only. Never shown to contributors.</p>
          </section>
        </div>
      )}

      {/* ── TAB: Tasks ──────────────────────────────────────────────────────── */}
      {tab === "tasks" && (
        <div className="space-y-5">
          {/* Link existing task */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
            <h2 className="font-bold text-[var(--text-primary)]">Link Existing Task</h2>
            <div className="flex gap-3 flex-wrap">
              <select value={linkTaskId} onChange={(e) => setLinkTaskId(e.target.value)}
                onFocus={loadAvailableTasks}
                className={`${ic} flex-1 min-w-[200px]`}>
                <option value="">Select a task to link…</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                ))}
              </select>
              <Button disabled={!linkTaskId || linking} onClick={linkTask}>
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Link Task</>}
              </Button>
              <Button variant="secondary" asChild>
                <Link href={`/admin/tasks/new?project_id=${id}`}><Plus className="h-4 w-4" /> Create New Task</Link>
              </Button>
            </div>
          </section>

          {/* Task list */}
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-12 flex flex-col items-center gap-3 text-center">
              <ClipboardList className="h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">No tasks linked yet. Link an existing task or create a new one.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                    {["Task", "Type", "Status", "Slots", "Submissions", "Approved", "NC Paid", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-[var(--text-primary)] truncate">{t.title}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{t.task_type ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          t.status === "active" ? "bg-green-500/10 text-green-400" :
                          t.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                        }`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                        {t.filled_slots ?? 0}/{t.total_slots ?? "∞"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{t.submission_count}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{t.approved_count}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-amber-400 font-medium text-xs">
                          <NexCoinIcon size={12} /> {t.nc_paid.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/admin/tasks/${t.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          <Button variant="secondary" size="sm" asChild>
                            <Link href={`/admin/tasks/${t.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
                          </Button>
                          {t.drive_sheet_id && (
                            <Button variant="secondary" size="sm" asChild>
                              <a href={`https://docs.google.com/spreadsheets/d/${t.drive_sheet_id}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button variant="secondary" size="sm"
                            onClick={() => unlinkTask(t.id)}
                            className="text-red-400 hover:text-red-300 hover:border-red-500/30">
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
        </div>
      )}

      {/* ── TAB: Submissions ────────────────────────────────────────────────── */}
      {tab === "submissions" && (
        <div className="space-y-4">
          {/* Filters + export */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={subStatusFilter} onChange={(e) => setSubStatusFilter(e.target.value)}
              className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={subTaskFilter} onChange={(e) => setSubTaskFilter(e.target.value)}
              className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none">
              <option value="all">All Tasks</option>
              {subTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" onClick={() => exportCSV(submissions, project.name)}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>

          {subLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand-500)]" /></div>
          ) : submissions.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-12 text-center">
              <p className="text-sm text-[var(--text-secondary)]">No submissions found.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                    {["Contributor", "NexLeader", "Task", "Submitted", "Status", "Coins", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{s.profiles?.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-[var(--text-muted)]">{s.profiles?.email ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{s.nexleader_name ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[160px]">
                        <p className="truncate">{s.task_title}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap text-xs">
                        {new Date(s.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          s.status === "approved" ? "bg-green-500/10 text-green-400" :
                          s.status === "rejected" ? "bg-red-500/10 text-red-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.coins_awarded != null
                          ? <span className="flex items-center gap-1 text-amber-400 text-xs font-medium"><NexCoinIcon size={12} />{s.coins_awarded}</span>
                          : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/admin/submissions?id=${s.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Financials ─────────────────────────────────────────────────── */}
      {tab === "financials" && (
        <div className="space-y-5">
          {/* NC Breakdown */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">NexCoin Breakdown</h2>
            {[
              { label: "Total NC Paid to Contributors",   value: project.nc_paid,                  highlight: true },
              { label: "NexLeader Commissions (10%)",     value: project.nexleader_commission,      warn: true },
              { label: "Platform Cut (24%)",              value: project.platform_cut,              warn: true },
              { label: "Net Contributor Payouts (66%)",   value: project.net_contributor_payout,    ok: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)] last:border-0">
                <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
                <span className={`flex items-center gap-1 font-bold text-sm ${
                  row.highlight ? "text-[var(--text-primary)]" :
                  row.ok ? "text-green-400" : "text-amber-400"
                }`}>
                  <NexCoinIcon size={13} /> {row.value.toLocaleString()} NC
                </span>
              </div>
            ))}
          </section>

          {/* Budget usage */}
          {project.total_budget_nc > 0 && (
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-3">
              <h2 className="font-bold text-[var(--text-primary)]">Budget Usage</h2>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">NC Used</span>
                <span className="font-bold text-[var(--text-primary)]">{ncPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--brand-500)] transition-all duration-700" style={{ width: `${ncPct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>{project.nc_paid.toLocaleString()} NC paid</span>
                <span>{project.total_budget_nc.toLocaleString()} NC budget</span>
              </div>
            </section>
          )}

          {/* Client payment */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">Client Payment</h2>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Expected</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">{project.client_payment_amount ?? "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium">Status</p>
                <button onClick={togglePaymentReceived}
                  className={`h-9 rounded-lg border px-4 text-sm font-semibold flex items-center gap-2 transition-colors ${
                    project.client_payment_received
                      ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  }`}>
                  {project.client_payment_received
                    ? <><CheckCircle2 className="h-4 w-4" /> Received</>
                    : <><Clock className="h-4 w-4" /> Mark Received</>}
                </button>
                {project.client_payment_received_at && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">on {fmt(project.client_payment_received_at)}</p>
                )}
              </div>
            </div>
          </section>

          {/* Payment timeline */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">Payment Timeline</h2>
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {[
                { label: "Project Started",   date: project.start_date,                   done: !!project.start_date },
                { label: "Work Submitted",    date: null,                                  done: project.nc_paid > 0 },
                { label: "Client Review",     date: null,                                  done: project.status === "under_review" || project.status === "completed" },
                { label: "Payment Expected",  date: null,                                  done: project.status === "completed" },
                { label: "Payment Received",  date: project.client_payment_received_at,   done: project.client_payment_received },
              ].map((step, i, arr) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                      step.done ? "border-[var(--brand-500)] bg-[var(--brand-500)]" : "border-[var(--border-default)] bg-[var(--surface-subtle)]"
                    }`}>
                      {step.done
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : <div className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />}
                    </div>
                    <p className="text-[10px] text-center text-[var(--text-muted)] leading-tight px-1">{step.label}</p>
                    {step.date && <p className="text-[10px] text-[var(--brand-500)]">{fmt(step.date)}</p>}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 w-8 flex-shrink-0 ${step.done ? "bg-[var(--brand-500)]" : "bg-[var(--border-default)]"}`} />
                  )}
                </div>
              ))}
            </div>
            {project.payment_timeline && (
              <p className="text-sm text-[var(--text-secondary)] border-t border-[var(--border-default)] pt-3">
                <span className="font-semibold text-[var(--text-primary)]">Agreed timeline:</span> {project.payment_timeline}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
