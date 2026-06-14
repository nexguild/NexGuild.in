"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Search, GraduationCap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

interface Assignment {
  id: string;
  contributor_id: string;
  submission_type: string | null;
  answers: { answer: string } | null;
  file_url: string | null;
  status: string;
  feedback: string | null;
  submitted_at: string;
  tasks: { id: string; title: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = typeof TABS[number];

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-500/10 text-yellow-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<Tab>("pending");
  const [search, setSearch]           = useState("");
  const [feedbacks, setFeedbacks]     = useState<Record<string, string>>({});
  const [reviewing, setReviewing]     = useState<string | null>(null);
  const [token, setToken]             = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);

      const { data } = await supabase
        .from("assignments")
        .select("id, contributor_id, submission_type, answers, file_url, status, feedback, submitted_at, tasks(id, title), profiles(full_name, email)")
        .order("submitted_at", { ascending: false });

      setAssignments((data as unknown as Assignment[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function review(assignmentId: string, action: "approve" | "reject") {
    if (!token) return;
    setReviewing(assignmentId);
    const feedback = feedbacks[assignmentId]?.trim() || undefined;

    const res = await fetch("/api/admin/review-assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignmentId, action, feedback }),
    });

    if (res.ok) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignmentId
            ? { ...a, status: action === "approve" ? "approved" : "rejected", feedback: feedback ?? a.feedback }
            : a
        )
      );
    }
    setReviewing(null);
  }

  const filtered = assignments.filter((a) => {
    const matchTab = a.status === activeTab;
    const term = search.toLowerCase();
    const matchSearch =
      search === "" ||
      a.profiles?.full_name?.toLowerCase().includes(term) ||
      a.profiles?.email?.toLowerCase().includes(term) ||
      a.tasks?.title?.toLowerCase().includes(term);
    return matchTab && matchSearch;
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assignments</h1>
          <p className="text-sm text-[var(--text-secondary)]">Review contributor assignments before granting task access.</p>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px capitalize transition-colors ${
              activeTab === tab
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
            {tab === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] max-w-xs">
        <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contributor or task…"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center">
          <GraduationCap className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No {activeTab} assignments</p>
          <p className="text-sm text-[var(--text-secondary)]">Assignment submissions will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Avatar name={a.profiles?.full_name ?? "?"} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{a.profiles?.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{a.profiles?.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[a.status] ?? ""}`}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(a.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Task */}
              {a.tasks && (
                <p className="text-xs text-[var(--text-muted)]">
                  Task:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">{a.tasks.title}</span>
                  {" · "}
                  <span className="capitalize">{a.submission_type ?? "quiz"}</span>
                </p>
              )}

              {/* Answer */}
              {a.answers?.answer && (
                <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-3">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">Contributor Answer</p>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{a.answers.answer}</p>
                </div>
              )}

              {/* File */}
              {a.file_url && (
                <a
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-500)] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View uploaded file
                </a>
              )}

              {/* Existing feedback */}
              {a.feedback && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-xs font-semibold text-red-400 mb-1">Admin Feedback</p>
                  <p className="text-sm text-red-300">{a.feedback}</p>
                </div>
              )}

              {/* Review controls */}
              {a.status === "pending" && (
                <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                  <input
                    type="text"
                    value={feedbacks[a.id] ?? ""}
                    onChange={(e) => setFeedbacks((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    placeholder="Feedback for contributor (optional on approve, recommended on reject)…"
                    className="w-full h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={reviewing === a.id}
                      onClick={() => review(a.id, "approve")}
                    >
                      {reviewing === a.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={reviewing === a.id}
                      onClick={() => review(a.id, "reject")}
                    >
                      {reviewing === a.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><XCircle className="h-4 w-4" /> Reject</>}
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
