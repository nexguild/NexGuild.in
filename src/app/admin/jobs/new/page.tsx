"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

const CATEGORIES = [
  "Customer Service", "Data Entry", "Content", "Marketing",
  "QA / Testing", "Translation", "Other",
];

const WORK_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "wfh",    label: "WFH (Work From Home)" },
  { value: "wfo",    label: "WFO / Office" },
  { value: "hybrid", label: "Hybrid" },
];

const JOB_TYPES = ["full-time", "part-time", "contract", "freelance", "internship"];

const SOURCES = [
  { value: "manual",  label: "Manual post" },
  { value: "hr_lead", label: "HR Lead (commission-based)" },
];

interface FormData {
  title: string;
  company: string;
  company_logo_url: string;
  location: string;
  work_type: string;
  job_type: string;
  category: string;
  description: string;
  requirements: string;
  salary_range: string;
  apply_url: string;
  apply_via_nexguild: boolean;
  tags: string;
  source: string;
  is_active: boolean;
  is_featured: boolean;
  hr_name: string;
  hr_contact: string;
  commission_note: string;
  expires_at: string;
}

const DEFAULT: FormData = {
  title: "", company: "", company_logo_url: "", location: "India",
  work_type: "remote", job_type: "full-time", category: "Customer Service",
  description: "", requirements: "", salary_range: "",
  apply_url: "", apply_via_nexguild: false,
  tags: "", source: "manual",
  is_active: true, is_featured: false,
  hr_name: "", hr_contact: "", commission_note: "", expires_at: "",
};

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function inputCls() {
  return "w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)]";
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{ backgroundColor: value ? "#14b8a6" : "#374151", transition: "background-color 0.2s" }}
        className="h-6 w-11 rounded-full relative flex-shrink-0"
      >
        <span
          style={{ transform: value ? "translateX(22px)" : "translateX(2px)", transition: "transform 0.2s" }}
          className="absolute top-[2px] left-0 h-5 w-5 rounded-full bg-white shadow"
        />
      </button>
      <span className="text-sm text-[var(--text-primary)]">{label}</span>
    </div>
  );
}

export default function AdminJobsNewPage() {
  const allowed = usePageGuard(ADMIN_ROLES.REVIEW);
  const router  = useRouter();
  const [form, setForm]     = useState<FormData>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(key: keyof FormData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          expires_at: form.expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin/jobs");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!allowed) return null;

  const isHrLead = form.source === "hr_lead";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Core info */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Job Info</h2>

          <Field label="Job Title" required>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls()} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" required>
              <input required value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Company Logo URL" hint="Optional — paste image URL">
              <input value={form.company_logo_url} onChange={(e) => set("company_logo_url", e.target.value)} className={inputCls()} placeholder="https://…" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls()}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Source">
              <select value={form.source} onChange={(e) => set("source", e.target.value)} className={inputCls()}>
                {SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Work Type">
              <select value={form.work_type} onChange={(e) => set("work_type", e.target.value)} className={inputCls()}>
                {WORK_TYPES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
            </Field>
            <Field label="Job Type">
              <select value={form.job_type} onChange={(e) => set("job_type", e.target.value)} className={inputCls()}>
                {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => set("location", e.target.value)} className={inputCls()} />
            </Field>
          </div>

          <Field label="Salary / CTC Range" hint="e.g. ₹15,000–₹25,000/month or ₹3–5 LPA">
            <input value={form.salary_range} onChange={(e) => set("salary_range", e.target.value)} className={inputCls()} />
          </Field>

          <Field label="Tags" hint="Comma-separated: e.g. Voice, BPO, Night Shift">
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls()} placeholder="Voice, BPO, Night Shift" />
          </Field>
        </div>

        {/* Description */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</h2>
          <Field label="Job Description" required>
            <textarea
              required
              rows={6}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)]"
            />
          </Field>
          <Field label="Requirements / Eligibility">
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)]"
            />
          </Field>
        </div>

        {/* Application */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Application</h2>
          <Toggle
            value={form.apply_via_nexguild}
            onChange={(v) => set("apply_via_nexguild", v)}
            label="Accept applications via NexGuild (shows in-app form)"
          />
          {!form.apply_via_nexguild && (
            <Field label="External Apply URL" hint="Leave blank if apply_via_nexguild is on">
              <input value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} className={inputCls()} placeholder="https://…" />
            </Field>
          )}
          <Field label="Expires At" hint="Leave blank for no expiry">
            <input type="date" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} className={inputCls()} />
          </Field>
        </div>

        {/* HR Lead info (internal) */}
        {isHrLead && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4">
            <h2 className="text-xs font-bold text-violet-400 uppercase tracking-wider">HR Contact (Internal)</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="HR Name">
                <input value={form.hr_name} onChange={(e) => set("hr_name", e.target.value)} className={inputCls()} />
              </Field>
              <Field label="HR Email / Phone">
                <input value={form.hr_contact} onChange={(e) => set("hr_contact", e.target.value)} className={inputCls()} />
              </Field>
            </div>
            <Field label="Commission Note" hint="e.g. ₹5,000 per successful hire — not shown publicly">
              <input value={form.commission_note} onChange={(e) => set("commission_note", e.target.value)} className={inputCls()} />
            </Field>
          </div>
        )}

        {/* Publish settings */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Settings</h2>
          <Toggle value={form.is_active} onChange={(v) => set("is_active", v)} label="Active (visible on jobs page)" />
          <Toggle value={form.is_featured} onChange={(v) => set("is_featured", v)} label="Featured (shown at top with star)" />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Link href="/admin/jobs" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</> : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
