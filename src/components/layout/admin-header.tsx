"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, User, Settings, LogOut, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const BREADCRUMBS: Record<string, string[]> = {
  "/admin":                   ["Overview"],
  "/admin/contributors":      ["Contributors"],
  "/admin/tasks":             ["Tasks"],
  "/admin/tasks/new":         ["Tasks", "New Task"],
  "/admin/projects":          ["Projects"],
  "/admin/submissions":       ["Submissions"],
  "/admin/assignments":       ["Assignments"],
  "/admin/offerwalls":        ["Offerwalls"],
  "/admin/withdrawals":       ["Voucher Redemptions"],
  "/admin/vouchers":          ["Vouchers"],
  "/admin/announcements":     ["Announcements"],
  "/admin/finances":          ["Finances"],
  "/admin/settings":          ["Settings"],
};

interface AdminProfile {
  full_name: string | null;
  email: string | null;
  role: string;
}

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const crumbs    = BREADCRUMBS[pathname] ?? ["Admin"];
  const dropRef   = useRef<HTMLDivElement>(null);

  const [open, setOpen]       = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data as AdminProfile | null);
        });
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const displayName = profile?.full_name ?? "Admin";
  const isOwner     = profile?.role === "owner";

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-sidebar-admin z-30 flex items-center justify-between px-4 sm:px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-md hover:bg-[var(--surface-subtle)] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-[var(--text-primary)]" />
        </button>

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
      </div>

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

        {/* Admin user dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <Avatar name={displayName} size="sm" />
            <span className="hidden sm:block text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </span>
            {isOwner && (
              <span className="hidden sm:block text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                Owner
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl overflow-hidden z-50">
              {/* Identity */}
              <div className="px-4 py-3 border-b border-[var(--border-default)]">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{profile?.email ?? "—"}</p>
                {isOwner && (
                  <span className="mt-1 inline-block text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                    Owner
                  </span>
                )}
              </div>

              {/* Links */}
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </div>

              <div className="border-t border-[var(--border-default)] py-1">
                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
