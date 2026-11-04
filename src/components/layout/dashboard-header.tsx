"use client";

import {
  Bell,
  ChevronDown,
  CheckCheck,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Wallet,
  Banknote,
  Users,
  Menu,
  X,
  Download,
  Share,
  MoreVertical,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":               "Dashboard",
  "/dashboard/opportunities": "Earn",
  "/dashboard/surveys":       "Paid Surveys",
  "/dashboard/tasks":         "My Work",
  "/dashboard/offerwalls":    "Apps & Offers",
  "/dashboard/offerwalls/adbluemedia": "Partner Offers",
  "/dashboard/earnings":      "Earnings",
  "/dashboard/wallet":        "Coin Balance",
  "/dashboard/store":         "Cashout & Rewards",
  "/dashboard/leaderboard":   "Top Contributors",
  "/dashboard/vouchers":      "My Vouchers",
  "/dashboard/community":     "Community",
  "/dashboard/announcements": "News & Updates",
  "/dashboard/support":       "Help & Support",
  "/dashboard/nexleader":     "NexLeader",
  "/dashboard/profile":       "My Profile",
  "/dashboard/settings":      "Account Settings",
};

const TYPE_COLORS: Record<string, string> = {
  submission_approved:  "text-green-600",
  submission_rejected:  "text-red-500",
  assignment_approved:  "text-green-600",
  assignment_rejected:  "text-red-500",
  voucher_delivered:    "text-teal-600",
  voucher:              "text-teal-600",
  support:              "text-teal-700",
  new_task:             "text-teal-700",
  announcement:         "text-teal-700",
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

const NAV_CATEGORIES = [
  {
    label: "Home",
    icon: LayoutDashboard,
    href: "/dashboard",
    items: [],
  },
  {
    label: "Earn",
    icon: Sparkles,
    href: "/dashboard/opportunities",
    items: [
      { label: "Paid Tasks", href: "/dashboard/opportunities" },
      { label: "Paid Surveys", href: "/dashboard/surveys" },
      { label: "Apps & Offers", href: "/dashboard/offerwalls" },
      { label: "Partner Offers", href: "/dashboard/offerwalls/adbluemedia" },
      { label: "My Work", href: "/dashboard/tasks" },
    ],
  },
  {
    label: "Rewards",
    icon: Wallet,
    href: "/dashboard/wallet",
    items: [
      { label: "Coin Balance", href: "/dashboard/wallet" },
      { label: "Earnings History", href: "/dashboard/earnings" },
      { label: "My Vouchers", href: "/dashboard/vouchers" },
    ],
  },
  {
    label: "Community",
    icon: Users,
    href: "/dashboard/community",
    items: [
      { label: "Community Chat", href: "/dashboard/community" },
      { label: "Top Contributors", href: "/dashboard/leaderboard" },
      { label: "News & Updates", href: "/dashboard/announcements" },
      { label: "Help & Support", href: "/dashboard/support" },
    ],
  },
  {
    label: "Account",
    icon: User,
    href: "/dashboard/profile",
    items: [
      { label: "My Profile", href: "/dashboard/profile" },
      { label: "Account Settings", href: "/dashboard/settings" },
    ],
  },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  if (href === "/dashboard/offerwalls") {
    return pathname === href
      || (pathname.startsWith(`${href}/`) && !pathname.startsWith(`${href}/adbluemedia`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DashboardCategoryNav({
  pathname,
  className,
}: {
  pathname: string;
  className: string;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const activeCategory = NAV_CATEGORIES.find((category) =>
    category.items.length === 0
      ? isNavItemActive(pathname, category.href)
      : category.items.some((item) => isNavItemActive(pathname, item.href))
  );

  useEffect(() => {
    setOpenCategory(null);
  }, [pathname]);

  useEffect(() => {
    if (!openCategory) return;

    function handlePointerDown(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [openCategory]);

  return (
    <nav
      ref={navRef}
      aria-label="Dashboard navigation"
      className={className}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpenCategory(null);
      }}
    >
      {NAV_CATEGORIES.map((category) => {
        const CategoryIcon = category.icon;
        const active = activeCategory?.label === category.label;

        if (category.items.length === 0) {
          return (
            <Link
              key={category.label}
              href={category.href}
              aria-label={`${category.label} section`}
              title={category.label}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-2.5 text-[13px] font-semibold transition-colors sm:px-3 ${
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CategoryIcon className={`h-4 w-4 ${active ? "text-teal-600" : "text-slate-400"}`} />
              <span>{category.label}</span>
            </Link>
          );
        }

        return (
          <div key={category.label} className="relative">
            <button
              type="button"
              aria-label={`${category.label} menu`}
              aria-expanded={openCategory === category.label}
              onClick={() => setOpenCategory((current) => current === category.label ? null : category.label)}
              className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-2.5 text-[13px] font-semibold transition-colors sm:px-3 ${
                active || openCategory === category.label
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CategoryIcon className={`h-4 w-4 ${active ? "text-teal-600" : "text-slate-400"}`} />
              <span>{category.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${openCategory === category.label ? "rotate-180" : ""}`} />
            </button>
            {openCategory === category.label && (
              <div className="absolute left-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {category.items.map((item) => {
                  const itemActive = isNavItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenCategory(null)}
                      aria-current={itemActive ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        itemActive
                          ? "bg-teal-50 text-teal-800"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const router   = useRouter();
  const title    = PAGE_TITLES[pathname] ?? "Dashboard";
  const [open, setOpen]                   = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [userName, setUserName]           = useState<string | null>(null);
  const [userInitials, setUserInitials]   = useState("?");
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [installError, setInstallError] = useState("");
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const userIdRef                         = useRef<string | null>(null);
  const bellRef                           = useRef<HTMLDivElement>(null);
  const menuRef                           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const checkInstalled = () => {
      setIsInstalled(standaloneQuery.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    };
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    checkInstalled();
    standaloneQuery.addEventListener("change", checkInstalled);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener("change", checkInstalled);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Fetch once on mount: notifications + user name for avatar
  useEffect(() => {
    // 💡 ১. সুপ্রাবেস রিয়েলটাইম চ্যানেল ট্র্যাক করার জন্য রেফারেন্স লক করলাম
    const channelRef: { current: ReturnType<typeof supabase.channel> | null } = { current: null };

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      userIdRef.current = user.id;

      // Silently capture device fingerprint once per session
      const fpKey = `fp_sent_${user.id}`;
      if (!sessionStorage.getItem(fpKey)) {
        import("@fingerprintjs/fingerprintjs").then(async (FingerprintJS) => {
          try {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              await fetch("/api/profile/fingerprint", {
                method:  "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
                body:    JSON.stringify({ fingerprint: result.visitorId }),
              });
              sessionStorage.setItem(fpKey, "1");
            }
          } catch { /* silent */ }
        }).catch(() => {});
      }

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

  // Close notification and account menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMenuOpen(false);
        setInstallHelpOpen(false);
      }
    }
    if (open || menuOpen || installHelpOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, menuOpen, installHelpOpen]);

  // Close menus on route change
  useEffect(() => { setOpen(false); setMenuOpen(false); setMobileNavOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

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

  async function addToHomeScreen() {
    if (!installPrompt) {
      setInstallHelpOpen(true);
      return;
    }

    setInstallError("");
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (outcome === "accepted") setIsInstalled(true);
    } catch (error) {
      console.error("[pwa] install prompt failed:", error);
      setInstallError("The install prompt could not be opened. Use your browser menu to add NexGuild to your home screen.");
      setInstallHelpOpen(true);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-1 px-2 sm:gap-3 sm:px-6 xl:px-10">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800 sm:h-10 sm:w-10 lg:hidden"
            aria-label="Open dashboard navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="dashboard-mobile-drawer"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <NexGuildLogo theme="light" href="/dashboard" compactOnMobile />
          <span className="hidden h-7 w-px bg-slate-200 xl:block" />
          <div className="hidden min-w-0 xl:block">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Member space</p>
            <h1 className="truncate text-sm font-bold tracking-tight text-slate-800">{title}</h1>
          </div>
        </div>

        <div className="hidden min-w-0 lg:block">
          <DashboardCategoryNav
            pathname={pathname}
            className="flex items-center gap-1"
          />
        </div>

        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1.5">
          <Link
            href="/dashboard/store"
            aria-current={pathname === "/dashboard/store" ? "page" : undefined}
            aria-label="Cashout"
            className={`inline-flex h-8 flex-shrink-0 items-center justify-center gap-1 rounded-xl px-2 text-[11px] font-semibold transition-colors sm:h-10 sm:gap-2 sm:px-3 sm:text-[13px] ${
              pathname === "/dashboard/store"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-teal-50 text-teal-800 hover:bg-teal-100"
            }`}
          >
            <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Cashout</span>
          </Link>
          {/* Notification Bell */}
          <div ref={bellRef} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              open
                ? "border-teal-200 bg-teal-50 text-teal-800"
                : "border-transparent text-slate-500 hover:border-teal-100 hover:bg-teal-50/80 hover:text-teal-800"
            }`}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={open}
            aria-controls="dashboard-notification-panel"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#d6b66e] px-1 text-[9px] font-extrabold leading-none text-[#183d36] shadow-sm"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div
              id="dashboard-notification-panel"
              role="dialog"
              aria-label="Notifications"
              className="dashboard-notification-panel fixed right-3 top-[72px] z-50 flex max-h-[min(28rem,calc(100dvh-6rem))] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border sm:right-4 sm:w-96"
            >
              {/* Dropdown header */}
              <div className="flex flex-shrink-0 flex-col gap-2 border-b border-teal-900/10 bg-[linear-gradient(115deg,rgba(20,184,166,0.09),rgba(214,182,110,0.12))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-teal-700" />
                  <span className="text-sm font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full border border-teal-700/10 bg-teal-700/10 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-teal-700/10 bg-white/55 px-2.5 py-1 text-xs font-semibold text-teal-800 transition-colors hover:bg-white/85 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-white/55"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close notifications"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/70 hover:text-teal-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center gap-3 text-center px-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.14), rgba(214,182,110,0.2))" }}
                    >
                      <Bell className="h-6 w-6 text-teal-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Task updates will appear here.</p>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-teal-900/[0.07]">
                    {notifications.map((n) => {
                      const href = n.type ? (TYPE_HREF[n.type] ?? "/dashboard") : "/dashboard";
                      return (
                        <li key={n.id}>
                          <Link
                            href={href}
                            onClick={() => { markRead(n.id); setOpen(false); }}
                            className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-teal-50/70 ${!n.is_read ? "bg-teal-50/55" : ""}`}
                          >
                            {!n.is_read ? (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-teal-600 ring-4 ring-teal-600/10" />
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
            <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 sm:block ${menuOpen ? "rotate-180" : ""}`} />
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
      </div>
    </header>
    {mobileNavOpen && (
      <div className="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
          aria-label="Close dashboard navigation"
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          id="dashboard-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-mobile-drawer-title"
          className="dashboard-mobile-drawer absolute inset-y-0 left-0 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col border-r border-white/70 shadow-2xl"
        >
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-teal-900/10 px-4">
            <div>
              <NexGuildLogo theme="light" href="/dashboard" />
              <p id="dashboard-mobile-drawer-title" className="sr-only">Dashboard navigation</p>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-800"
              aria-label="Close dashboard navigation"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Mobile dashboard navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {NAV_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              if (category.items.length === 0) {
                const active = isNavItemActive(pathname, category.href);
                return (
                  <Link
                    key={category.label}
                    href={category.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                      active ? "bg-teal-700 text-white shadow-sm" : "text-slate-700 hover:bg-teal-50"
                    }`}
                  >
                    <CategoryIcon className={`h-4 w-4 ${active ? "text-white" : "text-teal-700"}`} />
                    {category.label}
                  </Link>
                );
              }

              return (
                <section key={category.label}>
                  <h2 className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    <CategoryIcon className="h-3.5 w-3.5 text-teal-700" />
                    {category.label}
                  </h2>
                  <ul className="space-y-1">
                    {category.items.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onClick={() => setMobileNavOpen(false)}
                            className={`flex min-h-10 items-center rounded-xl px-3 pl-9 text-sm font-medium transition-colors ${
                              active
                                ? "bg-teal-50 text-teal-800"
                                : "text-slate-600 hover:bg-white/70 hover:text-teal-800"
                            }`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </nav>
          <div className="flex-shrink-0 border-t border-teal-900/10 p-4">
            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  void addToHomeScreen();
                }}
                className="mb-3 flex min-h-11 w-full items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-3 text-left text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100"
              >
                <Download className="h-4 w-4 flex-shrink-0" />
                Add NexGuild to Home Screen
              </button>
            )}
            <p className="text-xs font-medium text-slate-500">{userName || "NexGuild Member"}</p>
            <p className="mt-1 text-[10px] text-slate-400">Contributor workspace</p>
          </div>
        </aside>
      </div>
    )}
    {installHelpOpen && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) setInstallHelpOpen(false);
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-nexguild-title"
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-teal-800 to-teal-600 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Download className="h-5 w-5" />
              </span>
              <div>
                <h2 id="install-nexguild-title" className="font-bold">Add NexGuild to your home screen</h2>
                <p className="mt-0.5 text-xs text-teal-50/80">Open it like an app, right from your phone.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close install instructions"
              onClick={() => setInstallHelpOpen(false)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-5">
            {installError && (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {installError}
              </p>
            )}
            <ol className="space-y-3 text-sm text-slate-700">
              {isIOS ? (
                <>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Share className="h-4 w-4" /></span>
                    <span>In Safari, tap the <b>Share</b> button.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><span className="text-base font-bold">＋</span></span>
                    <span>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><MoreVertical className="h-4 w-4" /></span>
                    <span>Open your browser menu (⋮).</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Download className="h-4 w-4" /></span>
                    <span>Tap <b>Install app</b> or <b>Add to Home screen</b>.</span>
                  </li>
                </>
              )}
            </ol>
            <button
              type="button"
              onClick={() => setInstallHelpOpen(false)}
              className="w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-teal-800"
            >
              Got it
            </button>
          </div>
        </section>
      </div>
    )}
    </>
  );
}