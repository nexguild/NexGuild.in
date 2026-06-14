"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const TASK_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "App Testing",
  "Game Testing", "Survey", "Social Media Task", "Web Research",
  "Data Collection", "Content Task", "Micro-task",
];

const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [loading, setLoading]       = useState(true);
  const [title, setTitle]           = useState("");
  const [taskType, setTaskType]     = useState("");
  const [description, setDescription]   = useState("");
  const [requirements, setRequirements] = useState("");
  const [payPerTask, setPayPerTask]     = useState("");
  const [totalSlots, setTotalSlots]     = useState("");
  const [deadline, setDeadline]         = useState("");
  const [taskStatus, setTaskStatus]     = useState("active");
  const [assignmentReq, setAssignmentReq]   = useState(false);
  const [assignmentType, setAssignmentType] = useState("quiz");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: fetchErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !data) { setLoading(false); return; }

      setTitle(data.title ?? "");
      setTaskType(data.task_type ?? "");
      setDescription(data.description ?? "");
      setRequirements(data.requirements ?? "");
      setPayPerTask(data.pay_per_task != null ? String(data.pay_per_task) : "");
      setTotalSlots(data.total_slots != null ? String(data.total_slots) : "");
      setDeadline(data.deadline ? data.deadline.split("T")[0] : "");
      setTaskStatus(data.status ?? "active");
      setAssignmentReq(data.assignment_required ?? false);
      setAssignmentType(data.assignment_type ?? "quiz");
      setLoading(false);
    }
    load();
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !taskType || !description.trim()) {
      setError("Title, type, and description are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const { error: updateErr } = await supabase.from("tasks").update({
      title: title.trim(),
      task_type: taskType,
      description: description.trim(),
      requirements: requirements.trim() || null,
      pay_per_task: payPerTask ? parseFloat(payPerTask) : null,
      total_slots: totalSlots ? parseInt(totalSlots) : null,
      deadline: deadline || null,
      status: taskStatus,
      assignment_required: assignmentReq,
      assignment_type: assignmentReq ? assignmentType : null,
    }).eq("id", id);

    if (updateErr) { setError(updateErr.message); setSaving(false); return; }
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/admin/tasks/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Task
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Task</h1>
        <p className="text-sm text-[var(--text-secondary)]">Changes are saved immediately to Supabase.</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Basic Info */}
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--text-primary)]">Task Details</h2>

          <div>
            <label className={labelClass}>Task Title <span className="text-[var(--danger-text)]">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Task Type <span className="text-[var(--danger-text)]">*</span></label>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={inputClass}>
              <option value="">Select task type</option>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className={inputClass}>
              {["active", "paused", "draft", "archived"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-[var(--danger-text)]">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y"
            />
          </div>

          <div>
            <label className={labelClass}>Instructions for Contributors</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y"
            />
          </div>
        </section>

        {/* Pay & Capacity */}
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--text-primary)]">Pay & Capacity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Coins Per Task</label>
              <input type="number" value={payPerTask} onChange={(e) => setPayPerTask(e.target.value)} min={1} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Slots</label>
              <input type="number" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)} min={1} placeholder="blank = unlimited" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </div>
        </section>

        {/* Assignment Gate */}
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--text-primary)]">Assignment Gate</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={assignmentReq}
              onClick={() => setAssignmentReq(!assignmentReq)}
              style={{ backgroundColor: assignmentReq ? "var(--brand-500)" : undefined }}
              className={`h-6 w-11 rounded-full relative flex-shrink-0 transition-colors ${!assignmentReq ? "bg-[var(--border-strong)]" : ""}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${assignmentReq ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">Require assignment to unlock task</span>
          </div>
          <div className={assignmentReq ? "" : "opacity-40 pointer-events-none"}>
            <label className={labelClass}>Assignment Type</label>
            <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} className={inputClass}>
              <option value="quiz">Quiz / Text Answer</option>
              <option value="file">File Upload</option>
            </select>
          </div>
        </section>

        {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-lg">{error}</p>}
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" /> Changes saved successfully.
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
          <Button type="button" variant="ghost" size="lg" asChild>
            <Link href={`/admin/tasks/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
