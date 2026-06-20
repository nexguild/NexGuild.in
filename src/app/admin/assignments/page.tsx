"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Loader2, Search, GraduationCap,
  ExternalLink, FileText, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface QuizQuestion {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: "a" | "b" | "c" | "d";
}

interface QuizAnswers {
  type: "quiz";
  selected: string[];  // per-question selected option key ("a"|"b"|"c"|"d")
  score: number;
  passed: boolean;
}

interface TextAnswers {
  type?: "text";
  answer: string;
}

interface Assignment {
  id: string;
  contributor_id: string;
  task_id: string;
  submission_type: string | null;
  answers: QuizAnswers | TextAnswers | null;
  file_url: string | null;
  status: string;
  feedback: string | null;
  submitted_at: string;
  tasks: {
    id: string;
    title: string;
    assignment_type: string | null;
    assignment_questions: QuizQuestion[] | null;
    assignment_passing_score: number | null;
  } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

const TABS = ["pending", "approved", "rejected"] as const;
type Tab = typeof TABS[number];

const STATUS_BADGE: Record<string, string> = {
  pending:  "bg-yellow-500/10 text-yellow-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

function AssignmentContent({ assignment }: { assignment: Assignment }) {
  const type = assignment.tasks?.assignment_type ?? assignment.submission_type ?? "text";
  const answers = assignment.answers;
  const questions = assignment.tasks?.assignment_questions ?? [];
  const passingScore = assignment.tasks?.assignment_passing_score ?? 70;

  if (type === "file" || assignment.file_url) {
    return (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[var(--text-muted)]" />
        <a
          href={assignment.file_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--brand-500)] hover:underline font-medium"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View uploaded file
        </a>
      </div>
    );
  }

  if (type === "quiz" && answers && "selected" in answers && questions.length > 0) {
    const quizAnswers = answers as QuizAnswers;
    const score = quizAnswers.score ?? 0;
    const passed = score >= passingScore;
    return (
      <div className="space-y-3">
        {/* Score banner */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
          passed
            ? "bg-green-500/10 border-green-500/20"
            : "bg-red-500/10 border-red-500/20"
        }`}>
          <div className="flex items-center gap-2">
            {passed
              ? <CheckCircle2 className="h-4 w-4 text-green-400" />
              : <XCircle className="h-4 w-4 text-red-400" />
            }
            <span className={`text-sm font-bold ${passed ? "text-green-400" : "text-red-400"}`}>
              Score: {score}% — {passed ? "PASSED" : "FAILED"} (pass mark: {passingScore}%)
            </span>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-2">
          {questions.map((q, i) => {
            const selected = quizAnswers.selected?.[i];
            const isCorrect = selected === q.correct;
            return (
              <div key={i} className={`rounded-lg border p-3 text-sm space-y-1 ${
                isCorrect ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
              }`}>
                <p className="font-semibold text-[var(--text-primary)]">Q{i + 1}: {q.question}</p>
                <div className="flex flex-wrap gap-3 text-xs mt-1">
                  <span className={`font-medium ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                    Selected: {selected?.toUpperCase() ?? "—"}) {selected ? q[selected as keyof QuizQuestion] : "No answer"}
                  </span>
                  {!isCorrect && (
                    <span className="text-green-400 font-medium">
                      Correct: {q.correct.toUpperCase()}) {q[q.correct]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Text response (type = "text" or legacy)
  const textAnswer = answers && "answer" in answers ? (answers as TextAnswers).answer : null;
  if (textAnswer) {
    return (
      <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-3">
        <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> Written Response
        </p>
        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{textAnswer}</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-[var(--text-muted)] italic">No submission content found.</p>
  );
}

export default function AdminAssignmentsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.REVIEW);

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
      const tok = session?.access_token ?? null;
      setToken(tok);
      if (!tok) { setLoading(false); return; }

      const res = await fetch("/api/admin/assignments", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const json = await res.json();
        setAssignments((json.assignments ?? []) as Assignment[]);
      }
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
    if (a.status !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.profiles?.full_name?.toLowerCase().includes(q) ||
      a.profiles?.email?.toLowerCase().includes(q) ||
      a.tasks?.title?.toLowerCase().includes(q)
    );
  });

  const pendingCount = assignments.filter((a) => a.status === "pending").length;

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assignments</h1>
          <p className="text-sm text-[var(--text-secondary)]">Review contributor assignments before granting task access.</p>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400">
            {pendingCount} pending review
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto">
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center px-6">
          <GraduationCap className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No {activeTab} assignments</p>
          <p className="text-sm text-[var(--text-secondary)]">Assignment submissions will appear here when contributors apply.</p>
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

              {/* Task + type badge */}
              {a.tasks && (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-[var(--text-muted)]">
                    Task: <span className="font-semibold text-[var(--text-primary)]">{a.tasks.title}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full capitalize">
                    {a.tasks.assignment_type === "quiz"
                      ? <><HelpCircle className="h-3 w-3" /> Quiz</>
                      : a.tasks.assignment_type === "file"
                      ? <><ExternalLink className="h-3 w-3" /> File Upload</>
                      : <><FileText className="h-3 w-3" /> Text Response</>
                    }
                  </span>
                </div>
              )}

              {/* Submission content */}
              <AssignmentContent assignment={a} />

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
                    <Button size="sm" disabled={reviewing === a.id} onClick={() => review(a.id, "approve")}>
                      {reviewing === a.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
                    </Button>
                    <Button variant="destructive" size="sm" disabled={reviewing === a.id} onClick={() => review(a.id, "reject")}>
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
