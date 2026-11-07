"use client";

import { useEffect, useState } from "react";
import { Search, Lock, Globe, X, ChevronRight, CheckCircle2, Loader2, XCircle, Star, ClipboardList, Sparkles, Layers, ArrowRight } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";

interface TaskStep {
  title: string;
  description: string;
  submitType: "text" | "file" | "none";
  placeholder?: string;
  acceptedFiles?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  pay_per_task: number | null;
  total_slots: number | null;
  filled_slots: number | null;
  deadline: string | null;
  assignment_required: boolean;
  required_language: string | null;
  is_private: boolean | null;
  is_featured: boolean | null;
  required_level: number | null;
  xp_reward: number | null;
  terms: string | null;
  validation_time: string | null;
  payment_time: string | null;
  steps: TaskStep[] | null;
  required_task_ids: string[] | null;
  excluded_task_ids: string[] | null;
}

interface ProfileData {
  languages: string[];
  skills: string[];
  level: number;
}

type SortBy = "newest" | "highest_payout" | "ending_soon";
type PayoutFilter = "all" | "under10" | "10to50" | "50plus";

const FILTERS = [
  "All", "Audio Recording", "Transcription", "Data Annotation",
  "App Testing", "Game Testing", "Survey", "Web Research",
];

const DEFAULT_RULES = [
  "No multi-accounting or duplicate submissions allowed.",
  "Submit only original, honest work — no AI-generated or copied content.",
  "Fake or low-quality submissions result in rejection and potential ban.",
  "One submission per task per account.",
  "Admin review decisions are final.",
];

const EARNING_OPTIONS = [
  { title: "Paid Tasks", description: "Complete paid work and challenges.", href: "#task-list", action: "Browse tasks", icon: ClipboardList, tone: "teal" },
  { title: "Paid Surveys", description: "Share your opinion and earn NexCoins.", href: "/dashboard/surveys", action: "Find surveys", icon: Sparkles, tone: "amber" },
  { title: "Apps & Games", description: "Discover app installs, games, and more ways to earn.", href: "/dashboard/offerwalls", action: "Explore apps", icon: Layers, tone: "blue" },
  { title: "My Work", description: "Continue tasks and track your submissions.", href: "/dashboard/tasks", action: "View my work", icon: CheckCircle2, tone: "slate" },
] as const;

const OPTION_TONES: Record<(typeof EARNING_OPTIONS)[number]["tone"], string> = {
  teal: "bg-teal-50 text-teal-700 group-hover:border-teal-300",
  amber: "bg-amber-50 text-amber-700 group-hover:border-amber-300",
  blue: "bg-sky-50 text-sky-700 group-hover:border-sky-300",
  slate: "bg-slate-100 text-slate-700 group-hover:border-slate-300",
};

function formatDeadline(deadline: string | null, now: Date): { text: string; cls: string } | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = diff / 86400000;
  if (days > 60) return null;
  if (diff < 48 * 3600000) return { text: "⏰ Ending soon!", cls: "text-red-500 font-semibold text-xs" };
  const d = Math.floor(days);
  if (d <= 7) return { text: `⏰ ${d} days left`, cls: "text-amber-500 font-medium text-xs" };
  return { text: `${d} days left`, cls: "text-slate-400 text-xs" };
}

function getAccentColor(taskType: string | null): string {
  const t = (taskType ?? "").toLowerCase();
  if (t === "survey") return "#6366F1";
  if (t.includes("social")) return "#8B5CF6";
  if (t.includes("annotation") || t.includes("data")) return "#F59E0B";
  return "#02b491";
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [tasks, setTasks]                 = useState<Task[]>([]);
  const [approvedTaskIds, setApprovedTaskIds] = useState<Set<string>>(new Set());
  const [submissionMap, setSubmissionMap] = useState<Record<string, string>>({});
  const [assignmentMap, setAssignmentMap] = useState<Record<string, string>>({});
  const [profile, setProfile]             = useState<ProfileData>({ languages: [], skills: [], level: 1 });
  const [userId, setUserId]               = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState("All");
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState<SortBy>("newest");
  const [payoutFilter, setPayoutFilter]   = useState<PayoutFilter>("all");
  const [showOnlyQualified, setShowOnlyQualified] = useState(false);
  const [now, setNow]                     = useState(() => new Date());

  // T&C modal
  const [tncTask, setTncTask]       = useState<Task | null>(null);
  const [tncChecked, setTncChecked] = useState(false);
  const [starting, setStarting]     = useState(false);
  const [retrying, setRetrying]     = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const [tasksRes, subsRes, assignRes, profileRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("status", "active").or("is_private.eq.false,is_private.is.null").is("deleted_at", null).order("created_at", { ascending: false }),
        user
          ? supabase.from("submissions").select("task_id, status").eq("contributor_id", user.id).neq("status", "rejected")
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from("assignments").select("task_id, status").eq("contributor_id", user.id)
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from("profiles").select("languages, skills, level").eq("id", user.id).single()
          : Promise.resolve({ data: null }),
      ]);

      setTasks((tasksRes.data ?? []) as Task[]);

      const map: Record<string, string> = {};
      const approvedSet = new Set<string>();
      for (const s of (subsRes.data ?? []) as { task_id: string; status: string }[]) {
        map[s.task_id] = s.status;
        if (s.status === "approved") approvedSet.add(s.task_id);
      }
      setSubmissionMap(map);
      setApprovedTaskIds(approvedSet);

      const amap: Record<string, string> = {};
      for (const a of (assignRes.data ?? []) as { task_id: string; status: string }[]) {
        amap[a.task_id] = a.status;
      }
      setAssignmentMap(amap);

      if (profileRes.data) {
        setProfile({
          languages: (profileRes.data.languages as string[] | null) ?? [],
          skills:    (profileRes.data.skills    as string[] | null) ?? [],
          level:     (profileRes.data.level     as number  | null) ?? 1,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  function openTnc(task: Task) {
    setTncChecked(false);
    setTncTask(task);
  }

  async function agreeAndStart() {
    if (!tncTask) return;
    setStarting(true);
    const taskId = tncTask.id;
    const isAssignment = tncTask.assignment_required;
    setTncTask(null);
    setStarting(false);
    if (isAssignment) {
      router.push(`/dashboard/tasks/${taskId}`);
    } else {
      router.push(`/dashboard/tasks/${taskId}/work`);
    }
  }

  const userLevel = profile.level ?? 1;

  const filtered = tasks
    .filter((t) => {
      if (activeFilter !== "All" && t.task_type?.toLowerCase() !== activeFilter.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
      }
      if (showOnlyQualified) {
        const needed = t.required_level ?? 1;
        if (userLevel < needed) return false;
      }
      // Eligibility: required tasks (all must be approved)
      if (userId && t.required_task_ids && t.required_task_ids.length > 0) {
        if (!t.required_task_ids.every((rid) => approvedTaskIds.has(rid))) return false;
      }
      // Eligibility: excluded tasks (none must be approved)
      if (userId && t.excluded_task_ids && t.excluded_task_ids.length > 0) {
        if (t.excluded_task_ids.some((eid) => approvedTaskIds.has(eid))) return false;
      }
      const pay = t.pay_per_task ?? 0;
      if (payoutFilter === "under10"  && pay >= 10) return false;
      if (payoutFilter === "10to50"   && (pay < 10 || pay > 50)) return false;
      if (payoutFilter === "50plus"   && pay <= 50) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      if (sortBy === "highest_payout") return (b.pay_per_task ?? 0) - (a.pay_per_task ?? 0);
      if (sortBy === "ending_soon") {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      return 0;
    });

  const payoutLabels: Record<PayoutFilter, string> = {
    all: "Any payout", under10: "< 10", "10to50": "10–50", "50plus": "50+",
  };

  return (
    <div className="space-y-6">

      <section className="relative isolate overflow-hidden rounded-[1.6rem] bg-[#103f38] text-white shadow-[0_18px_45px_rgba(15,76,69,0.14)]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(214,182,110,0.22),transparent_35%),radial-gradient(ellipse_at_5%_100%,rgba(20,184,166,0.16),transparent_40%)]" />
        <div aria-hidden className="absolute -right-20 -top-32 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e4d3a8]">
              <Sparkles className="h-3.5 w-3.5" /> Earn with NexGuild
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose how you want to earn.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Find paid projects here, or jump to a dedicated page for surveys, offerwalls, and your active work.</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d6b66e]/15 text-[#e6c77d]">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">Tasks for you</p>
              <p className="mt-0.5 text-xl font-semibold">{loading ? "—" : filtered.length} <span className="text-xs font-medium text-white/60">available</span></p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Explore earning options" className="space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Explore NexGuild</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Your earning options</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {EARNING_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Link key={option.title} href={option.href} className="group flex min-h-44 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(15,76,69,0.1)]">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${OPTION_TONES[option.tone]}`}><Icon className="h-5 w-5" /></span>
                <span className="mt-4 text-sm font-bold text-slate-900">{option.title}</span>
                <span className="mt-1 text-xs leading-5 text-slate-500">{option.description}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-teal-700">{option.action}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Search + Filter Bar ─────────────────────────────────────── */}
      <div id="task-list" className="scroll-mt-28 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Paid tasks</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Open opportunities</h2>
          </div>
          {!loading && (
            <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 sm:inline-flex">
              {filtered.length} available
            </span>
          )}
        </div>

        {/* Row 1: Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks and projects..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 transition-shadow"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-300 cursor-pointer flex-shrink-0"
          >
            <option value="newest">Newest</option>
            <option value="highest_payout">Highest Payout</option>
            <option value="ending_soon">Ending Soon</option>
          </select>
        </div>

        {/* Row 2: Category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 border transition-all ${
                activeFilter === f
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Row 3: Payout buckets + Level toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "under10", "10to50", "50plus"] as PayoutFilter[]).map((bucket) => (
            <button
              key={bucket}
              onClick={() => setPayoutFilter(bucket)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-all ${
                payoutFilter === bucket
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-600"
              }`}
            >
              <NexCoinIcon size={10} />
              {payoutLabels[bucket]}
            </button>
          ))}

          <button
            onClick={() => setShowOnlyQualified((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 border transition-all ${
              showOnlyQualified
                ? "bg-teal-500 text-white border-teal-500"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-600"
            }`}
          >
            {showOnlyQualified ? "✓ My Level Only" : "🔒 Show All Levels"}
          </button>
        </div>
      </div>

      {/* ── Task Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-slate-100 bg-white animate-pulse shadow-[0_2px_12px_rgba(0,0,0,0.06)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty state ──────────────────────────────────────────── */
        <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] py-16 flex flex-col items-center gap-3 text-center px-6">
          <span className="text-5xl">🔍</span>
          <p className="text-lg font-bold text-slate-800 mt-1">No tasks found</p>
          <p className="text-sm text-slate-500">Try adjusting your filters or check back soon.</p>
          <a
            href="/dashboard/surveys"
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-teal-600 hover:to-teal-700"
          >
            Explore paid surveys →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => {
            const subStatus      = submissionMap[task.id];
            const filled         = task.filled_slots ?? 0;
            const total          = task.total_slots;
            const isFull         = total != null && filled >= total && !subStatus;
            const fillPct        = total ? Math.min(100, (filled / total) * 100) : 0;
            const deadlineInfo   = formatDeadline(task.deadline, now);
            const accentColor    = getAccentColor(task.task_type);
            const isPrivate      = task.is_private || task.assignment_required;
            const lang           = task.required_language && task.required_language.toLowerCase() !== "any" ? task.required_language : null;
            const isFeatured     = task.is_featured;
            const langMatches    = lang && profile.languages.length > 0 &&
              profile.languages.map((l) => l.toLowerCase()).includes(lang.toLowerCase());
            const assignStatus   = assignmentMap[task.id];
            const assignRejected = task.assignment_required && assignStatus === "rejected";
            const isResubmitNeeded = subStatus === "resubmit_requested";
            const isFinalRejected  = subStatus === "rejected";
            const taskLevel      = task.required_level ?? 1;
            const isLocked       = userLevel < taskLevel && !subStatus;
            const contributorCoins = task.pay_per_task != null ? Math.floor(task.pay_per_task * 0.66) : null;

            async function handleCardClick() {
              if (isFull || isFinalRejected || isLocked) return;
              if (assignRejected) {
                if (!userId || retrying) return;
                setRetrying(task.id);
                await supabase
                  .from("assignments")
                  .delete()
                  .eq("task_id", task.id)
                  .eq("contributor_id", userId)
                  .eq("status", "rejected");
                setAssignmentMap((prev) => {
                  const next = { ...prev };
                  delete next[task.id];
                  return next;
                });
                setRetrying(null);
                router.push(`/dashboard/tasks/${task.id}`);
                return;
              }
              if (subStatus === "in_progress" || isResubmitNeeded) {
                router.push(`/dashboard/tasks/${task.id}/work`); return;
              }
              if (!subStatus) openTnc(task);
            }

            const isDisabled = isFull || isFinalRejected || isLocked;

            return (
              <div
                key={task.id}
                onClick={handleCardClick}
                className={`relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white
                  shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200
                  ${isDisabled
                    ? isFinalRejected ? "opacity-50 cursor-not-allowed" : "opacity-70 cursor-not-allowed"
                    : "cursor-pointer hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-1"
                  }
                  ${isFeatured && !isDisabled ? "ring-1 ring-amber-200" : ""}
                `}
              >
                {/* Top accent bar */}
                <div className="h-[3px] w-full flex-shrink-0" style={{ background: accentColor }} />

                {/* Sold Out Overlay */}
                {isFull && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-xs font-bold text-white bg-red-500/90 px-3 py-1 rounded-full shadow-lg">
                      SOLD OUT
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-3 p-5 flex-1">
                  {/* Badges row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {task.task_type ?? "Task"}
                    </span>
                    {isFeatured && (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                        ⭐ Featured
                      </span>
                    )}
                    {isPrivate && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        <Lock className="h-2.5 w-2.5" /> Private
                      </span>
                    )}
                    {lang && (
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        langMatches ? "text-green-600 bg-green-50" : "text-blue-600 bg-blue-50"
                      }`}>
                        <Globe className="h-2.5 w-2.5" /> {lang}{langMatches && " ✓"}
                      </span>
                    )}
                    {isLocked && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Lock className="h-2.5 w-2.5" /> Level {taskLevel}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-800 leading-snug line-clamp-2">
                    {task.title}
                  </h3>

                  {/* Description */}
                  {task.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Coins + XP */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <NexCoinIcon size={20} />
                      <span className="text-xl font-bold text-slate-800">
                        {contributorCoins ?? "—"}
                      </span>
                      <span className="text-sm text-slate-400">NexCoins</span>
                    </div>
                    {(task.xp_reward ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-current" /> +{task.xp_reward} XP
                      </span>
                    )}
                  </div>

                  {/* Slots + progress (only if >10% filled) */}
                  {total != null && fillPct > 10 && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400">{filled}/{total} slots taken</p>
                      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500 transition-all duration-500"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Deadline */}
                  {deadlineInfo && (
                    <p className={deadlineInfo.cls}>{deadlineInfo.text}</p>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* CTA */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {subStatus === "submitted" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-sm font-semibold px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Under Review
                      </span>
                    ) : subStatus === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 text-green-600 text-sm font-semibold px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Approved ✓
                      </span>
                    ) : isFinalRejected ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-500 text-sm font-semibold px-3 py-1.5">
                        <XCircle className="h-4 w-4" /> Rejected ✗
                      </span>
                    ) : isLocked ? (
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-slate-400">
                        <Lock className="h-4 w-4" /> Level {taskLevel} Required
                      </div>
                    ) : (
                      <button
                        onClick={handleCardClick}
                        disabled={isFull || retrying === task.id}
                        className={`w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1 transition-all duration-150 ${
                          isFull
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : isResubmitNeeded
                            ? "bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100"
                            : assignRejected
                            ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                            : subStatus === "in_progress"
                            ? "border border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100"
                            : "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 active:scale-[0.98]"
                        }`}
                      >
                        {retrying === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isResubmitNeeded ? "Resubmit →" :
                           subStatus === "in_progress" ? "Continue" :
                           assignRejected ? "Retry Assignment →" :
                           <>Get Started <ChevronRight className="h-4 w-4" /></>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BlogTipCard
        slug="nexguild-task-system-explained"
        title="How NexGuild Tasks Work"
        excerpt="Understand task levels, submission types, and how to complete work correctly."
      />

      {/* ── T&C Modal ───────────────────────────────────────────────── */}
      {tncTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-start-dialog-title"
            className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] sm:max-h-[85dvh] sm:max-w-lg sm:rounded-[1.75rem]"
          >
            <div className="flex flex-shrink-0 items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 ring-1 ring-teal-100">
                  <ClipboardList className="h-5 w-5 text-teal-700" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 id="task-start-dialog-title" className="text-base font-bold text-slate-800">Before You Start</h2>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{tncTask.title}</p>
                </div>
              </div>
              <button
                onClick={() => setTncTask(null)}
                aria-label="Close dialog"
                className="ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Rules & Requirements</p>
                <ul className="space-y-2.5">
                  {DEFAULT_RULES.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                      {rule}
                    </li>
                  ))}
                  {tncTask.terms && tncTask.terms.trim() && (
                    <>
                      <li className="flex items-start gap-2.5 pt-1 text-[13px] font-semibold text-slate-800">
                        <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                        Task-specific conditions:
                      </li>
                      {tncTask.terms.split("\n").filter(Boolean).map((r, i) => (
                        <li key={`c-${i}`} className="flex items-start gap-2.5 pl-4 text-[13px] leading-relaxed text-slate-600">
                          <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                          {r.trim()}
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>

              {(tncTask.validation_time || tncTask.payment_time) && (
                <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Expected Timeline</p>
                  {tncTask.validation_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Review time</span>
                      <span className="font-semibold text-slate-800">{tncTask.validation_time}</span>
                    </div>
                  )}
                  {tncTask.payment_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Payment after approval</span>
                      <span className="font-semibold text-teal-700">{tncTask.payment_time}</span>
                    </div>
                  )}
                </div>
              )}

              {tncTask.pay_per_task && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-white p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-white shadow-sm">
                    <NexCoinIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-700">{Math.floor(tncTask.pay_per_task * 0.66)} NexCoins</p>
                    <p className="text-xs text-slate-500">Credited after your work is approved</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 space-y-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
              <label className="flex cursor-pointer select-none items-start gap-3">
                <input
                  type="checkbox"
                  checked={tncChecked}
                  onChange={(e) => setTncChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-teal-600"
                />
                <span className="text-xs leading-relaxed text-slate-600">
                  I have read and agree to the rules and conditions above
                </span>
              </label>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 rounded-xl text-slate-600 hover:bg-slate-100" onClick={() => setTncTask(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 font-semibold text-white shadow-sm hover:from-teal-800 hover:to-teal-700"
                  disabled={!tncChecked || starting}
                  onClick={agreeAndStart}
                >
                  {starting ? "Starting…" : tncTask.assignment_required ? "Proceed to Assignment →" : "Agree & Start →"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
