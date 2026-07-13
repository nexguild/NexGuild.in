"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, FileText,
  ExternalLink, Users, Coins, Clock, Edit, Sheet, Copy, Lock,
  Upload, X, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  requirements: string | null;
  pay_per_task: number | null;
  total_slots: number | null;
  filled_slots: number | null;
  deadline: string | null;
  status: string;
  assignment_required: boolean;
  is_private: boolean | null;
  drive_folder_id: string | null;
  drive_sheet_id: string | null;
  steps: { title: string; submitType: string }[] | null;
  required_task_ids: string[] | null;
  excluded_task_ids: string[] | null;
  allows_partial_payment: boolean | null;
  unit_name: string | null;
  total_units: number | null;
  pay_per_unit_nc: number | null;
}

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

interface FileItem {
  name: string;
  url: string;
  size: number;
}

interface Submission {
  id: string;
  contributor_id: string;
  status: string;
  notes: string | null;
  files: FileItem[] | null;
  coins_awarded: number | null;
  feedback: string | null;
  submitted_at: string;
  valid_units: number | null;
  partial_payment_nc: number | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_BADGE: Record<string, string> = {
  in_progress: "bg-blue-500/10 text-blue-400",
  submitted:   "bg-yellow-500/10 text-yellow-400",
  approved:    "bg-green-500/10 text-green-400",
  rejected:    "bg-red-500/10 text-red-400",
};

export default function AdminTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const allowed = usePageGuard(ADMIN_ROLES.CONTENT);

  const [task, setTask]               = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [token, setToken]             = useState<string | null>(null);
  const [feedbacks, setFeedbacks]     = useState<Record<string, string>>({});
  const [reviewing, setReviewing]     = useState<string | null>(null);
  const [coinsMap, setCoinsMap]       = useState<Record<string, string>>({});
  const [copiedLink, setCopiedLink]     = useState(false);
  const [eligNames, setEligNames]       = useState<Record<string, string>>({});
  const [validUnitsMap, setValidUnitsMap] = useState<Record<string, string>>({});

  // Import Client Validation modal
  const [importOpen, setImportOpen]             = useState(false);
  const [importStep, setImportStep]             = useState<"upload" | "map" | "preview" | "done">("upload");
  const [importCsvText, setImportCsvText]       = useState("");
  const [importHeaders, setImportHeaders]       = useState<string[]>([]);
  const [importIdCol, setImportIdCol]           = useState("");
  const [importStatusCol, setImportStatusCol]   = useState("");
  const [importReasonCol, setImportReasonCol]   = useState("");
  const [importValidVal, setImportValidVal]     = useState("valid");
  const [importInvalidVal, setImportInvalidVal] = useState("invalid");
  const [importPreview, setImportPreview]       = useState<{
    rows: ImportPreviewRow[]; valid: number; invalid: number; notFound: number; unrecognized: number;
  } | null>(null);
  const [importLoading, setImportLoading]       = useState(false);
  const [importError, setImportError]           = useState<string | null>(null);
  const [importResult, setImportResult]         = useState<{
    approved: number; rejected: number; skipped: number; errors: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }
      setToken(session.access_token);

      const [{ data: taskData }, { data: subData }] = await Promise.all([
        supabase.from("tasks").select("*").eq("id", id).single(),
        supabase.from("submissions")
          .select("id, contributor_id, status, notes, files, coins_awarded, feedback, submitted_at, valid_units, partial_payment_nc, profiles(full_name, email)")
          .eq("task_id", id)
          .order("submitted_at", { ascending: false }),
      ]);

      const t = taskData as Task;
      setTask(t);
      setSubmissions((subData as unknown as Submission[]) ?? []);

      // Resolve eligibility task names
      const allEligIds = [...(t.required_task_ids ?? []), ...(t.excluded_task_ids ?? [])];
      if (allEligIds.length > 0) {
        const { data: eligTasks } = await supabase
          .from("tasks").select("id, title").in("id", allEligIds);
        const nm: Record<string, string> = {};
        for (const et of (eligTasks ?? []) as { id: string; title: string }[]) nm[et.id] = et.title;
        setEligNames(nm);
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  async function review(submissionId: string, action: "approve" | "reject") {
    if (!token) return;
    setReviewing(submissionId);

    const feedback = feedbacks[submissionId]?.trim() || undefined;
    const coinsStr = coinsMap[submissionId];
    const coinsOverride = (task?.allows_partial_payment ? undefined : (coinsStr ? parseInt(coinsStr, 10) : undefined));
    const validUnitsStr = validUnitsMap[submissionId];
    const validUnits = (task?.allows_partial_payment && action === "approve" && validUnitsStr)
      ? parseInt(validUnitsStr, 10)
      : undefined;

    const res = await fetch("/api/admin/review-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId, action, feedback, coinsOverride, validUnits }),
    });

    if (res.ok) {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: action === "approve" ? "approved" : "rejected", feedback: feedback ?? s.feedback }
            : s
        )
      );
    }
    setReviewing(null);
  }

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

  function handleCSVLoad(text: string) {
    setImportCsvText(text);
    const hdrs = parseCSVHeaders(text);
    if (hdrs.length === 0) { setImportError("Could not detect CSV headers."); return; }
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
    const res = await fetch(`/api/admin/tasks/${id}/bulk-validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    const res = await fetch(`/api/admin/tasks/${id}/bulk-validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    // Reload submissions
    const { data: subData } = await supabase
      .from("submissions")
      .select("id, contributor_id, status, notes, files, coins_awarded, feedback, submitted_at, valid_units, partial_payment_nc, profiles(full_name, email)")
      .eq("task_id", id)
      .order("submitted_at", { ascending: false });
    setSubmissions((subData as unknown as Submission[]) ?? []);
  }

  function copyPrivateLink() {
    const url = `https://nexguild.in/dashboard/tasks/${id}/work`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Link href="/admin/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
        <p className="text-sm text-[var(--text-muted)]">Task not found.</p>
      </div>
    );
  }

  const pending = submissions.filter((s) => s.status === "submitted").length;

  if (!allowed) return null;
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/admin/tasks/${id}/edit`}><Edit className="h-4 w-4" /> Edit Task</Link>
        </Button>
      </div>

      {/* Task Info */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <span className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider">
            {task.task_type ?? "Task"}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            task.status === "active" ? "bg-green-500/10 text-green-400" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
          }`}>
            {task.status}
          </span>
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{task.title}</h1>
        {task.description && <p className="text-sm text-[var(--text-secondary)]">{task.description}</p>}

        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          {task.pay_per_task != null && (
            <span className="flex items-center gap-1.5 text-[var(--brand-500)] font-semibold">
              <Coins className="h-4 w-4" /> {task.pay_per_task} NexCoins
            </span>
          )}
          {task.total_slots != null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> {task.filled_slots ?? 0} / {task.total_slots} slots
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Deadline: {new Date(task.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {task.requirements && (
          <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-[var(--brand-500)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Requirements</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{task.requirements}</p>
          </div>
        )}

        {task.allows_partial_payment && (
          <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4 space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">⚡ Partial Payment Task</p>
            <p className="text-xs text-[var(--text-muted)]">
              {task.total_units} {task.unit_name ?? "units"} per submission ·
              {task.pay_per_unit_nc} NC per {task.unit_name ?? "unit"}
            </p>
          </div>
        )}

        {((task.required_task_ids ?? []).length > 0 || (task.excluded_task_ids ?? []).length > 0) && (
          <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Eligibility Rules</p>
            {(task.required_task_ids ?? []).map((rid) => (
              <p key={rid} className="text-sm text-emerald-400">
                ✅ Required: {eligNames[rid] ?? rid}
              </p>
            ))}
            {(task.excluded_task_ids ?? []).map((eid) => (
              <p key={eid} className="text-sm text-red-400">
                🚫 Excludes users who completed: {eligNames[eid] ?? eid}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Drive resources + Private link */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Submissions Sheet */}
          <div className="flex items-center gap-2">
            <Sheet className="h-4 w-4 text-[var(--text-muted)]" />
            {task.drive_sheet_id ? (
              <a
                href={`https://docs.google.com/spreadsheets/d/${task.drive_sheet_id}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-500)] hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Submissions Sheet
              </a>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">
                Sheet auto-creates on task creation (Apps Script)
              </span>
            )}
          </div>

          {/* Drive folder */}
          {task.drive_folder_id && (
            <a
              href={`https://drive.google.com/drive/folders/${task.drive_folder_id}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Drive Folder
            </a>
          )}

          {/* Private link copy */}
          {task.is_private && (
            <button
              onClick={copyPrivateLink}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
            >
              <Lock className="h-3 w-3" />
              {copiedLink ? "Copied!" : "Copy Private Link"}
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Submissions */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Submissions ({submissions.length})
          </h2>
          <div className="flex items-center gap-2">
            {pending > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                {pending} pending review
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={() => { resetImport(); setImportOpen(true); }}>
              <Upload className="h-3.5 w-3.5" /> Import Client Validation
            </Button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-12 flex flex-col items-center gap-2 text-center">
            <FileText className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No submissions yet</p>
            <p className="text-xs text-[var(--text-muted)]">Submissions will appear here when contributors submit their work.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={sub.profiles?.full_name ?? "?"} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{sub.profiles?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{sub.profiles?.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[sub.status] ?? ""}`}>
                      {sub.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {sub.notes && (
                  <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-3">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Notes</p>
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{sub.notes}</p>
                  </div>
                )}

                {/* Files */}
                {sub.files && sub.files.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Files</p>
                    <div className="flex flex-wrap gap-2">
                      {sub.files.map((f, i) => (
                        <a
                          key={i}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs text-[var(--brand-500)] hover:bg-[var(--surface-card)] transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {f.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing feedback */}
                {sub.feedback && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                    <p className="text-xs font-semibold text-red-400 mb-1">Admin Feedback</p>
                    <p className="text-sm text-red-300">{sub.feedback}</p>
                  </div>
                )}

                {/* Approved result */}
                {sub.status === "approved" && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {sub.valid_units != null && task.total_units != null
                      ? `Partially approved — ${sub.valid_units}/${task.total_units} ${task.unit_name ?? "units"} • ${sub.coins_awarded} NexCoins credited`
                      : `${sub.coins_awarded} NexCoins credited`}
                  </div>
                )}

                {/* Review controls (only for submitted status) */}
                {sub.status === "submitted" && (
                  <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                    {task.allows_partial_payment ? (
                      /* Partial payment controls */
                      (() => {
                        const vu        = parseInt(validUnitsMap[sub.id] || "0") || 0;
                        const unitNc    = task.pay_per_unit_nc ?? 0;
                        const gross     = vu * unitNc;
                        const contribs  = Math.floor(gross * 0.66);
                        return (
                          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 space-y-3">
                            <p className="text-xs font-semibold text-[var(--text-secondary)]">Partial Payment Review</p>
                            <div className="flex items-center gap-3">
                              <label className="text-sm text-[var(--text-primary)] flex-shrink-0">Valid {task.unit_name ?? "units"}:</label>
                              <input
                                type="number"
                                min={0}
                                max={task.total_units ?? undefined}
                                value={validUnitsMap[sub.id] ?? ""}
                                onChange={(e) => setValidUnitsMap((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                                placeholder={`0–${task.total_units ?? "?"}`}
                                className="w-24 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                              />
                              <span className="text-sm text-[var(--text-muted)]">/ {task.total_units ?? "?"} {task.unit_name ?? "units"}</span>
                            </div>
                            {vu > 0 && (
                              <p className="text-xs text-[var(--brand-500)]">
                                {vu} valid {task.unit_name ?? "unit"}{vu !== 1 ? "s" : ""} × {unitNc} NC = <strong>{gross} NC gross</strong> → <strong>{contribs} NC to contributor</strong>
                              </p>
                            )}
                            <input
                              type="text"
                              value={feedbacks[sub.id] ?? ""}
                              onChange={(e) => setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                              placeholder="Feedback for contributor (optional)…"
                              className="w-full h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                            />
                          </div>
                        );
                      })()
                    ) : (
                      /* Standard controls */
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={feedbacks[sub.id] ?? ""}
                            onChange={(e) => setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                            placeholder="Feedback for contributor (optional on approve, recommended on reject)…"
                            className="w-full h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                          />
                        </div>
                        <input
                          type="number"
                          value={coinsMap[sub.id] ?? task.pay_per_task ?? ""}
                          onChange={(e) => setCoinsMap((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                          placeholder="Coins"
                          className="w-24 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={reviewing === sub.id}
                        onClick={() => review(sub.id, "approve")}
                      >
                        {reviewing === sub.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <><CheckCircle2 className="h-4 w-4" /> {task.allows_partial_payment ? "Approve Partial Payment" : "Approve"}</>}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={reviewing === sub.id}
                        onClick={() => review(sub.id, "reject")}
                      >
                        {reviewing === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Reject</>}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Import Client Validation Modal ─────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] flex-shrink-0">
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Import Client Validation</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {importStep === "upload" && "Upload the CSV downloaded from the Google Sheet"}
                  {importStep === "map"    && "Map CSV columns to submission fields"}
                  {importStep === "preview" && "Review matches before applying"}
                  {importStep === "done"  && "Validation applied"}
                </p>
              </div>
              <button onClick={() => setImportOpen(false)} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              {importError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> {importError}
                </div>
              )}

              {/* Step: upload */}
              {importStep === "upload" && (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Open the task&apos;s Google Sheet, add a <strong>Client Status</strong> column with <code className="text-xs bg-[var(--surface-subtle)] px-1 py-0.5 rounded">valid</code> / <code className="text-xs bg-[var(--surface-subtle)] px-1 py-0.5 rounded">invalid</code> values, then download as CSV and paste or upload below.
                  </p>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Paste CSV content</label>
                  <textarea
                    rows={8}
                    value={importCsvText}
                    onChange={(e) => setImportCsvText(e.target.value)}
                    placeholder={"Submission ID,Contributor Name,...,Client Status\nabc-123,...,valid\ndef-456,...,invalid"}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
                  />
                  <p className="text-xs text-[var(--text-muted)]">Or upload a file:</p>
                  <input
                    type="file" accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => handleCSVLoad((ev.target?.result as string) ?? "");
                      reader.readAsText(file);
                    }}
                    className="text-sm text-[var(--text-secondary)]"
                  />
                  <div className="flex gap-3 pt-1">
                    <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
                    <Button disabled={!importCsvText.trim()} onClick={() => handleCSVLoad(importCsvText)}>
                      Next: Map Columns
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: map */}
              {importStep === "map" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Submission ID column *</label>
                      <select value={importIdCol} onChange={(e) => setImportIdCol(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
                        {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Status column *</label>
                      <select value={importStatusCol} onChange={(e) => setImportStatusCol(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
                        {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Reason column (optional)</label>
                      <select value={importReasonCol} onChange={(e) => setImportReasonCol(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
                        <option value="">— none —</option>
                        {importHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Valid value</label>
                        <input type="text" value={importValidVal} onChange={(e) => setImportValidVal(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Invalid value</label>
                        <input type="text" value={importInvalidVal} onChange={(e) => setImportInvalidVal(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setImportStep("upload")}>Back</Button>
                    <Button disabled={importLoading} onClick={runPreview}>
                      {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preview Matches"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: preview */}
              {importStep === "preview" && importPreview && (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm font-semibold flex-wrap">
                    <span className="text-green-400">{importPreview.valid} valid</span>
                    <span className="text-red-400">{importPreview.invalid} invalid</span>
                    <span className="text-[var(--text-muted)]">{importPreview.notFound} not found</span>
                    {importPreview.unrecognized > 0 && <span className="text-amber-400">{importPreview.unrecognized} unrecognized</span>}
                  </div>
                  <div className="rounded-lg border border-[var(--border-default)] overflow-x-auto max-h-60">
                    <table className="w-full text-xs min-w-[500px]">
                      <thead>
                        <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                          {["#", "Submission ID", "Contributor", "Current", "Client"].map((h) => (
                            <th key={h} className="text-left px-3 py-2 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-default)]">
                        {importPreview.rows.slice(0, 100).map((r) => (
                          <tr key={r.rowNum} className={!r.found ? "opacity-40" : ""}>
                            <td className="px-3 py-2 text-[var(--text-muted)]">{r.rowNum}</td>
                            <td className="px-3 py-2 font-mono text-[var(--text-muted)] truncate max-w-[120px]">{r.submissionId.slice(0, 8)}…</td>
                            <td className="px-3 py-2 text-[var(--text-primary)]">{r.contributor ?? "not found"}</td>
                            <td className="px-3 py-2 text-[var(--text-muted)] capitalize">{r.currentStatus ?? "—"}</td>
                            <td className="px-3 py-2">
                              <span className={`font-semibold ${r.clientStatus === "valid" ? "text-green-400" : r.clientStatus === "invalid" ? "text-red-400" : "text-amber-400"}`}>
                                {r.clientStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.rows.length > 100 && (
                    <p className="text-xs text-[var(--text-muted)]">Showing first 100 of {importPreview.rows.length} rows.</p>
                  )}
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setImportStep("map")}>Back</Button>
                    <Button disabled={importLoading || (importPreview.valid + importPreview.invalid) === 0} onClick={applyValidation}
                      className="bg-[var(--brand-500)] hover:brightness-105 text-white">
                      {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Apply — ${importPreview.valid} approve, ${importPreview.invalid} reject`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: done */}
              {importStep === "done" && importResult && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 space-y-2">
                    <p className="font-semibold text-green-400">Validation applied successfully</p>
                    <div className="text-sm text-[var(--text-secondary)] space-y-1">
                      <p>{importResult.approved} submissions approved (+coins credited)</p>
                      <p>{importResult.rejected} submissions rejected</p>
                      {importResult.skipped > 0 && <p className="text-[var(--text-muted)]">{importResult.skipped} skipped (not found or unrecognized status)</p>}
                      {importResult.errors > 0 && <p className="text-red-400">{importResult.errors} errors — check server logs</p>}
                    </div>
                  </div>
                  <Button onClick={() => setImportOpen(false)}>Done</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
