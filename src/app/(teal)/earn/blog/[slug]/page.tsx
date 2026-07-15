import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts, getPostBySlug, type PostMeta } from "@/lib/blog";
import { AdSlot } from "@/components/ui/ad-slot";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ReadingProgress } from "@/components/blog/ReadingProgress";

const SITE_URL = "https://www.nexguild.in";

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
  const url = `${SITE_URL}/earn/blog/${slug}`;
  return {
    title:       post.title,
    description: post.description,
    alternates:  { canonical: url },
    openGraph: {
      type:          "article",
      url,
      title:         post.title,
      description:   post.description,
      publishedTime: new Date(post.date).toISOString(),
      section:       post.category,
    },
    twitter: {
      card:        "summary_large_image",
      title:       post.title,
      description: post.description,
    },
  };
}

function getRelatedPosts(current: PostMeta, all: PostMeta[]): PostMeta[] {
  const others = all.filter((p) => p.slug !== current.slug);
  const slugWords = current.slug.split("-").filter((w) => w.length > 3);
  const related = others.filter(
    (p) => p.category === current.category || slugWords.some((w) => p.slug.includes(w))
  );
  const byDate = (a: PostMeta, b: PostMeta) =>
    new Date(b.date).getTime() - new Date(a.date).getTime();
  if (related.length >= 2) return related.sort(byDate).slice(0, 3);
  return others.sort(byDate).slice(0, 3);
}

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "Remote Work": { bg: "rgba(13,148,136,0.08)", text: "#0D9488", border: "rgba(13,148,136,0.2)" },
  NexGuild: { bg: "rgba(15,61,54,0.08)", text: "#0F3D36", border: "rgba(15,61,54,0.18)" },
};

function CategoryBadge({ category, small }: { category: string; small?: boolean }) {
  const s = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["Remote Work"];
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ${small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {category}
    </span>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post, getAllPosts());
  const postUrl = `${SITE_URL}/earn/blog/${post.slug}`;
  const hasToc = post.headings.length >= 3;

  const formattedDate = new Date(post.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: {
      "@type": "Person",
      name: "Somen Biswas",
      url: "https://www.linkedin.com/in/somenbiswas/",
    },
    publisher: {
      "@type": "Organization",
      name: "NexGuild",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  const faqJsonLd = post.faqs && post.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ReadingProgress />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="px-6 pb-10 pt-12"
        style={{
          background: "linear-gradient(180deg,rgba(238,242,255,0.55) 0%,rgba(235,251,250,0) 100%)",
          borderBottom: "1px solid rgba(13,148,136,0.08)",
        }}
      >
        <div className="mx-auto max-w-2xl">
          <Link
            href="/earn/blog"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
            style={{ color: "#0D9488" }}
          >
            ← Back to Blog
          </Link>

          <div className="mb-4">
            <CategoryBadge category={post.category} />
          </div>

          <h1
            className="mb-4 text-4xl font-bold leading-tight text-[#0F3D36] sm:text-5xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {post.title}
          </h1>

          <p className="mb-6 text-base leading-relaxed text-stone-500 sm:text-lg">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-stone-400">
            <span>📅 {formattedDate}</span>
            <span>⏱ {post.readingTime} min read</span>
            <span>✍️ NexGuild Team</span>
          </div>

          <div
            className="mt-8 h-px"
            style={{ background: "linear-gradient(90deg,#0D9488 0%,rgba(13,148,136,0) 100%)" }}
          />
        </div>
      </section>

      {/* ── Ad Slot (top) ─────────────────────────────────────────────── */}
      <div className={`mx-auto px-6 py-6 ${hasToc ? "max-w-screen-lg" : "max-w-2xl"}`}>
        <AdSlot placement="blog-post-top" />
      </div>

      {/* ── Article Body + TOC ───────────────────────────────────────── */}
      <div className={`mx-auto px-6 ${hasToc ? "max-w-screen-lg" : "max-w-2xl"}`}>
        <div
          className={
            hasToc
              ? "items-start lg:grid lg:grid-cols-[1fr_220px] lg:gap-12 xl:gap-16"
              : ""
          }
        >
          <article className="pb-10">
            <div
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          </article>

          {hasToc && (
            <aside className="hidden lg:block">
              <TableOfContents headings={post.headings} />
            </aside>
          )}
        </div>
      </div>

      {/* ── Author + Share ────────────────────────────────────────────── */}
      <div className="px-6 pb-10">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Author card */}
          <div className="flex gap-4 items-start rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/founder.jpg"
              alt="Somen Biswas"
              width={56}
              height={56}
              className="h-14 w-14 flex-shrink-0 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Written by Somen Biswas</p>
              <p className="mb-2 text-xs font-medium text-teal-600">Founder, NexGuild</p>
              <p className="text-sm leading-relaxed text-slate-500">
                Building NexGuild from India — a global platform connecting contributors with real
                earning opportunities. Zero coding background, built with AI.
              </p>
              <div className="mt-3 flex gap-3">
                <a
                  href="https://www.linkedin.com/in/somenbiswas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#0A66C2] hover:underline"
                >
                  LinkedIn ↗
                </a>
                <a
                  href="https://x.com/nexguild"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Twitter / X ↗
                </a>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <ShareButtons title={post.title} url={postUrl} />
        </div>
      </div>

      {/* ── Ad Slot (bottom) ──────────────────────────────────────────── */}
      <div className="px-6 pb-10">
        <div className="mx-auto max-w-2xl">
          <AdSlot placement="blog-post-end" />
        </div>
      </div>

      {/* ── Related Posts ─────────────────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <div className="px-6 pb-14">
          <div className="mx-auto max-w-2xl">
            <h2
              className="mb-6 flex items-center gap-2 text-xl font-bold text-[#0F3D36]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              🔖 You Might Also Like
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {relatedPosts.map((p) => (
                <Link key={p.slug} href={`/earn/blog/${p.slug}`} className="group block">
                  <article
                    className="flex h-full flex-col gap-2.5 rounded-xl p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-teal-200 group-hover:shadow-md"
                    style={{
                      background: "rgba(255,255,255,0.65)",
                      border: "1.5px solid rgba(13,148,136,0.12)",
                    }}
                  >
                    <CategoryBadge category={p.category} small />
                    <h3
                      className="text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-[#0D9488]"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {p.title}
                    </h3>
                    <p className="flex-1 text-xs leading-relaxed text-stone-500 line-clamp-2">
                      {p.description}
                    </p>
                    <span className="mt-1 inline-block text-xs font-semibold text-[#0D9488] transition-transform group-hover:translate-x-0.5">
                      Read More →
                    </span>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Back Link ─────────────────────────────────────────────────── */}
      <div className="px-6 pb-20">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/earn/blog"
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
