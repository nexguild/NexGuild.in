"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2, FileText,
  ExternalLink, Users, Coins, Clock, Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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

  const [task, setTask]               = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [token, setToken]             = useState<string | null>(null);
  const [feedbacks, setFeedbacks]     = useState<Record<string, string>>({});
  const [reviewing, setReviewing]     = useState<string | null>(null);
  const [coinsMap, setCoinsMap]       = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }
      setToken(session.access_token);

      const [{ data: taskData }, { data: subData }] = await Promise.all([
        supabase.from("tasks").select("*").eq("id", id).single(),
        supabase.from("submissions")
          .select("id, contributor_id, status, notes, files, coins_awarded, feedback, submitted_at, profiles(full_name, email)")
          .eq("task_id", id)
          .order("submitted_at", { ascending: false }),
      ]);

      setTask(taskData as Task);
      setSubmissions((subData as unknown as Submission[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id, router]);

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
      </div>

      {/* Submissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">
            Submissions ({submissions.length})
          </h2>
          {pending > 0 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
              {pending} pending review
            </span>
          )}
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
                    {sub.coins_awarded} NexCoins credited
                  </div>
                )}

                {/* Review controls (only for submitted status) */}
                {sub.status === "submitted" && (
                  <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={reviewing === sub.id}
                        onClick={() => review(sub.id, "approve")}
                      >
                        {reviewing === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Approve</>}
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
    </div>
  );
}
