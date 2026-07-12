"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, FolderOpen, CheckCircle2, Clock, CreditCard,
  ClipboardList, BarChart2, Plus, Trash2, ExternalLink, Download,
  Eye, Pencil, AlertCircle, Save, Upload, X, FileText, Calendar,
  ChevronLeft, ChevronRight, Layers,
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
  client_payment_amount: string | null; client_payment_inr: number | null;
  client_payment_received: boolean; client_payment_received_at: string | null;
  internal_notes: string | null; created_at: string; updated_at: string | null;
  task_count: number; nc_paid: number; nexleader_commission: number;
  platform_cut: number; net_contributor_payout: number;
  // Daily target fields
  is_daily_target: boolean | null;
  daily_quota: number | null;
  daily_unit_name: string | null;
  file_delivery_method: string | null;
}

interface DailyWorkItem {
  id: string;
  contributor_id: string | null;
  assigned_date: string;
  file_url: string | null;
  file_name: string | null;
  status: string;
  submission_content: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  coins_awarded: number | null;
  feedback: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
  tasks: { title: string; pay_per_unit_nc: number | null } | null;
}

interface ProjectTask {
  id: string; title: string; task_type: string | null; status: string;
  pay_per_task_inr: number | null;
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

interface ImportPreviewRow {
  rowNum: number;
  submissionId: string;
  contributor: string | null;
  task: string | null;
  currentStatus: string | null;
  clientStatus: "valid" | "invalid" | "unrecognized";
  reason: string | null;
  found: boolean;
}

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
  const id           = params.id as string;
  const allowed      = usePageGuard(ADMIN_ROLES.REVIEW);

  const tokenRef = useRef<string | null>(null);
  const [tab, setTab]               = useState<"overview" | "tasks" | "submissions" | "financials" | "daily">(
    (searchParams.get("tab") as "overview" | "tasks" | "submissions" | "financials" | "daily") ?? "overview"
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
  const [editBudgetNC, setEditBudgetNC]               = useState("");
  const [editClientPayment, setEditClientPayment]     = useState("");
  const [editClientPaymentInr, setEditClientPaymentInr] = useState("");
  const [editInternalNotes, setEditInternalNotes]     = useState("");
  const [nexcoinPerInr, setNexcoinPerInr]             = useState(12.5);

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

  // Import Client Validation modal
  const [importOpen, setImportOpen]               = useState(false);
  const [importStep, setImportStep]               = useState<"upload" | "map" | "preview" | "done">("upload");
  const [importCsvText, setImportCsvText]         = useState("");
  const [importHeaders, setImportHeaders]         = useState<string[]>([]);
  const [importIdCol, setImportIdCol]             = useState("");
  const [importStatusCol, setImportStatusCol]     = useState("");
  const [importReasonCol, setImportReasonCol]     = useState("");
  const [importValidVal, setImportValidVal]       = useState("valid");
  const [importInvalidVal, setImportInvalidVal]   = useState("invalid");
  const [importPreview, setImportPreview]         = useState<{
    rows: ImportPreviewRow[]; valid: number; invalid: number; notFound: number; unrecognized: number;
  } | null>(null);
  const [importLoading, setImportLoading]         = useState(false);
  const [importError, setImportError]             = useState<string | null>(null);
  const [importResult, setImportResult]           = useState<{
    approved: number; rejected: number; skipped: number; errors: number;
  } | null>(null);

  // Daily target project settings
  const [editIsDailyTarget, setEditIsDailyTarget]   = useState(false);
  const [editDailyQuota, setEditDailyQuota]         = useState("");
  const [editDailyUnitName, setEditDailyUnitName]   = useState("");
  const [editFileDelivery, setEditFileDelivery]     = useState<"admin_upload" | "pool">("admin_upload");

  // Daily Work tab
  const [dailyDate, setDailyDate]         = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  const [dailyItems, setDailyItems]       = useState<DailyWorkItem[]>([]);
  const [dailyLoading, setDailyLoading]   = useState(false);
  const [dailyError, setDailyError]       = useState<string | null>(null);
  const [uploadFilesOpen, setUploadFilesOpen] = useState(false);
  const [uploadRawUrls, setUploadRawUrls]   = useState("");
  const [uploadTaskId, setUploadTaskId]     = useState("");
  const [uploadLoading, setUploadLoading]   = useState(false);
  const [uploadError, setUploadError]       = useState<string | null>(null);
  const [reviewItemId, setReviewItemId]     = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewing, setReviewing]           = useState(false);

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
    setEditClientPaymentInr(p.client_payment_inr != null ? String(p.client_payment_inr) : "");
    setEditInternalNotes(p.internal_notes ?? "");
    setEditIsDailyTarget(p.is_daily_target ?? false);
    setEditDailyQuota(p.daily_quota != null ? String(p.daily_quota) : "");
    setEditDailyUnitName(p.daily_unit_name ?? "");
    setEditFileDelivery((p.file_delivery_method ?? "admin_upload") as "admin_upload" | "pool");
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.from("platform_settings").select("value").eq("key", "nexcoin_per_inr").single()
      .then(({ data }) => { if (data?.value) setNexcoinPerInr(parseFloat(data.value as string)); });
  }, []);

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
        client_payment_inr: editClientPaymentInr ? parseFloat(editClientPaymentInr) : null,
        internal_notes: editInternalNotes || null,
        is_daily_target: editIsDailyTarget,
        daily_quota: editIsDailyTarget && editDailyQuota ? parseInt(editDailyQuota) : null,
        daily_unit_name: editIsDailyTarget ? (editDailyUnitName || null) : null,
        file_delivery_method: editIsDailyTarget ? editFileDelivery : null,
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
    if (tab === "daily") loadDailyItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, subStatusFilter, subTaskFilter]);

  // ── Import CSV helpers ──────────────────────────────────────────────────────
  function parseCSVHeaders(text: string): string[] {
    const firstLine = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")[0] ?? "";
    if (!firstLine.trim()) return [];
    const headers: string[] = [];
    let inQuotes = false, field = "";
    for (let i = 0; i < firstLine.length; i++) {
      const ch = firstLine[i];
      if (ch === '"') {
        if (inQuotes && firstLine[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === "," && !inQuotes) { headers.push(field.trim()); field = ""; }
      else { field += ch; }
    }
    headers.push(field.trim());
    return headers;
  }

  function resetImport() {
    setImportStep("upload"); setImportCsvText(""); setImportHeaders([]);
    setImportIdCol(""); setImportStatusCol(""); setImportReasonCol("");
    setImportValidVal("valid"); setImportInvalidVal("invalid");
    setImportPreview(null); setImportError(null); setImportResult(null); setImportLoading(false);
  }

  function openImport() { resetImport(); setImportOpen(true); }

  function handleCSVLoad(text: string) {
    setImportCsvText(text);
    const hdrs = parseCSVHeaders(text);
    if (hdrs.length === 0) { setImportError("Could not detect CSV headers. Make sure the file has a header row."); return; }
    setImportHeaders(hdrs);
    setImportIdCol(hdrs[0] ?? "");
    setImportStatusCol(hdrs[1] ?? "");
    setImportReasonCol("");
    setImportError(null);
    setImportStep("map");
  }

  async function runPreview() {
    if (!importIdCol || !importStatusCol) { setImportError("Submission ID column and Status column are required."); return; }
    setImportLoading(true); setImportError(null);
    const res = await fetch(`/api/admin/projects/${id}/bulk-validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        action: "preview",
        csvText: importCsvText,
        submissionIdCol: importIdCol,
        statusCol: importStatusCol,
        reasonCol: importReasonCol || null,
        validValue: importValidVal,
        invalidValue: importInvalidVal,
      }),
    });
    const data = await res.json() as { rows?: ImportPreviewRow[]; valid?: number; invalid?: number; notFound?: number; unrecognized?: number; error?: string };
    if (!res.ok || data.error) { setImportError(data.error ?? "Preview failed."); setImportLoading(false); return; }
    setImportPreview({ rows: data.rows ?? [], valid: data.valid ?? 0, invalid: data.invalid ?? 0, notFound: data.notFound ?? 0, unrecognized: data.unrecognized ?? 0 });
    setImportStep("preview");
    setImportLoading(false);
  }

  async function applyValidation() {
    setImportLoading(true); setImportError(null);
    const res = await fetch(`/api/admin/projects/${id}/bulk-validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        action: "apply",
        csvText: importCsvText,
        submissionIdCol: importIdCol,
        statusCol: importStatusCol,
        reasonCol: importReasonCol || null,
        validValue: importValidVal,
        invalidValue: importInvalidVal,
      }),
    });
    const data = await res.json() as { approved?: number; rejected?: number; skipped?: number; errors?: number; error?: string };
    if (!res.ok || data.error) { setImportError(data.error ?? "Apply failed."); setImportLoading(false); return; }
    setImportResult({ approved: data.approved ?? 0, rejected: data.rejected ?? 0, skipped: data.skipped ?? 0, errors: data.errors ?? 0 });
    setImportStep("done");
    setImportLoading(false);
    loadSubmissions();
  }

  // ── Daily Work helpers ──────────────────────────────────────────────────────
  async function loadDailyItems(date?: string) {
    setDailyLoading(true); setDailyError(null);
    const d = date ?? dailyDate;
    const res = await fetch(`/api/admin/projects/${id}/daily-items?date=${d}`, {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    const data = await res.json() as { items?: DailyWorkItem[]; error?: string };
    if (!res.ok || data.error) { setDailyError(data.error ?? "Failed to load items."); setDailyLoading(false); return; }
    setDailyItems(data.items ?? []);
    setDailyLoading(false);
  }

  function shiftDate(delta: number) {
    const d = new Date(dailyDate + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const next = d.toLocaleDateString("en-CA");
    setDailyDate(next);
    loadDailyItems(next);
  }

  async function uploadFilesForDay() {
    const lines = uploadRawUrls.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) { setUploadError("Enter at least one file URL."); return; }
    if (!uploadTaskId) { setUploadError("Select a task."); return; }
    setUploadLoading(true); setUploadError(null);
    const fileEntries = lines.map((l) => {
      const parts = l.split("|");
      return { url: (parts[0] ?? "").trim(), name: (parts[1] ?? parts[0] ?? "").trim() };
    });
    const res = await fetch(`/api/admin/projects/${id}/daily-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ date: dailyDate, taskId: uploadTaskId, fileEntries, deliveryMethod: project?.file_delivery_method ?? "admin_upload" }),
    });
    const data = await res.json() as { ok?: boolean; created?: number; error?: string };
    if (!res.ok || data.error) { setUploadError(data.error ?? "Upload failed."); setUploadLoading(false); return; }
    setUploadFilesOpen(false); setUploadRawUrls(""); setUploadLoading(false);
    loadDailyItems();
  }

  async function reviewDailyItem(itemId: string, action: "approve" | "reject") {
    setReviewing(true);
    const res = await fetch(`/api/admin/daily-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ action, feedback: reviewFeedback || undefined }),
    });
    if (res.ok) { setReviewItemId(null); setReviewFeedback(""); loadDailyItems(); }
    setReviewing(false);
  }

  async function bulkApproveAll() {
    setDailyLoading(true);
    const res = await fetch(`/api/admin/projects/${id}/daily-items/bulk-approve?date=${dailyDate}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (res.ok) loadDailyItems();
    else setDailyLoading(false);
  }

  function exportDailyCSV() {
    const header = ["Contributor", "Email", "File", "Status", "Submitted At", "Coins", "Submission"];
    const rows = dailyItems.map((item) => [
      item.profiles?.full_name ?? "Unknown",
      item.profiles?.email ?? "—",
      item.file_name ?? item.file_url ?? "—",
      item.status,
      item.submitted_at ? new Date(item.submitted_at).toLocaleString("en-IN") : "—",
      item.coins_awarded ?? 0,
      (item.submission_content ?? "").replace(/"/g, '""'),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `daily_work_${dailyDate}.csv`; a.click();
  }

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
    { id: "overview",    label: "Overview",    icon: <FolderOpen className="h-4 w-4" /> },
    { id: "tasks",       label: "Tasks",       icon: <ClipboardList className="h-4 w-4" /> },
    { id: "submissions", label: "Submissions", icon: <Eye className="h-4 w-4" /> },
    { id: "financials",  label: "Financials",  icon: <BarChart2 className="h-4 w-4" /> },
    ...(project.is_daily_target ? [{ id: "daily", label: "Daily Work", icon: <Calendar className="h-4 w-4" /> }] : []),
  ] as { id: string; label: string; icon: React.ReactNode }[];

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
          <button key={t.id} onClick={() => setTab(t.id as "overview" | "tasks" | "submissions" | "financials" | "daily")}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={lc}>Amount (display text)</label>
                <input type="text" value={editClientPayment}
                  onChange={(e) => setEditClientPayment(e.target.value)}
                  placeholder="e.g. $70 USD" className={ic} />
                <p className="text-xs text-[var(--text-muted)] mt-1">Free text — shown as-is</p>
              </div>
              <div>
                <label className={lc}>Amount in ₹ INR</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] pointer-events-none select-none">₹</span>
                  <input type="number" min="0" step="0.01" value={editClientPaymentInr}
                    onChange={(e) => setEditClientPaymentInr(e.target.value)}
                    placeholder="e.g. 5800" className={`${ic} pl-7`} />
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">Used for margin calculation</p>
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

          {/* Daily target project settings */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--brand-500)]" />
                <h2 className="font-bold text-[var(--text-primary)]">Daily Target Project</h2>
              </div>
              <Button size="sm" disabled={saving} onClick={saveOverview}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save</>}
              </Button>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setEditIsDailyTarget((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${editIsDailyTarget ? "bg-[var(--brand-500)]" : "bg-[var(--border-default)]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${editIsDailyTarget ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">Enable daily quota system</span>
            </label>
            {editIsDailyTarget && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className={lc}>Daily quota per contributor</label>
                  <input type="number" min="1" value={editDailyQuota} onChange={(e) => setEditDailyQuota(e.target.value)} className={ic} placeholder="10" />
                </div>
                <div>
                  <label className={lc}>Unit name</label>
                  <input type="text" value={editDailyUnitName} onChange={(e) => setEditDailyUnitName(e.target.value)} className={ic} placeholder="e.g. QC item, recording" />
                </div>
                <div>
                  <label className={lc}>File delivery method</label>
                  <select value={editFileDelivery} onChange={(e) => setEditFileDelivery(e.target.value as "admin_upload" | "pool")} className={ic}>
                    <option value="admin_upload">Admin uploads files daily</option>
                    <option value="pool">Contributor fetches from pool</option>
                  </select>
                </div>
              </div>
            )}
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
            <Button variant="secondary" size="sm" onClick={openImport}>
              <Upload className="h-3.5 w-3.5" /> Import Client Validation
            </Button>
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

      {/* ── TAB: Daily Work ────────────────────────────────────────────────── */}
      {tab === "daily" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date nav */}
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-1 py-0.5">
              <button onClick={() => shiftDate(-1)} className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date" value={dailyDate}
                onChange={(e) => { setDailyDate(e.target.value); loadDailyItems(e.target.value); }}
                className="bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none px-1"
              />
              <button onClick={() => shiftDate(1)} className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1" />
            {project.file_delivery_method !== "pool" && (
              <Button size="sm" onClick={() => { setUploadFilesOpen(true); setUploadError(null); setUploadRawUrls(""); }}>
                <Upload className="h-3.5 w-3.5" /> Upload Today&apos;s Files
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={bulkApproveAll}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Bulk Approve All
            </Button>
            <Button variant="secondary" size="sm" onClick={exportDailyCSV}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>

          {/* Stats pills */}
          {dailyItems.length > 0 && (
            <div className="flex gap-3 flex-wrap text-sm">
              {[
                { label: "Total", val: dailyItems.length, cls: "text-[var(--text-primary)]" },
                { label: "Submitted", val: dailyItems.filter(i => i.status === "submitted").length, cls: "text-amber-400" },
                { label: "Approved", val: dailyItems.filter(i => i.status === "approved").length, cls: "text-green-400" },
                { label: "Pending", val: dailyItems.filter(i => i.status === "pending").length, cls: "text-[var(--text-muted)]" },
                { label: "Rejected", val: dailyItems.filter(i => i.status === "rejected").length, cls: "text-red-400" },
              ].map((s) => (
                <span key={s.label} className={`font-semibold ${s.cls}`}>{s.val} {s.label}</span>
              ))}
            </div>
          )}

          {dailyError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {dailyError}
            </div>
          )}

          {dailyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand-500)]" /></div>
          ) : dailyItems.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-14 text-center">
              <Calendar className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">No work items for {dailyDate}.</p>
              {project.file_delivery_method !== "pool" && (
                <Button size="sm" className="mt-4" onClick={() => setUploadFilesOpen(true)}>
                  <Upload className="h-3.5 w-3.5" /> Upload Files
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                    {["Contributor", "File", "Status", "Submission", "Coins", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {dailyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text-primary)]">{item.profiles?.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.profiles?.email ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {item.file_url
                          ? <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-[var(--brand-500)] hover:underline text-xs truncate block">
                              {item.file_name ?? item.file_url}
                            </a>
                          : <span className="text-[var(--text-muted)] text-xs">{item.file_name ?? "—"}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                          item.status === "approved" ? "bg-green-500/10 text-green-400"
                          : item.status === "rejected" ? "bg-red-500/10 text-red-400"
                          : item.status === "submitted" ? "bg-amber-500/10 text-amber-400"
                          : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                        }`}>{item.status}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {item.submission_content
                          ? <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                              {item.submission_content.slice(0, 120)}{item.submission_content.length > 120 ? "…" : ""}
                            </p>
                          : <span className="text-[var(--text-muted)] text-xs italic">No submission yet</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.coins_awarded != null
                          ? <span className="flex items-center gap-1 text-amber-400 text-xs font-medium"><NexCoinIcon size={12} />{item.coins_awarded}</span>
                          : <span className="text-[var(--text-muted)] text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.status === "pending" || item.status === "submitted" ? (
                          reviewItemId === item.id ? (
                            <div className="flex flex-col gap-1.5 min-w-[160px]">
                              <input
                                type="text" value={reviewFeedback}
                                onChange={(e) => setReviewFeedback(e.target.value)}
                                placeholder="Feedback (optional)" className={`${ic} h-7 text-xs`}
                              />
                              <div className="flex gap-1">
                                <button onClick={() => reviewDailyItem(item.id, "approve")} disabled={reviewing}
                                  className="flex-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs py-1 font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50">
                                  {reviewing ? "…" : "Approve"}
                                </button>
                                <button onClick={() => reviewDailyItem(item.id, "reject")} disabled={reviewing}
                                  className="flex-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-1 font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                  {reviewing ? "…" : "Reject"}
                                </button>
                                <button onClick={() => { setReviewItemId(null); setReviewFeedback(""); }}
                                  className="rounded-md border border-[var(--border-default)] text-[var(--text-muted)] text-xs px-2 py-1 hover:bg-[var(--surface-subtle)]">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => { setReviewItemId(item.id); setReviewFeedback(""); }}>
                              Review
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            {item.reviewed_at ? fmt(item.reviewed_at) : "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Upload Files Modal */}
          {uploadFilesOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
                  <h3 className="font-bold text-[var(--text-primary)]">Upload Files for {dailyDate}</h3>
                  <button onClick={() => setUploadFilesOpen(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {uploadError && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" /> {uploadError}
                    </div>
                  )}
                  <div>
                    <label className={lc}>Task</label>
                    <select value={uploadTaskId} onChange={(e) => setUploadTaskId(e.target.value)} className={ic}>
                      <option value="">Select task…</option>
                      {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lc}>File URLs <span className="font-normal text-[var(--text-muted)]">(one per line)</span></label>
                    <textarea
                      rows={6} value={uploadRawUrls}
                      onChange={(e) => setUploadRawUrls(e.target.value)}
                      placeholder={"https://example.com/file1.wav\nhttps://example.com/file2.wav\n\nOptional: add | display name after URL:\nhttps://example.com/file3.wav | recording-001.wav"}
                      className={tc}
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Files will be assigned round-robin to active contributors. Format: <code>URL</code> or <code>URL | display name</code>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setUploadFilesOpen(false)}>Cancel</Button>
                    <Button disabled={uploadLoading} onClick={uploadFilesForDay}>
                      {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-3.5 w-3.5" /> Upload & Assign</>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Financials ─────────────────────────────────────────────────── */}
      {tab === "financials" && (() => {
        // Auto-calculate budget from linked tasks
        const totalSlots      = tasks.reduce((s, t) => s + (t.total_slots ?? 0), 0);
        const potentialNc     = tasks.reduce((s, t) => s + (t.pay_per_task ?? 0) * (t.total_slots ?? 0), 0);
        const approvedCount   = tasks.reduce((s, t) => s + t.approved_count, 0);
        const paidNc          = project.nc_paid;
        const remainingNc     = Math.max(0, potentialNc - paidNc);
        const budgetPct       = potentialNc > 0 ? Math.min(100, Math.round((paidNc / potentialNc) * 100)) : 0;
        const potentialInr    = Math.round(potentialNc / nexcoinPerInr);
        const paidInr         = Math.round(paidNc / nexcoinPerInr);
        const remainingInr    = Math.round(remainingNc / nexcoinPerInr);

        // Margin calculation
        const clientInr       = project.client_payment_inr ?? 0;
        const marginInr       = clientInr > 0 ? clientInr - paidInr : null;
        const marginPct       = clientInr > 0 && paidInr > 0 ? Math.round((marginInr! / clientInr) * 100) : null;

        return (
          <div className="space-y-5">
            {/* Project Budget (auto-sum from tasks) */}
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h2 className="font-bold text-[var(--text-primary)]">Project Budget</h2>
                <span className="text-xs text-[var(--text-muted)] ml-auto">auto-calculated from {tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Potential total (all slots filled)", nc: potentialNc, inr: potentialInr, slots: `${tasks.length} tasks · ${totalSlots} slots`, cls: "text-[var(--text-primary)]" },
                  { label: "Paid out so far", nc: paidNc, inr: paidInr, slots: `${approvedCount} approved submissions`, cls: "text-amber-400" },
                  { label: "Remaining budget", nc: remainingNc, inr: remainingInr, slots: "", cls: remainingNc > 0 ? "text-green-400" : "text-[var(--text-muted)]" },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4 space-y-1.5">
                    <p className="text-xs text-[var(--text-muted)] font-medium">{row.label}</p>
                    <p className={`text-xl font-bold flex items-center gap-1 ${row.cls}`}>
                      <NexCoinIcon size={16} /> {row.nc.toLocaleString()} NC
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">≈ ₹{row.inr.toLocaleString("en-IN")}</p>
                    {row.slots && <p className="text-[10px] text-[var(--text-muted)]">{row.slots}</p>}
                  </div>
                ))}
              </div>

              {potentialNc > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>Budget used</span>
                    <span className="font-semibold text-[var(--text-primary)]">{budgetPct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--brand-500)] transition-all duration-700" style={{ width: `${budgetPct}%` }} />
                  </div>
                </div>
              )}
            </section>

            {/* NC Breakdown */}
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)]">Paid NC Breakdown</h2>
              {[
                { label: "Total NC Paid to Contributors",   value: project.nc_paid,                 cls: "text-[var(--text-primary)]" },
                { label: "NexLeader Commissions (10%)",     value: project.nexleader_commission,     cls: "text-amber-400" },
                { label: "Platform Cut (24%)",              value: project.platform_cut,             cls: "text-amber-400" },
                { label: "Net Contributor Payouts (66%)",   value: project.net_contributor_payout,   cls: "text-green-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)] last:border-0">
                  <span className="text-sm text-[var(--text-secondary)]">{row.label}</span>
                  <span className={`flex items-center gap-1 font-bold text-sm ${row.cls}`}>
                    <NexCoinIcon size={13} /> {row.value.toLocaleString()} NC
                  </span>
                </div>
              ))}
            </section>

            {/* Client payment + margin */}
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)]">Client Payment & Margin</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Amount (display)</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{project.client_payment_amount ?? "—"}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Free-text e.g. "$70 USD" (set in Overview)</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] font-medium mb-1">Amount in ₹ INR (for margin calc)</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {clientInr > 0 ? `₹${clientInr.toLocaleString("en-IN")}` : "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Set in Overview → Client Payment</p>
                </div>
              </div>

              {marginInr !== null && (
                <div className={`rounded-xl p-4 border ${marginInr >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Estimated Margin</p>
                  <p className={`text-2xl font-bold ${marginInr >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {marginInr >= 0 ? "+" : ""}₹{marginInr.toLocaleString("en-IN")}
                    {marginPct !== null && <span className="text-sm font-normal ml-2">({marginPct}%)</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    ₹{clientInr.toLocaleString("en-IN")} client − ₹{paidInr.toLocaleString("en-IN")} paid out (at {nexcoinPerInr} NC/₹)
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap pt-1">
                <button onClick={togglePaymentReceived}
                  className={`h-9 rounded-lg border px-4 text-sm font-semibold flex items-center gap-2 transition-colors ${
                    project.client_payment_received
                      ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                  }`}>
                  {project.client_payment_received
                    ? <><CheckCircle2 className="h-4 w-4" /> Payment Received</>
                    : <><Clock className="h-4 w-4" /> Mark as Received</>}
                </button>
                {project.client_payment_received_at && (
                  <p className="text-xs text-[var(--text-muted)]">on {fmt(project.client_payment_received_at)}</p>
                )}
              </div>
            </section>

            {/* Payment timeline */}
            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)]">Payment Timeline</h2>
              <div className="flex items-center overflow-x-auto pb-2">
                {[
                  { label: "Project Started",  date: project.start_date,                 done: !!project.start_date },
                  { label: "Work Submitted",   date: null,                               done: project.nc_paid > 0 },
                  { label: "Client Review",    date: null,                               done: project.status === "under_review" || project.status === "completed" },
                  { label: "Payment Expected", date: null,                               done: project.status === "completed" },
                  { label: "Payment Received", date: project.client_payment_received_at, done: project.client_payment_received },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                        step.done ? "border-[var(--brand-500)] bg-[var(--brand-500)]" : "border-[var(--border-default)] bg-[var(--surface-subtle)]"
                      }`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className="h-2 w-2 rounded-full bg-[var(--text-muted)]" />}
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
        );
      })()}

      {/* ── Import Client Validation Modal ──────────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--brand-500)]" />
                <h2 className="font-bold text-[var(--text-primary)]">Import Client Validation</h2>
              </div>
              <button onClick={() => setImportOpen(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 px-6 pt-4 pb-2">
              {(["upload", "map", "preview", "done"] as const).map((s, i) => {
                const stepIdx = ["upload", "map", "preview", "done"].indexOf(importStep);
                const thisIdx = i;
                const done    = stepIdx > thisIdx;
                const active  = stepIdx === thisIdx;
                return (
                  <div key={s} className="flex items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      active ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-white"
                      : done  ? "border-[var(--brand-500)] bg-[var(--brand-500)]/10 text-[var(--brand-500)]"
                      :         "border-[var(--border-default)] text-[var(--text-muted)]"
                    }`}>{i + 1}</div>
                    {i < 3 && <div className={`h-0.5 w-8 ${done ? "bg-[var(--brand-500)]" : "bg-[var(--border-default)]"}`} />}
                  </div>
                );
              })}
              <div className="ml-3 flex gap-4 text-xs text-[var(--text-muted)]">
                {(["Upload CSV", "Map Columns", "Preview", "Done"] as const).map((label, i) => (
                  <span key={label} className={i === ["upload","map","preview","done"].indexOf(importStep) ? "text-[var(--brand-500)] font-semibold" : ""}>{label}</span>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {importError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {importError}
                </div>
              )}

              {/* ── Step: Upload ─────────────────────────────────────────────── */}
              {importStep === "upload" && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Upload the client&apos;s CSV file. It must have a header row with at least a submission ID column and a valid/invalid status column.
                  </p>
                  <label className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] py-10 cursor-pointer hover:border-[var(--brand-500)] transition-colors">
                    <Upload className="h-8 w-8 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">Click to upload CSV file</span>
                    <span className="text-xs text-[var(--text-muted)]">.csv files only</span>
                    <input
                      type="file" accept=".csv,text/csv" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => handleCSVLoad(ev.target?.result as string ?? "");
                        reader.readAsText(file, "utf-8");
                      }}
                    />
                  </label>
                  <div className="relative flex items-center">
                    <div className="flex-1 h-px bg-[var(--border-default)]" />
                    <span className="mx-3 text-xs text-[var(--text-muted)]">or paste CSV</span>
                    <div className="flex-1 h-px bg-[var(--border-default)]" />
                  </div>
                  <div>
                    <label className={lc}>Paste CSV text</label>
                    <textarea
                      rows={5} className={tc}
                      placeholder={"submission_id,status,reason\nabc-123,valid,\ndef-456,invalid,Wrong recording"}
                      value={importCsvText}
                      onChange={(e) => setImportCsvText(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => {
                    if (importCsvText.trim()) handleCSVLoad(importCsvText);
                    else setImportError("Paste CSV text or upload a file.");
                  }}>
                    Parse Headers →
                  </Button>
                </div>
              )}

              {/* ── Step: Map ───────────────────────────────────────────────── */}
              {importStep === "map" && (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--text-secondary)]">Map the CSV columns to the fields NexGuild needs.</p>
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2 text-xs text-[var(--text-muted)]">
                    Detected {importHeaders.length} column{importHeaders.length !== 1 ? "s" : ""}: {importHeaders.join(", ")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={lc}>Submission ID column <span className="text-red-400">*</span></label>
                      <select value={importIdCol} onChange={(e) => setImportIdCol(e.target.value)} className={ic}>
                        {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lc}>Status column <span className="text-red-400">*</span></label>
                      <select value={importStatusCol} onChange={(e) => setImportStatusCol(e.target.value)} className={ic}>
                        {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lc}>Reason column <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
                      <select value={importReasonCol} onChange={(e) => setImportReasonCol(e.target.value)} className={ic}>
                        <option value="">— none —</option>
                        {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={lc}>Value meaning &ldquo;Valid&rdquo;</label>
                      <input type="text" value={importValidVal} onChange={(e) => setImportValidVal(e.target.value)} className={ic} placeholder="valid" />
                      <p className="text-xs text-[var(--text-muted)] mt-1">Case-insensitive match</p>
                    </div>
                    <div>
                      <label className={lc}>Value meaning &ldquo;Invalid&rdquo;</label>
                      <input type="text" value={importInvalidVal} onChange={(e) => setImportInvalidVal(e.target.value)} className={ic} placeholder="invalid" />
                      <p className="text-xs text-[var(--text-muted)] mt-1">Case-insensitive match</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setImportStep("upload")}>← Back</Button>
                    <Button disabled={importLoading} onClick={runPreview}>
                      {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview →"}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step: Preview ─────────────────────────────────────────────── */}
              {importStep === "preview" && importPreview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Will approve", value: importPreview.valid,        cls: "text-green-400 border-green-500/20 bg-green-500/5" },
                      { label: "Will reject",  value: importPreview.invalid,      cls: "text-red-400 border-red-500/20 bg-red-500/5" },
                      { label: "Not found",    value: importPreview.notFound,     cls: "text-[var(--text-muted)] border-[var(--border-default)] bg-[var(--surface-subtle)]" },
                      { label: "Unrecognized", value: importPreview.unrecognized, cls: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl border px-3 py-2.5 text-center ${s.cls}`}>
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-[10px] font-medium leading-tight mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[var(--border-default)] overflow-x-auto max-h-60">
                    <table className="w-full text-xs min-w-[560px]">
                      <thead className="sticky top-0 bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                        <tr>
                          {["Row", "Submission ID", "Contributor", "Task", "Current", "Action", "Reason"].map((h) => (
                            <th key={h} className="text-left px-3 py-2 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-default)]">
                        {importPreview.rows.map((row) => (
                          <tr key={`${row.rowNum}-${row.submissionId}`} className={`${!row.found ? "opacity-50" : ""} hover:bg-[var(--surface-subtle)]`}>
                            <td className="px-3 py-2 text-[var(--text-muted)]">{row.rowNum}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-[var(--text-secondary)] max-w-[90px] truncate">{row.submissionId}</td>
                            <td className="px-3 py-2 text-[var(--text-primary)]">{row.contributor ?? <span className="italic text-[var(--text-muted)]">not found</span>}</td>
                            <td className="px-3 py-2 text-[var(--text-secondary)] max-w-[120px] truncate">{row.task ?? "—"}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                                row.currentStatus === "approved" ? "bg-green-500/10 text-green-400"
                                : row.currentStatus === "rejected" ? "bg-red-500/10 text-red-400"
                                : "bg-amber-500/10 text-amber-400"
                              }`}>{row.currentStatus ?? "—"}</span>
                            </td>
                            <td className="px-3 py-2">
                              {!row.found
                                ? <span className="text-[var(--text-muted)] italic">skip</span>
                                : row.clientStatus === "valid"
                                ? <span className="text-green-400 font-semibold">Approve</span>
                                : row.clientStatus === "invalid"
                                ? <span className="text-red-400 font-semibold">Reject</span>
                                : <span className="text-amber-400 italic">skip</span>}
                            </td>
                            <td className="px-3 py-2 text-[var(--text-muted)] max-w-[120px] truncate">{row.reason ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setImportStep("map")}>← Back</Button>
                    <Button
                      disabled={importLoading || (importPreview.valid === 0 && importPreview.invalid === 0)}
                      onClick={applyValidation}
                      className="bg-[var(--brand-500)] hover:brightness-105 text-white">
                      {importLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : `Apply Validation (${importPreview.valid + importPreview.invalid} submissions)`}
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step: Done ────────────────────────────────────────────────── */}
              {importStep === "done" && importResult && (
                <div className="space-y-4 text-center py-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] text-lg">Validation Applied</h3>
                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-sm">
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
                      <p className="text-2xl font-bold text-green-400">{importResult.approved}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Approved + Credited</p>
                    </div>
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                      <p className="text-2xl font-bold text-red-400">{importResult.rejected}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Rejected</p>
                    </div>
                    {importResult.skipped > 0 && (
                      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3 col-span-2">
                        <p className="text-xl font-bold text-[var(--text-muted)]">{importResult.skipped}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Skipped (not found / unrecognized)</p>
                      </div>
                    )}
                    {importResult.errors > 0 && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 col-span-2">
                        <p className="text-xl font-bold text-amber-400">{importResult.errors}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Errors (check logs)</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button variant="secondary" onClick={resetImport}>Import Another File</Button>
                    <Button onClick={() => setImportOpen(false)}>Close</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
