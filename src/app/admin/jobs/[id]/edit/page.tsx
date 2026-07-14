"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users } from "lucide-react";
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

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  applicant_role: string | null;
  experience_years: string | null;
  message: string | null;
  created_at: string;
}

function inputCls() {
  return "w-full h-9 px-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)]";
}

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

export default function AdminJobsEditPage() {
  const allowed = usePageGuard(ADMIN_ROLES.REVIEW);
  const router  = useRouter();
  const { id }  = useParams<{ id: string }>();

  const [loadingJob, setLoadingJob]   = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showApps, setShowApps]       = useState(false);

  const [form, setForm] = useState({
    title: "", company: "", company_logo_url: "", location: "India",
    work_type: "remote", job_type: "full-time", category: "Customer Service",
    description: "", requirements: "", salary_range: "",
    apply_url: "", apply_via_nexguild: false,
    tags: "",
    source: "manual", is_active: true, is_featured: false,
    hr_name: "", hr_contact: "", commission_note: "", expires_at: "",
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    if (!allowed || !id) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/jobs/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError("Job not found"); setLoadingJob(false); return; }
      const j = data.job;
      setForm({
        title:               j.title ?? "",
        company:             j.company ?? "",
        company_logo_url:    j.company_logo_url ?? "",
        location:            j.location ?? "India",
        work_type:           j.work_type ?? "remote",
        job_type:            j.job_type ?? "full-time",
        category:            j.category ?? "Customer Service",
        description:         j.description ?? "",
        requirements:        j.requirements ?? "",
        salary_range:        j.salary_range ?? "",
        apply_url:           j.apply_url ?? "",
        apply_via_nexguild:  j.apply_via_nexguild ?? false,
        tags:                (j.tags ?? []).join(", "),
        source:              j.source ?? "manual",
        is_active:           j.is_active ?? true,
        is_featured:         j.is_featured ?? false,
        hr_name:             j.hr_name ?? "",
        hr_contact:          j.hr_contact ?? "",
        commission_note:     j.commission_note ?? "",
        expires_at:          j.expires_at ? j.expires_at.slice(0, 10) : "",
      });
      setApplications(data.applications ?? []);
      setLoadingJob(false);
    })();
  }, [allowed, id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: "PUT",
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

  if (loadingJob) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  const isHrLead = form.source === "hr_lead";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Edit Job</h1>
          {applications.length > 0 && (
            <button
              type="button"
              onClick={() => setShowApps(!showApps)}
              className="flex items-center gap-1.5 text-sm text-[var(--brand-500)] hover:underline"
            >
              <Users className="h-4 w-4" />
              {applications.length} Application{applications.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Applications panel */}
      {showApps && applications.length > 0 && (
        <div className="mb-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] divide-y divide-[var(--border-subtle)]">
          <div className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Applications</div>
          {applications.map((a) => (
            <div key={a.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold text-[var(--text-primary)]">{a.full_name}</p>
                <p className="text-xs text-[var(--text-muted)]">{new Date(a.created_at).toLocaleDateString("en-IN")}</p>
              </div>
              <p className="text-xs text-[var(--text-muted)]">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
              {a.applicant_role && <p className="text-xs text-[var(--text-muted)]">{a.applicant_role} · {a.experience_years ?? "—"}</p>}
              {a.message && <p className="text-xs text-[var(--text-muted)] mt-1 italic">&ldquo;{a.message}&rdquo;</p>}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Job Info</h2>
          <Field label="Job Title" required>
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputCls()} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" required>
              <input required value={form.company} onChange={(e) => set("company", e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Company Logo URL">
              <input value={form.company_logo_url} onChange={(e) => set("company_logo_url", e.target.value)} className={inputCls()} placeholder="https://…" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
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
          <Field label="Salary / CTC Range">
            <input value={form.salary_range} onChange={(e) => set("salary_range", e.target.value)} className={inputCls()} />
          </Field>
          <Field label="Tags" hint="Comma-separated">
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls()} />
          </Field>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</h2>
          <Field label="Job Description" required>
            <textarea required rows={6} value={form.description} onChange={(e) => set("description", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)]"
            />
          </Field>
          <Field label="Requirements / Eligibility">
            <textarea rows={3} value={form.requirements} onChange={(e) => set("requirements", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] text-sm text-[var(--text-primary)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 focus:border-[var(--brand-500)]"
            />
          </Field>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Application</h2>
          <Toggle value={form.apply_via_nexguild} onChange={(v) => set("apply_via_nexguild", v)} label="Accept applications via NexGuild" />
          {!form.apply_via_nexguild && (
            <Field label="External Apply URL">
              <input value={form.apply_url} onChange={(e) => set("apply_url", e.target.value)} className={inputCls()} placeholder="https://…" />
            </Field>
          )}
          <Field label="Expires At">
            <input type="date" value={form.expires_at} onChange={(e) => set("expires_at", e.target.value)} className={inputCls()} />
          </Field>
        </div>

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
            <Field label="Commission Note">
              <input value={form.commission_note} onChange={(e) => set("commission_note", e.target.value)} className={inputCls()} />
            </Field>
          </div>
        )}

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 space-y-4">
          <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Settings</h2>
          <Toggle value={form.is_active} onChange={(v) => set("is_active", v)} label="Active (visible on jobs page)" />
          <Toggle value={form.is_featured} onChange={(v) => set("is_featured", v)} label="Featured (shown at top with star)" />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Link href="/admin/jobs" className="flex-1">
            <Button type="button" variant="secondary" className="w-full">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving…</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
