"use client";

import { Bell, ChevronDown, CheckCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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

const TYPE_COLORS: Record<string, string> = {
  submission_approved:  "text-green-400",
  submission_rejected:  "text-red-400",
  assignment_approved:  "text-green-400",
  assignment_rejected:  "text-red-400",
  voucher_delivered:    "text-[var(--brand-500)]",
  new_task:             "text-blue-400",
  announcement:         "text-[var(--brand-500)]",
};

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const title    = PAGE_TITLES[pathname] ?? "Dashboard";

  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId]               = useState<string | null>(null);
  const ref                               = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, is_read, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data as Notification[]) ?? []);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      fetchNotifications(user.id);
    }
    init();
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  async function markAllRead() {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  function handleBellClick() {
    setOpen((v) => {
      if (!v && userId) fetchNotifications(userId); // refresh on open
      return !v;
    });
  }

  return (
    <header className="h-16 fixed top-0 right-0 left-sidebar z-30 flex items-center justify-between px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div ref={ref} className="relative">
          <button
            onClick={handleBellClick}
            className="relative h-9 w-9 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-[var(--brand-500)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-80 max-h-[480px] flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Notifications {unreadCount > 0 && <span className="text-[var(--brand-500)]">({unreadCount})</span>}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-center px-4">
                    <Bell className="h-8 w-8 text-[var(--text-muted)]" />
                    <p className="text-sm font-medium text-[var(--text-primary)]">No notifications yet</p>
                    <p className="text-xs text-[var(--text-muted)]">Task approvals and updates will appear here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--border-default)]">
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`px-4 py-3 cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors ${!n.is_read ? "bg-[var(--brand-500)]/5" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.is_read && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-[var(--brand-500)] flex-shrink-0" />
                          )}
                          <div className={!n.is_read ? "" : "ml-4"}>
                            <p className={`text-xs font-semibold ${n.type ? (TYPE_COLORS[n.type] ?? "text-[var(--text-primary)]") : "text-[var(--text-primary)]"}`}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                              {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <button className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-[var(--surface-subtle)] transition-colors">
          <Avatar name="?" size="sm" />
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      </div>
    </header>
  );
}
