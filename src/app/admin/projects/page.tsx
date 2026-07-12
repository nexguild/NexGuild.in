"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FolderOpen, Plus, Loader2, Eye, Pencil, Trash2,
  CheckCircle2, Clock, AlertCircle, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  description: string | null;
  status: string;
  deadline: string | null;
  total_budget_nc: number;
  client_payment_amount: string | null;
  client_payment_received: boolean;
  created_at: string;
  task_count: number;
  nc_paid: number;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:        { label: "Draft",        cls: "bg-slate-500/10 text-slate-400" },
  active:       { label: "Active",       cls: "bg-green-500/10 text-green-400" },
  under_review: { label: "Under Review", cls: "bg-amber-500/10 text-amber-400" },
  completed:    { label: "Completed",    cls: "bg-blue-500/10 text-blue-400" },
  paused:       { label: "Paused",       cls: "bg-red-500/10 text-red-400" },
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function DeadlinePill({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-[var(--text-muted)] text-xs">No deadline</span>;
  const days = daysUntil(deadline);
  if (days < 0) return <span className="text-xs font-medium text-red-400">Overdue by {Math.abs(days)}d</span>;
  if (days === 0) return <span className="text-xs font-medium text-red-400">Due today</span>;
  if (days <= 7) return <span className="text-xs font-medium text-amber-400">Due in {days}d</span>;
  return <span className="text-xs text-[var(--text-muted)]">Due in {days}d</span>;
}

export default function AdminProjectsPage() {
  const tokenRef = useRef<string | null>(null);
  const allowed  = usePageGuard(ADMIN_ROLES.REVIEW);

  const [projects, setProjects]       = useState<Project[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting]       = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      const res = await fetch("/api/admin/projects", {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Failed to load projects.");
      } else {
        const { projects: data } = await res.json() as { projects: Project[] };
        setProjects(data ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/admin/projects/${deleteTarget.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  }

  // Stats
  const total     = projects.length;
  const active    = projects.filter((p) => p.status === "active").length;
  const completed = projects.filter((p) => p.status === "completed").length;
  const totalNC   = projects.reduce((s, p) => s + (p.nc_paid ?? 0), 0);

  const filtered = projects.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.client_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage client projects and linked tasks.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
        </Button>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Projects", value: total,     icon: <FolderOpen className="h-4 w-4" /> },
            { label: "Active",         value: active,    icon: <CheckCircle2 className="h-4 w-4 text-green-400" /> },
            { label: "Completed",      value: completed, icon: <CheckCircle2 className="h-4 w-4 text-blue-400" /> },
            { label: "Total NC Paid",  value: totalNC.toLocaleString(), icon: <span className="text-sm font-bold text-amber-400">NC</span> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 flex items-center gap-3">
              <div className="text-[var(--text-muted)]">{s.icon}</div>
              <div>
                <p className="text-lg font-bold text-[var(--text-primary)] leading-tight">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
          <option value="all">All Status</option>
          {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-4 text-center">
          <FolderOpen className="h-10 w-10 text-[var(--text-muted)]" />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">{projects.length === 0 ? "No projects yet" : "No results"}</p>
            <p className="text-sm text-[var(--text-secondary)]">{projects.length === 0 ? "Create your first client project." : "Try adjusting your filters."}</p>
          </div>
          {projects.length === 0 && <Button asChild size="sm"><Link href="/admin/projects/new"><Plus className="h-4 w-4" /> New Project</Link></Button>}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Project", "Client", "Status", "Deadline", "Tasks", "NC Budget", "Payment", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filtered.map((p) => {
                const meta   = STATUS_META[p.status] ?? STATUS_META.draft;
                const ncPct  = p.total_budget_nc > 0 ? Math.min(100, Math.round((p.nc_paid / p.total_budget_nc) * 100)) : 0;
                return (
                  <tr key={p.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                    {/* Project name */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                      {p.description && <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{p.description}</p>}
                    </td>
                    {/* Client */}
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{p.client_name ?? "—"}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
                    </td>
                    {/* Deadline */}
                    <td className="px-4 py-3 whitespace-nowrap"><DeadlinePill deadline={p.deadline} /></td>
                    {/* Tasks */}
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{p.task_count ?? 0}</td>
                    {/* NC Budget */}
                    <td className="px-4 py-3 min-w-[120px]">
                      {p.total_budget_nc > 0 ? (
                        <div>
                          <p className="text-xs text-[var(--text-muted)] mb-1">{(p.nc_paid ?? 0).toLocaleString()} / {p.total_budget_nc.toLocaleString()} NC</p>
                          <div className="h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden w-24">
                            <div className="h-full rounded-full bg-[var(--brand-500)]" style={{ width: `${ncPct}%` }} />
                          </div>
                        </div>
                      ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                    {/* Payment */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.client_payment_amount ? (
                        p.client_payment_received
                          ? <span className="inline-flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="h-3 w-3" /> Received</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-amber-400"><Clock className="h-3 w-3" /> Awaiting</span>
                      ) : <span className="text-[var(--text-muted)] text-xs">—</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/admin/projects/${p.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/admin/projects/${p.id}?tab=overview&edit=1`}><Pencil className="h-3.5 w-3.5" /></Link>
                        </Button>
                        <Button variant="secondary" size="sm"
                          onClick={() => setDeleteTarget(p)}
                          className="text-red-400 hover:text-red-300 hover:border-red-500/30">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-2xl border border-[var(--border-default)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="font-bold text-[var(--text-primary)]">Delete Project?</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">&ldquo;{deleteTarget.name}&rdquo;</span>{" "}
              will be permanently deleted. All linked tasks will be unlinked (not deleted).
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={deleting} onClick={confirmDelete}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
