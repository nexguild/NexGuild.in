"use client";

import { useState } from "react";
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

const ic = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-colors";
const lc = "block text-sm font-semibold text-[var(--text-primary)] mb-1.5";
const tc = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y";

export default function NewProjectPage() {
  const router  = useRouter();
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [name, setName]                           = useState("");
  const [clientName, setClientName]               = useState("");
  const [description, setDescription]             = useState("");
  const [projectType, setProjectType]             = useState("");
  const [status, setStatus]                       = useState("draft");
  const [startDate, setStartDate]                 = useState("");
  const [deadline, setDeadline]                   = useState("");
  const [paymentTimeline, setPaymentTimeline]     = useState("");
  const [totalBudgetNC, setTotalBudgetNC]         = useState("");
  const [clientPaymentAmount, setClientPaymentAmount] = useState("");
  const [internalNotes, setInternalNotes]         = useState("");
  const [saving, setSaving]                       = useState(false);
  const [error, setError]                         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/admin/projects", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        name, client_name: clientName, description, project_type: projectType,
        status, start_date: startDate || null, deadline: deadline || null,
        payment_timeline: paymentTimeline, total_budget_nc: totalBudgetNC || 0,
        client_payment_amount: clientPaymentAmount, internal_notes: internalNotes,
      }),
    });

    const data = await res.json() as { ok?: boolean; id?: string; error?: string };
    if (!res.ok) { setError(data.error ?? "Failed to create project."); setSaving(false); return; }
    router.push(`/admin/projects/${data.id}`);
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Project Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lc}>Project Name <span className="text-[var(--danger-text)]">*</span></label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Audio Dataset Q3" className={ic} />
            </div>
            <div>
              <label className={lc}>Client Name</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corp" className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project and its goals…" className={tc} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lc}>Project Type</label>
              <select value={projectType} onChange={(e) => setProjectType(e.target.value)} className={ic}>
                <option value="">Select type…</option>
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lc}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={ic}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="under_review">Under Review</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Timeline</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lc}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={ic} />
            </div>
            <div>
              <label className={lc}>Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={ic} />
            </div>
          </div>
          <div>
            <label className={lc}>Payment Timeline</label>
            <input type="text" value={paymentTimeline} onChange={(e) => setPaymentTimeline(e.target.value)}
              placeholder="e.g. 30 days after completion" className={ic} />
          </div>
        </section>

        {/* Financials */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Financials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lc}>NC Budget (contributor payouts)</label>
              <input type="number" min="0" value={totalBudgetNC} onChange={(e) => setTotalBudgetNC(e.target.value)}
                placeholder="e.g. 50000" className={ic} />
              <p className="text-xs text-[var(--text-muted)] mt-1">Total NexCoins budgeted for all task payouts</p>
            </div>
            <div>
              <label className={lc}>Client Payment Amount</label>
              <input type="text" value={clientPaymentAmount} onChange={(e) => setClientPaymentAmount(e.target.value)}
                placeholder="e.g. $70 USD" className={ic} />
              <p className="text-xs text-[var(--text-muted)] mt-1">What the client pays you</p>
            </div>
          </div>
        </section>

        {/* Internal Notes */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
          <h2 className="font-bold text-[var(--text-primary)]">Internal Notes</h2>
          <textarea rows={4} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Private notes, special requirements, contacts, links…" className={tc} />
          <p className="text-xs text-[var(--text-muted)]">Only visible to admins. Never shown to contributors.</p>
        </section>

        {error && <p className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
          </Button>
          <Button variant="ghost" size="lg" asChild><Link href="/admin/projects">Cancel</Link></Button>
        </div>
      </form>
    </div>
  );
}
