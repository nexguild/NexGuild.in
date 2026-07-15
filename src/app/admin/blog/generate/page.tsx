"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Sparkles, RefreshCw, CheckCircle2,
  AlertCircle, ExternalLink, Eye, Edit3, ChevronDown, ChevronUp, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

// ── Types ──────────────────────────────────────────────────────────────────────
interface GeneratedPost {
  title: string; slug: string; description: string;
  category: string; date: string; content: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function countH2(md: string) {
  return (md.match(/^## .+/gm) ?? []).length;
}

function keywordDensity(content: string, keyword: string): number {
  if (!keyword.trim() || !content.trim()) return 0;
  const totalWords = content.trim().split(/\s+/).filter(Boolean).length;
  if (totalWords === 0) return 0;
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = (content.match(new RegExp(escaped, "gi")) ?? []).length;
  return Math.round((matches / totalWords) * 1000) / 10;
}

// Light client-side markdown → HTML (handles ##, ###, **, *, bullets, numbered)
function mdToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-teal-400 underline">$1</a>')
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("<h")) return block;
      if (/^[*-] /.test(block.trim())) {
        const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^[*-] /, "")}</li>`).join("");
        return `<ul class="list-disc pl-5 space-y-1">${items}</ul>`;
      }
      if (/^\d+\. /.test(block.trim())) {
        const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`).join("");
        return `<ol class="list-decimal pl-5 space-y-1">${items}</ol>`;
      }
      if (block.trim()) return `<p>${block.trim()}</p>`;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

const ic = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-colors";
const lc = "block text-sm font-semibold text-[var(--text-primary)] mb-1.5";
const tc = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y";

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BlogGeneratePage() {
  const allowed  = usePageGuard(ADMIN_ROLES.REVIEW);
  const tokenRef = useRef<string | null>(null);

  // Phase: form → loading → preview
  const [phase, setPhase] = useState<"form" | "loading" | "preview">("form");

  // Form fields
  const [topic, setTopic]       = useState("");
  const [keyword, setKeyword]   = useState("");
  const [angle, setAngle]       = useState("");
  const [audience, setAudience] = useState("Global");
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
  const [slugsLoading, setSlugsLoading]   = useState(false);
  const [genError, setGenError]           = useState<string | null>(null);

  // Generated/editable post
  const [post, setPost]         = useState<GeneratedPost | null>(null);
  const [editTitle, setEditTitle]       = useState("");
  const [editSlug, setEditSlug]         = useState("");
  const [editDesc, setEditDesc]         = useState("");
  const [editContent, setEditContent]   = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDate, setEditDate]         = useState("");

  // Preview mode toggle
  const [showPreview, setShowPreview] = useState(true);

  // Publish state
  const [publishing, setPublishing]   = useState(false);
  const [published, setPublished]     = useState<{ slug: string; url: string } | null>(null);
  const [pubError, setPubError]       = useState<string | null>(null);

  // Topic suggestions
  const [suggestions, setSuggestions]         = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      tokenRef.current = session?.access_token ?? null;
    });
    loadSlugs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSlugs() {
    setSlugsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    const res = await fetch("/api/admin/blog/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { posts } = await res.json() as { posts: { slug: string }[] };
      const slugs = (posts ?? []).map((p) => p.slug);
      setExistingSlugs(slugs);
      loadSuggestions(slugs, token);
    }
    setSlugsLoading(false);
  }

  async function loadSuggestions(slugs?: string[], overrideToken?: string | null) {
    setSuggestionsLoading(true);
    const token = overrideToken ?? tokenRef.current;
    const res = await fetch("/api/admin/blog/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ existingSlugs: slugs ?? existingSlugs }),
    });
    if (res.ok) {
      const { suggestions: s } = await res.json() as { suggestions: string[] };
      setSuggestions(s ?? []);
    }
    setSuggestionsLoading(false);
  }

  async function generate() {
    if (!topic.trim()) { setGenError("Topic is required."); return; }
    setGenError(null);
    setPhase("loading");
    setPublished(null);
    setPubError(null);

    const res = await fetch("/api/admin/blog/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ topic, keyword, angle, audience }),
    });

    const data = await res.json() as { ok?: boolean; post?: GeneratedPost; error?: string };
    if (!res.ok || !data.post) {
      setGenError(data.error ?? "Generation failed.");
      setPhase("form");
      return;
    }

    const p = data.post;
    setPost(p);
    setEditTitle(p.title);
    setEditSlug(p.slug);
    setEditDesc(p.description);
    setEditContent(p.content);
    setEditCategory(p.category);
    setEditDate(p.date);
    setPhase("preview");
  }

  async function publish() {
    setPublishing(true); setPubError(null);
    const res = await fetch("/api/admin/blog/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        title: editTitle, slug: editSlug, description: editDesc,
        content: editContent, category: editCategory, date: editDate,
      }),
    });
    const data = await res.json() as { ok?: boolean; slug?: string; url?: string; error?: string };
    if (res.ok && data.url) {
      setPublished({ slug: data.slug ?? editSlug, url: data.url });
    } else {
      setPubError(data.error ?? "Publish failed.");
    }
    setPublishing(false);
  }

  // SEO scores
  const wordCount  = countWords(editContent);
  const h2Count    = countH2(editContent);
  const titleLen   = editTitle.length;
  const descLen    = editDesc.length;
  const kwDensity  = keywordDensity(editContent, keyword);
  const slugDuplicate = existingSlugs.includes(editSlug) && editSlug !== post?.slug;

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/blog" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Blog Generator</h1>
          <p className="text-sm text-[var(--text-secondary)]">Generate SEO-optimised posts with Groq AI (llama-3.3-70b)</p>
        </div>
      </div>

      {/* ── FORM PHASE ────────────────────────────────────────────────────── */}
      {phase === "form" && (
        <div className="space-y-5 max-w-2xl">

          {/* ── Today's Topic Ideas ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <h2 className="font-bold text-[var(--text-primary)] text-sm">
                  Today&apos;s Topic Ideas
                </h2>
                <span className="text-xs text-amber-400/80 font-medium">
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
              <button
                onClick={() => loadSuggestions()}
                disabled={suggestionsLoading}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${suggestionsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {suggestionsLoading ? (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating ideas…
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No suggestions yet — click Refresh to generate.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setTopic(s)}
                    className="text-left text-xs px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-[var(--text-muted)]">Click any idea to use it as your topic.</p>
          </section>

          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
            <h2 className="font-bold text-[var(--text-primary)]">Content Brief</h2>

            <div>
              <label className={lc}>Topic / Keyword <span className="text-[var(--danger-text)]">*</span></label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. how to earn money online for students in India" className={ic} />
            </div>

            <div>
              <label className={lc}>Target SEO Keyword <span className="text-xs font-normal text-[var(--text-muted)]">for title focus</span></label>
              <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. earn money online students" className={ic} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={lc}>Post Angle</label>
                <select value={angle} onChange={(e) => setAngle(e.target.value)} className={ic}>
                  <option value="">General guide</option>
                  <option value="General guide">General guide</option>
                  <option value="Review">Review</option>
                  <option value="Comparison">Comparison</option>
                  <option value="How-to">How-to</option>
                  <option value="Listicle">Listicle</option>
                  <option value="Case study">Case study</option>
                </select>
              </div>
              <div>
                <label className={lc}>Target Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className={ic}>
                  <option value="Global">Global (recommended)</option>
                  <option value="India">India</option>
                  <option value="US & Canada">US &amp; Canada</option>
                  <option value="UK & Europe">UK &amp; Europe</option>
                  <option value="Southeast Asia">Southeast Asia</option>
                  <option value="Students">Students</option>
                  <option value="Freelancers">Freelancers</option>
                  <option value="Remote Workers">Remote Workers</option>
                </select>
              </div>
            </div>
          </section>

          {/* Existing slugs */}
          <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--text-primary)] text-sm">Existing Posts ({existingSlugs.length})</h2>
              <button onClick={loadSlugs} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1">
                <RefreshCw className={`h-3 w-3 ${slugsLoading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
            {slugsLoading ? (
              <p className="text-xs text-[var(--text-muted)]">Loading…</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {existingSlugs.map((s) => (
                  <span key={s} className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)]">{s}</span>
                ))}
              </div>
            )}
          </section>

          {genError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{genError}</p>
            </div>
          )}

          <Button size="lg" onClick={generate} disabled={!topic.trim()}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold">
            <Sparkles className="h-4 w-4" /> Generate Blog Post
          </Button>
        </div>
      )}

      {/* ── LOADING PHASE ─────────────────────────────────────────────────── */}
      {phase === "loading" && (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="relative flex items-center justify-center h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" />
            <Sparkles className="h-10 w-10 text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--text-primary)] text-lg">Generating your blog post…</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">llama-3.3-70b is writing ~1,400 words · ~15 seconds</p>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
        </div>
      )}

      {/* ── PREVIEW PHASE ─────────────────────────────────────────────────── */}
      {phase === "preview" && post && (
        <div className="space-y-5">
          {/* Action bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => { setPhase("form"); setPublished(null); setPubError(null); }}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Form
            </Button>
            <Button variant="secondary" size="sm" onClick={generate}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <div className="flex-1" />
            {published ? (
              <a href={published.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-4 w-4" /> View Live Post <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Button size="sm" onClick={publish} disabled={publishing}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6">
                {publishing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</> : "Publish Now"}
              </Button>
            )}
          </div>

          {pubError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{pubError}</p>
            </div>
          )}

          {published && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-400">Post published! Going live at nexguild.in/blog/{published.slug}</p>
                <p className="text-xs text-green-400/70 mt-0.5">Vercel auto-deploys in ~1 minute. Trigger a redeploy if not live after 2 minutes.</p>
              </div>
            </div>
          )}

          <div className="lg:flex lg:gap-5 lg:items-start space-y-5 lg:space-y-0">
            {/* Left: editable fields + preview */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Editable metadata */}
              <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
                <h2 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wide">Metadata</h2>
                <div>
                  <label className={lc}>Title</label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={ic} />
                  <p className={`text-xs mt-1 ${titleLen >= 50 && titleLen <= 60 ? "text-green-400" : "text-amber-400"}`}>
                    {titleLen} chars · target 50–60
                  </p>
                </div>
                <div>
                  <label className={lc}>Slug</label>
                  <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className={ic} />
                  {slugDuplicate && <p className="text-xs text-red-400 mt-1">⚠ This slug already exists — change it to avoid overwriting.</p>}
                </div>
                <div>
                  <label className={lc}>Meta Description</label>
                  <textarea rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={tc} />
                  <p className={`text-xs mt-1 ${descLen >= 150 && descLen <= 160 ? "text-green-400" : "text-amber-400"}`}>
                    {descLen} chars · target 150–160
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lc}>Category</label>
                    <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Date</label>
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={ic} />
                  </div>
                </div>
              </section>

              {/* Content editor */}
              <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wide">Content</h2>
                  <button onClick={() => setShowPreview((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {showPreview ? <><Edit3 className="h-3.5 w-3.5" /> Edit</>  : <><Eye className="h-3.5 w-3.5" /> Preview</>}
                    {showPreview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {showPreview ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none text-[var(--text-secondary)] [&_h2]:text-[var(--text-primary)] [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-[var(--text-primary)] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:text-[var(--text-primary)] [&_code]:bg-[var(--surface-subtle)] [&_code]:px-1 [&_code]:rounded [&_code]:text-xs"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(editContent) }}
                  />
                ) : (
                  <textarea
                    rows={30}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={`${tc} font-mono text-xs leading-relaxed`}
                  />
                )}
              </section>
            </div>

            {/* Right: SEO panel */}
            <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 lg:sticky lg:top-20 space-y-4">
              <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
                <h2 className="font-bold text-[var(--text-primary)] text-sm">SEO Score</h2>
                {[
                  { label: "Word count", value: `${wordCount.toLocaleString()} words`, ok: wordCount >= 1200, note: "target 1,200+" },
                  { label: "Title length", value: `${titleLen} chars`, ok: titleLen >= 50 && titleLen <= 60, note: "target 50–60" },
                  { label: "Meta description", value: `${descLen} chars`, ok: descLen >= 150 && descLen <= 160, note: "target 150–160" },
                  { label: "H2 headings", value: `${h2Count} found`, ok: h2Count >= 5, note: "target 5+" },
                  { label: "Keyword density", value: keyword ? `${kwDensity}%` : "n/a", ok: keyword ? (kwDensity >= 0.3 && kwDensity <= 1.5) : true, note: "target 0.3–1.5%" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-2">
                    <span className={`text-base leading-none mt-0.5 ${row.ok ? "text-green-400" : "text-amber-400"}`}>
                      {row.ok ? "✅" : "⚠️"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{row.label}</p>
                      <p className={`text-xs ${row.ok ? "text-green-400" : "text-amber-400"}`}>{row.value}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{row.note}</p>
                    </div>
                  </div>
                ))}
              </section>

              <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-2">
                <h2 className="font-bold text-[var(--text-primary)] text-sm">Quick Actions</h2>
                <Button size="sm" variant="secondary" className="w-full justify-start gap-2" onClick={generate}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </Button>
                <Button size="sm"
                  className="w-full justify-start gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={publish} disabled={publishing}>
                  {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Publish Now"}
                </Button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
