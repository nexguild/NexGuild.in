"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText, Plus, Loader2, Trash2, Eye, AlertCircle, ExternalLink, RefreshCw, Calendar, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface BlogPost {
  filename: string;
  sha: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  category: string;
  wordCount: number;
}

export default function AdminBlogPage() {
  const allowed  = usePageGuard(ADMIN_ROLES.REVIEW);
  const tokenRef = useRef<string | null>(null);

  const [posts, setPosts]           = useState<BlogPost[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting]     = useState(false);

  async function load() {
    setLoading(true); setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    tokenRef.current = session?.access_token ?? null;
    const res = await fetch("/api/admin/blog/list", {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? "Failed to load blog posts.");
    } else {
      const { posts: data } = await res.json() as { posts: BlogPost[] };
      setPosts(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/blog/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ filename: deleteTarget.filename, sha: deleteTarget.sha }),
    });
    if (res.ok) {
      setPosts((p) => p.filter((post) => post.filename !== deleteTarget.filename));
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? "Delete failed.");
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Blog Posts</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage published blog content on nexguild.in/blog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/blog/generate"><Plus className="h-4 w-4" /> Generate New Post</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(() => {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const thisWeek = posts.filter((p) => p.date && new Date(p.date) >= weekStart).length;
            return [
              { label: "Total Posts",    value: posts.length },
              { label: "Total Words",    value: posts.reduce((s, p) => s + p.wordCount, 0).toLocaleString() },
              { label: "Avg Word Count", value: posts.length ? Math.round(posts.reduce((s, p) => s + p.wordCount, 0) / posts.length).toLocaleString() : "—" },
              { label: "This Week",      value: `${thisWeek} / 7`, highlight: thisWeek >= 7 },
            ];
          })().map((s) => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${"highlight" in s && s.highlight ? "border-green-500/30 bg-green-500/5" : "border-[var(--border-default)] bg-[var(--surface-card)]"}`}>
              <p className={`text-xl font-bold ${"highlight" in s && s.highlight ? "text-green-400" : "text-[var(--text-primary)]"}`}>{s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-4 text-center">
          <FileText className="h-10 w-10 text-[var(--text-muted)]" />
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">No blog posts yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Generate your first AI-powered blog post.</p>
          </div>
          <Button asChild size="sm"><Link href="/admin/blog/generate"><Plus className="h-4 w-4" /> Generate Post</Link></Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Post", "Slug", "Date", "Words", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {posts.map((p) => (
                <tr key={p.filename} className="hover:bg-[var(--surface-subtle)] transition-colors">
                  <td className="px-4 py-3 max-w-[280px]">
                    <p className="font-medium text-[var(--text-primary)] truncate">{p.title}</p>
                    {p.description && (
                      <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{p.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono">
                      <Hash className="h-3 w-3" />{p.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.date ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${p.wordCount >= 1200 ? "text-green-400" : "text-amber-400"}`}>
                      {p.wordCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="secondary" size="sm" asChild>
                        <a href={`https://nexguild.in/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button variant="secondary" size="sm" asChild>
                        <a href={`https://github.com/${encodeURIComponent("nexguild/NexGuild.in")}/blob/main/src/content/blog/${p.filename}`}
                          target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button variant="secondary" size="sm"
                        onClick={() => setDeleteTarget(p)}
                        className="text-red-400 hover:text-red-300 hover:border-red-500/30">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <h2 className="font-bold text-[var(--text-primary)]">Delete Post?</h2>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">&ldquo;{deleteTarget.title}&rdquo;</span> will be permanently removed from GitHub and the live site.
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
