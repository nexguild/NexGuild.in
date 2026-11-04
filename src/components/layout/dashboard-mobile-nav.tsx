"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, ClipboardList, Banknote, Sparkles, MoreHorizontal, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Home",          href: "/dashboard",               icon: LayoutDashboard },
  { label: "Paid Tasks",    href: "/dashboard/opportunities",  icon: Search },
  { label: "My Work",       href: "/dashboard/tasks",          icon: ClipboardList },
  { label: "Cashout",       href: "/dashboard/store",           icon: Banknote },
  { label: "Paid Surveys", href: "/dashboard/surveys",         icon: Sparkles },
  { label: "Offers",       href: "/dashboard/offerwalls/adbluemedia", icon: Coins },
  { label: "More",          href: "/dashboard/profile",        icon: MoreHorizontal },
];

export function DashboardMobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--surface-card)] border-t border-[var(--border-default)]">
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 flex-1 py-2 rounded-md transition-colors",
                active ? "text-[var(--brand-500)]" : "text-[var(--text-muted)]"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "fill-current" : "")} strokeWidth={active ? 2.5 : 1.5} />
              <span className="max-w-full truncate text-[10px] font-medium sm:text-xs">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
