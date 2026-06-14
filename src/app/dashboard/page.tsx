"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ArrowRight, Bell, ClipboardList, Layers, ShoppingBag, Coins } from "lucide-react";
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

const QUICK_ACTIONS = [
  { icon: ClipboardList, label: "Browse Tasks",  href: "/dashboard/tasks",       desc: "Find and start new tasks" },
  { icon: Layers,        label: "Offerwalls",     href: "/dashboard/offerwalls",  desc: "Earn via partner offers" },
  { icon: ShoppingBag,   label: "Store",          href: "/dashboard/store",       desc: "Redeem your NexCoins" },
];

export default function DashboardHome() {
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [tasksDone, setTasksDone]     = useState<number>(0);
  const [approvalRate, setApprovalRate] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profileData },
        { data: tasksData },
        { count: approvedCount },
        { count: reviewedCount },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, nexcoins")
          .eq("id", user.id)
          .single(),
        supabase
          .from("tasks")
          .select("id, title, description, task_type, pay_per_task")
          .eq("status", "active")
          .limit(3),
        // Tasks Done = approved submissions
        supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contributor_id", user.id)
          .eq("status", "approved"),
        // Approval Rate denominator = all reviewed (approved + rejected)
        supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contributor_id", user.id)
          .in("status", ["approved", "rejected"]),
      ]);

      setProfile(profileData ?? { full_name: null, nexcoins: 0 });
      setTasks(tasksData ?? []);
      setTasksDone(approvedCount ?? 0);
      setApprovalRate(
        reviewedCount && reviewedCount > 0
          ? Math.round(((approvedCount ?? 0) / reviewedCount) * 100)
          : null
      );
      setLoading(false);
    }
    fetchData();
  }, []);

  const displayName = profile?.full_name ?? "there";

  return (
    <div className="space-y-8">

      {/* Announcement Banner */}
      <div className="rounded-xl border border-[var(--brand-200)] bg-[var(--brand-50)] p-4 flex items-start gap-3">
        <Bell className="h-4 w-4 text-[var(--brand-500)] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--brand-500)]">Welcome to NexGuild!</p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            We are growing our contributor community. New task types and higher-paying projects are being added every week.
          </p>
        </div>
      </div>

      {/* Welcome + Stats */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
          {loading ? "Welcome back!" : `Welcome back, ${displayName}!`}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-5">Here is your dashboard overview.</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="NexCoins"
            value={loading ? "—" : (profile?.nexcoins ?? 0).toLocaleString()}
          />
          <StatCard
            label="Tasks Done"
            value={loading ? "—" : tasksDone.toLocaleString()}
          />
          <StatCard
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
