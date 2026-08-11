"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, Save, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import Link from "next/link";

interface PostData {
  filename: string;
  slug:     string;
  title:    string;
  description: string;
  category: string;
  date:     string;
  tags:     string[];
  content:  string;
}

const CATEGORIES = [
  "Remote Work", "Earning Tips", "Platform Review",
  "Freelancing", "Surveys", "Offerwalls", "Other",
];

function Counter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const cls = len > max ? "text-red-400 font-semibold" : len > max * 0.85 ? "text-amber-400" : "text-[var(--text-muted)]";
  return <span className={`text-xs tabular-nums ${cls}`}>{len}/{max}</span>;
}

function EditInner() {
  const params   = useSearchParams();
  const tokenRef = useRef<string | null>(null);
  const allowed  = usePageGuard(ADMIN_ROLES.REVIEW);

  const filename = params.get("file") ?? "";

  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState<string | null>(null);
  const [post,     setPost]     = useState<PostData | null>(null);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("Remote Work");
  const [date,        setDate]        = useState("");
  const [tags,        setTags]        = useState("");
  const [content,     setContent]     = useState("");

  const [saving,  setSaving]  = useState(false);
  const [saveOk,  setSaveOk]  = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      if (!filename) { setLoadErr("No file specified."); setLoading(false); return; }

      const res = await fetch(`/api/admin/blog/get?filename=${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setLoadErr(d.error ?? "Failed to load post.");
        setLoading(false);
        return;
      }

      const data = await res.json() as PostData;
      setPost(data);
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category || "Remote Work");
      setDate(data.date);
      setTags(data.tags.join(", "));
      setContent(data.content);
      setLoading(false);
    }
    load();
  }, [filename]);

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(false);

    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const res = await fetch("/api/admin/blog/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenRef.current}`,
      },
      body: JSON.stringify({
        filename:    post.filename,
        title,
        description,
        category,
        date,
        tags:        tagArray,
        content,
      }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setSaveErr(d.error ?? "Save failed. Try again.");
    } else {
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 4000);
    }
    setSaving(false);
  }

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (loadErr || !post) {
    return (
      <div className="space-y-4">
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{loadErr ?? "Post not found."}</p>
        </div>
      </div>
    );
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Blog
          </Link>
          <span className="text-[var(--text-muted)]">/</span>
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">{post.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saveOk && (
            <span className="flex items-center gap-1.5 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" /> Saved & live
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              : <Save className="h-4 w-4 mr-1.5" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {saveErr && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{saveErr}</p>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_272px] gap-5 items-start">

        {/* LEFT — main fields */}
        <div className="space-y-4">

          {/* Title */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Title <span className="text-red-400">*</span>
              </label>
              <Counter value={title} max={60} />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title…"
              className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            />
            {title.length > 60 && (
              <p className="text-xs text-red-400">Over 60 chars — Google will truncate this in search results.</p>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Description <span className="text-red-400">*</span>
              </label>
              <Counter value={description} max={155} />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Shown in Google search results. Don't repeat the title — add a specific promise."
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
            />
            {description.length > 155 && (
              <p className="text-xs text-red-400">Over 155 chars — Google will cut this off mid-sentence.</p>
            )}
          </div>

          {/* Content */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">Content (Markdown)</label>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">{wordCount.toLocaleString()} words</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Do <strong>not</strong> add a # Title at the top — the page template renders H1 automatically.
              Use ## for sections.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={32}
              spellCheck
              className="w-full px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] font-mono leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* RIGHT — metadata sidebar */}
        <div className="space-y-4">

          {/* Slug (read-only) */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Slug</label>
            <p className="text-xs text-[var(--text-muted)]">
              Cannot be changed — editing would break Google rankings and all existing links.
            </p>
            <div className="px-3 py-2 rounded-md bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-muted)] font-mono break-all select-all">
              {post.slug}
            </div>
          </div>

          {/* Category */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Date */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            />
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Tags</label>
            <p className="text-xs text-[var(--text-muted)]">Comma-separated</p>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="surveys, online earning, tips"
              className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            />
          </div>

          {/* Live link */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Live on site</label>
            <a
              href={`https://www.nexguild.in/earn/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-500)] hover:underline break-all"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              /earn/blog/{post.slug}
            </a>
          </div>

          {/* SEO reminder */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-amber-400">SEO reminder</p>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc list-inside">
              <li>Title ≤ 60 chars</li>
              <li>Description ≤ 155 chars</li>
              <li>No # Title in content</li>
              <li>After saving, request indexing in GSC</li>
            </ul>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              : <Save className="h-4 w-4 mr-1.5" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditBlogPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    }>
      <EditInner />
    </Suspense>
  );
}
