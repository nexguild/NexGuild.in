import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface CategoryQuickLink {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function CategoryQuickLinks({
  label,
  links,
}: {
  label: string;
  links: CategoryQuickLink[];
}) {
  return (
    <nav aria-label={label} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {links.map(({ title, description, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_12px_28px_rgba(15,76,69,0.09)]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900">{title}</span>
            <span className="mt-0.5 block text-xs leading-4 text-slate-500">{description}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-700" />
        </Link>
      ))}
    </nav>
  );
}
