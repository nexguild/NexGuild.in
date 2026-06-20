import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { AdSlot } from "@/components/ui/ad-slot";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const catStyle = CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE["Remote Work"];

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>

      {/* ── Post Header ───────────────────────────────────────────── */}
      <section
        className="py-16 px-6"
        style={{ borderBottom: "1px solid rgba(13,148,136,0.08)" }}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:underline"
            style={{ color: "#0D9488" }}
          >
            ← Back to Blog
          </Link>

          <div className="mb-4">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{
                background: catStyle.bg,
                color: catStyle.text,
                border: `1px solid ${catStyle.border}`,
              }}
            >
              {post.category}
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-[#0F3D36]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {post.title}
          </h1>
          <p className="text-sm text-stone-400">{post.readingTime} min read</p>
        </div>
      </section>

      {/* ── Ad Slot (top of content) ───────────────────────────────── */}
      <div className="px-6 py-6">
        <div className="mx-auto max-w-2xl">
          <AdSlot placement="blog-post-top" />
        </div>
      </div>

      {/* ── Article Body ──────────────────────────────────────────── */}
      <article className="px-6 pb-12">
        <div
          className="mx-auto max-w-2xl blog-prose"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>

      {/* ── Ad Slot (end of content) ──────────────────────────────── */}
      <div className="px-6 pb-10">
        <div className="mx-auto max-w-2xl">
          <AdSlot placement="blog-post-end" />
        </div>
      </div>

      {/* ── Back Link ─────────────────────────────────────────────── */}
      <div className="px-6 pb-20">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
            style={{ color: "#0D9488" }}
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
