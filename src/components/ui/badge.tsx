import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
  success: "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]",
  warning: "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]",
  danger:  "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]",
  info:    "bg-[var(--badge-info-bg)] text-[var(--badge-info-text)]",
  brand:   "bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)]",
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5",
        "text-xs font-medium uppercase tracking-wide",
        "rounded-full",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
