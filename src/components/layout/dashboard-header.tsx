"use client";

import { Bell, ChevronDown, CheckCheck, User, Settings, LogOut, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/opportunities": "Opportunities",
  "/dashboard/tasks":         "My Tasks",
  "/dashboard/offerwalls":    "Offerwall Hub",
  "/dashboard/earnings":      "Earnings",
  "/dashboard/wallet":        "NexCoins",
  "/dashboard/store":         "NexStore",
  "/dashboard/leaderboard":   "Leaderboard",
  "/dashboard/vouchers":      "My Vouchers",
  "/dashboard/support":       "Support",
  "/dashboard/profile":       "Profile",
  "/dashboard/settings":      "Settings",
};

const TYPE_COLORS: Record<string, string> = {
  submission_approved:  "text-green-600",
  submission_rejected:  "text-red-500",
  assignment_approved:  "text-green-600",
  assignment_rejected:  "text-red-500",
  voucher_delivered:    "text-teal-600",
  voucher:              "text-teal-600",
  support:              "text-indigo-500",
  new_task:             "text-indigo-500",
  announcement:         "text-indigo-500",
  bonus_coins:          "text-amber-500",
  system:               "text-slate-500",
};

const TYPE_HREF: Record<string, string> = {
  submission_approved:  "/dashboard/earnings",
  submission_rejected:  "/dashboard/tasks",
  assignment_approved:  "/dashboard/earnings",
  assignment_rejected:  "/dashboard/tasks",
  voucher_delivered:    "/dashboard/vouchers",
  voucher:              "/dashboard/vouchers",
  support:              "/dashboard/support",
  new_task:             "/dashboard/tasks",
  announcement:         "/dashboard/announcements",
  bonus_coins:          "/dashboard/earnings",
  system:               "/dashboard",
};

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const title    = PAGE_TITLES[pathname] ?? "Dashboard";
  const [open, setOpen]                   = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [userName, setUserName]           = useState<string | null>(null);
  const [userInitials, setUserInitials]   = useState("?");
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const userIdRef                         = useRef<string | null>(null);
  const bellRef                           = useRef<HTMLDivElement>(null);
  const menuRef                           = useRef<HTMLDivElement>(null);

  // Fetch once on mount: notifications + user name for avatar
  useEffect(() => {
    // 💡 ১. সুপ্রাবেস রিয়েলটাইম চ্যানেল ট্র্যাক করার জন্য রেফারেন্স লক করলাম
    const channelRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null };

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userIdRef.current = user.id;

      // Fetch profile name, avatar, and notifications in parallel
      const [{ data: profileData }, { data, error }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single(),
        supabase
          .from("notifications")
          .select("id, title, message, type, is_read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      // Set user name, initials, and avatar
      const name = profileData?.full_name ?? user.email ?? "";
      setUserName(name);
      setUserInitials(
        name
          ? name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
          : "?"
      );
      if (profileData?.avatar_url) setAvatarUrl(profileData.avatar_url);

      if (error) {
        console.error("[notifications] fetch:", error.message);
        return;
      }

      const list = (data as Notification[]) ?? [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);

      const channelName = `notifications-${user.id}`;

      const existingChannel = supabase.getChannels().find((ch) => (ch as any).topic === `realtime:${channelName}`);
if (existingChannel) {
  await supabase.removeChannel(existingChannel);
}

      // ৩. এবার একদম ফ্রেশ ভাবে ইভেন্ট অন করে সাবস্ক্রাইব করব
      const activeChannel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        );

      activeChannel.subscribe();
      channelRef.current = activeChannel;
    }

    init();

    // 💡 ৪. সেফ ক্লিনআপ: পেজ লিভ করলে ব্যাকগ্রাউন্ড মেমোরি ক্লিয়ার হবে
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close both dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (open || menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, menuOpen]);

  // Close dropdowns on route change
  useEffect(() => { setOpen(false); setMenuOpen(false); }, [pathname]);

  // Live avatar sync: profile page dispatches this after a successful upload
  useEffect(() => {
    function onAvatarUpdated(e: Event) {
      const url = (e as CustomEvent<{ url: string }>).detail?.url;
      if (url) setAvatarUrl(url);
    }
    window.addEventListener("nexguild:avatar-updated", onAvatarUpdated);
    return () => window.removeEventListener("nexguild:avatar-updated", onAvatarUpdated);
  }, []);

  function markAllRead() {
    if (!userIdRef.current) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    void (async () => {
      const { error, count } = await supabase
        .from("notifications")
        .update({ is_read: true }, { count: "exact" })
        .eq("user_id", userIdRef.current!);
      if (error) console.error("[notifications] markAllRead DB error:", error.message, error);
      else if (count === 0) console.warn("[notifications] markAllRead: 0 rows updated — check RLS UPDATE policy on notifications table");
    })();
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    void (async () => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) console.error("[notifications] markRead DB error:", error.message);
    })();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-sidebar z-30 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notification Bell */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 h-4 min-w-[16px] px-0.5 rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] max-h-[28rem] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50">
              {/* Dropdown header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(20,184,166,0.04) 100%)" }}
              >
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-100">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-center px-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
                    >
                      <Bell className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Task updates will appear here.</p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {notifications.map((n) => {
                      const href = n.type ? (TYPE_HREF[n.type] ?? "/dashboard") : "/dashboard";
                      return (
                        <li key={n.id}>
                          <Link
                            href={href}
                            onClick={() => { markRead(n.id); setOpen(false); }}
                            className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${!n.is_read ? "bg-indigo-50/40" : ""}`}
                          >
                            {!n.is_read ? (
                              <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0 bg-indigo-500" />
                            ) : (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold ${n.type ? (TYPE_COLORS[n.type] ?? "text-slate-800") : "text-slate-800"}`}>
                                {n.title}
                              </p>
                              {n.message && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-1.5">
                                {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 h-9 pl-2 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="User menu"
          >
            <div className="relative">
              <Avatar src={avatarUrl} name={userInitials} size="sm" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[100px] truncate">
              {userName ? userName.split(" ")[0] : ""}
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-56 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50">
              {/* Profile header */}
              <div className="px-4 py-3.5 border-b border-slate-100"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(20,184,166,0.05) 100%)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar src={avatarUrl} name={userInitials} size="sm" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{userName || "Member"}</p>
                    <p className="text-[11px] text-slate-400 font-medium">NexGuild Member</p>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <User className="h-4 w-4 text-slate-400" />
                View Profile
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </Link>
              <div className="border-t border-slate-100 mx-2" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}