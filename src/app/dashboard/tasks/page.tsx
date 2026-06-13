import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { BadgeVariant } from "@/components/ui/badge";

const TABS = ["In Progress", "Submitted", "Approved", "Rejected"];

const TASKS = [
  { title: "Consumer Habits Survey",   type: "Survey",       date: "Jun 12, 2025", status: "in_progress", payout: 1.20 },
  { title: "Image Sentiment Tagging",  type: "Micro-task",   date: "Jun 12, 2025", status: "in_progress", payout: 0.06 },
  { title: "Audio Clip Transcription", type: "Data Labeling",date: "Jun 11, 2025", status: "submitted",   payout: 0.90 },
  { title: "Brand Awareness Study",    type: "Survey",       date: "Jun 10, 2025", status: "approved",    payout: 0.60 },
  { title: "Recipe Article Writing",   type: "Content Task", date: "Jun 9, 2025",  status: "approved",    payout: 3.50 },
  { title: "Text Sentiment Task",      type: "Micro-task",   date: "Jun 8, 2025",  status: "rejected",    payout: 0.04 },
];

const statusConfig: Record<string, { label: string; variant: BadgeVariant; action: string }> = {
  in_progress: { label: "In Progress", variant: "info",    action: "Continue" },
  submitted:   { label: "Submitted",   variant: "warning", action: "View" },
  approved:    { label: "Approved",    variant: "success", action: "View" },
  rejected:    { label: "Rejected",    variant: "danger",  action: "Retry" },
};

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">My Tasks</h1>
        <p className="text-sm text-[var(--text-secondary)]">Track all your submissions and their review status.</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto scrollbar-thin">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              i === 0
                ? "border-[var(--brand-500)] text-[var(--brand-600)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
            {i === 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] text-xs font-bold">
                2
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Task</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Type</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Date</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Status</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--text-secondary)]">Payout</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--text-secondary)]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {TASKS.map((task) => {
              const cfg = statusConfig[task.status];
              return (
                <tr key={task.title} className="hover:bg-[var(--surface-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-xs truncate">{task.title}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{task.type}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{task.date}</td>
                  <td className="px-4 py-3"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
                    {task.status === "approved" ? (
                      <span className="text-success-700 dark:text-[#4ADE80]">{formatCurrency(task.payout)}</span>
                    ) : task.status === "submitted" ? (
                      <span className="text-[var(--text-muted)]">Pending</span>
                    ) : (
                      formatCurrency(task.payout)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={task.status === "rejected" ? "secondary" : "ghost"}
                    >
                      {cfg.action}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden space-y-3">
        {TASKS.map((task) => {
          const cfg = statusConfig[task.status];
          return (
            <div key={task.title} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-[var(--text-primary)] text-sm">{task.title}</p>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--text-muted)]">{task.type} · {task.date}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(task.payout)}</span>
                  <Button size="sm" variant="ghost">{cfg.action}</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
