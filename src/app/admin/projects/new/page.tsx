"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

const PROJECT_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "App Testing",
  "Survey", "Content Task", "Translation", "Micro-task", "Other",
];

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-colors";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

export default function NewProjectPage() {
  const router   = useRouter();
  const tokenRef = useRef<string | null>(null);

  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [name, setName]               = useState("");
  const [clientName, setClientName]   = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [budget, setBudget]           = useState("");
  const [deadline, setDeadline]       = useState("");
  const [status, setStatus]           = useState("active");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError(null);

    if (!tokenRef.current) {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
    }

    const res = await fetch("/api/admin/projects", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ name, client_name: clientName, description, project_type: projectType, budget, deadline, status, notes }),
    });

    const data = await res.json() as { ok?: boolean; id?: string; error?: string };

    if (!res.ok) {
      setError(data.error ?? "Failed to create project.");
      setSaving(false);
      return;
    }

    router.push("/admin/projects");
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--brand-500)]/10 flex items-center justify-center">
          <FolderOpen className="h-5 w-5 text-[var(--brand-500)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">New Project</h1>
          <p className="text-sm text-[var(--text-secondary)]">Create a new client project.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Project Name <span className="text-[var(--danger-text)]">*</span></label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Audio Dataset Q3" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Client Name</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Acme Corp" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the project and its goals…"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Project Type</label>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className={inputClass}>
              <option value="">Select type…</option>
              {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Budget (internal reference)</label>
            <input type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 5000" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes, special requirements, contacts…"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
          />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => router.push("/admin/projects")}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
