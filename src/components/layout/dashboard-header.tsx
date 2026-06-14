"use client";

import { Bell, ChevronDown, CheckCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/opportunities": "Opportunities",
  "/dashboard/tasks":         "My Tasks",
  "/dashboard/offerwalls":    "Offerwall Hub",
  "/dashboard/earnings":      "Earnings",
  "/dashboard/wallet":        "NexCoins",
  "/dashboard/store":         "Store",
  "/dashboard/vouchers":      "My Vouchers",
  "/dashboard/support":       "Support",
  "/dashboard/profile":       "Profile",
  "/dashboard/settings":      "Settings",
};

const TYPE_COLORS: Record<string, string> = {
  submission_approved:  "text-green-400",
  submission_rejected:  "text-red-400",
  assignment_approved:  "text-green-400",
  assignment_rejected:  "text-red-400",
  voucher_delivered:    "text-[var(--brand-500)]",
  voucher:              "text-[var(--brand-500)]",
  support:              "text-blue-400",
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
  // Separate state — never derived, never recalculated on re-render.
  // Only four things ever touch this: initial fetch, realtime INSERT, markRead, markAllRead.
  const [unreadCount, setUnreadCount]     = useState(0);
  const userIdRef                         = useRef<string | null>(null);
  const ref                               = useRef<HTMLDivElement>(null);

  // Fetch ONCE on mount + realtime INSERT subscription.
  // Bell open/close and route changes never trigger a re-fetch.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, message, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("[notifications] fetch:", error.message);
        return;
      }

      const list = (data as Notification[]) ?? [];
      setNotifications(list);
      // Set count once from DB — this is the only time we derive it
      setUnreadCount(list.filter((n) => !n.is_read).length);

      // Realtime: new inserts only — increment count, prepend to list
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    }

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close dropdown on route change — no fetch, state is preserved
  useEffect(() => { setOpen(false); }, [pathname]);

  function markAllRead() {
    if (!userIdRef.current) return;
    // Synchronous local update — badge clears immediately, no re-derive possible
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    // Persist to DB in background. No boolean filter — just mark all owned rows read.
    // count:"exact" lets us catch silent 0-row updates (e.g. RLS blocking the write).
    void (async () => {
      const { error, count } = await supabase
        .from("notifications")
        .update({ is_read: true }, { count: "exact" })
        .eq("user_id", userIdRef.current!);
      if (error) {
        console.error("[notifications] markAllRead DB error:", error.message, error);
      } else if (count === 0) {
        console.warn("[notifications] markAllRead: 0 rows updated — check RLS UPDATE policy on notifications table");
      }
    })();
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    void (async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) console.error("[notifications] markRead DB error:", error.message);
    })();
  }

  return (
    <header className="h-16 fixed top-0 right-0 left-sidebar z-30 flex items-center justify-between px-6 bg-[var(--surface-card)] border-b border-[var(--border-default)]">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
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
