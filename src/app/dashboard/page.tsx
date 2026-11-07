"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList, Layers, ArrowRight,
  RefreshCw, Flame, Star, Lock, Trophy, CheckCircle2, Clock, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";
import { formatNexcoins } from "@/lib/nexcoins";
import {
  type DashboardPromotion,
} from "@/lib/dashboard-promotion";

/* ─── Types ─────────────────────────────────────────────────────── */
interface Profile {
  full_name: string | null;
  nexcoins: number;
  xp: number | null;
  level: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  last_streak_claim_date: string | null;
  last_task_approved_date: string | null;
  tasks_approved_today: number | null;
}
interface Task {
  id: string; title: string; description: string | null;
  task_type: string | null; pay_per_task: number | null;
  xp_reward: number | null; required_level: number | null;
  is_featured: boolean | null;
}
interface OfferwallProvider { id: string; name: string; slug: string; is_ad_network: boolean; description: string | null; logo_url: string | null; isLive: boolean; }
interface SubmissionMeta { status: string; feedback: string | null; }
interface Notification { id: string; title: string; message: string | null; type: string | null; created_at: string; }
interface CoinTx { amount: number; created_at: string; source?: string | null; }
interface LeaderboardEntry { rank: number; id: string; full_name: string; approved_count: number; }
interface StreakDayRow { day_date: string; tasks_completed: number; target_met: boolean; reward_claimed: boolean; reward_amount: number; }

/* ─── Count-Up Hook (FIX 4) ─────────────────────────────────────── */
function useCountUp(target: number, duration: number = 1000): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Number((eased * target).toFixed(6)));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Earnings SVG Line Chart ────────────────────────────────────── */
function EarningsChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return (
    <div className="h-32 flex items-center justify-center text-sm text-slate-400">No earnings data yet</div>
  );
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 500; const H = 100; const pad = 8;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - 2 * pad);
    const y = H - pad - ((d.value / max) * (H - 2 * pad));
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const areaPath = `M${pts[0]} L${pts.join(" L")} L${pad + (W - 2 * pad)},${H - pad} L${pad},${H - pad} Z`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#earnGrad)" />
        <polyline points={polyline} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - 2 * pad);
          const y = H - pad - ((d.value / max) * (H - 2 * pad));
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#b08b45" stroke="white" strokeWidth="1.5" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-slate-400">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Daily Progress Ring ────────────────────────────────────────── */
function ProgressRing({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  const r = 36; const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#e5eee9" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none" stroke="#0f766e" strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800">{value}</span>
          <span className="text-[10px] text-slate-400 leading-tight">{sub}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-600 text-center">{label}</p>
    </div>
  );
}

/* ─── Streak helpers ─────────────────────────────────────────────── */
const STREAK_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getISTDate(daysOffset = 0): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  d.setDate(d.getDate() + daysOffset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(): string[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const dow = now.getDay(); // 0=Sun
  const mon = new Date(now);
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

/* ─── Streak Grid ────────────────────────────────────────────────── */
function StreakGrid({
  weekDates, streakDays, todayIST, tasksRequired,
  streak, dailyBonus, day7Bonus,
  claimingDay, claimResult, claimError, onClaim,
}: {
  weekDates: string[];
  streakDays: StreakDayRow[];
  todayIST: string;
  tasksRequired: number;
  streak: number;
  dailyBonus: number;
  day7Bonus: number;
  claimingDay: boolean;
  claimResult: { awarded: number; is_day7_bonus: boolean } | null;
  claimError: string | null;
  onClaim: () => void;
}) {
  const dayMap = Object.fromEntries(streakDays.map(d => [d.day_date, d]));
  const todayRow = dayMap[todayIST];
  const canClaim = (todayRow?.target_met ?? false) && !(todayRow?.reward_claimed ?? false) && !claimResult;

  return (
    <div className="relative isolate overflow-hidden rounded-[1.5rem] border border-[#dce9e3] bg-white shadow-[0_8px_28px_rgba(15,76,69,0.06)]">
      <div className="relative overflow-hidden bg-[linear-gradient(110deg,#12483f,#0f766e)] px-5 py-5 text-white sm:px-7">
        <div aria-hidden className="absolute -right-10 -top-20 h-48 w-48 rounded-full border border-white/10" />
        <div aria-hidden className="absolute -right-2 -top-14 h-36 w-36 rounded-full border border-white/[0.08]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6c77d]/20 bg-[#e6c77d]/10 text-[#e6c77d]">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Consistency pays off</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Your weekly streak</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5">
            <Flame className="h-4 w-4 text-[#e6c77d]" />
            <span className="text-sm font-bold">{streak} day{streak === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>
      <div className="p-5 sm:px-7 sm:py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">Complete tasks each day to keep your momentum.</p>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#f7f1e4] px-3 py-1.5 text-[11px] font-bold text-[#806323] sm:inline-flex">
            <NexCoinIcon size={14} /> Day 7 bonus +{day7Bonus}
          </span>
        </div>

      {/* 7-day circles */}
      <div className="relative mb-5 grid grid-cols-7 gap-1">
        <div aria-hidden className="absolute left-[7%] right-[7%] top-[42px] h-px bg-slate-100" />
        {weekDates.map((date, i) => {
          const row      = dayMap[date];
          const isToday  = date === todayIST;
          const isPast   = date < todayIST;
          const claimed  = row?.reward_claimed ?? false;
          const targetMet = row?.target_met ?? false;
          const completed = row?.tasks_completed ?? 0;

          /* reward label above circle */
          const rewardLabel = claimed
            ? `+${row?.reward_amount ?? dailyBonus}`
            : isToday && targetMet
            ? "Claim!"
            : i === 6
            ? `+${day7Bonus}`
            : `+${dailyBonus}`;

          /* circle appearance */
          let circleClass = "";
          let circleContent: React.ReactNode;

          if (isPast) {
            if (claimed) {
              circleClass   = "bg-teal-500 text-white";
              circleContent = "✓";
            } else {
              circleClass   = "bg-gray-100 text-gray-300 border-2 border-gray-200";
              circleContent = "✗";
            }
          } else if (isToday) {
            if (claimed || (claimResult && !canClaim)) {
              circleClass   = "bg-teal-500 text-white";
              circleContent = "✓";
            } else if (targetMet) {
              circleClass   = "bg-amber-400 text-white animate-pulse";
              circleContent = "!";
            } else {
              circleClass   = "border-2 border-teal-400 text-teal-700 bg-teal-50 animate-pulse";
              circleContent = <span className="text-[10px] font-bold">{completed}/{tasksRequired}</span>;
            }
          } else {
            /* future */
            circleClass   = "border-2 border-gray-200 text-gray-300 bg-gray-50";
            circleContent = null;
          }

          return (
            <div key={date} className="relative z-10 flex min-w-0 flex-col items-center gap-2">
              <span className={`text-[9px] font-bold leading-none sm:text-[10px] ${
                claimed ? "text-teal-600" : isToday && targetMet ? "text-amber-600" : "text-slate-400"
              }`}>
                {rewardLabel} <span className="hidden sm:inline">NC</span>
              </span>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ring-4 ring-white transition sm:h-12 sm:w-12 ${circleClass}`}>
                {circleContent}
              </div>
              <span className={`text-[10px] font-semibold ${isToday ? "text-teal-800" : "text-slate-400"}`}>
                {STREAK_DAY_NAMES[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Claim / status area */}
      {claimResult ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50 py-3 text-sm font-bold text-teal-800">
          <NexCoinIcon size={16} />
          +{claimResult.awarded} coins claimed!{claimResult.is_day7_bonus ? " 🔥 7-Day Bonus!" : " Keep it up!"}
        </div>
      ) : canClaim ? (
        <button
          onClick={onClaim}
          disabled={claimingDay}
          className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(15,118,110,0.18)] transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60"
          style={{ background: "linear-gradient(90deg,#0f766e,#12483f)" }}
        >
          {claimingDay ? "Claiming…" : `🎉 Claim Today's Reward — +${dailyBonus} NexCoins`}
        </button>
      ) : claimError ? (
        <div className="py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-center text-slate-500">
          {claimError}
        </div>
      ) : (todayRow?.reward_claimed) ? (
        <div className="rounded-xl border border-teal-100 bg-teal-50 py-3 text-center text-xs font-semibold text-teal-800">
          ✓ Reward claimed today — come back tomorrow!
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 bg-[#f8faf9] p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Today&apos;s progress</span>
            <span className="font-bold text-teal-800">{todayRow?.tasks_completed ?? 0} / {tasksRequired} tasks</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/70">
            <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, ((todayRow?.tasks_completed ?? 0) / tasksRequired) * 100)}%`, background: "linear-gradient(90deg, #0f766e, #c4a15a)" }} />
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            {Math.max(0, tasksRequired - (todayRow?.tasks_completed ?? 0))} more task{Math.max(0, tasksRequired - (todayRow?.tasks_completed ?? 0)) !== 1 ? "s" : ""} needed to unlock today&apos;s streak reward
          </p>
        </div>
      )}
      </div>
    </div>
  );
}

/* ─── Fallback fake data (shown only when real data is empty) ───── */
// TODO: Remove FAKE_LEADERBOARD once real users are active
const FAKE_LEADERBOARD: LeaderboardEntry[] = [
  { rank:  1, id: "f01", full_name: "Priya Sharma",      approved_count: 15 },
  { rank:  2, id: "f02", full_name: "Rahul Mehta",       approved_count: 14 },
  { rank:  3, id: "f03", full_name: "Ananya Krishnan",   approved_count: 13 },
  { rank:  4, id: "f04", full_name: "Deepak Rajput",     approved_count: 12 },
  { rank:  5, id: "f05", full_name: "Sneha Tiwari",      approved_count: 11 },
  { rank:  6, id: "f06", full_name: "Arjun Nair",        approved_count: 10 },
  { rank:  7, id: "f07", full_name: "Kavya Reddy",       approved_count:  9 },
  { rank:  8, id: "f08", full_name: "Vikram Pandey",     approved_count:  8 },
  { rank:  9, id: "f09", full_name: "Pooja Iyer",        approved_count:  7 },
  { rank: 10, id: "f10", full_name: "Mohit Sinha",       approved_count:  6 },
];

const FAKE_ACTIVITY: Notification[] = [
  { id: "fa1", title: "Task Approved", message: "Audio Recording Sample #12 was approved", type: "submission_approved", created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: "fa2", title: "New Task Available", message: "Data Annotation batch is now live", type: "new_task", created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "fa3", title: "Bonus Coins Credited", message: "Day streak reward — +10 NexCoins", type: "bonus_coins", created_at: new Date(Date.now() - 9 * 3600000).toISOString() },
  { id: "fa4", title: "Task Approved", message: "Transcription task completed and approved", type: "submission_approved", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "fa5", title: "New Task Available", message: "App Testing (Android) — limited slots", type: "new_task", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "fa6", title: "Welcome to NexGuild!", message: "Complete your first task to start earning", type: "announcement", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
];

const FAKE_CHART: { label: string; value: number }[] = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 210 },
  { label: "Wed", value: 180 },
  { label: "Thu", value: 340 },
  { label: "Fri", value: 290 },
  { label: "Sat", value: 410 },
  { label: "Sun", value: 260 },
];

/* ─── Page ─────────────────────────────────────────────────────── */
export default function DashboardHome() {
  const [profile, setProfile]               = useState<Profile | null>(null);
  const [tasks, setTasks]                   = useState<Task[]>([]);
  const [userLevel, setUserLevel]           = useState(1);
  const [submissionMeta, setSubmissionMeta] = useState<Record<string, SubmissionMeta>>({});
  const [tasksDone, setTasksDone]           = useState(0);
  const [approvalRate, setApprovalRate]     = useState<number | null>(null);
  const [totalEarned, setTotalEarned]       = useState(0);
  const [todayApproved, setTodayApproved]   = useState(0);
  const [chartData, setChartData]           = useState<{ label: string; value: number }[]>([]);
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [leaderboard, setLeaderboard]       = useState<LeaderboardEntry[]>([]);
  const [streakDays, setStreakDays]         = useState<StreakDayRow[]>([]);
  const [liveOfferwalls, setLiveOfferwalls] = useState<OfferwallProvider[]>([]);
  const [loading, setLoading]               = useState(true);
  const [dailyBonus, setDailyBonus]         = useState(10);
  const [day7Bonus, setDay7Bonus]           = useState(50);
  const [tasksRequired, setTasksRequired]   = useState(5);
  const [nexcoinPerUsd, setNexcoinPerUsd]   = useState(1000);
  const [claimingDay, setClaimingDay]       = useState(false);
  const [claimResult, setClaimResult]       = useState<{ awarded: number; is_day7_bonus: boolean } | null>(null);
  const [claimError, setClaimError]         = useState<string | null>(null);
  const [loginRewardClaimed, setLoginRewardClaimed] = useState<boolean | null>(null);
  const [claimingLogin, setClaimingLogin]           = useState(false);
  const [loginRewardAmount, setLoginRewardAmount]   = useState<number | null>(null);
  const [promotion, setPromotion] = useState<DashboardPromotion | null>(null);
  const [showDashboardPromotion, setShowDashboardPromotion] = useState(false);

  useEffect(() => {
    if (!promotion) {
      setShowDashboardPromotion(false);
      return;
    }

    const timers: number[] = [];
    const updatePromotionVisibility = () => {
      const now = Date.now();
      const start = promotion.startsAt ? Date.parse(promotion.startsAt) : null;
      const end = promotion.endsAt ? Date.parse(promotion.endsAt) : null;
      setShowDashboardPromotion(
        promotion.enabled &&
        (start === null || now >= start) &&
        (end === null || now <= end)
      );
    };
    const scheduleUpdate = (timestamp: number) => {
      const timer = window.setTimeout(() => {
        updatePromotionVisibility();
        if (Date.now() < timestamp) scheduleUpdate(timestamp);
      }, Math.min(Math.max(0, timestamp - Date.now()), 2_147_483_647));
      timers.push(timer);
    };
    updatePromotionVisibility();

    const start = promotion.startsAt ? Date.parse(promotion.startsAt) : null;
    const end = promotion.endsAt ? Date.parse(promotion.endsAt) : null;
    if (start !== null && start > Date.now()) {
      scheduleUpdate(start);
    }
    if (end !== null && end >= Date.now()) {
      scheduleUpdate(end + 1);
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [promotion]);

  useEffect(() => {
    fetch("/api/dashboard-promotion", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json() as DashboardPromotion | { error?: string };
        if (!res.ok) {
          throw new Error("error" in data ? data.error ?? "Could not load dashboard announcement." : "Could not load dashboard announcement.");
        }
        setPromotion(data as DashboardPromotion);
      })
      .catch((cause: unknown) => {
        console.error("[dashboard] promotion load failed:", cause);
      });
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
      const { data: { session } } = await supabase.auth.getSession();

      const todayIST     = getISTDate();
      const yesterdayIST = getISTDate(-1);
      const weekDates    = getWeekDates();
      const datesToFetch = [...new Set([...weekDates, yesterdayIST])];

      const [
        { data: profileData },
        { data: tasksData },
        { data: mySubmissions },
        { count: approvedCount },
        { count: reviewedCount },
        { data: txData },
        { data: notifData },
        { data: streakSettings },
        { data: streakDaysData },
        leaderRes,
        offerRes,
      ] = await Promise.all([
        supabase.from("profiles").select("full_name, nexcoins, xp, level, current_streak, longest_streak, last_streak_claim_date, last_task_approved_date, tasks_approved_today").eq("id", user.id).single(),
        supabase.from("tasks").select("id, title, description, task_type, pay_per_task, xp_reward, required_level, is_featured").eq("status", "active").or("is_private.eq.false,is_private.is.null").is("deleted_at", null).order("created_at", { ascending: false }).limit(20),
        supabase.from("submissions").select("task_id, status, feedback").eq("contributor_id", user.id),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("contributor_id", user.id).eq("status", "approved"),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("contributor_id", user.id).in("status", ["approved", "rejected"]),
        supabase.from("coin_transactions").select("amount, created_at, source").eq("contributor_id", user.id).eq("type", "earned").gte("created_at", sevenDaysAgo + "T00:00:00"),
        supabase.from("notifications").select("id, title, message, type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("platform_settings").select("key, value").in("key", ["streak_daily_bonus", "streak_day7_bonus", "streak_tasks_required_per_day", "nexcoin_per_usd"]),
        supabase.from("streak_days").select("day_date, tasks_completed, target_met, reward_claimed, reward_amount").eq("contributor_id", user.id).in("day_date", datesToFetch),
        fetch("/api/leaderboard?limit=5", { headers: { Authorization: `Bearer ${session?.access_token}` } }),
        fetch("/api/offerwalls", { headers: { Authorization: `Bearer ${session?.access_token}` } }),
      ]);

      const p = profileData as Profile | null;
      setUserLevel(p?.level ?? 1);

      // Process streak_days for this week
      const sRows = (streakDaysData as StreakDayRow[] | null) ?? [];
      setStreakDays(sRows.filter(d => weekDates.includes(d.day_date)));

      // Streak reset check: if yesterday wasn't claimed and today isn't claimed yet, reset
      if (p && (p.current_streak ?? 0) > 0) {
        const yRow = sRows.find(d => d.day_date === yesterdayIST);
        const tRow = sRows.find(d => d.day_date === todayIST);
        if (!yRow?.reward_claimed && !tRow?.reward_claimed) {
          await supabase.from("profiles").update({ current_streak: 0 }).eq("id", user.id);
          p.current_streak = 0;
        }
      }

      const settingsRows = (streakSettings as { key: string; value: string }[] | null) ?? [];
      setDailyBonus(parseInt(settingsRows.find(r => r.key === "streak_daily_bonus")?.value ?? "10") || 10);
      setDay7Bonus(parseInt(settingsRows.find(r => r.key === "streak_day7_bonus")?.value ?? "50") || 50);
      setTasksRequired(parseInt(settingsRows.find(r => r.key === "streak_tasks_required_per_day")?.value ?? "5") || 5);
      setNexcoinPerUsd(parseFloat(settingsRows.find(r => r.key === "nexcoin_per_usd")?.value ?? "1000") || 1000);

      const metaMap: Record<string, SubmissionMeta> = {};
      for (const s of (mySubmissions ?? []) as { task_id: string; status: string; feedback: string | null }[]) {
        metaMap[s.task_id] = { status: s.status, feedback: s.feedback };
      }
      setSubmissionMeta(metaMap);

      const availableTasks = ((tasksData ?? []) as Task[])
        .filter(t => { const sub = metaMap[t.id]; return !sub || sub.status === "resubmit_requested"; })
        .slice(0, 3);
      setTasks(availableTasks);

      const approved = approvedCount ?? 0;
      const reviewed = reviewedCount ?? 0;
      setTasksDone(approved);
      setApprovalRate(reviewed > 0 ? Math.round((approved / reviewed) * 100) : null);

      const txRows = (txData ?? []) as CoinTx[];
      setTotalEarned(txRows.reduce((s, r) => s + (r.amount ?? 0), 0));
      setLoginRewardClaimed(txRows.some(r => r.source === "daily_login" && r.created_at.startsWith(today)));

      const todayTaskTx = txRows.filter(r => r.created_at.startsWith(today) && (r.source === "task" || r.source == null));
      setTodayApproved(todayTaskTx.length);

      const dayMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        dayMap[d] = 0;
      }
      for (const tx of txRows) {
        const d = tx.created_at.split("T")[0];
        if (d in dayMap) dayMap[d] += tx.amount ?? 0;
      }
      setChartData(
        Object.entries(dayMap).map(([date, value]) => ({
          label: new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
          value,
        }))
      );

      setNotifications((notifData as Notification[] | null) ?? []);

      if (leaderRes.ok) {
        const { leaderboard: lb } = await leaderRes.json() as { leaderboard: LeaderboardEntry[] };
        setLeaderboard(lb ?? []);
      }
      if (offerRes.ok) {
        const { providers: offerProviders } = await offerRes.json() as { providers: OfferwallProvider[] };
        setLiveOfferwalls((offerProviders ?? []).filter(p => !p.is_ad_network && p.isLive));
      }

      setProfile(p ?? { full_name: null, nexcoins: 0, xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_streak_claim_date: null, last_task_approved_date: null, tasks_approved_today: 0 });
      setLoading(false);
    }
    fetchData();
  }, []);

  async function claimStreakDay() {
    setClaimingDay(true);
    setClaimError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const todayIST = getISTDate();
      const res = await fetch("/api/streak/claim-day", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ date: todayIST }),
      });
      const data = await res.json() as { success?: boolean; reward_amount?: number; is_day7_bonus?: boolean; reason?: string };
      if (data.success) {
        const awarded = data.reward_amount ?? 0;
        setClaimResult({ awarded, is_day7_bonus: data.is_day7_bonus ?? false });
        setProfile(prev => prev ? { ...prev, nexcoins: prev.nexcoins + awarded, current_streak: (prev.current_streak ?? 0) + 1 } : prev);
        setStreakDays(prev => prev.map(d => d.day_date === todayIST ? { ...d, reward_claimed: true, reward_amount: awarded } : d));
      } else {
        setClaimError(
          data.reason === "already_claimed" ? "Already claimed today." :
          data.reason === "target_not_met"  ? "Task target not met yet." :
          data.reason === "wrong_date"      ? "Can only claim today's reward." :
          "Could not claim reward."
        );
      }
    } catch { setClaimError("Network error. Try again."); }
    setClaimingDay(false);
  }

  async function claimLoginReward() {
    setClaimingLogin(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/daily-reward/claim", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json() as { success?: boolean; amount?: number; already_claimed?: boolean };
      if (data.success) {
        setLoginRewardClaimed(true);
        setLoginRewardAmount(data.amount ?? 5);
        setProfile(prev => prev ? { ...prev, nexcoins: prev.nexcoins + (data.amount ?? 5) } : prev);
      } else {
        setLoginRewardClaimed(true);
      }
    } catch { /* ignore */ }
    setClaimingLogin(false);
  }

  /* ── Derived values ─────────────────────────────────────────────── */
  const displayName  = profile?.full_name ?? "there";
  const xp           = profile?.xp ?? 0;
  const level        = profile?.level ?? 1;
  const xpInLevel    = xp % 1000;
  const xpPct        = Math.round((xpInLevel / 1000) * 100);
  const streak       = profile?.current_streak ?? 0;
  const todayIST     = getISTDate();
  const weekDatesUI  = getWeekDates();
  const todayRow     = streakDays.find(d => d.day_date === todayIST);
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  /* ── Count-up animated values (FIX 4) ──────────────────────────── */
  const countCoins  = useCountUp(profile?.nexcoins ?? 0);
  const countEarned = useCountUp(totalEarned);
  const countDone   = useCountUp(tasksDone);
  const displayCoins = countCoins < (profile?.nexcoins ?? 0) ? Math.floor(countCoins) : countCoins;
  const displayEarned = countEarned < totalEarned
    ? Math.floor(countEarned)
    : countEarned;
  const estimatedUsd = (profile?.nexcoins ?? 0) / nexcoinPerUsd;
  const featuredTasks = tasks
    .filter((task) => (task.required_level ?? 1) <= userLevel)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || (b.pay_per_task ?? 0) - (a.pay_per_task ?? 0))
    .slice(0, 2);
  const featuredTaskIds = new Set(featuredTasks.map((task) => task.id));
  const moreTasks = tasks.filter((task) => !featuredTaskIds.has(task.id));

  const notifTypeIcon: Record<string, string> = {
    submission_approved: "✅", submission_rejected: "❌", assignment_approved: "✅",
    assignment_rejected: "❌", voucher_delivered: "🎁", new_task: "📋",
    announcement: "📢", bonus_coins: "🪙", support: "💬", system: "ℹ️",
  };

  /* ── Inline style tag (streak ring animation only) ─────────────── */
  const PULSE_STYLE = `
    @media (prefers-reduced-motion: reduce) {
      .animate-pulse { animation: none !important; }
      .cpx-campaign-banner,
      .cpx-campaign-banner::before,
      .cpx-campaign-orb,
      .cpx-campaign-sparkle,
      .cpx-campaign-cta {
        animation: none !important;
      }
    }

    .cpx-campaign-banner {
      background-size: 220% 220%;
      animation: cpx-campaign-gradient 10s ease infinite;
      box-shadow: 0 12px 30px rgba(15, 76, 69, 0.2);
    }

    .cpx-campaign-banner::before {
      content: "";
      position: absolute;
      inset: -80% auto -80% -35%;
      width: 30%;
      transform: rotate(22deg);
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      animation: cpx-campaign-shine 6s ease-in-out infinite;
      pointer-events: none;
    }

    .cpx-campaign-orb {
      animation: cpx-campaign-float 5s ease-in-out infinite;
    }

    .cpx-campaign-sparkle {
      animation: cpx-campaign-sparkle 2.4s ease-in-out infinite;
    }

    .cpx-campaign-cta {
      box-shadow: 0 5px 18px rgba(255,255,255,0.22);
      animation: cpx-campaign-cta 2.8s ease-in-out infinite;
    }

    @keyframes cpx-campaign-gradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    @keyframes cpx-campaign-shine {
      0%, 18% { left: -35%; opacity: 0; }
      30% { opacity: 1; }
      55%, 100% { left: 120%; opacity: 0; }
    }

    @keyframes cpx-campaign-float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(8deg); }
    }

    @keyframes cpx-campaign-sparkle {
      0%, 100% { transform: scale(1); opacity: 0.75; }
      50% { transform: scale(1.2); opacity: 1; }
    }

    @keyframes cpx-campaign-cta {
      0%, 100% { box-shadow: 0 5px 18px rgba(214,182,110,0.2); }
      50% { box-shadow: 0 7px 25px rgba(214,182,110,0.4); }
    }
  `;

  return (
    /* FIX 8 — page background gradient */
    <div className="min-h-screen flex flex-col gap-5 pb-8">
      <style>{PULSE_STYLE}</style>

      {showDashboardPromotion && promotion && (
        <div
          className="cpx-campaign-banner order-1 relative isolate overflow-hidden rounded-2xl border border-white/35 bg-[linear-gradient(115deg,#0f766e_0%,#0f4c45_48%,#b9893c_100%)] p-5 text-white sm:p-6"
        >
          <div aria-hidden className="cpx-campaign-orb pointer-events-none absolute -right-8 -top-14 h-44 w-44 rounded-full border border-white/20 bg-white/10" />
          <div aria-hidden className="cpx-campaign-orb pointer-events-none absolute bottom-[-4rem] right-40 h-32 w-32 rounded-full bg-amber-200/15" style={{ animationDelay: "1.2s" }} />
          <span aria-hidden className="cpx-campaign-sparkle pointer-events-none absolute right-[37%] top-5 hidden text-2xl text-yellow-100/90 sm:block">✦</span>
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.17em] text-white shadow-sm backdrop-blur-sm sm:text-xs">
                <span className="cpx-campaign-sparkle" aria-hidden>✦</span>
                {promotion.label}
              </p>
              <h2 className="text-xl font-black leading-tight drop-shadow-sm sm:text-2xl">
                {promotion.headline}
              </h2>
              <p className="mt-1.5 max-w-xl whitespace-pre-line text-xs leading-relaxed text-white/90 sm:text-sm">
                {promotion.message}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:min-w-[190px]">
              <a
                href={promotion.primaryUrl}
                target={promotion.primaryUrl.startsWith("https://") ? "_blank" : undefined}
                rel={promotion.primaryUrl.startsWith("https://") ? "noopener noreferrer" : undefined}
                className="cpx-campaign-cta group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-teal-800 transition hover:-translate-y-1 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {promotion.primaryLabel} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              {promotion.secondaryLabel && promotion.secondaryUrl && (
                <a
                href={promotion.secondaryUrl}
                target={promotion.secondaryUrl.startsWith("https://") ? "_blank" : undefined}
                rel={promotion.secondaryUrl.startsWith("https://") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {promotion.secondaryLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="order-2 animate-fade-slide-up relative isolate overflow-hidden rounded-lg bg-[#0e3c36] text-white shadow-[0_24px_60px_rgba(15,76,69,0.2)] sm:rounded-[1.75rem]" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_10%,rgba(214,182,110,0.2),transparent_35%),radial-gradient(ellipse_at_5%_100%,rgba(20,184,166,0.18),transparent_42%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-48 h-[26rem] w-[26rem] rounded-full border border-white/[0.08]" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-36 h-[19rem] w-[19rem] rounded-full border border-white/[0.08]" />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:min-h-[260px] lg:grid-cols-[1fr_0.85fr] lg:items-center lg:p-10">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d6b66e] shadow-[0_0_10px_rgba(214,182,110,0.9)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4d3a8]">Your NexGuild dashboard</p>
            </div>
            <p className="text-sm font-medium text-white/65">{greeting}, {loading ? "welcome back" : displayName}</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">Your next reward<br className="hidden sm:block" /> starts here.</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/65">Pick a task, share your opinion, and watch your effort add up.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/dashboard/opportunities" className="group inline-flex items-center gap-2 rounded-xl bg-[#d6b66e] px-5 py-3 text-sm font-bold text-[#183d36] shadow-[0_6px_20px_rgba(214,182,110,0.2)] transition hover:-translate-y-0.5 hover:bg-[#e2c47c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Find your next task <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/dashboard/surveys" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10">
                <Sparkles className="h-4 w-4 text-[#e4c875]" /> Try a survey
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[390px] lg:ml-auto">
            <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-[#d6b66e]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.055))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur-md sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/65">Your available balance</p>
                <Link href="/dashboard/wallet" className="rounded-full border border-white/15 p-2 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Open wallet">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3 flex min-w-0 items-center gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#d6b66e]/15 ring-1 ring-[#e2c47c]/25">
                  <NexCoinIcon size={30} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-nowrap text-xl font-semibold tabular-nums tracking-tight sm:text-3xl">{loading ? "—" : formatNexcoins(displayCoins)} <span className="hidden text-sm font-medium text-white/60 sm:inline">NC</span></p>
                  <p className="mt-0.5 text-xs text-white/55">{loading ? "Your NexCoin balance" : `≈ $${estimatedUsd.toFixed(2)} estimated value`}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/80">Level {level}</span>
                  <span className="text-white/55">{xpInLevel.toLocaleString()} / 1,000 XP</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/20">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#c5a352] to-[#f0d48b] shadow-[0_0_12px_rgba(214,182,110,0.35)] transition-all duration-700" style={{ width: `${xpPct}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/[0.12] px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">Lifetime earned</p>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-sm font-bold text-white/90"><NexCoinIcon size={15} /><span className="truncate tabular-nums">{loading ? "—" : formatNexcoins(displayEarned)}</span></p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/[0.12] px-3 py-2.5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/45">Current streak</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white/90"><Flame className="h-4 w-4 text-[#e9b86c]" />{loading ? "—" : `${streak} day${streak === 1 ? "" : "s"}`}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="order-3 animate-fade-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Featured opportunities</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Start earning today</h2>
          </div>
          <Link href="/dashboard/opportunities" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition hover:text-teal-900">
            Browse all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {loading ? (
              [1, 2].map((item) =>               <div key={item} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />)
            ) : featuredTasks.length > 0 ? (
              featuredTasks.map((task, index) => {
                const needsResub = submissionMeta[task.id]?.status === "resubmit_requested";
                const taskHref = needsResub ? `/dashboard/tasks/${task.id}/work` : `/dashboard/tasks/${task.id}`;
                const reward = task.pay_per_task != null ? Math.floor(task.pay_per_task * 0.66) : null;
                return (
                  <Link
                    key={task.id}
                    href={taskHref}
                    className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_18px_36px_rgba(15,76,69,0.12)]"
                  >
                    <div className={`relative flex min-h-[105px] items-start justify-between overflow-hidden p-4 ${index === 0 ? "bg-[linear-gradient(135deg,#0f766e,#12483f)]" : "bg-[linear-gradient(135deg,#886b32,#b08b45)]"}`}>
                      <div aria-hidden className="absolute -right-6 -top-12 h-36 w-36 rounded-full border border-white/15" />
                      <div aria-hidden className="absolute -right-1 -top-7 h-24 w-24 rounded-full border border-white/10" />
                      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm">
                        <ClipboardList className="h-5 w-5" />
                      </span>
                      <div className="relative flex flex-col items-end gap-2">
                        {task.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/90">
                            <Sparkles className="h-3 w-3" /> Featured
                          </span>
                        )}
                        {reward !== null && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-[#624b1d] shadow-sm">
                            <NexCoinIcon size={16} />{reward} <span className="text-[10px] font-bold text-[#806323]">NC</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">{task.task_type ?? "Task"}</span>
                        {needsResub && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700">Resubmit</span>}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-6 tracking-tight text-slate-900">{task.title}</h3>
                      {task.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>}
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800">
                          View opportunity <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                        {(task.xp_reward ?? 0) > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-[#806323]"><Star className="h-3 w-3" />+{task.xp_reward} XP</span>}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center sm:col-span-2">
                <ClipboardList className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">No featured tasks right now</p>
                <p className="mt-1 text-xs text-slate-500">Browse all opportunities to see what’s available.</p>
                <Link href="/dashboard/opportunities" className="mt-3 text-xs font-bold text-teal-700 hover:underline">Explore tasks</Link>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#dcebe5] bg-[linear-gradient(155deg,#eff8f4_0%,#e6f1ec_100%)] p-5 shadow-[0_5px_20px_rgba(15,76,69,0.05)]">
            <div aria-hidden className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#d6b66e]/20 blur-sm" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">Surveys, apps &amp; games</p>
                  <h3 className="mt-1.5 text-base font-semibold leading-6 text-[#173f38]">Explore apps &amp; games</h3>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/80 text-teal-700 shadow-sm">
                  <Layers className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">A fresh mix of surveys, app installs, games, and other activities. Rewards vary by activity.</p>
              {!loading && liveOfferwalls.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {liveOfferwalls.slice(0, 3).map((provider) => (
                    <Link key={provider.id} href="/dashboard/offerwalls" className="group flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 p-2.5 transition hover:bg-white">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-50">
                        {provider.logo_url
                          ? <img src={provider.logo_url} alt="" className="h-full w-full object-contain p-1" />
                          : <Layers className="h-4 w-4 text-teal-700" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{provider.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/80 bg-white/70 px-3 py-3 text-xs text-slate-600">
                  {loading ? "Checking available activities…" : "Browse apps and games to see what’s available."}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-teal-900/5 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-teal-900/70">Surveys</span>
                <span className="rounded-full border border-teal-900/5 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-teal-900/70">App offers</span>
                <span className="rounded-full border border-teal-900/5 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-teal-900/70">More to explore</span>
              </div>
              <Link href="/dashboard/offerwalls" className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(15,118,110,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0b625c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
                Explore apps &amp; games <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── DAILY LOGIN REWARD ──────────────────────────────────────── */}
      {!loading && loginRewardClaimed !== null && (
        <div className="order-5 animate-fade-slide-up" style={{ animationDelay: "150ms" }}>
          <div className={`rounded-2xl border px-5 py-3.5 flex items-center gap-4 transition-all duration-300 ${
            loginRewardClaimed
              ? "bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-800/40"
              : "bg-amber-50/80 border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-800/40"
          }`}>
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
              loginRewardClaimed ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"
            }`}>
              {loginRewardClaimed ? "✅" : "🎁"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${loginRewardClaimed ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                {loginRewardClaimed
                  ? loginRewardAmount ? `+${loginRewardAmount} NC claimed!` : "Daily reward claimed"
                  : "Daily Login Reward"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loginRewardClaimed
                  ? "Come back tomorrow for another reward."
                  : "Claim 5 NC just for logging in today."}
              </p>
            </div>
            {!loginRewardClaimed && (
              <button
                onClick={claimLoginReward}
                disabled={claimingLogin}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {claimingLogin ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                {claimingLogin ? "Claiming…" : "Claim +5 NC"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── FIX 3: STAT CARDS ───────────────────────────────────────── */}
      <div className="order-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Approved Today",
            value: loading ? "—" : todayApproved.toLocaleString(),
            sub: "Tasks reviewed today",
            icon: <CheckCircle2 className="h-[18px] w-[18px] text-teal-700" />,
            topBorder: "border-t-teal-500",
          },
          {
            label: "Total Earned",
            value: loading ? "—" : formatNexcoins(displayEarned),
            sub: "Lifetime coins earned",
            icon: <NexCoinIcon size={18} />,
            topBorder: "border-t-[#c4a15a]",
          },
          {
            label: "Tasks Completed",
            value: loading ? "—" : countDone.toLocaleString(),
            sub: "All-time approved",
            icon: <ClipboardList className="h-[18px] w-[18px] text-emerald-500" />,
            topBorder: "border-t-green-400",
          },
          {
            label: "Approval Rate",
            value: loading ? "—" : approvalRate === null ? "N/A" : `${approvalRate}%`,
            sub: "Approved / reviewed",
            icon: <CheckCircle2 className="h-[18px] w-[18px] text-amber-500" />,
            topBorder: "border-t-amber-400",
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-slide-up group rounded-2xl border border-slate-200/70 border-t-2 ${s.topBorder} bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(15,76,69,0.08)] sm:p-5`}
            style={{ animationDelay: `${200 + i * 50}ms` }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f1f7f4]">{s.icon}</span>
              <ArrowRight className="h-4 w-4 text-slate-200 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />
            </div>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{s.value}</p>
            <p className="mt-1 text-[11px] text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── STREAK GRID ─────────────────────────────────────────────── */}
      <div className="order-7 animate-fade-slide-up" style={{ animationDelay: "300ms" }}>
        <StreakGrid
          weekDates={weekDatesUI}
          streakDays={streakDays}
          todayIST={todayIST}
          tasksRequired={tasksRequired}
          streak={streak}
          dailyBonus={dailyBonus}
          day7Bonus={day7Bonus}
          claimingDay={claimingDay}
          claimResult={claimResult}
          claimError={claimError}
          onClaim={claimStreakDay}
        />
      </div>

      {/* ── FIX 7: AVAILABLE NOW + DAILY PROGRESS ───────────────────── */}
      <div className="order-4 animate-fade-slide-up grid grid-cols-1 gap-4 lg:grid-cols-5" style={{ animationDelay: "400ms" }}>

        {/* More tasks and daily progress */}
        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)] lg:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(100deg,#f5faf7,#ffffff)] px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Keep the momentum</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">More opportunities</h2>
            </div>
            <Link href="/dashboard/tasks" className="flex shrink-0 items-center gap-1 rounded-full border border-teal-100 bg-white px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-50">
              Browse all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 sm:p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse" />)}
            </div>
          ) : moreTasks.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <ClipboardList className="h-8 w-8 text-slate-200" />
              <p className="text-sm font-semibold text-slate-600">{tasks.length > 0 ? "You’re all caught up" : "No tasks available yet"}</p>
              <p className="text-xs text-slate-400">{tasks.length > 0 ? "Check back soon for more opportunities." : "Check back soon."}</p>
            </div>
          ) : (
            <>
              {moreTasks.length > 0 && (
                <div className="space-y-3">
                  {moreTasks.map((task) => {
                    const sub        = submissionMeta[task.id];
                    const needsResub = sub?.status === "resubmit_requested";
                    const taskLevel  = task.required_level ?? 1;
                    const locked     = taskLevel > userLevel;
                    const href       = locked ? "#" : needsResub ? `/dashboard/tasks/${task.id}/work` : `/dashboard/tasks/${task.id}`;
                    return (
                      <Link
                        key={task.id}
                        href={href}
                        onClick={e => locked && e.preventDefault()}
                        className={`group flex items-stretch overflow-hidden rounded-xl border shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          locked
                            ? "border-gray-100 bg-white opacity-60 cursor-not-allowed"
                            : needsResub
                            ? "border-orange-200 bg-orange-50/30"
                            : "border-slate-200/80 bg-white"
                        }`}
                      >
                        {/* Teal left accent bar */}
                        {!locked && !needsResub && (
                          <div className="w-1 bg-teal-400 self-stretch flex-shrink-0" />
                        )}
                        <div className="flex min-w-0 flex-1 items-center gap-3 p-3.5">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${locked ? "bg-slate-100" : "bg-teal-50"}`}>
                            {locked
                              ? <Lock className="h-3.5 w-3.5 text-slate-400" />
                              : <ClipboardList className="h-3.5 w-3.5 text-teal-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide truncate">{task.task_type ?? "Task"}</p>
                              {locked && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Lv.{taskLevel}</span>}
                              {needsResub && (
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <RefreshCw className="h-2.5 w-2.5" />Resubmit
                                </span>
                              )}
                            </div>
                            <p className={`truncate text-sm font-semibold ${locked ? "text-slate-500" : "text-slate-800"}`}>{task.title}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {task.pay_per_task != null && (
                              <span className="inline-flex items-center gap-0.5 text-base font-bold text-teal-600">
                                <NexCoinIcon size={12} />{Math.floor(task.pay_per_task * 0.66)}
                              </span>
                            )}
                            {(task.xp_reward ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-500">
                                <Star className="h-3 w-3" />+{task.xp_reward}XP
                              </span>
                            )}
                            {!locked && (
                              <ArrowRight className="h-3.5 w-3.5 text-slate-300 mt-0.5 group-hover:translate-x-1 transition-transform" />
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

            </>
          )}
          </div>
        </div>

        {/* Daily Progress — 2/5 */}
        <div className="relative isolate overflow-hidden rounded-[1.4rem] border border-[#dce9e3] bg-[linear-gradient(150deg,#f1f8f4,#ffffff_70%)] p-5 shadow-[0_8px_28px_rgba(15,76,69,0.05)] lg:col-span-2 sm:p-6">
          <div aria-hidden className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[#d6b66e]/10 blur-xl" />
          <div className="relative">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Your day at a glance</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">Today&apos;s progress</h2>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-28 w-28 rounded-full bg-slate-100 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <ProgressRing value={todayApproved} max={Math.max(todayApproved, 3)} label="Tasks approved" sub="today" />
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-white bg-white/80 px-3 py-2.5 text-xs">
                  <span className="flex items-center gap-2 text-slate-500"><Clock className="h-3.5 w-3.5 text-teal-700" />Streak</span>
                  <span className="font-bold text-slate-800">{streak} day{streak !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white bg-white/80 px-3 py-2.5 text-xs">
                  <span className="flex items-center gap-2 text-slate-500"><Star className="h-3.5 w-3.5 text-[#b08b45]" />Level</span>
                  <span className="font-bold text-slate-800">{level}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white bg-white/80 px-3 py-2.5 text-xs">
                  <span className="flex items-center gap-2 text-slate-500"><NexCoinIcon size={14} />Today&apos;s earnings</span>
                  <span className="font-bold text-slate-800">
                    {chartData.find(d => d.label === new Date().toLocaleDateString("en-IN", { weekday: "short" }))?.value ?? 0} NC
                  </span>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ── EARNINGS CHART ──────────────────────────────────────────── */}
      <div
        className="order-9 animate-fade-slide-up overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]"
        style={{ animationDelay: "500ms" }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(100deg,#f5faf7,#ffffff)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Your momentum</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">Earnings overview</h2>
            <p className="mt-0.5 text-xs text-slate-500">NexCoins earned over the last 7 days</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && <div className="hidden text-right sm:block"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">This week</p><p className="mt-0.5 text-sm font-bold text-teal-800">{formatNexcoins(chartData.reduce((sum, day) => sum + day.value, 0))} NC</p></div>}
            <Link href="/dashboard/earnings" className="inline-flex items-center gap-1 rounded-full border border-teal-100 bg-white px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-50">Details <ArrowRight className="h-3 w-3" /></Link>
          </div>
        </div>
        <div className="p-5 sm:px-6 sm:py-5">
          {loading ? <div className="h-28 animate-pulse rounded-xl bg-slate-50" /> : <EarningsChart data={chartData} />}
        </div>
      </div>

      {/* ── RECENT ACTIVITY + TOP CONTRIBUTORS ─────────────────────── */}
      <div className="order-10 grid grid-cols-1 gap-4 lg:grid-cols-2">

        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 bg-[linear-gradient(100deg,#f5faf7,#ffffff)] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Your account</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-900">Recent activity</h2>
          </div>
          <div className="p-5">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-slate-50 animate-pulse" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1f7f4] text-teal-700"><Clock className="h-5 w-5" /></span>
              <p className="mt-3 text-sm font-semibold text-slate-700">Your activity will show up here</p>
              <p className="mt-1 text-xs text-slate-500">Complete a task or claim a reward to get started.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.slice(0, 6).map((n) => (
                <li key={n.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#f1f7f4] text-sm">{notifTypeIcon[n.type ?? ""] ?? "ℹ️"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{n.title}</p>
                    {n.message && <p className="mt-0.5 truncate text-[11px] text-slate-500">{n.message}</p>}
                  </div>
                  <p className="flex-shrink-0 text-[10px] font-medium text-slate-400">
                    {new Date(n.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(100deg,#fbf8ef,#ffffff)] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#927334]">Community highlights</p>
              <h2 className="mt-1 flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
                <Trophy className="h-4 w-4 text-[#b08b45]" /> Top contributors
              </h2>
            </div>
            <Link href="/dashboard/leaderboard" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-100 bg-white px-3 py-2 text-xs font-bold text-[#806323] transition hover:bg-amber-50">Leaderboard <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="p-5">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 rounded-lg bg-slate-50 animate-pulse" />)}</div>
          ) : (
            <ul className="space-y-2">
              {(leaderboard.length === 0 || (leaderboard[0]?.approved_count ?? 0) < 5 ? FAKE_LEADERBOARD : leaderboard).slice(0, 10).map((entry) => (
                <li key={entry.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${entry.rank === 1 ? "bg-[#fbf7eb]" : "bg-slate-50/70"}`}>
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    entry.rank === 1 ? "bg-[#d6b66e] text-white shadow-sm" :
                    entry.rank === 2 ? "bg-slate-300 text-white" :
                    entry.rank === 3 ? "bg-[#c89468] text-white" :
                    "bg-white text-slate-500"
                  }`}>{entry.rank}</span>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white bg-white text-xs font-bold text-teal-800 shadow-sm">
                    {entry.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{entry.full_name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">Community contributor</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full border border-teal-100 bg-white px-2.5 py-1 text-[10px] font-bold text-teal-800">{entry.approved_count} tasks</span>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </div>

      <div className="order-11">
        <BlogTipCard
          slug="tips-get-approved-faster-task-platforms"
          title="Tips to Get Approved Faster on Task Platforms"
          excerpt="Simple habits that help you earn more approvals and build your reputation."
        />
      </div>
    </div>
  );
}
