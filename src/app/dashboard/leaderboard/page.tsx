"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  approved_count: number;
}

const RANK_META: Record<number, {
  rowBg: string;
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
  label: string;
}> = {
  1: {
    rowBg:     "bg-amber-50/60",
    badgeBg:   "bg-amber-100",
    badgeText: "text-amber-700",
    icon:      <Trophy className="h-4 w-4 text-amber-500" />,
    label:     "Gold",
  },
  2: {
    rowBg:     "bg-slate-50/60",
    badgeBg:   "bg-slate-100",
    badgeText: "text-slate-600",
    icon:      <Medal className="h-4 w-4 text-slate-400" />,
    label:     "Silver",
  },
  3: {
    rowBg:     "bg-orange-50/60",
    badgeBg:   "bg-orange-100",
    badgeText: "text-orange-700",
    icon:      <Medal className="h-4 w-4 text-orange-400" />,
    label:     "Bronze",
  },
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/leaderboard?limit=50", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { leaderboard } = await res.json() as { leaderboard: LeaderboardEntry[] };
        setEntries(leaderboard ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative overflow-hidden rounded-2xl p-6 shadow-lg"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)", animationDelay: "0ms" }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-white/70" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">All-time Rankings</span>
          </div>
          <h1 className="mb-1 text-2xl font-extrabold text-white">Top Contributors</h1>
          <p className="text-sm text-white/75">Ranked by total approved tasks — keep completing to climb higher.</p>
        </div>
      </div>

      {/* ── LIST ─────────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm" style={{ animationDelay: "100ms" }}>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-400">Loading leaderboard…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
            >
              <Trophy className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-slate-800">No data yet</p>
              <p className="mt-0.5 text-sm text-slate-400">Complete and get tasks approved to appear here.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {entries.map((entry) => {
              const meta = RANK_META[entry.rank];
              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${meta ? meta.rowBg : "hover:bg-slate-50"}`}
                >
                  {/* Rank badge */}
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    meta ? `${meta.badgeBg} ${meta.badgeText}` : "bg-slate-100 text-slate-500"
                  }`}>
                    {meta ? meta.icon : entry.rank}
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{entry.full_name}</p>
                    <p className="text-xs text-slate-400">{entry.approved_count} approved task{entry.approved_count !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Rank label for top 3 */}
                  {meta && (
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText}`}>
                      #{entry.rank}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
