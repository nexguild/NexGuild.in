"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, Users, Coins, CheckCircle2,
  XCircle, Loader2, Upload, FileText, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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
}

interface Assignment {
  id: string;
  status: string;
  feedback: string | null;
  answers: { answer: string } | null;
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
  const router = useRouter();

  const [userId, setUserId]           = useState<string | null>(null);
  const [task, setTask]               = useState<Task | null>(null);
  const [assignment, setAssignment]   = useState<Assignment | null>(null);
  const [submission, setSubmission]   = useState<Submission | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Assignment form
  const [quizAnswer, setQuizAnswer]   = useState("");
  const [assignFile, setAssignFile]   = useState<File | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [assignErr, setAssignErr]     = useState<string | null>(null);

  // Start task
  const [starting, setStarting]       = useState(false);

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

    let fileUrl: string | null = null;

    if (task.assignment_type === "file") {
      if (!assignFile) { setAssignErr("Please select a file."); setSubmitting(false); return; }
      const ext  = assignFile.name.split(".").pop();
      const path = `${userId}/${task.id}/assignment.${ext}`;
      const { error: upErr } = await supabase.storage.from("assignments").upload(path, assignFile, { upsert: true });
      if (upErr) { setAssignErr("File upload failed: " + upErr.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("assignments").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    } else {
      if (!quizAnswer.trim()) { setAssignErr("Please write your answer."); setSubmitting(false); return; }
    }

    const payload = {
      task_id: task.id,
      contributor_id: userId,
      submission_type: task.assignment_type ?? "quiz",
      answers: task.assignment_type !== "file" ? { answer: quizAnswer.trim() } : null,
      file_url: fileUrl,
      status: "pending",
    };

    let result;
    if (assignment) {
      // Re-submission after rejection — update existing row
      result = await supabase.from("assignments").update({ ...payload, submitted_at: new Date().toISOString() }).eq("id", assignment.id);
    } else {
      result = await supabase.from("assignments").insert(payload);
    }

    if (result.error) {
      setAssignErr(result.error.message);
    } else {
      // Reload assignment state
      const { data } = await supabase.from("assignments").select("*").eq("task_id", id).eq("contributor_id", userId).single();
      setAssignment(data as Assignment);
      setQuizAnswer("");
      setAssignFile(null);
    }
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
      // Maybe already exists — fetch it
      const { data: existing } = await supabase.from("submissions").select("*").eq("task_id", id).eq("contributor_id", userId).single();
      if (existing) setSubmission(existing as Submission);
    } else {
      setSubmission(data as Submission);
    }
    setStarting(false);
  }

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
        <Link href="/dashboard/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 text-center">
          <AlertCircle className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--text-primary)]">{error ?? "Task not found"}</p>
        </div>
      </div>
    );
  }

  const slotsLeft = task.total_slots != null ? task.total_slots - (task.filled_slots ?? 0) : null;
  const canSubmitWork = !task.assignment_required || assignment?.status === "approved";

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Tasks
      </Link>

      {/* Task Header */}
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

        {task.description && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{task.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5 text-[var(--brand-500)] font-semibold">
            <Coins className="h-4 w-4" />
            {task.pay_per_task != null ? `${task.pay_per_task} NexCoins` : "—"}
          </span>
          {slotsLeft != null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {slotsLeft} slots left
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Due {new Date(task.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Requirements */}
        {task.requirements && (
          <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-[var(--brand-500)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Requirements</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{task.requirements}</p>
          </div>
        )}
      </div>

      {/* === ASSIGNMENT GATE === */}
      {task.assignment_required && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Assignment Gate</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            This task requires you to complete an assignment first. An admin will review it before granting access.
          </p>

          {/* No assignment yet → show form */}
          {!assignment && (
            <form onSubmit={submitAssignment} className="space-y-4">
              {task.assignment_type === "file" ? (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Upload Your Assignment File</label>
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border-default)] rounded-lg p-6 cursor-pointer hover:border-[var(--brand-500)] transition-colors">
                    <Upload className="h-6 w-6 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {assignFile ? assignFile.name : "Click to select a file"}
                    </span>
                    <input type="file" className="hidden" onChange={(e) => setAssignFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Your Answer</label>
                  <textarea
                    value={quizAnswer}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    rows={4}
                    placeholder="Write your answer here based on the requirements above…"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
                  />
                </div>
              )}
              {assignErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{assignErr}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Assignment"}
              </Button>
            </form>
          )}

          {/* Pending */}
          {assignment?.status === "pending" && (
            <div className="flex items-start gap-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
              <Loader2 className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-yellow-400">Assignment Under Review</p>
                <p className="text-xs text-yellow-300/70 mt-0.5">
                  Submitted {new Date(assignment.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · An admin will review it shortly.
                </p>
              </div>
            </div>
          )}

          {/* Rejected → show feedback + re-submit */}
          {assignment?.status === "rejected" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Assignment Rejected</p>
                  {assignment.feedback && (
                    <p className="text-xs text-red-300/70 mt-1">{assignment.feedback}</p>
                  )}
                </div>
              </div>
              <form onSubmit={submitAssignment} className="space-y-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">Re-submit Assignment</p>
                {task.assignment_type === "file" ? (
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border-default)] rounded-lg p-6 cursor-pointer hover:border-[var(--brand-500)] transition-colors">
                    <Upload className="h-6 w-6 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">{assignFile ? assignFile.name : "Click to select a file"}</span>
                    <input type="file" className="hidden" onChange={(e) => setAssignFile(e.target.files?.[0] ?? null)} />
                  </label>
                ) : (
                  <textarea
                    value={quizAnswer}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    rows={4}
                    placeholder="Write a new answer…"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
                  />
                )}
                {assignErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{assignErr}</p>}
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-submit Assignment"}
                </Button>
              </form>
            </div>
          )}

          {/* Approved */}
          {assignment?.status === "approved" && (
            <div className="flex items-start gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-400">Assignment Approved</p>
                <p className="text-xs text-green-300/70 mt-0.5">You can now submit your work below.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === SUBMISSION SECTION === */}
      {canSubmitWork && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Your Submission</h2>

          {/* No submission yet */}
          {!submission && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Ready to work on this task? Click Start Task to begin. You can then upload your work when done.
              </p>
              <Button onClick={startTask} disabled={starting} size="lg">
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Task"}
              </Button>
            </div>
          )}

          {/* In progress */}
          {submission?.status === "in_progress" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <div className="h-2 w-2 rounded-full bg-[var(--brand-500)] animate-pulse" />
                Task in progress
              </div>
              <Button asChild size="lg">
                <Link href={`/dashboard/tasks/${id}/submit`}>Submit Work →</Link>
              </Button>
            </div>
          )}

          {/* Submitted → under review */}
          {submission?.status === "submitted" && (
            <div className="flex items-start gap-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
              <Loader2 className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-semibold text-blue-400">Under Review</p>
                <p className="text-xs text-blue-300/70 mt-0.5">Your submission is being reviewed by an admin.</p>
              </div>
            </div>
          )}

          {/* Approved */}
          {submission?.status === "approved" && (
            <div className="flex items-start gap-3 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-400">
                  Approved! +{submission.coins_awarded ?? task.pay_per_task ?? 0} NexCoins
                </p>
                <p className="text-xs text-green-300/70 mt-0.5">Coins have been credited to your wallet.</p>
              </div>
            </div>
          )}

          {/* Rejected → re-submit */}
          {submission?.status === "rejected" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Submission Rejected</p>
                  {submission.feedback && (
                    <p className="text-xs text-red-300/70 mt-1">{submission.feedback}</p>
                  )}
                </div>
              </div>
              <Button asChild size="lg" variant="secondary">
                <Link href={`/dashboard/tasks/${id}/submit`}>Re-submit Work</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
