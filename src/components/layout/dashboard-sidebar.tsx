"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, ClipboardList, Layers,
  TrendingUp, ShoppingBag, Gift, User, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";
import { supabase } from "@/lib/supabase";

const NAV_ITEMS = [
  { label: "Dashboard",      href: "/dashboard",               icon: LayoutDashboard },
  { label: "Opportunities",  href: "/dashboard/opportunities",  icon: Search },
  { label: "My Tasks",       href: "/dashboard/tasks",          icon: ClipboardList },
  { label: "Offerwall Hub",  href: "/dashboard/offerwalls",     icon: Layers },
  { label: "Earnings",       href: "/dashboard/earnings",       icon: TrendingUp },
  { label: "Store",          href: "/dashboard/store",          icon: ShoppingBag },
  { label: "My Vouchers",   href: "/dashboard/vouchers",       icon: Gift },
];

const ACCOUNT_ITEMS = [
  { label: "Profile",  href: "/dashboard/profile",  icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-sidebar flex flex-col z-40 sidebar-bg border-r border-[var(--border-default)]">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--border-default)] flex-shrink-0">
        <NexGuildLogo theme="teal" />
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-active-text)]"
                      : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="h-px bg-[var(--border-default)] my-3" />

        <ul className="space-y-0.5">
          {ACCOUNT_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-active-text)]"
                      : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Log Out */}
      <div className="px-3 py-4 border-t border-[var(--border-default)]">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 h-10 px-3 w-full rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
