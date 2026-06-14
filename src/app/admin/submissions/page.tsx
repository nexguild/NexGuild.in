"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Loader2, Search,
  FileText, ExternalLink, CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

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
  tasks: { id: string; title: string; pay_per_task: number | null } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

const TABS = ["submitted", "approved", "rejected", "in_progress"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  submitted:   "Pending Review",
  approved:    "Approved",
  rejected:    "Rejected",
  in_progress: "In Progress",
};

const STATUS_BADGE: Record<string, string> = {
  in_progress: "bg-blue-500/10 text-blue-400",
  submitted:   "bg-yellow-500/10 text-yellow-400",
  approved:    "bg-green-500/10 text-green-400",
  rejected:    "bg-red-500/10 text-red-400",
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<Tab>("submitted");
  const [search, setSearch]           = useState("");
  const [feedbacks, setFeedbacks]     = useState<Record<string, string>>({});
  const [coinsMap, setCoinsMap]       = useState<Record<string, string>>({});
  const [reviewing, setReviewing]     = useState<string | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);

      const { data } = await supabase
        .from("submissions")
        .select("id, contributor_id, status, notes, files, coins_awarded, feedback, submitted_at, tasks(id, title, pay_per_task), profiles(full_name, email)")
        .order("submitted_at", { ascending: false });

      setSubmissions((data as unknown as Submission[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function review(submissionId: string, action: "approve" | "reject") {
    if (!token) return;
    setReviewing(submissionId);
    const feedback = feedbacks[submissionId]?.trim() || undefined;
    const coinsStr = coinsMap[submissionId];
    const coinsOverride = coinsStr ? parseInt(coinsStr, 10) : undefined;

    const res = await fetch("/api/admin/review-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ submissionId, action, feedback, coinsOverride }),
    });

    if (res.ok) {
      const result = await res.json();
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: action === "approve" ? "approved" : "rejected",
                feedback: feedback ?? s.feedback,
                coins_awarded: action === "approve" ? (result.coins_awarded ?? s.coins_awarded) : s.coins_awarded,
              }
            : s
        )
      );
    }
    setReviewing(null);
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

  const filtered = submissions.filter((s) => {
    const matchTab = s.status === activeTab;
    const term = search.toLowerCase();
    const matchSearch =
      search === "" ||
      s.profiles?.full_name?.toLowerCase().includes(term) ||
      s.profiles?.email?.toLowerCase().includes(term) ||
      s.tasks?.title?.toLowerCase().includes(term);
    return matchTab && matchSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === "submitted").length;
  const pendingFiltered = filtered.filter((s) => s.status === "submitted");
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
      setSelected((prev) => {
        const next = new Set(prev);
        pendingFiltered.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pendingFiltered.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

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
            <input
              type="checkbox"
              checked={allPendingSelected}
              onChange={toggleSelectAll}
              className="accent-[var(--brand-500)]"
            />
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
                  {sub.status === "submitted" && (
                    <input
                      type="checkbox"
                      checked={selected.has(sub.id)}
                      onChange={() => toggleSelect(sub.id)}
                      className="accent-[var(--brand-500)] mt-1 flex-shrink-0"
                    />
                  )}
                  <Avatar name={sub.profiles?.full_name ?? "?"} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{sub.profiles?.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{sub.profiles?.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[sub.status] ?? ""}`}>
                    {sub.status === "submitted" ? "Pending" : sub.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Task + coins */}
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

              {/* Files */}
              {sub.files && sub.files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sub.files.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs text-[var(--brand-500)] hover:bg-[var(--surface-card)] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> {f.name}
                    </a>
                  ))}
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
              {sub.status === "approved" && sub.coins_awarded != null && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {sub.coins_awarded} NexCoins credited
                </div>
              )}

              {/* Review controls */}
              {sub.status === "submitted" && (
                <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbacks[sub.id] ?? ""}
                      onChange={(e) => setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                      placeholder="Feedback (optional on approve)…"
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
                    <Button size="sm" disabled={reviewing === sub.id} onClick={() => review(sub.id, "approve")}>
                      {reviewing === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
                    </Button>
                    <Button variant="destructive" size="sm" disabled={reviewing === sub.id} onClick={() => review(sub.id, "reject")}>
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
  );
}
