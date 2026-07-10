import Link from "next/link";

interface BlogTipCardProps {
  slug: string;
  title: string;
  excerpt: string;
}

export function BlogTipCard({ slug, title, excerpt }: BlogTipCardProps) {
  return (
    <div
      className="flex items-start gap-4 rounded-xl px-5 py-4 bg-white shadow-sm"
      style={{ border: "1px solid #E5E7EB", borderLeft: "3px solid #02b491" }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">📚</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Helpful Guide</p>
        <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{title}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{excerpt}</p>
      </div>
      <Link
        href={`/blog/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-xs font-semibold whitespace-nowrap mt-0.5 hover:opacity-75 transition-opacity"
        style={{ color: "#02b491" }}
      >
        Read Guide →
      </Link>
    </div>
  );
}
