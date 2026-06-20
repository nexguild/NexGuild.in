import Link from "next/link";
import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { getAllPosts } from "@/lib/blog";
import { AdSlot } from "@/components/ui/ad-slot";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical guides on remote work, online earning, micro-tasks, and making the most of NexGuild.",
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "Remote Work": {
    bg: "rgba(13,148,136,0.08)",
    text: "#0D9488",
    border: "rgba(13,148,136,0.2)",
  },
  NexGuild: {
    bg: "rgba(15,61,54,0.08)",
    text: "#0F3D36",
    border: "rgba(15,61,54,0.18)",
  },
};

function CategoryBadge({ category }: { category: string }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["Remote Work"];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {category}
    </span>
  );
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 text-center">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(45,212,191,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <FadeIn>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(13,148,136,0.18)",
              }}
            >
              <span className="text-xs font-bold text-[#115E59] uppercase tracking-wider">
                NexGuild Blog
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#0F3D36]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Insights &amp; Guides
            </h1>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
              Practical guides on remote work, online earning, and making the most of NexGuild.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Ad Slot ───────────────────────────────────────────────── */}
      <div className="px-6 pb-4">
        <div className="mx-auto max-w-container">
          <AdSlot placement="blog-index-top" />
        </div>
      </div>

      {/* ── Post Grid ─────────────────────────────────────────────── */}
      <section className="py-10 px-6 pb-24">
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post, i) => (
              <FadeIn key={post.slug} delay={i * 45} className="h-full">
                <Link href={`/blog/${post.slug}`} className="block h-full group">
                  <article
                    className="h-full rounded-2xl p-7 flex flex-col gap-3 transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md"
                    style={{
                      background: "rgba(255,255,255,0.45)",
                      border: "1.5px solid rgba(13,148,136,0.12)",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <CategoryBadge category={post.category} />
                    <h2
                      className="text-xl font-bold text-[#0F3D36] group-hover:text-[#0D9488] transition-colors leading-snug"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {post.title}
                    </h2>
                    <p className="text-sm text-stone-600 leading-relaxed flex-1">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[rgba(13,148,136,0.08)]">
                      <span className="text-xs text-stone-400">
                        {post.readingTime} min read
                      </span>
                      <span className="text-xs font-semibold text-[#0D9488] group-hover:translate-x-1 transition-transform inline-block">
                        Read more →
                      </span>
                    </div>
                  </article>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
