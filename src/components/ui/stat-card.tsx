import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-secondary)] font-medium">{label}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 truncate">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-1 font-medium",
                trendUp ? "text-[var(--success-text)]" : "text-[var(--text-muted)]"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 text-[var(--text-muted)]">{icon}</div>
        )}
      </div>
    </div>
  );
}
