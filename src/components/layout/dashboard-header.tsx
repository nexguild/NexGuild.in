"use client";

import { Bell, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/opportunities": "Opportunities",
  "/dashboard/tasks":         "My Tasks",
  "/dashboard/offerwalls":    "Offerwall Hub",
  "/dashboard/earnings":      "Earnings",
  "/dashboard/wallet":        "NexCoins",
  "/dashboard/store":         "Store",
  "/dashboard/profile":       "Profile",
  "/dashboard/settings":      "Settings",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="h-16 fixed top-0 right-0 left-sidebar z-30 flex items-center justify-between px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-500)]" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-[var(--surface-subtle)] transition-colors">
          <Avatar name="?" size="sm" />
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  );
}
