"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, User, Settings, LogOut, Menu, Download, Share, MoreVertical, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

const BREADCRUMBS: Record<string, string[]> = {
  "/admin":                   ["Overview"],
  "/admin/contributors":      ["Contributors"],
  "/admin/tasks":             ["Tasks"],
  "/admin/tasks/new":         ["Tasks", "New Task"],
  "/admin/projects":          ["Projects"],
  "/admin/submissions":       ["Submissions"],
  "/admin/assignments":       ["Assignments"],
  "/admin/offerwalls":        ["Offerwalls"],
  "/admin/vouchers":          ["Vouchers"],
  "/admin/voucher-catalog":   ["Voucher Catalog"],
  "/admin/global-payouts":    ["Queues", "Global Payouts"],
  "/admin/announcements":     ["Announcements"],
  "/admin/finances":          ["Finances"],
  "/admin/settings":          ["Settings"],
  "/admin/audit-logs":        ["Audit History"],
  "/admin/email-previews":    ["Email Previews"],
  "/admin/active-contributors": ["Contributor Activity"],
};

interface AdminProfile {
  full_name: string | null;
  email: string | null;
  role: string;
}

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const crumbs    = BREADCRUMBS[pathname] ?? ["Admin"];
  const dropRef   = useRef<HTMLDivElement>(null);

  const [open, setOpen]       = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [search, setSearch] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installError, setInstallError] = useState("");

  useEffect(() => {
    const checkInstalled = () => {
      setIsInstalled(window.localStorage.getItem("nexguild-admin-app-installed") === "1");
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      window.localStorage.setItem("nexguild-admin-app-installed", "1");
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    checkInstalled();
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

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

  async function installAdminApp() {
    if (!installPrompt) {
      setInstallHelpOpen(true);
      return;
    }

    setInstallError("");
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (outcome === "accepted") setIsInstalled(true);
    } catch (error) {
      console.error("[pwa] admin install prompt failed:", error);
      setInstallError("The install prompt could not be opened. Use your browser menu to add the admin app.");
      setInstallHelpOpen(true);
    }
  }

  const displayName = profile?.full_name ?? "Admin";
  const isOwner     = profile?.role === "owner";
  const canSearchContributors = ADMIN_ROLES.USERS.some((role) => role === profile?.role);
  const canManageSettings = ADMIN_ROLES.UPPER.some((role) => role === profile?.role);

  return (
    <>
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
        {canSearchContributors && <form
          onSubmit={(event) => {
            event.preventDefault();
            const query = search.trim();
            if (query) router.push("/admin/contributors?search=" + encodeURIComponent(query));
          }}
          className="hidden md:flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] w-56"
        >
          <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="search"
            placeholder="Search contributors..."
            aria-label="Search contributors by name, email or ID"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>}

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
                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void installAdminApp();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Download className="h-4 w-4" /> Install Admin App
                  </button>
                )}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <User className="h-4 w-4" /> Profile
                </Link>
                {canManageSettings && <Link
                  href="/admin/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>}
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
    {installHelpOpen && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) setInstallHelpOpen(false);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-admin-app-title"
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                <Download className="h-5 w-5" />
              </span>
              <div>
                <h2 id="install-admin-app-title" className="font-bold">Install NexGuild Admin</h2>
                <p className="mt-0.5 text-xs text-slate-300">Keep admin tools one tap away.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close install instructions"
              onClick={() => setInstallHelpOpen(false)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-5">
            {installError && (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {installError}
              </p>
            )}
            <ol className="space-y-3 text-sm text-slate-700">
              {isIOS ? (
                <>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Share className="h-4 w-4" /></span>
                    <span>In Safari, tap the <b>Share</b> button.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><span className="text-base font-bold">＋</span></span>
                    <span>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><MoreVertical className="h-4 w-4" /></span>
                    <span>Open your browser menu (⋮).</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Download className="h-4 w-4" /></span>
                    <span>Tap <b>Install app</b> or <b>Add to Home screen</b>.</span>
                  </li>
                </>
              )}
            </ol>
            <button
              type="button"
              onClick={() => setInstallHelpOpen(false)}
              className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-900"
            >
              Got it
            </button>
          </div>
        </section>
      </div>
    )}
    </>
  );
}
