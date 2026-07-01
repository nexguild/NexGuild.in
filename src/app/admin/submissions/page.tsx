"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Loader2, Search,
  FileText, ExternalLink, CheckSquare, RefreshCw, X, Copy, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface FileItem {
  name: string;
  url: string;
  size: number;
}

interface StepSubmission {
  step_index: number;
  submission_type: string;
  text_value: string | null;
  file_url: string | null;
  submitted_at: string;
}

interface TaskStep {
  title: string;
  submitType: string;
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
  tasks: { id: string; title: string; pay_per_task: number | null; steps: TaskStep[] | null } | null;
  profiles: { full_name: string | null; email: string | null } | null;
  step_submissions: StepSubmission[];
}

function isDriveUrl(url: string): boolean {
  return url.includes("drive.google.com");
}

function isImageFile(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function StepSubmissionItem({ ss, stepTitle }: { ss: StepSubmission; stepTitle: string }) {
  const isDrive = ss.file_url ? isDriveUrl(ss.file_url) : false;
  const isImg   = ss.file_url ? (isDrive || isImageFile(ss.file_url)) : false;

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3 space-y-2">
      <p className="text-xs font-bold text-[var(--text-primary)]">{stepTitle}</p>

      {ss.submission_type === "text" && ss.text_value && (
        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{ss.text_value}</p>
      )}

      {ss.submission_type === "proof_code" && ss.text_value && (
        <p className="text-sm text-green-400 font-mono font-semibold">
          ✓ Verified automatically: {ss.text_value}
        </p>
      )}

      {ss.submission_type === "none" && (
        <p className="text-sm text-green-400">✓ Marked complete</p>
      )}

      {ss.submission_type === "file" && ss.file_url && (
        <div className="space-y-2">
          {isDrive && isImg ? (
            <iframe
              src={ss.file_url.replace("/view", "/preview")}
              className="w-full rounded border border-[var(--border-default)]"
              style={{ height: 200 }}
              allow="autoplay"
            />
          ) : !isDrive && isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ss.file_url} alt="submission" className="max-h-48 rounded border border-[var(--border-default)]" />
          ) : null}
          <a
            href={ss.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-500)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {isDrive ? "Open in Google Drive" : "View file"}
          </a>
        </div>
      )}
    </div>
  );
}

const TABS = ["submitted", "approved", "rejected"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  submitted: "Pending Review",
  approved:  "Approved",
  rejected:  "Rejected",
};

const STATUS_BADGE: Record<string, string> = {
  in_progress:        "bg-blue-500/10 text-blue-400",
  submitted:          "bg-yellow-500/10 text-yellow-400",
  resubmit_requested: "bg-orange-500/10 text-orange-400",
  approved:           "bg-green-500/10 text-green-400",
  rejected:           "bg-red-500/10 text-red-400",
};

function statusLabel(status: string): string {
  if (status === "submitted")          return "Pending";
  if (status === "resubmit_requested") return "Retry Allowed";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminSubmissionsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.CONTENT);

  const [submissions, setSubmissions]     = useState<Submission[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<Tab>("submitted");
  const [search, setSearch]               = useState("");
  const [feedbacks, setFeedbacks]         = useState<Record<string, string>>({});
  const [coinsMap, setCoinsMap]           = useState<Record<string, string>>({});
  const [approving, setApproving]         = useState<string | null>(null);
  const [token, setToken]                 = useState<string | null>(null);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [copiedId, setCopiedId]           = useState<string | null>(null);

  function copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  // Reject modal
  const [rejectModal, setRejectModal]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting]       = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const tok = session?.access_token ?? null;
      setToken(tok);
      if (!tok) { setLoading(false); return; }

      const res = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const json = await res.json();
        setSubmissions((json.submissions ?? []) as Submission[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function approve(submissionId: string) {
    if (!token) return;
    setApproving(submissionId);
    const feedback    = feedbacks[submissionId]?.trim() || undefined;
    const coinsStr    = coinsMap[submissionId];
    const coinsOverride = coinsStr ? parseInt(coinsStr, 10) : undefined;

    const res = await fetch("/api/admin/review-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId, action: "approve", feedback, coinsOverride }),
    });

    if (res.ok) {
      const result = await res.json();
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: "approved", feedback: feedback ?? s.feedback, coins_awarded: result.coins_awarded ?? s.coins_awarded }
            : s
        )
      );
    }
    setApproving(null);
  }

  async function rejectWithOption(allowRetry: boolean) {
    if (!token || !rejectModal || !rejectReason.trim()) return;
    setRejecting(true);
    const action = allowRetry ? "request_resubmit" : "reject";

    const res = await fetch("/api/admin/review-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId: rejectModal, action, feedback: rejectReason.trim() }),
    });

    if (res.ok) {
      const newStatus = allowRetry ? "resubmit_requested" : "rejected";
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === rejectModal
            ? { ...s, status: newStatus, feedback: rejectReason.trim() }
            : s
        )
      );
    }
    setRejecting(false);
    setRejectModal(null);
    setRejectReason("");
  }

  async function bulkApprove() {
    if (!token || selected.size === 0) return;
    setBulkApproving(true);
    for (const id of selected) {
      await fetch("/api/admin/review-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ submissionId: id, action: "approve" }),
      });
      setSubmissions((prev) =>
        prev.map((s) => s.id === id ? { ...s, status: "approved" } : s)
      );
    }
    setSelected(new Set());
    setBulkApproving(false);
  }

  const isPending = (s: Submission) => s.status === "submitted" || s.status === "pending";

  const filtered = submissions.filter((s) => {
    let matchTab: boolean;
    if (activeTab === "submitted") {
      matchTab = s.status === "submitted" || s.status === "pending";
    } else if (activeTab === "rejected") {
      // "Rejected" tab includes both final rejections and retry-allowed rejections
      matchTab = s.status === "rejected" || s.status === "resubmit_requested";
    } else {
      matchTab = s.status === activeTab;
    }
    if (!matchTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.profiles?.full_name?.toLowerCase().includes(q) ||
      s.profiles?.email?.toLowerCase().includes(q) ||
      s.tasks?.title?.toLowerCase().includes(q)
    );
  });

  const pendingCount  = submissions.filter((s) => s.status === "submitted" || s.status === "pending").length;
  const pendingFiltered = filtered.filter(isPending);
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every((s) => selected.has(s.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelected((prev) => { const next = new Set(prev); pendingFiltered.forEach((s) => next.delete(s.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); pendingFiltered.forEach((s) => next.add(s.id)); return next; });
    }
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Submissions</h1>
          <p className="text-sm text-[var(--text-secondary)]">Review contributor work and approve or reject.</p>
        </div>
        {selected.size > 0 && (
          <Button size="sm" disabled={bulkApproving} onClick={bulkApprove}>
            {bulkApproving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><CheckSquare className="h-4 w-4" /> Approve {selected.size} selected</>}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelected(new Set()); }}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {TAB_LABELS[tab]}
            {tab === "submitted" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + select all */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contributor or task…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
        {activeTab === "submitted" && pendingFiltered.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer select-none">
            <input type="checkbox" checked={allPendingSelected} onChange={toggleSelectAll} className="accent-[var(--brand-500)]" />
            Select all
          </label>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center">
          <FileText className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No {TAB_LABELS[activeTab].toLowerCase()} submissions</p>
          <p className="text-sm text-[var(--text-secondary)]">Submissions will appear here when contributors submit their work.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <div
              key={sub.id}
              className={`rounded-xl border bg-[var(--surface-card)] p-5 space-y-4 transition-colors ${
                selected.has(sub.id) ? "border-[var(--brand-500)]" : "border-[var(--border-default)]"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {isPending(sub) && (
                    <input type="checkbox" checked={selected.has(sub.id)} onChange={() => toggleSelect(sub.id)} className="accent-[var(--brand-500)] mt-1 flex-shrink-0" />
                  )}
                  <Avatar name={sub.profiles?.full_name ?? "?"} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{sub.profiles?.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{sub.profiles?.email ?? "—"}</p>
                    <button
                      onClick={() => copyId(sub.contributor_id)}
                      title={sub.contributor_id}
                      className="flex items-center gap-1 font-mono text-xs text-[var(--text-muted)] hover:text-[var(--brand-500)] transition-colors mt-0.5"
                    >
                      {sub.contributor_id.slice(0, 8)}…
                      {copiedId === sub.contributor_id
                        ? <CheckCheck className="h-3 w-3 text-green-400 flex-shrink-0" />
                        : <Copy className="h-3 w-3 flex-shrink-0 opacity-50" />
                      }
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[sub.status] ?? ""}`}>
                    {statusLabel(sub.status)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Task */}
              {sub.tasks && (
                <p className="text-xs text-[var(--text-muted)]">
                  Task: <span className="font-semibold text-[var(--text-primary)]">{sub.tasks.title}</span>
                  {sub.tasks.pay_per_task != null && (
                    <span className="ml-2 text-[var(--brand-500)] font-semibold">{sub.tasks.pay_per_task} coins</span>
                  )}
                </p>
              )}

              {/* Notes */}
              {sub.notes && (
                <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-3">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Notes</p>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{sub.notes}</p>
                </div>
              )}

              {/* Step submissions (tasks with guided stages) */}
              {sub.step_submissions && sub.step_submissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Stage Submissions</p>
                  {sub.step_submissions.map((ss) => {
                    const steps = sub.tasks?.steps ?? [];
                    const stepMeta = steps[ss.step_index];
                    const label = stepMeta?.title
                      ? `Stage ${ss.step_index + 1}: ${stepMeta.title}`
                      : `Stage ${ss.step_index + 1}`;
                    return <StepSubmissionItem key={ss.step_index} ss={ss} stepTitle={label} />;
                  })}
                </div>
              )}

              {/* Files (classic mode) */}
              {sub.files && sub.files.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Files</p>
                  <div className="flex flex-wrap gap-2">
                    {sub.files.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs text-[var(--brand-500)] hover:bg-[var(--surface-card)] transition-colors">
                        <ExternalLink className="h-3 w-3" /> {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {sub.feedback && (
                <div className={`rounded-lg p-3 ${
                  sub.status === "resubmit_requested"
                    ? "bg-orange-500/10 border border-orange-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${sub.status === "resubmit_requested" ? "text-orange-400" : "text-red-400"}`}>
                    {sub.status === "resubmit_requested" ? "Feedback (Retry Allowed)" : "Rejection Reason"}
                  </p>
                  <p className={`text-sm ${sub.status === "resubmit_requested" ? "text-orange-300" : "text-red-300"}`}>{sub.feedback}</p>
                </div>
              )}

              {/* Approved */}
              {sub.status === "approved" && sub.coins_awarded != null && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {sub.coins_awarded} NexCoins credited
                </div>
              )}

              {/* Review controls (pending submissions only) */}
              {isPending(sub) && (
                <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbacks[sub.id] ?? ""}
                      onChange={(e) => setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                      placeholder="Optional feedback for approval…"
                      className="flex-1 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                    />
                    <input
                      type="number"
                      value={coinsMap[sub.id] ?? sub.tasks?.pay_per_task ?? ""}
                      onChange={(e) => setCoinsMap((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                      placeholder="Coins"
                      className="w-24 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={approving === sub.id} onClick={() => approve(sub.id)}>
                      {approving === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={approving === sub.id}
                      onClick={() => { setRejectModal(sub.id); setRejectReason(""); }}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !rejecting) { setRejectModal(null); setRejectReason(""); } }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Reject Submission</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">Provide a reason, then choose how to reject.</p>
              </div>
              <button
                onClick={() => { if (!rejecting) { setRejectModal(null); setRejectReason(""); } }}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-50"
                disabled={rejecting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--text-primary)]">Rejection reason <span className="text-red-400">*</span></label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Explain what was wrong with the submission…"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
                autoFocus
                disabled={rejecting}
              />
            </div>

            {/* Two rejection options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => rejectWithOption(true)}
                disabled={rejecting || !rejectReason.trim()}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                {rejecting
                  ? <Loader2 className="h-5 w-5 text-orange-400 animate-spin" />
                  : <RefreshCw className="h-5 w-5 text-orange-400" />}
                <div>
                  <p className="text-sm font-bold text-orange-400">Allow Retry</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">Contributor can resubmit after fixing issues</p>
                </div>
              </button>

              <button
                onClick={() => rejectWithOption(false)}
                disabled={rejecting || !rejectReason.trim()}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                {rejecting
                  ? <Loader2 className="h-5 w-5 text-red-400 animate-spin" />
                  : <XCircle className="h-5 w-5 text-red-400" />}
                <div>
                  <p className="text-sm font-bold text-red-400">Final Rejection</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">Permanently rejected, no resubmission</p>
                </div>
              </button>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => { setRejectModal(null); setRejectReason(""); }} disabled={rejecting}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
