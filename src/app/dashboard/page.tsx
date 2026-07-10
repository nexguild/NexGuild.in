"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList, Layers, ArrowRight, X, Megaphone,
  RefreshCw, Flame, Star, Lock, Trophy, CheckCircle2, Clock,
} from "lucide-react";
import Link from "next/link";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";

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
}
interface OfferwallProvider { id: string; name: string; slug: string; is_ad_network: boolean; description: string | null; logo_url: string | null; isLive: boolean; }
interface SubmissionMeta { status: string; feedback: string | null; }
interface Notification { id: string; title: string; message: string | null; type: string | null; created_at: string; }
interface CoinTx { amount: number; created_at: string; source?: string | null; }
interface LeaderboardEntry { rank: number; id: string; full_name: string; approved_count: number; }

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
      setCount(Math.floor(eased * target));
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
            <stop offset="0%" stopColor="#0891B2" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#earnGrad)" />
        <polyline points={polyline} fill="none" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - 2 * pad);
          const y = H - pad - ((d.value / max) * (H - 2 * pad));
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#0891B2" />;
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
          <circle cx="44" cy="44" r={r} fill="none" stroke="#E0F2FE" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none" stroke="#0891B2" strokeWidth="8"
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

/* ─── 7-Day Streak Grid (FIX 6) ─────────────────────────────────── */
const STREAK_DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function StreakGrid({
  streak, canClaim, claimedToday, claimResult, claimError, claimingStreak,
  dailyBonus, day7Bonus, tasksToday, tasksRequired, onClaim,
}: {
  streak: number; canClaim: boolean; claimedToday: boolean;
  claimResult: { awarded: number } | null; claimError: string | null; claimingStreak: boolean;
  dailyBonus: number; day7Bonus: number; tasksToday: number; tasksRequired: number; onClaim: () => void;
}) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const cyclePos = claimResult && streak === 0 ? 7 : streak;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-orange-500">🔥 {streak}</span>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Day Streak</h2>
        </div>
        <span className="text-xs text-slate-400">Day 7 = +{day7Bonus} bonus coins</span>
      </div>

      <div className="flex items-center justify-between gap-1.5 mb-5">
        {days.map((day) => {
          const done    = day <= cyclePos;
          const current = day === cyclePos + 1 && canClaim;
          const reward  = day === 7 ? day7Bonus : dailyBonus;
          return (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-bold text-slate-400 leading-none">
                {day === 7 ? "🔥" : `+${reward}`}
              </span>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done
                  ? "bg-teal-500 text-white"
                  : current
                  ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500 ring-offset-2 animate-pulse"
                  : "bg-gray-100 text-gray-300"
              }`}>
                {done ? "✓" : current ? "🔥" : day}
              </div>
              <span className="text-[10px] text-gray-400">{STREAK_DAY_NAMES[day - 1]}</span>
            </div>
          );
        })}
      </div>

      {claimResult ? (
        <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 border border-green-100 text-sm font-bold text-green-700">
          <NexCoinIcon size={16} /> +{claimResult.awarded} coins claimed! Keep it up!
        </div>
      ) : canClaim ? (
        <button
          onClick={onClaim}
          disabled={claimingStreak}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(90deg,#4F46E5,#0891B2)" }}
        >
          {claimingStreak ? "Claiming…" : `🔥 Claim Day ${cyclePos + 1} Reward (+${cyclePos + 1 === 7 ? day7Bonus : dailyBonus} coins)`}
        </button>
      ) : claimError ? (
        <div className="py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-center text-slate-500">{claimError}</div>
      ) : claimedToday ? (
        <div className="py-2.5 rounded-xl bg-green-50 border border-green-100 text-xs text-center font-semibold text-green-600">
          ✓ Claimed today — come back tomorrow!
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today&apos;s tasks</span>
            <span className="font-bold text-slate-700">{tasksToday} / {tasksRequired}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (tasksToday / tasksRequired) * 100)}%`, background: "#0891B2" }} />
          </div>
          <p className="text-xs text-slate-400 text-center">
            {tasksRequired - tasksToday > 0
              ? `Complete ${tasksRequired - tasksToday} more task${tasksRequired - tasksToday !== 1 ? "s" : ""} to unlock today's streak reward`
              : "All tasks done — claim your reward!"}
          </p>
        </div>
      )}
    </div>
  );
}

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
  const [liveOfferwalls, setLiveOfferwalls] = useState<OfferwallProvider[]>([]);
  const [loading, setLoading]               = useState(true);
  const [banner, setBanner]                 = useState<{ id: string; title: string; message: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [dailyBonus, setDailyBonus]         = useState(10);
  const [day7Bonus, setDay7Bonus]           = useState(50);
  const [tasksRequired, setTasksRequired]   = useState(5);
  const [claimingStreak, setClaimingStreak] = useState(false);
  const [claimResult, setClaimResult]       = useState<{ awarded: number; new_streak: number } | null>(null);
  const [claimError, setClaimError]         = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
      const { data: { session } } = await supabase.auth.getSession();

      const [
        { data: profileData },
        { data: tasksData },
        { data: mySubmissions },
        { count: approvedCount },
        { count: reviewedCount },
        { data: txData },
        { data: notifData },
        { data: streakSettings },
        leaderRes,
        offerRes,
      ] = await Promise.all([
        supabase.from("profiles").select("full_name, nexcoins, xp, level, current_streak, longest_streak, last_streak_claim_date, last_task_approved_date, tasks_approved_today").eq("id", user.id).single(),
        supabase.from("tasks").select("id, title, description, task_type, pay_per_task, xp_reward, required_level").eq("status", "active").order("created_at", { ascending: false }).limit(20),
        supabase.from("submissions").select("task_id, status, feedback").eq("contributor_id", user.id),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("contributor_id", user.id).eq("status", "approved"),
        supabase.from("submissions").select("*", { count: "exact", head: true }).eq("contributor_id", user.id).in("status", ["approved", "rejected"]),
        supabase.from("coin_transactions").select("amount, created_at, source").eq("contributor_id", user.id).eq("type", "earned").gte("created_at", sevenDaysAgo + "T00:00:00"),
        supabase.from("notifications").select("id, title, message, type, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("platform_settings").select("key, value").in("key", ["streak_daily_bonus", "streak_day7_bonus", "streak_tasks_required_per_day"]),
        fetch("/api/leaderboard?limit=5", { headers: { Authorization: `Bearer ${session?.access_token}` } }),
        fetch("/api/offerwalls", { headers: { Authorization: `Bearer ${session?.access_token}` } }),
      ]);

      const p = profileData as Profile | null;
      setUserLevel(p?.level ?? 1);

      const settingsRows = (streakSettings as { key: string; value: string }[] | null) ?? [];
      setDailyBonus(parseInt(settingsRows.find(r => r.key === "streak_daily_bonus")?.value ?? "10") || 10);
      setDay7Bonus(parseInt(settingsRows.find(r => r.key === "streak_day7_bonus")?.value ?? "50") || 50);
      setTasksRequired(parseInt(settingsRows.find(r => r.key === "streak_tasks_required_per_day")?.value ?? "5") || 5);

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

      const bannerNotif = ((notifData as Notification[] | null) ?? []).find(n => n.type === "announcement");
      setBanner(bannerNotif ? { id: bannerNotif.id, title: bannerNotif.title.replace(/^📢\s*/, ""), message: bannerNotif.message ?? "" } : null);

      setProfile(p ?? { full_name: null, nexcoins: 0, xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_streak_claim_date: null, last_task_approved_date: null, tasks_approved_today: 0 });
      setLoading(false);
    }
    fetchData();
  }, []);

  async function dismissBanner() {
    setBannerDismissed(true);
    if (banner?.id) await supabase.from("notifications").update({ is_read: true }).eq("id", banner.id);
  }

  async function claimStreak() {
    setClaimingStreak(true);
    setClaimError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/streak/claim", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const data = await res.json() as { success?: boolean; awarded?: number; new_streak?: number; reason?: string; required?: number; completed?: number };
      if (data.success) {
        setClaimResult({ awarded: data.awarded ?? 0, new_streak: data.new_streak ?? 0 });
        setProfile(prev => prev ? { ...prev, nexcoins: prev.nexcoins + (data.awarded ?? 0), current_streak: data.new_streak ?? 0, last_streak_claim_date: new Date().toISOString().split("T")[0] } : prev);
      } else {
        setClaimError(
          data.reason === "already_claimed_today" ? "Already claimed today." :
          data.reason === "insufficient_tasks_today"
            ? `Need ${data.required ?? tasksRequired} tasks today (${data.completed ?? 0} done so far).`
            : data.reason === "no_approved_task_today" ? "No approved tasks today yet." :
          "Could not claim streak."
        );
      }
    } catch { setClaimError("Network error. Try again."); }
    setClaimingStreak(false);
  }

  /* ── Derived values ─────────────────────────────────────────────── */
  const displayName  = profile?.full_name ?? "there";
  const showBanner   = banner && !bannerDismissed;
  const xp           = profile?.xp ?? 0;
  const level        = profile?.level ?? 1;
  const xpInLevel    = xp % 1000;
  const xpPct        = Math.round((xpInLevel / 1000) * 100);
  const streak       = profile?.current_streak ?? 0;
  const today        = new Date().toISOString().split("T")[0];
  const tasksToday   = profile?.tasks_approved_today ?? 0;
  const claimedToday = profile?.last_streak_claim_date === today;
  const canClaim     = tasksToday >= tasksRequired && !claimedToday && !claimResult;
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  /* ── Count-up animated values (FIX 4) ──────────────────────────── */
  const countCoins  = useCountUp(profile?.nexcoins ?? 0);
  const countEarned = useCountUp(totalEarned);
  const countDone   = useCountUp(tasksDone);

  const notifTypeIcon: Record<string, string> = {
    submission_approved: "✅", submission_rejected: "❌", assignment_approved: "✅",
    assignment_rejected: "❌", voucher_delivered: "🎁", new_task: "📋",
    announcement: "📢", bonus_coins: "🪙", support: "💬", system: "ℹ️",
  };

  /* ── Inline style tag (FIX 6 ring animation only) ──────────────── */
  const PULSE_STYLE = `
    @media (prefers-reduced-motion: reduce) {
      .animate-pulse { animation: none !important; }
    }
  `;

  return (
    /* FIX 8 — page background gradient */
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 space-y-5 pb-8">
      <style>{PULSE_STYLE}</style>

      {/* ── FIX 1: HERO BANNER ──────────────────────────────────────── */}
      <div
        className="animate-fade-slide-up relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#4F46E5 0%,#0891B2 100%)", animationDelay: "0ms" }}
      >
        {/* noise texture overlay */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1">{greeting}</p>
              <h1 className="text-3xl font-bold text-white">
                {loading ? "Welcome back!" : `${displayName}!`}
              </h1>
              <p className="text-white/70 text-sm mt-1">Here&apos;s your overview for today.</p>
            </div>
            {!loading && streak > 0 && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex-shrink-0">
                <Flame className="h-4 w-4 text-orange-300" />
                <span className="text-white font-bold text-sm">{streak} day streak</span>
              </div>
            )}
          </div>

          {!loading && (
            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {/* NexCoins pill */}
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 px-5 py-3">
                <NexCoinIcon size={22} />
                <div>
                  <p className="text-white/60 text-xs font-medium">NexCoins Balance</p>
                  <p className="text-white font-bold text-2xl leading-tight">{countCoins.toLocaleString()}</p>
                </div>
              </div>
              {/* Level badge */}
              <div className="bg-white/20 rounded-full px-3 py-1">
                <p className="text-white/70 text-[10px] font-medium">LEVEL</p>
                <p className="text-white font-bold text-xl leading-tight text-center">{level}</p>
              </div>
              {/* XP bar */}
              <div className="flex-1 min-w-[160px]">
                <div className="flex justify-between text-[11px] text-white/60 mb-2">
                  <span>XP Progress</span>
                  <span>{xpInLevel.toLocaleString()} / 1,000</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-1000"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FIX 2: QUICK ACTIONS ROW ────────────────────────────────── */}
      <div className="animate-fade-slide-up flex flex-wrap gap-3" style={{ animationDelay: "100ms" }}>
        <Link
          href="/dashboard/offerwalls"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-white text-indigo-600 border border-indigo-100 shadow-sm hover:bg-indigo-50 transition-all"
        >
          <span>🎯</span><span>Complete a Survey</span>
        </Link>
        <Link
          href="/dashboard/tasks"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all"
        >
          <span>📋</span><span>Browse Tasks</span>
        </Link>
        <Link
          href="/dashboard/nexleader"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-white text-teal-600 border border-teal-100 shadow-sm hover:bg-teal-50 transition-all"
        >
          <span>👑</span><span>NexLeader Hub</span>
        </Link>
      </div>

      {/* ── FIX 3: STAT CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "NexCoins Balance",
            value: loading ? "—" : countCoins.toLocaleString(),
            sub: "Available to redeem",
            icon: <NexCoinIcon size={18} />,
            topBorder: "border-t-teal-400",
          },
          {
            label: "Total Earned",
            value: loading ? "—" : countEarned.toLocaleString(),
            sub: "Lifetime coins earned",
            icon: <NexCoinIcon size={18} />,
            topBorder: "border-t-indigo-400",
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
            className={`animate-fade-slide-up bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 border-t-2 ${s.topBorder} shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 p-4`}
            style={{ animationDelay: `${200 + i * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              {s.icon}
              <p className="text-xs text-slate-500 uppercase tracking-wide truncate">{s.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-sm text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── FIX 6: STREAK GRID ──────────────────────────────────────── */}
      <div className="animate-fade-slide-up" style={{ animationDelay: "300ms" }}>
        <StreakGrid
          streak={streak}
          canClaim={canClaim}
          claimedToday={claimedToday}
          claimResult={claimResult}
          claimError={claimError}
          claimingStreak={claimingStreak}
          dailyBonus={dailyBonus}
          day7Bonus={day7Bonus}
          tasksToday={tasksToday}
          tasksRequired={tasksRequired}
          onClaim={claimStreak}
        />
      </div>

      {/* ── FIX 7: AVAILABLE NOW + DAILY PROGRESS ───────────────────── */}
      <div className="animate-fade-slide-up grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ animationDelay: "400ms" }}>

        {/* Available Tasks — 3/5 */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Available Now</h2>
            <Link href="/dashboard/tasks" className="text-xs font-bold text-cyan-700 hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-50 animate-pulse" />)}
            </div>
          ) : tasks.length === 0 && liveOfferwalls.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <ClipboardList className="h-8 w-8 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">No tasks available yet</p>
              <p className="text-xs text-slate-400">Check back soon.</p>
            </div>
          ) : (
            <>
              {tasks.length > 0 && (
                <div className="space-y-3">
                  {tasks.map((task) => {
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
                        className={`group flex items-stretch overflow-hidden rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                          locked
                            ? "border-gray-100 bg-white opacity-60 cursor-not-allowed"
                            : needsResub
                            ? "border-orange-200 bg-orange-50/30"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        {/* Teal left accent bar */}
                        {!locked && !needsResub && (
                          <div className="w-1 bg-teal-400 self-stretch flex-shrink-0" />
                        )}
                        <div className="flex items-start gap-3 p-3.5 flex-1 min-w-0">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${locked ? "bg-slate-100" : "bg-teal-50"}`}>
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
                            <p className={`text-sm font-semibold truncate ${locked ? "text-slate-500" : "text-slate-800"}`}>{task.title}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {task.pay_per_task != null && (
                              <span className="inline-flex items-center gap-0.5 text-base font-bold text-teal-600">
                                <NexCoinIcon size={12} />{task.pay_per_task}
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

              {liveOfferwalls.length > 0 && (
                <div className={tasks.length > 0 ? "mt-4 pt-4 border-t border-slate-100" : ""}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Earn via Offerwalls</p>
                  </div>
                  <div className="space-y-2">
                    {liveOfferwalls.map((p) => (
                      <Link key={p.id} href="/dashboard/offerwalls"
                        className="group flex items-stretch overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="w-1 bg-indigo-400 self-stretch flex-shrink-0" />
                        <div className="flex items-center gap-3 p-3 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-50 overflow-hidden">
                            {p.logo_url
                              ? <img src={p.logo_url} alt={p.name} className="h-full w-full object-contain p-1" />
                              : <Layers className="h-3.5 w-3.5 text-indigo-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                            {p.description && <p className="text-xs text-slate-400 truncate">{p.description}</p>}
                          </div>
                          <span className="text-xs font-bold text-indigo-500 flex items-center gap-0.5 flex-shrink-0">
                            Start Earning <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Daily Progress — 2/5 */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">Today&apos;s Progress</h2>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-slate-50 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <ProgressRing value={todayApproved} max={Math.max(todayApproved, 3)} label="Tasks approved today" sub="tasks" />
              <div className="w-full space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Streak</span>
                  <span className="font-bold text-slate-700">{streak} day{streak !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-cyan-500" />Level</span>
                  <span className="font-bold text-slate-700">{level}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><NexCoinIcon size={13} />Today&apos;s Earnings</span>
                  <span className="font-bold text-slate-700">
                    {chartData.find(d => d.label === new Date().toLocaleDateString("en-IN", { weekday: "short" }))?.value ?? 0} coins
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── EARNINGS CHART ──────────────────────────────────────────── */}
      <div
        className="animate-fade-slide-up rounded-2xl bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5"
        style={{ animationDelay: "500ms" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Earnings Overview</h2>
            <p className="text-xs text-slate-400 mt-0.5">NexCoins earned — last 7 days</p>
          </div>
          <Link href="/dashboard/earnings" className="text-xs font-bold text-cyan-700 hover:underline">View All</Link>
        </div>
        {loading ? (
          <div className="h-28 rounded-xl bg-slate-50 animate-pulse" />
        ) : (
          <EarningsChart data={chartData} />
        )}
      </div>

      {/* ── RECENT ACTIVITY + TOP CONTRIBUTORS ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-slate-50 animate-pulse" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-slate-400">No activity yet</p></div>
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 6).map((n) => (
                <li key={n.id} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{notifTypeIcon[n.type ?? ""] ?? "ℹ️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{n.title}</p>
                    {n.message && <p className="text-xs text-slate-400 truncate">{n.message}</p>}
                  </div>
                  <p className="text-[10px] text-slate-300 flex-shrink-0">
                    {new Date(n.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Contributors</h2>
            </div>
            <Link href="/dashboard/leaderboard" className="text-xs font-bold text-cyan-700 hover:underline">View All</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 rounded-lg bg-slate-50 animate-pulse" />)}</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-8 text-center"><p className="text-sm text-slate-400">No data yet — be first!</p></div>
          ) : (
            <ul className="space-y-2.5">
              {leaderboard.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    entry.rank === 1 ? "bg-amber-100 text-amber-700" :
                    entry.rank === 2 ? "bg-slate-100 text-slate-600" :
                    entry.rank === 3 ? "bg-orange-100 text-orange-700" :
                    "bg-slate-50 text-slate-500"
                  }`}>{entry.rank}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{entry.full_name}</p>
                  </div>
                  <span className="text-xs font-bold text-cyan-700 flex-shrink-0">{entry.approved_count} tasks</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BlogTipCard
        slug="tips-get-approved-faster-task-platforms"
        title="Tips to Get Approved Faster on Task Platforms"
        excerpt="Simple habits that help you earn more approvals and build your reputation."
      />
    </div>
  );
}
