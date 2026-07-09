import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug, type PostMeta } from "@/lib/blog";
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

function getRelatedPosts(current: PostMeta, all: PostMeta[]): PostMeta[] {
  const others = all.filter((p) => p.slug !== current.slug);

  // Meaningful words from slug (length > 3 filters out stop-words like "the", "for", "how")
  const slugWords = current.slug.split("-").filter((w) => w.length > 3);

  const related = others.filter(
    (p) =>
      p.category === current.category ||
      slugWords.some((w) => p.slug.includes(w))
  );

  const byDate = (a: PostMeta, b: PostMeta) =>
    new Date(b.date).getTime() - new Date(a.date).getTime();

  if (related.length >= 2) return related.sort(byDate).slice(0, 3);

  // Fallback: 3 most recent posts
  return others.sort(byDate).slice(0, 3);
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

  const catStyle     = CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE["Remote Work"];
  const relatedPosts = getRelatedPosts(post, getAllPosts());

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

      {/* ── Related Posts ─────────────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <div className="px-6 pb-14">
          <div className="mx-auto max-w-2xl">
            <h2
              className="text-xl font-bold text-[#0F3D36] mb-5"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group block"
                >
                  <article
                    className="h-full rounded-xl p-5 flex flex-col gap-2 transition-all duration-200 hover:translate-y-[-2px] hover:bg-white hover:shadow-md"
                    style={{
                      background: "rgba(255,255,255,0.55)",
                      border: "1.5px solid rgba(13,148,136,0.12)",
                    }}
                  >
                    <h3
                      className="text-sm font-bold text-[#0F3D36] group-hover:text-[#0D9488] transition-colors leading-snug"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {p.title}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed flex-1">
                      {p.description.length > 100
                        ? p.description.slice(0, 100) + "…"
                        : p.description}
                    </p>
                    <span className="text-xs font-semibold text-[#0D9488] group-hover:translate-x-0.5 transition-transform inline-block mt-1">
                      Read More →
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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
