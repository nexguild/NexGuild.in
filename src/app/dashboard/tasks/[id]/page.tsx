"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, Users, CheckCircle2, CreditCard,
  XCircle, Loader2, Upload, FileText, AlertCircle, HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface QuizQuestion {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: "a" | "b" | "c" | "d";
}

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
  assignment_type: string | null;
  assignment_instructions: string | null;
  assignment_questions: QuizQuestion[] | null;
  assignment_passing_score: number | null;
  validation_time: string | null;
  payment_time: string | null;
}

interface Assignment {
  id: string;
  status: string;
  feedback: string | null;
  answers: Record<string, unknown> | null;
  file_url: string | null;
  submitted_at: string;
}

interface Submission {
  id: string;
  status: string;
  feedback: string | null;
  coins_awarded: number | null;
  submitted_at: string;
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [userId, setUserId]         = useState<string | null>(null);
  const [task, setTask]             = useState<Task | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Assignment form state
  const [textAnswer, setTextAnswer]     = useState("");
  const [assignFile, setAssignFile]     = useState<File | null>(null);
  const [quizSelected, setQuizSelected] = useState<Record<number, string>>({});
  const [submitting, setSubmitting]     = useState(false);
  const [assignErr, setAssignErr]       = useState<string | null>(null);

  // Start task
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const [{ data: taskData }, { data: assignData }, { data: subData }] = await Promise.all([
        supabase.from("tasks").select("*").eq("id", id).single(),
        supabase.from("assignments").select("*").eq("task_id", id).eq("contributor_id", user.id).maybeSingle(),
        supabase.from("submissions").select("*").eq("task_id", id).eq("contributor_id", user.id).maybeSingle(),
      ]);

      if (!taskData) { setError("Task not found."); setLoading(false); return; }
      setTask(taskData as Task);
      setAssignment(assignData as Assignment | null);
      setSubmission(subData as Submission | null);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function submitAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !task) return;
    setSubmitting(true);
    setAssignErr(null);

    const aType = task.assignment_type ?? "text";
    let fileUrl: string | null = null;
    let answersPayload: Record<string, unknown> | null = null;

    if (aType === "file") {
      if (!assignFile) { setAssignErr("Please select a file to upload."); setSubmitting(false); return; }
      const ext  = assignFile.name.split(".").pop() ?? "bin";
      const path = `${userId}/${task.id}/assignment_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assignments")
        .upload(path, assignFile, { upsert: true });
      if (upErr) { setAssignErr("File upload failed: " + upErr.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(path);
      fileUrl = urlData.publicUrl;

    } else if (aType === "quiz") {
      const questions = task.assignment_questions ?? [];
      if (questions.length === 0) { setAssignErr("No quiz questions found."); setSubmitting(false); return; }
      // Check all answered
      const unanswered = questions.findIndex((_, i) => !quizSelected[i]);
      if (unanswered >= 0) {
        setAssignErr(`Please answer question ${unanswered + 1}.`);
        setSubmitting(false);
        return;
      }
      // Calculate score
      const correctCount = questions.filter((q, i) => quizSelected[i] === q.correct).length;
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= (task.assignment_passing_score ?? 70);

      answersPayload = {
        type:     "quiz",
        selected: questions.map((_, i) => quizSelected[i]),
        score,
        passed,
      };

    } else {
      // text
      if (!textAnswer.trim()) { setAssignErr("Please write your answer."); setSubmitting(false); return; }
      answersPayload = { type: "text", answer: textAnswer.trim() };
    }

    const payload = {
      task_id:         task.id,
      contributor_id:  userId,
      submission_type: aType,
      answers:         answersPayload,
      file_url:        fileUrl,
      status:          "pending",
      submitted_at:    new Date().toISOString(),
    };

    let result;
    if (assignment) {
      result = await supabase.from("assignments").update(payload).eq("id", assignment.id);
    } else {
      result = await supabase.from("assignments").insert(payload);
    }

    if (result.error) {
      setAssignErr(result.error.message);
      setSubmitting(false);
      return;
    }

    // Reload
    const { data } = await supabase.from("assignments").select("*").eq("task_id", id).eq("contributor_id", userId!).single();
    setAssignment(data as Assignment);
    setTextAnswer("");
    setAssignFile(null);
    setQuizSelected({});
    setSubmitting(false);
  }

  async function startTask() {
    if (!userId || !task) return;
    setStarting(true);
    const { error: insErr, data } = await supabase
      .from("submissions")
      .insert({ task_id: task.id, contributor_id: userId, status: "in_progress" })
      .select()
      .single();
    if (insErr) {
      const { data: existing } = await supabase.from("submissions").select("*").eq("task_id", id).eq("contributor_id", userId).single();
      if (existing) setSubmission(existing as Submission);
    } else {
      setSubmission(data as Submission);
      const newFilled = (task.filled_slots ?? 0) + 1;
      const isFull    = task.total_slots != null && newFilled >= task.total_slots;
      await supabase.from("tasks").update({
        filled_slots: newFilled,
        ...(isFull ? { status: "closed" } : {}),
      }).eq("id", task.id);
      setTask((prev) => prev ? { ...prev, filled_slots: newFilled, ...(isFull ? { status: "closed" } : {}) } : prev);
    }
    setStarting(false);
    router.push(`/dashboard/tasks/${id}/work`);
  }

  // ── Loading / error ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link href="/dashboard/opportunities" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-10 text-center">
          <AlertCircle className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--text-primary)]">{error ?? "Task not found"}</p>
        </div>
      </div>
    );
  }

  const slotsLeft     = task.total_slots != null ? task.total_slots - (task.filled_slots ?? 0) : null;
  const canWork       = !task.assignment_required || assignment?.status === "approved";
  const aType         = task.assignment_type ?? "text";
  const questions     = task.assignment_questions ?? [];
  const passingScore  = task.assignment_passing_score ?? 70;

  function AssignmentForm({ isResubmit = false }: { isResubmit?: boolean }) {
    if (!task) return null;
    return (
      <form onSubmit={submitAssignment} className="space-y-4">
        {isResubmit && <p className="text-sm font-semibold text-[var(--text-primary)]">Re-submit Assignment</p>}

        {/* Instructions */}
        {task.assignment_instructions && (
          <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Instructions</p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">{task.assignment_instructions}</p>
          </div>
        )}

        {/* File upload */}
        {aType === "file" && (
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Upload Your Sample</label>
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border-default)] rounded-lg p-6 cursor-pointer hover:border-[var(--brand-500)] transition-colors">
              <Upload className="h-6 w-6 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                {assignFile ? assignFile.name : "Click to select a file"}
              </span>
              <input type="file" className="hidden" onChange={(e) => setAssignFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        )}

        {/* Text response */}
        {aType === "text" && (
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Your Answer</label>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              rows={4}
              placeholder="Write your answer here…"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
            />
          </div>
        )}

        {/* Quiz */}
        {aType === "quiz" && questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <HelpCircle className="h-4 w-4" />
              <span>{questions.length} questions · Passing score: {passingScore}%</span>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 space-y-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {i + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {(["a", "b", "c", "d"] as const).filter((opt) => q[opt]).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        quizSelected[i] === opt
                          ? "border-[var(--brand-500)] bg-[rgba(20,184,166,0.06)]"
                          : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`quiz-q-${i}`}
                        value={opt}
                        checked={quizSelected[i] === opt}
                        onChange={() => setQuizSelected((prev) => ({ ...prev, [i]: opt }))}
                        className="accent-[var(--brand-500)]"
                      />
                      <span className={`text-sm ${quizSelected[i] === opt ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-secondary)]"}`}>
                        <span className="font-bold mr-1.5 uppercase">{opt})</span>{q[opt]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {assignErr && (
          <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{assignErr}</p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isResubmit ? "Re-submit Assignment" : "Submit Assignment"}
        </Button>
      </form>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <Link href="/dashboard/opportunities" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-teal-200 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> Back to Opportunities
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#102b3f] via-[#14504b] to-[#0f766e] p-5 text-white shadow-[0_20px_55px_rgba(15,76,69,0.2)] sm:p-7">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(245,158,11,0.2),transparent_35%),radial-gradient(ellipse_at_0%_100%,rgba(45,212,191,0.16),transparent_42%)]" />
            <div aria-hidden className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/[0.08]" />
            <div className="relative z-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/85">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <FileText className="h-4 w-4" />
                  </span>
                  {task.task_type ?? "Contributor task"}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  task.status === "active"
                    ? "border-emerald-200/30 bg-emerald-300/15 text-emerald-100"
                    : "border-white/15 bg-white/[0.08] text-white/80"
                }`}>
                  {task.status}
                </span>
              </div>
              <h1 className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">{task.title}</h1>
              {task.description && (
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-teal-50/85">{task.description}</p>
              )}
            </div>
          </section>

          {task.requirements && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
                  <FileText className="h-4 w-4 text-teal-700" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">Requirements</h2>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{task.requirements}</p>
            </section>
          )}

      {/* ── ASSIGNMENT GATE ──────────────────────────────────────────────────── */}
      {task.assignment_required && (
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:p-6">
          <div>
            <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              {aType === "quiz"
                ? <HelpCircle className="h-5 w-5 text-[var(--brand-500)]" />
                : aType === "file"
                ? <Upload className="h-5 w-5 text-[var(--brand-500)]" />
                : <FileText className="h-5 w-5 text-[var(--brand-500)]" />}
              Assignment Required
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Complete this assignment first. An admin will review it before granting you access to work on this task.
            </p>
          </div>

          {/* No assignment yet */}
          {!assignment && <AssignmentForm />}

          {/* Pending */}
          {assignment?.status === "pending" && (
            <div className="flex items-start gap-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
              <Loader2 className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-bold text-yellow-400">Assignment Under Review</p>
                <p className="text-xs text-yellow-300/70 mt-0.5">
                  Submitted {new Date(assignment.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · An admin will review it shortly.
                </p>
              </div>
            </div>
          )}

          {/* Rejected → re-submit */}
          {assignment?.status === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-400">Assignment Not Approved</p>
                  {assignment.feedback && (
                    <p className="text-xs text-red-300/70 mt-1">{assignment.feedback}</p>
                  )}
                </div>
              </div>
              <AssignmentForm isResubmit />
            </div>
          )}

          {/* Approved */}
          {assignment?.status === "approved" && (
            <div className="flex items-start gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-400">Assignment Approved ✓</p>
                <p className="text-xs text-green-300/70 mt-0.5">You have been granted access to this task.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── SUBMISSION SECTION ───────────────────────────────────────────────── */}
      {canWork && (
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.045)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
              <CheckCircle2 className="h-4 w-4 text-teal-700" />
            </div>
            <h2 className="font-bold text-slate-800">Your Work</h2>
          </div>

          {!submission && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Ready to get started? Click below to begin working on this task.
              </p>
              <Button onClick={startTask} disabled={starting} size="lg">
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Task →"}
              </Button>
            </div>
          )}

          {submission?.status === "in_progress" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <div className="h-2 w-2 rounded-full bg-[var(--brand-500)] animate-pulse" />
                Task in progress
              </div>
              <Button asChild size="lg">
                <Link href={`/dashboard/tasks/${id}/work`}>Continue Working →</Link>
              </Button>
            </div>
          )}

          {submission?.status === "submitted" && (
            <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
              <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-bold text-blue-400">Under Review</p>
                <p className="text-xs text-blue-300/70 mt-0.5">Your submission is being reviewed by an admin.</p>
              </div>
            </div>
          )}

          {submission?.status === "approved" && (
            <div className="flex items-start gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-400">
                  Approved! +{submission.coins_awarded ?? (task.pay_per_task != null ? Math.floor(task.pay_per_task * 0.66) : 0)} NexCoins
                </p>
                <p className="text-xs text-green-300/70 mt-0.5">Coins have been credited to your wallet.</p>
              </div>
            </div>
          )}

          {submission?.status === "resubmit_requested" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-orange-500/10 border border-orange-500/20 p-4">
                <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-400">Changes Requested by Admin</p>
                  {submission.feedback && (
                    <p className="text-xs text-orange-300/80 mt-1 leading-relaxed">{submission.feedback}</p>
                  )}
                </div>
              </div>
              <Button asChild size="lg">
                <Link href={`/dashboard/tasks/${id}/work`}>Resubmit Work →</Link>
              </Button>
            </div>
          )}

          {submission?.status === "rejected" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-400">Submission Rejected</p>
                  {submission.feedback && (
                    <p className="text-xs text-red-300/70 mt-1 leading-relaxed">{submission.feedback}</p>
                  )}
                </div>
              </div>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/dashboard/tasks/${id}/work`}>Re-submit Work →</Link>
              </Button>
            </div>
          )}
        </section>
      )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          {task.pay_per_task != null && (
            <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
              <div aria-hidden className="pointer-events-none absolute -right-7 -top-8 h-24 w-24 rounded-full border border-amber-200/50" />
              <p className="relative mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700/70">Your reward</p>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200/70 bg-white shadow-sm">
                  <NexCoinIcon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold tracking-tight text-slate-800">{Math.floor(task.pay_per_task * 0.66)}</p>
                  <p className="text-xs font-medium text-slate-500">NexCoins on approval</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Task details</p>
            <div className="space-y-3.5">
              {slotsLeft != null && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                    <Users className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Availability</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">{slotsLeft} slots left</p>
                  </div>
                </div>
              )}
              {task.deadline && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
                    <Clock className="h-3.5 w-3.5 text-teal-700" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Deadline</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">{new Date(task.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              )}
              {task.validation_time && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100">
                    <Clock className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Review time</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">{task.validation_time}</p>
                  </div>
                </div>
              )}
              {task.payment_time && (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
                    <CreditCard className="h-3.5 w-3.5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Payment</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-700">Within {task.payment_time} of approval</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50/70 via-white to-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700">Getting started</p>
            <p className="text-xs leading-relaxed text-slate-600">
              {task.assignment_required && assignment?.status !== "approved"
                ? "Submit the required assignment. Once it is approved, you can start working on this task."
                : submission?.status === "in_progress"
                ? "Continue your task and follow each instruction carefully before submitting your work."
                : submission
                ? "Check your work status here. If changes are requested, use the task workspace to resubmit."
                : "Review the task details and requirements, then select Start Task to begin."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
