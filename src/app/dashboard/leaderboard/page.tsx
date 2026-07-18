"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  approved_count: number;
  isFake?: boolean;
}

// TODO: Remove FAKE_PEOPLE once real user base is active
const FAKE_PEOPLE: Omit<LeaderboardEntry, "rank">[] = [
  { id: "f01", full_name: "Priya Sharma",      approved_count: 15 },
  { id: "f02", full_name: "Rahul Mehta",        approved_count: 14 },
  { id: "f03", full_name: "Ananya Krishnan",    approved_count: 13 },
  { id: "f04", full_name: "Deepak Rajput",      approved_count: 13 },
  { id: "f05", full_name: "Sneha Tiwari",       approved_count: 12 },
  { id: "f06", full_name: "Arjun Nair",         approved_count: 11 },
  { id: "f07", full_name: "Kavya Reddy",        approved_count: 10 },
  { id: "f08", full_name: "Vikram Pandey",      approved_count: 10 },
  { id: "f09", full_name: "Pooja Iyer",         approved_count:  9 },
  { id: "f10", full_name: "Mohit Sinha",        approved_count:  9 },
  { id: "f11", full_name: "Divya Menon",        approved_count:  8 },
  { id: "f12", full_name: "Rohan Gupta",        approved_count:  8 },
  { id: "f13", full_name: "Shruti Joshi",       approved_count:  7 },
  { id: "f14", full_name: "Aakash Verma",       approved_count:  7 },
  { id: "f15", full_name: "Meera Pillai",       approved_count:  6 },
  { id: "f16", full_name: "Nikhil Desai",       approved_count:  6 },
  { id: "f17", full_name: "Tanvi Bhatt",        approved_count:  5 },
  { id: "f18", full_name: "Saurabh Mishra",     approved_count:  5 },
  { id: "f19", full_name: "Isha Chatterjee",    approved_count:  5 },
  { id: "f20", full_name: "Karan Malhotra",     approved_count:  4 },
  { id: "f21", full_name: "Aditi Banerjee",     approved_count:  4 },
  { id: "f22", full_name: "Yash Chaudhary",     approved_count:  3 },
  { id: "f23", full_name: "Ritika Singh",       approved_count:  3 },
  { id: "f24", full_name: "Pranav Kulkarni",    approved_count:  3 },
  { id: "f25", full_name: "Swati Agarwal",      approved_count:  2 },
  { id: "f26", full_name: "Harsh Bhatia",       approved_count:  2 },
  { id: "f27", full_name: "Neha Saxena",        approved_count:  2 },
];

function mergeWithFake(real: LeaderboardEntry[]): LeaderboardEntry[] {
  const realIds = new Set(real.map(e => e.id));
  const fakeFiltered = FAKE_PEOPLE.filter(f => !realIds.has(f.id)).map(f => ({ ...f, isFake: true, rank: 0 }));
  const merged = [...real.map(e => ({ ...e, isFake: false })), ...fakeFiltered];
  merged.sort((a, b) => b.approved_count - a.approved_count);
  return merged.map((e, i) => ({ ...e, rank: i + 1 }));
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
        setEntries(mergeWithFake(leaderboard ?? []));
      } else {
        setEntries(mergeWithFake([]));
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
