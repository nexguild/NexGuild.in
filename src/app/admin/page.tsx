"use client";

import { useEffect, useState } from "react";
import {
  Users, Gift, Briefcase, ClipboardCheck, Loader2,
  CheckCircle2, XCircle, GraduationCap, Coins,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
}

interface Activity {
  id: string;
  type: "submission" | "assignment" | "voucher";
  title: string;
  sub: string;
  status: string;
  time: string;
}

export default function AdminOverview() {
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState<StatItem[]>([]);
  const [activity, setActivity]   = useState<Activity[]>([]);

  useEffect(() => {
    async function load() {
      const [
        { count: contributors },
        { count: activeTasks },
        { count: pendingReviews },
        { count: pendingAssignments },
        { count: pendingVouchers },
        { data: coinsData },
        { data: recentSubs },
        { data: recentAssigns },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "contributor"),
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("assignments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("voucher_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("submissions").select("coins_awarded").eq("status", "approved"),
        supabase.from("submissions")
          .select("id, status, submitted_at, tasks(title), profiles(full_name)")
          .in("status", ["submitted", "approved", "rejected"])
          .order("submitted_at", { ascending: false })
          .limit(5),
        supabase.from("assignments")
          .select("id, status, submitted_at, tasks(title), profiles(full_name)")
          .order("submitted_at", { ascending: false })
          .limit(3),
      ]);

      const totalCoins = (coinsData ?? []).reduce(
        (s: number, r: { coins_awarded: number | null }) => s + (r.coins_awarded ?? 0), 0
      );

      setStats([
        { label: "Contributors",      value: (contributors ?? 0).toLocaleString(), icon: <Users className="h-5 w-5" />,          href: "/admin/contributors" },
        { label: "Active Tasks",      value: (activeTasks ?? 0).toLocaleString(),  icon: <Briefcase className="h-5 w-5" />,       href: "/admin/tasks" },
        { label: "Pending Reviews",   value: (pendingReviews ?? 0).toLocaleString(),     icon: <ClipboardCheck className="h-5 w-5" />,  href: "/admin/submissions" },
        { label: "Pending Assignments", value: (pendingAssignments ?? 0).toLocaleString(), icon: <GraduationCap className="h-5 w-5" />, href: "/admin/assignments" },
        { label: "Pending Vouchers",  value: (pendingVouchers ?? 0).toLocaleString(),    icon: <Gift className="h-5 w-5" />,            href: "/admin/vouchers" },
        { label: "Coins Issued",      value: totalCoins.toLocaleString(),           icon: <Coins className="h-5 w-5" />,          href: "/admin/finances" },
      ]);

      // Merge recent activity
      type SubRow = { id: string; status: string; submitted_at: string; tasks: { title: string } | null; profiles: { full_name: string | null } | null };
      type AssignRow = { id: string; status: string; submitted_at: string; tasks: { title: string } | null; profiles: { full_name: string | null } | null };

      const acts: Activity[] = [
        ...((recentSubs as unknown as SubRow[]) ?? []).map((s) => ({
          id: s.id,
          type: "submission" as const,
          title: (s.tasks as { title: string } | null)?.title ?? "Unknown task",
          sub: (s.profiles as { full_name: string | null } | null)?.full_name ?? "Unknown contributor",
          status: s.status,
          time: s.submitted_at,
        })),
        ...((recentAssigns as unknown as AssignRow[]) ?? []).map((a) => ({
          id: a.id,
          type: "assignment" as const,
          title: (a.tasks as { title: string } | null)?.title ?? "Unknown task",
          sub: (a.profiles as { full_name: string | null } | null)?.full_name ?? "Unknown contributor",
          status: a.status,
          time: a.submitted_at,
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8);

      setActivity(acts);
      setLoading(false);
    }
    load();
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href ?? "#"}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Recent Activity</h2>
            <Link href="/admin/submissions" className="text-xs text-[var(--brand-500)] hover:underline">View all</Link>
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
                <li key={`${a.type}-${a.id}`} className="px-5 py-3 flex items-center gap-3">
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
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Post New Task",         href: "/admin/tasks/new",      icon: <Briefcase className="h-4 w-4" /> },
              { label: "Review Submissions",    href: "/admin/submissions",    icon: <ClipboardCheck className="h-4 w-4" /> },
              { label: "Review Assignments",    href: "/admin/assignments",    icon: <GraduationCap className="h-4 w-4" /> },
              { label: "Deliver Vouchers",      href: "/admin/vouchers",       icon: <Gift className="h-4 w-4" /> },
              { label: "Send Announcement",     href: "/admin/announcements",  icon: <Users className="h-4 w-4" /> },
              { label: "View Finances",         href: "/admin/finances",       icon: <Coins className="h-4 w-4" /> },
            ].map((action) => (
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
      </div>
    </div>
  );
}
