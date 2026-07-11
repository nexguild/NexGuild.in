"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, ClipboardList, Layers,
  TrendingUp, ShoppingBag, Gift, Users, Megaphone, Headphones,
  User, Settings, LogOut, X, Wallet, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";
import { supabase } from "@/lib/supabase";

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: "Dashboard",      href: "/dashboard",               icon: LayoutDashboard },
  { label: "Opportunities",  href: "/dashboard/opportunities",  icon: Search },
  { label: "My Tasks",       href: "/dashboard/tasks",          icon: ClipboardList },
  { label: "Offerwall Hub",  href: "/dashboard/offerwalls",     icon: Layers },
  { label: "Earnings",       href: "/dashboard/earnings",       icon: TrendingUp },
  { label: "NexCoins",       href: "/dashboard/wallet",         icon: Wallet },
  { label: "NexStore",       href: "/dashboard/store",          icon: ShoppingBag },
  { label: "My Vouchers",    href: "/dashboard/vouchers",       icon: Gift },
  { label: "NexLeader",      href: "/dashboard/nexleader",      icon: Crown },
  { label: "Community",      href: "/dashboard/community",      icon: Users },
  { label: "Announcements",  href: "/dashboard/announcements",  icon: Megaphone },
  { label: "Support",        href: "/dashboard/support",        icon: Headphones },
];

const ACCOUNT_ITEMS = [
  { label: "Profile",  href: "/dashboard/profile",  icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function NavItem({ href, icon: Icon, label }: { href: string; icon: typeof LayoutDashboard; label: string }) {
    const active = isActive(href);
    return (
      <li>
        <Link
          href={href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition-all duration-150",
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
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
          <NexGuildLogo theme="light" href="/dashboard" />
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Main</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </ul>

          <p className="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</p>
          <ul className="space-y-0.5">
            {ACCOUNT_ITEMS.map((item) => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </ul>
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
