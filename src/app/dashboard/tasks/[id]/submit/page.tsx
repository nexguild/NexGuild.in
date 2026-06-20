"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, CheckCircle2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  pay_per_task: number | null;
}

interface FileItem {
  name: string;
  url: string;
  size: number;
}

export default function SubmitTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [userId, setUserId]         = useState<string | null>(null);
  const [task, setTask]             = useState<Task | null>(null);
  const [loading, setLoading]       = useState(true);
  const [notes, setNotes]           = useState("");
  const [files, setFiles]           = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      // Must have an in_progress or rejected submission to access this page
      const { data: sub } = await supabase
        .from("submissions")
        .select("status")
        .eq("task_id", id)
        .eq("contributor_id", user.id)
        .maybeSingle();

      if (!sub || !["in_progress", "rejected"].includes(sub.status)) {
        router.push(`/dashboard/tasks/${id}`);
        return;
      }

      const { data: taskData } = await supabase.from("tasks").select("id, title, description, requirements, pay_per_task").eq("id", id).single();
      setTask(taskData as Task);
      setLoading(false);
    }
    load();
  }, [id, router]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const arr = Array.from(selected);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !names.has(f.name))];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !task) return;
    if (!notes.trim() && files.length === 0) {
      setError("Add notes or upload at least one file.");
      return;
    }
    setSubmitting(true);
    setError(null);

    // Upload files to Supabase Storage
    const uploaded: FileItem[] = [];
    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const ts   = Date.now();
      const path = `${userId}/${task.id}/${ts}_${file.name}`;
      const { data: upData, error: upErr } = await supabase.storage
        .from("submissions")
        .upload(path, file, { upsert: true });
      if (upErr) {
        setError(`Failed to upload "${file.name}": ${upErr.message}`);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(upData.path);
      uploaded.push({ name: file.name, url: urlData.publicUrl, size: file.size });
    }

    // Update existing submission
    const { error: updateErr } = await supabase
      .from("submissions")
      .update({
        files: uploaded.length > 0 ? uploaded : null,
        notes: notes.trim() || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        feedback: null,
      })
      .eq("task_id", task.id)
      .eq("contributor_id", userId);

    if (updateErr) {
      setError(updateErr.message);
      setSubmitting(false);
      return;
    }

    // Notify admins async — fire and forget, don't block UX
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        fetch("/api/submissions/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ taskId: task.id }),
        }).catch(() => {});
      }
    });

    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-12 text-center">
        <div className="rounded-full h-16 w-16 flex items-center justify-center bg-green-500/10 mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Submission Received!</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            An admin will review your work. You'll get a notification once it's approved.
          </p>
          {task?.pay_per_task && (
            <p className="text-sm font-semibold text-[var(--brand-500)] mt-2">
              Potential reward: {task.pay_per_task} NexCoins
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/dashboard/tasks">My Tasks</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard/opportunities">More Tasks</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/dashboard/tasks/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Task
      </Link>

      {/* Task context */}
      {task && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-3">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{task.title}</h1>
          {task.description && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{task.description}</p>
          )}
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
      )}

      {/* Submission form */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-5">Submit Your Work</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Notes <span className="text-[var(--text-muted)]">(optional if uploading files)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Describe what you did, include relevant links, or add any notes for the reviewer…"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
            />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Files <span className="text-[var(--text-muted)]">(optional if adding notes)</span>
            </label>
            <label
              htmlFor="file-input"
              className="flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border-default)] rounded-lg p-8 cursor-pointer hover:border-[var(--brand-500)] transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <Upload className="h-7 w-7 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Click to select or drag &amp; drop files</span>
              <span className="text-xs text-[var(--text-muted)]">Any format, multiple files allowed</span>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-default)]">
                    <span className="text-sm text-[var(--text-primary)] truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="flex-shrink-0 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Work"}
            </Button>
            <Button type="button" variant="ghost" size="lg" asChild>
              <Link href={`/dashboard/tasks/${id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
