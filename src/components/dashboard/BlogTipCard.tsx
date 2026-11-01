import Link from "next/link";

interface BlogTipCardProps {
  slug: string;
  title: string;
  excerpt: string;
}

export function BlogTipCard({ slug, title, excerpt }: BlogTipCardProps) {
  return (
    <div className="relative isolate flex flex-col gap-4 overflow-hidden rounded-[1.4rem] border border-[#dce9e3] bg-[linear-gradient(110deg,#f1f8f4,#ffffff_72%)] p-5 shadow-[0_8px_28px_rgba(15,76,69,0.045)] sm:flex-row sm:items-center sm:p-6">
      <div aria-hidden className="absolute -right-10 -top-20 h-44 w-44 rounded-full border border-teal-900/[0.06]" />
      <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#123f39] text-xl text-[#e2c47c] shadow-sm">✦</span>
      <div className="relative min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">A little knowledge goes a long way</p>
        <p className="text-base font-semibold leading-snug tracking-tight text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{excerpt}</p>
      </div>
      <Link
        href={`/blog/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-4 py-2.5 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#0b625c]"
      >
        Read the guide <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
      </Link>
    </div>
  );
}
