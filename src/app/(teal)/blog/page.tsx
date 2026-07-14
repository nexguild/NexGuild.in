import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { getAllPosts } from "@/lib/blog";
import { AdSlot } from "@/components/ui/ad-slot";
import { BlogFilter } from "@/components/blog/BlogFilter";

export const metadata: Metadata = {
  title: "Blog — Earning Guides, Remote Work Tips & NexGuild Updates",
  description:
    "Practical guides on remote work, online earning, micro-tasks, and making the most of NexGuild. Written for Indian contributors and digital workers.",
  alternates: { canonical: "https://nexguild.in/blog" },
  openGraph: {
    title: "NexGuild Blog — Earning Guides & Remote Work Tips",
    description:
      "Practical guides on online earning, micro-tasks, offerwalls, and remote work for Indian contributors.",
    url:  "https://nexguild.in/blog",
    type: "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "NexGuild Blog — Earning Guides & Remote Work Tips",
    description: "Practical guides on online earning, micro-tasks, and remote work for Indian contributors.",
  },
};

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

      {/* ── Posts (filtered) ──────────────────────────────────────── */}
      <section className="py-4 px-6 pb-24">
        <div className="mx-auto max-w-container">
          <BlogFilter posts={posts} />
        </div>
      </section>
    </div>
  );
}
