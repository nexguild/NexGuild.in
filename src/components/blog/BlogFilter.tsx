"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostMeta } from "@/lib/blog";

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "Remote Work": { bg: "rgba(13,148,136,0.08)", text: "#0D9488", border: "rgba(13,148,136,0.2)" },
  NexGuild: { bg: "rgba(15,61,54,0.08)", text: "#0F3D36", border: "rgba(15,61,54,0.18)" },
};

function CategoryBadge({ category, small }: { category: string; small?: boolean }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["Remote Work"];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"}`}
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {category}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function BlogFilter({ posts }: { posts: PostMeta[] }) {
  const [active, setActive] = useState("All");

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <>
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              active === cat
                ? "bg-[#0D9488] text-white shadow-sm"
                : "border border-[rgba(13,148,136,0.2)] bg-white/60 text-stone-600 hover:bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured post — full width */}
      {featured && (
        <Link href={`/blog/${featured.slug}`} className="block mb-8 group">
          <article
            className="rounded-2xl p-8 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg"
            style={{
              background: "rgba(255,255,255,0.75)",
              border: "1.5px solid rgba(13,148,136,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <CategoryBadge category={featured.category} />
              <span className="text-xs text-stone-400">⏱ {featured.readingTime} min read</span>
              <span className="text-xs text-stone-400">📅 {formatDate(featured.date)}</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[#0F3D36] mb-3 group-hover:text-[#0D9488] transition-colors leading-snug"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {featured.title}
            </h2>
            <p className="text-stone-600 leading-relaxed mb-6 max-w-2xl">
              {featured.description}
            </p>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#0D9488,#0F766E)" }}
            >
              Read Article →
            </span>
          </article>
        </Link>
      )}

      {/* Remaining posts — 3-col grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <article
                className="flex h-full flex-col gap-3 rounded-xl p-6 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-teal-200 group-hover:shadow-md"
                style={{
                  background: "rgba(255,255,255,0.55)",
                  border: "1.5px solid rgba(13,148,136,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <CategoryBadge category={post.category} small />
                <h3
                  className="font-semibold leading-snug text-[#0F3D36] transition-colors group-hover:text-[#0D9488]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {post.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-stone-500 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center justify-between border-t border-[rgba(13,148,136,0.08)] pt-3 mt-auto">
                  <span className="text-xs text-stone-400">⏱ {post.readingTime} min read</span>
                  <span className="inline-block text-xs font-semibold text-[#0D9488] transition-transform group-hover:translate-x-0.5">
                    Read More →
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-stone-400">No posts in this category yet.</p>
      )}
    </>
  );
}
