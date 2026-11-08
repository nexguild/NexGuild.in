"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, ClipboardList, Gamepad2, Layers,
  TrendingUp, ShoppingBag, Gift, Users, Megaphone, Headphones, Sparkles,
  User, Settings, LogOut, X, Wallet, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";
import { supabase } from "@/lib/supabase";

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Discover",
    items: [
      { label: "Paid Tasks", href: "/dashboard/opportunities", icon: Search },
      { label: "Paid Surveys", href: "/dashboard/surveys", icon: Sparkles },
      { label: "Game Testing", href: "/dashboard/game-testing", icon: Gamepad2 },
      { label: "Apps & Games", href: "/dashboard/offerwalls", icon: Layers },
    ],
  },
  {
    label: "Rewards",
    items: [
      { label: "My Work", href: "/dashboard/tasks", icon: ClipboardList },
      { label: "Earnings", href: "/dashboard/earnings", icon: TrendingUp },
      { label: "NexCoins", href: "/dashboard/wallet", icon: Wallet },
      { label: "My Vouchers", href: "/dashboard/vouchers", icon: Gift },
    ],
  },
  {
    label: "Cashout",
    items: [
      { label: "Cashout & Rewards", href: "/dashboard/store", icon: Banknote },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Community", href: "/dashboard/community", icon: Users },
      { label: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
      { label: "Support", href: "/dashboard/support", icon: Headphones },
    ],
  },
];

const ACCOUNT_ITEMS = [
  { label: "Profile",  href: "/dashboard/profile",  icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavItem({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) {
    const active = isActive(href);
    return (
      <li>
        <Link
          href={href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 h-10 px-3 rounded-xl text-[13px] transition-all duration-150",
            active
              ? "font-semibold text-white shadow-md"
              : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          )}
          style={active ? { background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" } : undefined}
        >
          <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-white" : "text-slate-400")} />
          {label}
        </Link>
      </li>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-sidebar flex flex-col z-40",
          "bg-white border-r border-slate-100 shadow-sm",
          "will-change-transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-[76px] flex flex-col items-start justify-center gap-0.5 px-5 border-b border-slate-100 flex-shrink-0">
          <NexGuildLogo theme="light" href="/dashboard" />
          <span className="pl-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Contributor workspace</span>
          <button
            onClick={onClose}
            className="absolute right-4 top-5 lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {NAV_GROUPS.map((group, index) => (
            <section key={group.label} className={index === 0 ? "" : "mt-5"}>
              <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
                ))}
              </ul>
            </section>
          ))}

          <section className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Preferences</p>
            <ul className="space-y-1">
              {ACCOUNT_ITEMS.map((item) => (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </ul>
          </section>
        </nav>

        {/* Sign Out */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 h-10 px-3 w-full rounded-xl text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
