"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  project_type: string | null;
  budget: number | null;
  deadline: string | null;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-500/10 text-green-400",
  paused:    "bg-yellow-500/10 text-yellow-400",
  completed: "bg-blue-500/10 text-blue-400",
};

export default function AdminProjectsPage() {
  const tokenRef = useRef<string | null>(null);
  const allowed = usePageGuard(ADMIN_ROLES.REVIEW);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      const res = await fetch("/api/admin/projects", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
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

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage all managed projects and their tasks.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-4">
          <p className="text-sm text-red-400">{error}</p>
          {error.includes("projects") && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              If you haven&apos;t created the <code>projects</code> table yet, run the SQL from the admin setup guide in your Supabase SQL Editor.
            </p>
          )}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-4 text-center">
          <FolderOpen className="h-10 w-10 text-[var(--text-muted)]" />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">No projects yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Create a project to manage contributor tasks and budgets.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/projects/new"><Plus className="h-4 w-4" /> New Project</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Name", "Client", "Type", "Budget", "Deadline", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[200px]">
                    <p className="truncate">{p.name}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.client_name ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">{p.project_type ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                    {p.budget != null ? `₹${Number(p.budget).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                    {p.deadline
                      ? new Date(p.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[p.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-muted)]"}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
