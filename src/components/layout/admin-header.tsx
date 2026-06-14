"use client";

import { Search, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";

const BREADCRUMBS: Record<string, string[]> = {
  "/admin":                   ["Overview"],
  "/admin/contributors":      ["Contributors"],
  "/admin/tasks":             ["Tasks"],
  "/admin/tasks/new":         ["Tasks", "New Task"],
  "/admin/projects":          ["Projects"],
  "/admin/submissions":       ["Submissions"],
  "/admin/assignments":       ["Assignments"],
  "/admin/offerwalls":        ["Offerwalls"],
  "/admin/withdrawals":       ["Withdrawals"],
  "/admin/vouchers":          ["Vouchers"],
  "/admin/announcements":     ["Announcements"],
  "/admin/finances":          ["Finances"],
  "/admin/settings":          ["Settings"],
};

export function AdminHeader() {
  const pathname = usePathname();
  const crumbs = BREADCRUMBS[pathname] ?? ["Admin"];

  return (
    <header className="h-16 fixed top-0 right-0 left-sidebar-admin z-30 flex items-center justify-between px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-[var(--text-muted)]">Admin</span>
        {crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">/</span>
            <span className={i === crumbs.length - 1 ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] w-56">
          <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search contributors..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>

        {/* Admin user */}
        <button className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-[var(--surface-subtle)] transition-colors">
          <Avatar name="Admin User" size="sm" />
          <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)]">Admin</span>
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  );
}
