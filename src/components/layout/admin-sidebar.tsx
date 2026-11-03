"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FolderOpen,
  ClipboardCheck, Layers, Gift, BarChart3,
  Settings, LogOut, ClipboardList, GraduationCap, Megaphone, Headphones, Tag, X, Activity, Newspaper, TrendingUp, Briefcase, ShieldAlert, WalletCards, History, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";
import { supabase } from "@/lib/supabase";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { useAdminRole } from "@/components/layout/admin-auth-guard";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const role = useAdminRole();
  const [queueCounts, setQueueCounts] = useState({
    pendingReviews: 0,
    pendingAssignments: 0,
    pendingVouchers: 0,
    pendingGlobalPayouts: 0,
    openSupportTickets: 0,
    suspiciousItems: 0,
  });

  useEffect(() => {
    if (!role) return;
    let active = true;
    async function fetchCounts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const response = await fetch("/api/admin/stats", {
          headers: { Authorization: "Bearer " + session.access_token },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Queue counts request failed (${response.status}).`);
        const stats = await response.json();
        if (active) setQueueCounts(stats);
      } catch (error) {
        console.error("[admin/sidebar] queue counts fetch failed:", error);
      }
    }
    fetchCounts();
    const refresh = window.setInterval(fetchCounts, 30_000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, [role]);

  const navGroups = [
    {
      label: "Queues",
      items: [
        { label: "Submissions", href: "/admin/submissions", icon: ClipboardCheck, badge: queueCounts.pendingReviews, roles: ADMIN_ROLES.CONTENT },
        { label: "Assignments", href: "/admin/assignments", icon: GraduationCap, badge: queueCounts.pendingAssignments, roles: ADMIN_ROLES.REVIEW },
        { label: "Voucher Requests", href: "/admin/vouchers", icon: Gift, badge: queueCounts.pendingVouchers, roles: ADMIN_ROLES.FINANCE },
        { label: "Global Payouts", href: "/admin/global-payouts", icon: WalletCards, badge: queueCounts.pendingGlobalPayouts, roles: ADMIN_ROLES.FINANCE },
        { label: "Support", href: "/admin/support", icon: Headphones, badge: queueCounts.openSupportTickets, roles: ADMIN_ROLES.SUPPORT },
        { label: "Suspicious Visits", href: "/admin/suspicious-visits", icon: ShieldAlert, badge: queueCounts.suspiciousItems, roles: ADMIN_ROLES.UPPER },
      ],
    },
    {
      label: "Manage",
      items: [
        { label: "Contributors", href: "/admin/contributors", icon: Users, badge: 0, roles: ADMIN_ROLES.USERS },
        { label: "Tasks", href: "/admin/tasks", icon: ClipboardList, badge: 0, roles: ADMIN_ROLES.CONTENT },
        { label: "Projects", href: "/admin/projects", icon: FolderOpen, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Offerwalls", href: "/admin/offerwalls", icon: Layers, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Voucher Catalog", href: "/admin/voucher-catalog", icon: Tag, badge: 0, roles: ADMIN_ROLES.FINANCE },
        { label: "Finances", href: "/admin/finances", icon: BarChart3, badge: 0, roles: ADMIN_ROLES.FINANCE },
      ],
    },
    {
      label: "Growth",
      items: [
        { label: "Jobs", href: "/admin/jobs", icon: Briefcase, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Blog", href: "/admin/blog", icon: Newspaper, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Announcements", href: "/admin/announcements", icon: Megaphone, badge: 0, roles: ADMIN_ROLES.ANNOUNCE },
        { label: "Insights", href: "/admin/insights", icon: TrendingUp, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Contributor Activity", href: "/admin/active-contributors", icon: UserCheck, badge: 0, roles: ADMIN_ROLES.UPPER },
      ],
    },
    {
      label: "System",
      items: [
        { label: "Postback Logs", href: "/admin/postback-logs", icon: Activity, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Settings", href: "/admin/settings", icon: Settings, badge: 0, roles: ADMIN_ROLES.UPPER },
        { label: "Audit History", href: "/admin/audit-logs", icon: History, badge: 0, roles: ADMIN_ROLES.UPPER },
      ],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.some((allowedRole) => allowedRole === role)),
  })).filter((group) => group.items.length > 0);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-sidebar-admin flex flex-col z-40 admin-sidebar-bg border-r border-[rgba(255,255,255,0.06)]",
          "transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <NexGuildLogo theme="gold" href="/admin" />
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md text-[var(--admin-sidebar-text)] hover:text-white hover:bg-[var(--admin-sidebar-item-hover)] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <ul className="space-y-3">
            <li>
              <Link
                href="/admin"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors duration-150",
                  isActive("/admin")
                    ? "bg-[var(--admin-sidebar-item-active)] text-[var(--admin-sidebar-active-text)]"
                    : "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-item-hover)] hover:text-white"
                )}
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">Overview</span>
              </Link>
            </li>
            {navGroups.map((group) => {
              const groupBadge = group.items.reduce((total, item) => total + item.badge, 0);
              return (
                <li key={group.label} className="pt-2">
                  <div className="mb-1 flex items-center justify-between px-3">
                    <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--admin-sidebar-text)]">{group.label}</h2>
                    {groupBadge > 0 && <span className="rounded-full bg-[var(--brand-500)] px-1.5 py-0.5 text-[10px] font-bold text-white">{groupBadge}</span>}
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                              active
                                ? "bg-[var(--admin-sidebar-item-active)] text-[var(--admin-sidebar-active-text)]"
                                : "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-item-hover)] hover:text-white"
                            )}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.badge > 0 && (
                              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-500)] px-1 text-xs font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
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
    </>
  );
}
