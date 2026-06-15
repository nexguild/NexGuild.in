"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TASK_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "App Testing",
  "Game Testing", "Survey", "Social Media Task", "Web Research",
  "Data Collection", "Content Task", "Micro-task",
];

const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

export default function PostNewTaskPage() {
  const router = useRouter();

  const [title, setTitle]               = useState("");
  const [taskType, setTaskType]         = useState("");
  const [description, setDescription]   = useState("");
  const [requirements, setRequirements] = useState("");
  const [payPerTask, setPayPerTask]     = useState("");
  const [totalSlots, setTotalSlots]     = useState("");
  const [deadline, setDeadline]         = useState("");
  const [assignmentReq, setAssignmentReq] = useState(false);
  const [assignmentType, setAssignmentType] = useState("quiz");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function submit(status: "active" | "draft") {
    if (!title.trim() || !taskType || !description.trim()) {
      setError("Title, type, and description are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setError("Not authenticated."); setSaving(false); return; }

    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: title.trim(),
        task_type: taskType,
        description: description.trim(),
        requirements: requirements.trim() || null,
        pay_per_task: payPerTask ? parseFloat(payPerTask) : null,
        total_slots: totalSlots ? parseInt(totalSlots) : null,
        deadline: deadline || null,
        assignment_required: assignmentReq,
        assignment_type: assignmentReq ? assignmentType : null,
        status,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create task."); setSaving(false); return; }
    router.push("/admin/tasks");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Post New Task</h1>
        <p className="text-sm text-[var(--text-secondary)]">Create a new task for contributors to complete.</p>
      </div>

      <div className="space-y-5">
        {/* Basic Info */}
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--text-primary)]">Task Details</h2>

          <div>
            <label className={labelClass}>Task Title <span className="text-[var(--danger-text)]">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audio Recording — English Prompts" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Task Type <span className="text-[var(--danger-text)]">*</span></label>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={inputClass}>
              <option value="">Select task type</option>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-[var(--danger-text)]">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="Describe the task clearly — what contributors need to do, quality standards..."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y" />
          </div>

          <div>
            <label className={labelClass}>Instructions for Contributors</label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3}
              placeholder="Step-by-step instructions contributors will see when they start the task..."
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y" />
          </div>
        </section>

        {/* Pay & Capacity */}
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-semibold text-[var(--text-primary)]">Pay & Capacity</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Coins Per Task <span className="text-[var(--danger-text)]">*</span></label>
              <input type="number" value={payPerTask} onChange={(e) => setPayPerTask(e.target.value)}
                min={1} placeholder="e.g. 50" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Slots</label>
              <input type="number" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)}
                min={1} placeholder="e.g. 100 (blank = unlimited)" className={inputClass} />
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
          <p className="text-sm text-[var(--text-secondary)]">Require contributors to pass an assignment before accessing this task.</p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={assignmentReq}
              onClick={() => setAssignmentReq(!assignmentReq)}
              style={{ backgroundColor: assignmentReq ? "#14b8a6" : "#4b5563", transition: "background-color 0.2s ease" }}
              className="h-6 w-11 rounded-full relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2"
            >
              <span
                style={{ transform: assignmentReq ? "translateX(22px)" : "translateX(2px)", transition: "transform 0.2s ease" }}
                className="absolute top-[2px] left-0 h-5 w-5 rounded-full bg-white shadow-md"
              />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">Require assignment to unlock task</span>
          </div>

          <div className={assignmentReq ? "" : "opacity-40 pointer-events-none"}>
            <label className={labelClass}>Assignment Type</label>
            <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} className={inputClass}>
              <option value="quiz">Quiz</option>
              <option value="file">File Upload</option>
            </select>
          </div>
        </section>

        {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Button size="lg" disabled={saving} onClick={() => submit("active")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish Task
          </Button>
          <Button variant="secondary" size="lg" disabled={saving} onClick={() => submit("draft")}>
            Save as Draft
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/admin/tasks">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
