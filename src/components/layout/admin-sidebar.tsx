"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FolderOpen,
  ClipboardCheck, Layers, Gift, BarChart3,
  Settings, LogOut, ClipboardList, GraduationCap, Megaphone, Headphones, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";
import { supabase } from "@/lib/supabase";

export function AdminSidebar() {
  const pathname = usePathname();
  const [submissionCount, setSubmissionCount]   = useState(0);
  const [withdrawalCount, setWithdrawalCount]   = useState(0);
  const [assignmentCount, setAssignmentCount]   = useState(0);
  const [supportCount, setSupportCount]         = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [{ count: wdCount }, { count: subCount }, { count: asnCount }, { count: supCount }] = await Promise.all([
          supabase.from("voucher_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
          supabase.from("assignments").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        ]);
        setWithdrawalCount(wdCount ?? 0);
        setSubmissionCount(subCount ?? 0);
        setAssignmentCount(asnCount ?? 0);
        setSupportCount(supCount ?? 0);
      } catch {
        // silently keep counts at 0 if queries fail
      }
    }
    fetchCounts();
  }, []);

  const NAV_ITEMS = [
    { label: "Overview",      href: "/admin",                icon: LayoutDashboard, badge: 0 },
    { label: "Contributors",  href: "/admin/contributors",   icon: Users,           badge: 0 },
    { label: "Tasks",         href: "/admin/tasks",          icon: ClipboardList,   badge: 0 },
    { label: "Projects",       href: "/admin/projects",       icon: FolderOpen,      badge: 0 },
    { label: "Submissions",   href: "/admin/submissions",    icon: ClipboardCheck,  badge: submissionCount },
    { label: "Assignments",   href: "/admin/assignments",    icon: GraduationCap,   badge: assignmentCount },
    { label: "Offerwalls",    href: "/admin/offerwalls",     icon: Layers,          badge: 0 },
    { label: "Vouchers",         href: "/admin/vouchers",         icon: Gift,    badge: withdrawalCount },
    { label: "Voucher Catalog",  href: "/admin/voucher-catalog",  icon: Tag,     badge: 0 },
    { label: "Announcements",    href: "/admin/announcements",    icon: Megaphone, badge: 0 },
    { label: "Support",       href: "/admin/support",        icon: Headphones,      badge: supportCount },
    { label: "Finances",      href: "/admin/finances",       icon: BarChart3,       badge: 0 },
    { label: "Settings",      href: "/admin/settings",       icon: Settings,        badge: 0 },
  ];

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-sidebar-admin flex flex-col z-40 admin-sidebar-bg border-r border-[rgba(255,255,255,0.06)]">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
        <NexGuildLogo theme="gold" href="/admin" />
      </div>

      {/* Nav */}
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
                      ? "bg-[var(--admin-sidebar-item-active)] text-[var(--admin-sidebar-active-text)]"
                      : "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-item-hover)] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-500)] text-white text-xs font-bold px-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Log Out */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.06)]">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 h-10 px-3 w-full rounded-md text-sm font-medium text-[var(--admin-sidebar-text)] hover:text-white hover:bg-[var(--admin-sidebar-item-hover)] transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
