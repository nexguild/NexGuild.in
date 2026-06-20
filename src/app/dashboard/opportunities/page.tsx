"use client";

import { useEffect, useState } from "react";
import { Search, Lock, Globe, Users, Clock, X, ChevronRight, CheckCircle2, Star, Loader2, XCircle } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

function Toggle({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-5 w-9 rounded-full relative flex-shrink-0"
        style={{ backgroundColor: on ? "#14b8a6" : "#374151" }}
      >
        <span
          className="absolute top-[2px] left-0 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
        />
      </div>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}

function formatCountdown(deadline: string | null, now: Date): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [tasks, setTasks]                 = useState<Task[]>([]);
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
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const [tasksRes, subsRes, assignRes, profileRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("status", "active").order("created_at", { ascending: false }),
        user
          ? supabase.from("submissions").select("task_id, status").eq("contributor_id", user.id)
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
      for (const s of (subsRes.data ?? []) as { task_id: string; status: string }[]) {
        map[s.task_id] = s.status;
      }
      setSubmissionMap(map);

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
      // Level filter
      if (showOnlyQualified) {
        const needed = t.required_level ?? 1;
        if (userLevel < needed) return false;
      }
      // Payout filter
      const pay = t.pay_per_task ?? 0;
      if (payoutFilter === "under10"  && pay >= 10) return false;
      if (payoutFilter === "10to50"   && (pay < 10 || pay > 50)) return false;
      if (payoutFilter === "50plus"   && pay <= 50) return false;
      return true;
    })
    .sort((a, b) => {
      // Featured always floats to top
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      // Secondary sort
      if (sortBy === "highest_payout") return (b.pay_per_task ?? 0) - (a.pay_per_task ?? 0);
      if (sortBy === "ending_soon") {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      return 0; // newest — already fetched in descending order
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Opportunities</h1>
        <p className="text-sm text-[var(--text-secondary)]">Browse tasks available to you right now.</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="space-y-3">

        {/* Row 1: Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
            <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] cursor-pointer flex-shrink-0"
          >
            <option value="newest">Newest</option>
            <option value="highest_payout">Highest Payout</option>
            <option value="ending_soon">Ending Soon</option>
          </select>
        </div>

        {/* Row 2: Type filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                activeFilter === f
                  ? "bg-[var(--brand-500)] text-white"
                  : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Row 3: Payout buckets + Level toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Payout buckets */}
          {(["all", "under10", "10to50", "50plus"] as PayoutFilter[]).map((bucket) => {
            const labels: Record<PayoutFilter, string> = {
              all: "Any payout", under10: "< 10 coins", "10to50": "10–50 coins", "50plus": "50+ coins",
            };
            return (
              <button
                key={bucket}
                onClick={() => setPayoutFilter(bucket)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors border ${
                  payoutFilter === bucket
                    ? "bg-[var(--brand-500)]/10 border-[var(--brand-500)] text-[var(--brand-500)]"
                    : "bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-500)]"
                }`}
              >
                {labels[bucket]}
              </button>
            );
          })}

          {/* Level toggle */}
          <button
            onClick={() => setShowOnlyQualified((v) => !v)}
            className={`ml-auto px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors border flex items-center gap-1.5 ${
              showOnlyQualified
                ? "bg-[var(--brand-500)]/10 border-[var(--brand-500)] text-[var(--brand-500)]"
                : "bg-transparent border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-500)]"
            }`}
          >
            {showOnlyQualified ? "✓" : "🔒"} {showOnlyQualified ? "My Level Only" : "Show All Levels"}
          </button>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs text-[var(--text-muted)]">
            {filtered.length} {filtered.length === 1 ? "task" : "tasks"} found
          </p>
        )}
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center px-6">
          <Search className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No tasks found</p>
          <p className="text-sm text-[var(--text-secondary)]">Try a different filter or check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => {
            const subStatus = submissionMap[task.id];
            const filled    = task.filled_slots ?? 0;
            const total     = task.total_slots;
            const isFull    = total != null && filled >= total && !subStatus;
            const fillPct   = total ? Math.min(100, (filled / total) * 100) : 0;
            const countdown = formatCountdown(task.deadline, now);
            const isPrivate = task.is_private || task.assignment_required;
            const lang      = task.required_language && task.required_language.toLowerCase() !== "any" ? task.required_language : null;
            const isFeatured = task.is_featured;

            // Language match badge
            const langMatches = lang && profile.languages.length > 0 &&
              profile.languages.map((l) => l.toLowerCase()).includes(lang.toLowerCase());

            const assignStatus     = assignmentMap[task.id];
            const assignRejected   = task.assignment_required && assignStatus === "rejected";
            const isResubmitNeeded = subStatus === "resubmit_requested";
            const isFinalRejected  = subStatus === "rejected";
            const taskLevel        = task.required_level ?? 1;
            const isLocked         = userLevel < taskLevel && !subStatus;

            async function handleCardClick() {
              if (isFull || isFinalRejected || isLocked) return;
              // Assignment rejected → delete it, fresh assignment form
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

            return (
              <div
                key={task.id}
                className={`relative rounded-xl border bg-[var(--surface-card)] p-5 flex flex-col gap-3
                  transition-all duration-200
                  ${isFull
                    ? "opacity-60 border-[var(--border-default)]"
                    : isFinalRejected
                    ? "opacity-50 border-red-500/20 cursor-not-allowed"
                    : isLocked
                    ? "opacity-70 border-[var(--border-default)] cursor-not-allowed"
                    : `cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(20,184,166,0.12)] hover:border-[rgba(20,184,166,0.35)]
                    ${isFeatured ? "border-[rgba(245,158,11,0.4)]" : "border-[var(--border-default)]"}`
                  }`}
                onClick={handleCardClick}
              >
                {/* Featured top glow */}
                {isFeatured && (
                  <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent rounded-full" />
                )}

                {/* Sold Out Overlay */}
                {isFull && (
                  <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-xs font-bold text-white bg-red-500/90 px-3 py-1 rounded-full shadow-lg">
                      SOLD OUT
                    </span>
                  </div>
                )}

                {/* Badges row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-[var(--brand-500)] bg-[rgba(20,184,166,0.1)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {task.task_type ?? "Task"}
                  </span>
                  {isFeatured && (
                    <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-current" /> Featured
                    </span>
                  )}
                  {isPrivate && (
                    <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Private
                    </span>
                  )}
                  {lang && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      langMatches ? "text-green-400 bg-green-500/10" : "text-blue-400 bg-blue-500/10"
                    }`}>
                      <Globe className="h-2.5 w-2.5" /> {lang}
                      {langMatches && " ✓"}
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Requires Level {taskLevel}
                    </span>
                  )}
                  {(task.xp_reward ?? 0) > 0 && (
                    <span className="text-xs font-semibold text-[#02b491] bg-[rgba(20,184,166,0.08)] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-2.5 w-2.5" /> +{task.xp_reward} XP
                    </span>
                  )}
                </div>

                {/* Title + Description */}
                <div className="flex-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-base leading-snug mb-1.5 line-clamp-2">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border-default)]" />

                {/* Meta info */}
                <div className="space-y-2">
                  {/* Timer */}
                  {task.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      {countdown === "Ended" ? (
                        <span className="text-red-400 font-medium">Ended</span>
                      ) : (
                        <>Ends in <span className="text-[var(--text-primary)] font-mono font-semibold ml-1">{countdown}</span></>
                      )}
                    </div>
                  )}

                  {/* Coins + Slots */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <NexCoinIcon size={14} />
                      <span className="text-[var(--brand-500)] font-bold">{task.pay_per_task ?? "—"} coins</span>
                    </div>
                    {total != null && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Users className="h-3.5 w-3.5" />
                        <span>{filled}/{total}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {total != null && (
                    <div className="w-full h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-yellow-400" : "bg-[var(--brand-500)]"
                        }`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div onClick={(e) => e.stopPropagation()}>
                  {subStatus === "submitted" ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400">
                      <CheckCircle2 className="h-4 w-4" /> Submitted
                    </span>
                  ) : subStatus === "approved" ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-400">
                      <CheckCircle2 className="h-4 w-4" /> Approved ✓
                    </span>
                  ) : isFinalRejected ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-400">
                      <XCircle className="h-4 w-4" /> Rejected ✗
                    </span>
                  ) : isLocked ? (
                    <div className="w-full h-9 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-400">
                      <Lock className="h-4 w-4" /> Level {taskLevel} Required
                    </div>
                  ) : (
                    <button
                      onClick={handleCardClick}
                      disabled={isFull || retrying === task.id}
                      className={`w-full h-9 rounded-lg text-sm font-bold flex items-center justify-center gap-1 transition-all duration-150 ${
                        isFull
                          ? "bg-[var(--surface-subtle)] text-[var(--text-muted)] cursor-not-allowed"
                          : isResubmitNeeded
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
                          : assignRejected
                          ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                          : subStatus === "in_progress"
                          ? "bg-[rgba(20,184,166,0.1)] text-[var(--brand-500)] border border-[rgba(20,184,166,0.2)] hover:bg-[rgba(20,184,166,0.15)]"
                          : "bg-[var(--brand-500)] text-white hover:brightness-105 active:scale-[0.98]"
                      }`}
                    >
                      {retrying === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isResubmitNeeded ? "Resubmit →" :
                       subStatus === "in_progress" ? "Continue" :
                       assignRejected ? "Retry Assignment →" :
                       "Get Started"}
                      {retrying !== task.id && <ChevronRight className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* T&C Modal */}
      {tncTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-[var(--surface-card)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-default)] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh]">

            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-default)] flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Before You Start</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{tncTask.title}</p>
              </div>
              <button
                onClick={() => setTncTask(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-3 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Rules */}
              <div>
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Rules & Requirements</p>
                <ul className="space-y-2.5">
                  {DEFAULT_RULES.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)] mt-2 flex-shrink-0" />
                      {rule}
                    </li>
                  ))}
                  {tncTask.terms && tncTask.terms.trim() && (
                    <>
                      <li className="flex items-start gap-2.5 text-sm font-semibold text-[var(--text-primary)] pt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                        Task-specific conditions:
                      </li>
                      {tncTask.terms.split("\n").filter(Boolean).map((r, i) => (
                        <li key={`c-${i}`} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)] pl-4">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400/50 mt-2 flex-shrink-0" />
                          {r.trim()}
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </div>

              {/* Timeline info */}
              {(tncTask.validation_time || tncTask.payment_time) && (
                <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4 space-y-2.5">
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Expected Timeline</p>
                  {tncTask.validation_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Review time</span>
                      <span className="text-[var(--text-primary)] font-semibold">{tncTask.validation_time}</span>
                    </div>
                  )}
                  {tncTask.payment_time && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Payment after approval</span>
                      <span className="text-[var(--brand-500)] font-semibold">{tncTask.payment_time}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Reward reminder */}
              {tncTask.pay_per_task && (
                <div className="flex items-center gap-3 rounded-lg bg-[rgba(20,184,166,0.06)] border border-[rgba(20,184,166,0.2)] p-4">
                  <NexCoinIcon size={20} className="flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[var(--brand-500)]">{tncTask.pay_per_task} NexCoins</p>
                    <p className="text-xs text-[var(--text-muted)]">Credited after your work is approved</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border-default)] space-y-3 flex-shrink-0">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tncChecked}
                  onChange={(e) => setTncChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[var(--brand-500)] flex-shrink-0"
                />
                <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  I have read and agree to the rules and conditions above
                </span>
              </label>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setTncTask(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
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
