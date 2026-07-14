"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase, Plus, Loader2, Pencil, Trash2, Search,
  CheckCircle2, XCircle, Star, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  work_type: string;
  job_type: string;
  category: string;
  source: string;
  is_active: boolean;
  is_featured: boolean;
  apply_via_nexguild: boolean;
  posted_at: string;
  created_at: string;
  application_count: number;
}

const SOURCE_META: Record<string, { label: string; cls: string }> = {
  manual:   { label: "Manual",   cls: "bg-slate-500/10 text-slate-400" },
  hr_lead:  { label: "HR Lead",  cls: "bg-violet-500/10 text-violet-400" },
};

const WORK_TYPE_META: Record<string, string> = {
  remote: "Remote",
  wfh:    "WFH",
  wfo:    "WFO",
  hybrid: "Hybrid",
};

export default function AdminJobsPage() {
  const tokenRef = useRef<string | null>(null);
  const allowed  = usePageGuard(ADMIN_ROLES.REVIEW);

  const [jobs, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      tokenRef.current = data.session?.access_token ?? null;
    });
  }, []);

  useEffect(() => {
    if (!allowed) return;
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function fetchJobs() {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    try {
      const res = await fetch("/api/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs(data.jobs ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(job: Job) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !job.is_active }),
    });
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
  }

  async function toggleFeatured(job: Job) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/admin/jobs/${job.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: !job.is_featured }),
    });
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, is_featured: !j.is_featured } : j));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`/api/admin/jobs/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    setJobs((prev) => prev.filter((j) => j.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  const filtered = jobs.filter((j) =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
  );

  if (!allowed) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[var(--brand-500)]/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-[var(--brand-500)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Jobs</h1>
            <p className="text-xs text-[var(--text-muted)]">{jobs.length} total</p>
          </div>
        </div>
        <Link href="/admin/jobs/new">
          <Button size="sm" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs or company…"
          className="w-full pl-9 pr-4 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-bg)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase className="mx-auto h-10 w-10 mb-3 text-[var(--text-muted)] opacity-40" />
          <p className="text-sm text-[var(--text-muted)]">No jobs yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const src = SOURCE_META[job.source] ?? SOURCE_META.manual;
            return (
              <div
                key={job.id}
                className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] px-4 py-3 hover:border-[var(--brand-500)]/30 transition-colors"
              >
                {/* Logo placeholder */}
                <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-[var(--brand-500)]/10 flex items-center justify-center text-[var(--brand-500)] font-bold">
                  {job.company[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{job.title}</p>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${src.cls}`}>{src.label}</span>
                    {job.is_featured && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">
                        <Star className="h-2.5 w-2.5" /> Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {job.company} · {WORK_TYPE_META[job.work_type] ?? job.work_type} · {job.category}
                  </p>
                </div>

                {/* Applications count */}
                {job.apply_via_nexguild && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <Users className="h-3.5 w-3.5" />
                    <span>{job.application_count}</span>
                  </div>
                )}

                {/* Status toggle */}
                <button
                  onClick={() => toggleActive(job)}
                  className="hidden sm:flex items-center gap-1 text-xs font-medium transition-colors"
                  title={job.is_active ? "Deactivate" : "Activate"}
                >
                  {job.is_active ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-slate-500" />
                  )}
                </button>

                {/* Featured toggle */}
                <button
                  onClick={() => toggleFeatured(job)}
                  title={job.is_featured ? "Unfeature" : "Feature"}
                  className="hidden sm:flex"
                >
                  <Star className={`h-4 w-4 transition-colors ${job.is_featured ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
                </button>

                {/* Edit */}
                <Link href={`/admin/jobs/${job.id}/edit`}>
                  <button className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--admin-sidebar-item-hover)] transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </Link>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(job)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Delete job?</h3>
            <p className="text-sm text-[var(--text-muted)] mb-5">
              &ldquo;{deleteTarget.title}&rdquo; at {deleteTarget.company} will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
