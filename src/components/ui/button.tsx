import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--brand-500)] text-white border-transparent",
    "hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  secondary: [
    "bg-transparent text-[var(--brand-600)] border border-[var(--border-default)]",
    "hover:bg-[var(--brand-50)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--text-secondary)] border-transparent",
    "hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  destructive: [
    "bg-danger-500 text-white border-transparent",
    "hover:bg-danger-700",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  "h-8  px-3 text-sm  rounded",
  md:  "h-9  px-4 text-sm  rounded-md",
  lg:  "h-11 px-6 text-base rounded-md",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "font-medium whitespace-nowrap",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1",
        "active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </>
      )}
    </Comp>
  );
}
