import { StatCard } from "@/components/ui/stat-card";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { TrendingUp, Wallet, ClipboardList, ArrowRight, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const EARNINGS_STATS = [
  { label: "Today",      value: formatCurrency(1.40) },
  { label: "This Week",  value: formatCurrency(12.80) },
  { label: "This Month", value: formatCurrency(47.20) },
  { label: "All Time",   value: formatCurrency(214.60) },
];

const ACTIVE_TASKS = [
  { title: "Consumer Sentiment Survey", type: "Survey", payout: "$1.20" },
  { title: "Image Tagging Batch #47",   type: "Micro-task", payout: "$0.08" },
];

const RECENT_ACTIVITY = [
  { icon: CheckCircle, color: "text-[var(--success-text)]", label: "Survey approved", amount: "+$1.20", time: new Date(Date.now() - 1000 * 60 * 40) },
  { icon: CheckCircle, color: "text-[var(--success-text)]", label: "Image tagging batch approved", amount: "+$0.16", time: new Date(Date.now() - 1000 * 60 * 60 * 3) },
  { icon: Clock,       color: "text-[var(--warning-text)]", label: "Product description submitted", amount: "Pending", time: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  { icon: Wallet,      color: "text-[var(--info-text)]",    label: "Lootably offerwall earnings", amount: "+$0.85", time: new Date(Date.now() - 1000 * 60 * 60 * 8) },
];

const FEATURED_OPPS = [
  {
    title: "Brand Perception Survey",
    type: "survey" as const,
    description: "Quick 6-minute survey on technology brand awareness.",
    payout: "$0.75",
    estimatedMinutes: 6,
    skillLevel: "any" as const,
    href: "/dashboard/opportunities/1",
  },
  {
    title: "Sentiment Classification",
    type: "micro_task" as const,
    description: "Classify short social media posts as positive, negative, or neutral.",
    payout: "$0.06",
    estimatedMinutes: 2,
    skillLevel: "any" as const,
    href: "/dashboard/opportunities/2",
  },
  {
    title: "Recipe Article Writing",
    type: "content_task" as const,
    description: "Write a 300-word article on a provided recipe topic following the style guide.",
    payout: "$3.50",
    estimatedMinutes: 20,
    skillLevel: "intermediate" as const,
    href: "/dashboard/opportunities/3",
  },
];

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      {/* Earnings Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {EARNINGS_STATS.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      {/* Active Tasks + Wallet Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Active Tasks */}
        <div className="lg:col-span-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Active Tasks</h2>
            <Link href="/dashboard/tasks" className="text-sm text-[var(--text-link)] hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {ACTIVE_TASKS.length > 0 ? (
            <ul className="space-y-3">
              {ACTIVE_TASKS.map((task) => (
                <li key={task.title} className="flex items-center justify-between py-3 border-b border-[var(--border-default)] last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <ClipboardList className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{task.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-sm font-semibold text-[var(--success-text)]">{task.payout}</span>
                    <Button size="sm" variant="secondary">Continue</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <ClipboardList className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">No active tasks. Browse opportunities to get started.</p>
            </div>
          )}
        </div>

        {/* Wallet Snapshot */}
        <div className="lg:col-span-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Wallet</h2>
            <Wallet className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Available</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(38.45)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Pending</p>
              <p className="text-lg font-semibold text-[var(--warning-text)]">{formatCurrency(8.75)}</p>
            </div>
          </div>
          <Button className="w-full" asChild>
            <Link href="/dashboard/wallet">Withdraw Earnings</Link>
          </Button>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">Min. $5.00 required</p>
        </div>
      </div>

      {/* Featured Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Available Now</h2>
          <Link href="/dashboard/opportunities" className="text-sm text-[var(--text-link)] hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_OPPS.map((opp) => (
            <OpportunityCard key={opp.title} {...opp} />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent Activity</h2>
          <Link href="/dashboard/earnings" className="text-sm text-[var(--text-link)] hover:underline flex items-center gap-1">
            View all earnings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="divide-y divide-[var(--border-default)]">
          {RECENT_ACTIVITY.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${item.color}`} />
                  <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className={`text-sm font-semibold ${item.amount.startsWith("+") ? "text-[var(--success-text)]" : "text-[var(--text-muted)]"}`}>
                    {item.amount}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{timeAgo(item.time)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
