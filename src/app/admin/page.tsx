"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Gift, Briefcase, ClipboardCheck, Loader2,
  CheckCircle2, XCircle, GraduationCap, Coins, Headphones,
  WalletCards, ShieldAlert, AlertTriangle, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { useAdminRole, usePageGuard } from "@/components/layout/admin-auth-guard";

interface Counts {
  contributors:       number | null;
  activeTasks:        number | null;
  pendingReviews:     number | null;
  pendingAssignments: number | null;
  pendingVouchers:    number | null;
  pendingGlobalPayouts: number | null;
  openSupportTickets: number | null;
  suspiciousItems:    number | null;
  totalCoins:         number | null;
}

interface Activity {
  id: string;
  type: "submission" | "assignment";
  title: string;
  sub: string;
  status: string;
  time: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  submitted: <ClipboardCheck className="h-4 w-4 text-yellow-400" />,
  approved:  <CheckCircle2  className="h-4 w-4 text-green-400" />,
  rejected:  <XCircle       className="h-4 w-4 text-red-400" />,
  pending:   <Loader2       className="h-4 w-4 text-yellow-400 animate-spin" />,
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Pending review",
  approved:  "Approved",
  rejected:  "Rejected",
  pending:   "Pending",
};

export default function AdminOverview() {
  const role = useAdminRole();
  const allowed = usePageGuard(ADMIN_ROLES.ALL);
  const [loading, setLoading]   = useState(true);
  const [counts, setCounts]     = useState<Counts | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const tokenRef                = useRef<string | null>(null);

  // ── Fetch stats via service-role API route (bypasses RLS) ──────────
  const fetchStats = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Unable to load admin statistics.");
      }
      const data: Counts = await res.json();
      setCounts(data);
      setStatsError(null);
    } catch (e) {
      console.error("[admin/stats] fetch error:", e);
      setStatsError(e instanceof Error ? e.message : "Unable to load admin statistics.");
    }
  }, []);

  // ── Fetch recent activity (browser client — admin RLS covers this) ─
  const fetchActivity = useCallback(async () => {
    if (!role || !ADMIN_ROLES.REVIEW.some((allowedRole) => allowedRole === role)) {
      setActivity([]);
      return;
    }
    const [{ data: recentSubs }, { data: recentAssigns }] = await Promise.all([
      supabase
        .from("submissions")
        .select("id, status, submitted_at, tasks(title), profiles(full_name)")
        .in("status", ["submitted", "approved", "rejected"])
        .order("submitted_at", { ascending: false })
        .limit(5),
      supabase
        .from("assignments")
        .select("id, status, submitted_at, tasks(title), profiles(full_name)")
        .order("submitted_at", { ascending: false })
        .limit(3),
    ]);

    type Row = {
      id: string; status: string; submitted_at: string;
      tasks: { title: string } | null;
      profiles: { full_name: string | null } | null;
    };

    const acts: Activity[] = [
      ...((recentSubs as unknown as Row[]) ?? []).map((s) => ({
        id: s.id, type: "submission" as const,
        title: s.tasks?.title ?? "Unknown task",
        sub:   s.profiles?.full_name ?? "Unknown contributor",
        status: s.status, time: s.submitted_at,
      })),
      ...((recentAssigns as unknown as Row[]) ?? []).map((a) => ({
        id: a.id, type: "assignment" as const,
        title: a.tasks?.title ?? "Unknown task",
        sub:   a.profiles?.full_name ?? "Unknown contributor",
        status: a.status, time: a.submitted_at,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    setActivity(acts);
  }, [role]);

  useEffect(() => {
    let active = true;
    let refreshTimer: number | undefined;

    async function init() {
      if (!allowed) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session) return;
      tokenRef.current = session.access_token;

      await Promise.all([fetchStats(), fetchActivity()]);
      if (!active) return;
      setLoading(false);
      refreshTimer = window.setInterval(() => {
        void fetchStats();
        void fetchActivity();
      }, 30_000);
    }

    init();
    return () => {
      active = false;
      if (refreshTimer) window.clearInterval(refreshTimer);
    };
  }, [allowed, fetchStats, fetchActivity]);

  const statCards = counts
    ? [
        { label: "Contributors", value: counts.contributors?.toLocaleString() ?? "—", icon: <Users className="h-5 w-5" />, href: "/admin/contributors", roles: ADMIN_ROLES.USERS },
        { label: "Active Tasks", value: counts.activeTasks?.toLocaleString() ?? "—", icon: <Briefcase className="h-5 w-5" />, href: "/admin/tasks", roles: ADMIN_ROLES.CONTENT },
        { label: "Pending Reviews", value: counts.pendingReviews?.toLocaleString() ?? "—", icon: <ClipboardCheck className="h-5 w-5" />, href: "/admin/submissions", roles: ADMIN_ROLES.CONTENT },
        { label: "Pending Assignments", value: counts.pendingAssignments?.toLocaleString() ?? "—", icon: <GraduationCap className="h-5 w-5" />, href: "/admin/assignments", roles: ADMIN_ROLES.REVIEW },
        { label: "Pending Vouchers", value: counts.pendingVouchers?.toLocaleString() ?? "—", icon: <Gift className="h-5 w-5" />, href: "/admin/vouchers", roles: ADMIN_ROLES.FINANCE },
        { label: "Earned NexCoins", value: counts.totalCoins?.toLocaleString() ?? "—", icon: <Coins className="h-5 w-5" />, href: "/admin/finances", roles: ADMIN_ROLES.FINANCE },
      ]
        .filter((item) => item.roles.some((allowedRole) => allowedRole === role))
    : [];

  const attentionItems = counts
    ? [
        { label: "Submission reviews", value: counts.pendingReviews ?? 0, href: "/admin/submissions", icon: <ClipboardCheck className="h-4 w-4" />, roles: ADMIN_ROLES.CONTENT },
        { label: "Assignments", value: counts.pendingAssignments ?? 0, href: "/admin/assignments", icon: <GraduationCap className="h-4 w-4" />, roles: ADMIN_ROLES.REVIEW },
        { label: "Voucher requests", value: counts.pendingVouchers ?? 0, href: "/admin/vouchers", icon: <Gift className="h-4 w-4" />, roles: ADMIN_ROLES.FINANCE },
        { label: "Global payouts", value: counts.pendingGlobalPayouts ?? 0, href: "/admin/global-payouts", icon: <WalletCards className="h-4 w-4" />, roles: ADMIN_ROLES.FINANCE },
        { label: "Support tickets", value: counts.openSupportTickets ?? 0, href: "/admin/support", icon: <Headphones className="h-4 w-4" />, roles: ADMIN_ROLES.SUPPORT },
        { label: "Flagged task submissions", value: counts.suspiciousItems ?? 0, href: "/admin/suspicious-visits", icon: <ShieldAlert className="h-4 w-4" />, roles: ADMIN_ROLES.UPPER },
      ]
        .filter((item) => item.value > 0 && item.roles.some((allowedRole) => allowedRole === role))
    : [];

  const quickActions = [
    { label: "Post New Task", href: "/admin/tasks/new", icon: <Briefcase className="h-4 w-4" />, roles: ADMIN_ROLES.UPPER },
    { label: "Manage Voucher Catalog", href: "/admin/voucher-catalog", icon: <Gift className="h-4 w-4" />, roles: ADMIN_ROLES.FINANCE },
    { label: "Send Announcement", href: "/admin/announcements", icon: <Users className="h-4 w-4" />, roles: ADMIN_ROLES.ANNOUNCE },
    { label: "View Finances", href: "/admin/finances", icon: <Coins className="h-4 w-4" />, roles: ADMIN_ROLES.FINANCE },
  ].filter((action) => action.roles.some((allowedRole) => allowedRole === role));

  if (!allowed) return null;

  return (
    <div className="space-y-8">
      {statsError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{statsError}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchStats()}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-red-400/30 px-3 py-2 font-medium hover:bg-red-500/10 sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 flex flex-col gap-3 hover:border-[var(--brand-500)] transition-colors"
            >
              <div className="flex items-center justify-between text-[var(--brand-500)]">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider leading-tight">{s.label}</span>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
            </Link>
          ))}
        </div>
      )}

      {!loading && counts && (
        <section aria-labelledby="needs-attention-heading" className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-4">
            <div>
              <h2 id="needs-attention-heading" className="font-semibold text-[var(--text-primary)]">Needs attention</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Only queues with pending work are shown</p>
            </div>
          </div>
          {attentionItems.length > 0 ? <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] px-4 py-3 transition-colors hover:border-[var(--brand-500)] hover:bg-[var(--surface-subtle)]"
              >
                <span className="text-[var(--brand-500)]">{item.icon}</span>
                <span className="flex-1 text-sm text-[var(--text-primary)]">{item.label}</span>
                <span className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-bold ${item.value > 0 ? "bg-[var(--brand-500)] text-white" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"}`}>
                  {item.value}
                </span>
              </Link>
            ))}
          </div> : <p className="px-5 py-4 text-sm text-[var(--text-muted)]">All queues are clear.</p>}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {ADMIN_ROLES.REVIEW.some((allowedRole) => allowedRole === role) && (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">Recent Activity</h2>
              <Link href="/admin/submissions" className="text-xs text-[var(--brand-500)] hover:underline">Review submissions</Link>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded bg-[var(--surface-subtle)] animate-pulse" />)}
              </div>
            ) : activity.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-[var(--text-muted)]">No activity yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-default)]">
                {activity.map((a) => (
                  <li key={`${a.type}-${a.id}`}>
                    <Link href={a.type === "submission" ? "/admin/submissions" : "/admin/assignments"} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--surface-subtle)]">
                      {STATUS_ICON[a.status] ?? <ClipboardCheck className="h-4 w-4 text-[var(--text-muted)]" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-primary)] truncate">{a.title}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {a.sub} · {a.type} · {STATUS_LABEL[a.status] ?? a.status}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)] flex-shrink-0 hidden sm:block">
                        {new Date(a.time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Quick Actions</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Create or manage; pending reviews appear above</p>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-subtle)] hover:border-[var(--brand-500)] transition-colors text-sm font-medium text-[var(--text-primary)]"
                >
                  <span className="text-[var(--brand-500)]">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
