"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ArrowRight, Bell, ClipboardList, Layers, ShoppingBag, Coins, X, Megaphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Profile {
  full_name: string | null;
  nexcoins: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  pay_per_task: number | null;
}

interface AnnouncementNotif {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { icon: ClipboardList, label: "Browse Tasks",  href: "/dashboard/tasks",       desc: "Find and start new tasks" },
  { icon: Layers,        label: "Offerwalls",     href: "/dashboard/offerwalls",  desc: "Earn via partner offers" },
  { icon: ShoppingBag,   label: "Store",          href: "/dashboard/store",       desc: "Redeem your NexCoins" },
];

export default function DashboardHome() {
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [tasks, setTasks]               = useState<Task[]>([]);
  const [tasksDone, setTasksDone]       = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);
  const [banner, setBanner]             = useState<AnnouncementNotif | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profileData },
        { data: tasksData },
        { data: mySubmissions },
        { count: approvedCount },
        { count: reviewedCount },
        { data: announcementData },
      ] = await Promise.all([
        supabase.from("profiles").select("full_name, nexcoins").eq("id", user.id).single(),
        supabase.from("tasks").select("id, title, description, task_type, pay_per_task").eq("status", "active").limit(20),
        supabase.from("submissions").select("task_id").eq("contributor_id", user.id),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("contributor_id", user.id).eq("status", "approved"),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("contributor_id", user.id).in("status", ["approved", "rejected"]),
        // Latest unread announcement notification
        // Use neq("is_read", true) instead of eq("is_read", false) so rows
        // where is_read IS NULL (db default before explicit false) are also returned
        supabase
          .from("notifications")
          .select("id, title, message, created_at")
          .eq("user_id", user.id)
          .eq("type", "announcement")
          .neq("is_read", true)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      const startedIds = new Set((mySubmissions ?? []).map((s: { task_id: string }) => s.task_id));
      const availableTasks = (tasksData ?? []).filter((t) => !startedIds.has(t.id)).slice(0, 3);

      setProfile(profileData ?? { full_name: null, nexcoins: 0 });
      setTasks(availableTasks);
      setTasksDone(approvedCount ?? 0);
      setApprovalRate(
        reviewedCount && reviewedCount > 0
          ? Math.round(((approvedCount ?? 0) / reviewedCount) * 100)
          : null
      );

      const notif = (announcementData as unknown as AnnouncementNotif[] | null)?.[0] ?? null;
      console.log("[dashboard] announcement notif:", notif);
      setBanner(notif);
      setLoading(false);
    }
    fetchData();
  }, []);

  async function dismissBanner() {
    setBannerDismissed(true);
    if (banner?.id) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", banner.id);
    }
  }

  const displayName = profile?.full_name ?? "there";
  const showBanner  = banner && !bannerDismissed;

  // Strip the "📢 " prefix that admin adds when creating announcement notifications
  const bannerTitle   = banner?.title?.replace(/^📢\s*/, "") ?? "";
  const bannerMessage = banner?.message ?? "";

  return (
    <div className="space-y-8">

      {/* Announcement Banner */}
      {showBanner && (
        <div className="rounded-xl border border-[#14b8a6]/30 bg-gradient-to-r from-[#14b8a6]/10 to-[#f59e0b]/5 p-4 flex items-start gap-3 relative">
          <div className="h-8 w-8 rounded-lg bg-[#14b8a6]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Megaphone className="h-4 w-4 text-[#14b8a6]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{bannerTitle}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 leading-relaxed">{bannerMessage}</p>
          </div>
          <button
            onClick={dismissBanner}
            className="flex-shrink-0 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Welcome + Stats */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {loading ? "Welcome back!" : `Welcome back, ${displayName}!`}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-5">Here is your dashboard overview.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="NexCoins"
            value={loading ? "—" : (profile?.nexcoins ?? 0).toLocaleString()}
          />
          <StatCard
            label="Tasks Done"
            value={loading ? "—" : tasksDone.toLocaleString()}
          />
          <StatCard
            className="col-span-2 sm:col-span-1"
            label="Approval Rate"
            value={loading ? "—" : approvalRate === null ? "N/A" : approvalRate + "%"}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 card-hover group"
              >
                <div className="h-10 w-10 rounded-lg bg-[var(--brand-100)] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-[var(--brand-500)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{action.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] ml-auto flex-shrink-0 group-hover:text-[var(--brand-500)] transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* NexCoins Snapshot */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">NexCoins Balance</h2>
          <Coins className="h-4 w-4 text-[var(--brand-500)]" />
        </div>
        <div className="mb-6">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Available Coins</p>
          <p className="text-4xl font-bold text-[var(--brand-500)]">
            {loading ? "—" : (profile?.nexcoins ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Complete tasks to earn more NexCoins</p>
        </div>
        <Button asChild className="w-full sm:w-auto" variant="secondary">
          <Link href="/dashboard/store">Redeem in Store →</Link>
        </Button>
      </div>

      {/* Available Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Available Now</h2>
          <Link href="/dashboard/tasks" className="text-sm text-[var(--text-link)] hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-32 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-12 flex flex-col items-center gap-3 text-center px-6">
            <ClipboardList className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="font-semibold text-[var(--text-primary)]">No tasks available yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Check back soon — new tasks are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tasks/${task.id}`}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 card-hover group"
              >
                <p className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider mb-2">
                  {task.task_type ?? "Task"}
                </p>
                <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1 group-hover:text-[var(--brand-500)] transition-colors line-clamp-1">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{task.description}</p>
                )}
                {task.pay_per_task != null && (
                  <p className="text-xs font-medium text-[var(--success-text)]">
                    {task.pay_per_task} coins / task
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
