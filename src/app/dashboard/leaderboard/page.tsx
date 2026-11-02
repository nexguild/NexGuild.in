"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Loader2, Users } from "lucide-react";
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
  const topThree = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);

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
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#102b3f] via-[#14504b] to-[#0f766e] p-5 text-white shadow-[0_20px_55px_rgba(15,76,69,0.2)] sm:p-7"
        style={{ animationDelay: "0ms" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(245,158,11,0.2),transparent_35%),radial-gradient(ellipse_at_0%_100%,rgba(45,212,191,0.16),transparent_42%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/[0.08]" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/80">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Trophy className="h-4 w-4" />
              </span>
              <span>All-time rankings</span>
            </div>
            <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Top Contributors</h1>
            <p className="max-w-2xl text-sm text-teal-50/80">Celebrating the people making NexGuild better, one approved task at a time.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 sm:flex">
            <Users className="h-4 w-4 text-teal-100" />
            <span className="text-xs font-medium text-white/80">Ranked by approved tasks</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white py-20 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">Loading leaderboard…</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-100">
            <Trophy className="h-7 w-7 text-amber-500" />
          </div>
          <h2 className="font-bold text-slate-800">The leaderboard is waiting</h2>
          <p className="max-w-sm text-sm text-slate-500">Complete and get tasks approved to earn your place among the top contributors.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topThree.length > 0 && (
            <section aria-label="Top three contributors">
              <div className="mb-3 flex items-center gap-2">
                <Medal className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800">Top contributors</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3 md:items-end md:gap-4">
                {topThree.map((entry) => {
                  const meta = RANK_META[entry.rank];
                  const isFirst = entry.rank === 1;
                  return (
                    <article
                      key={entry.id}
                      className={`relative overflow-hidden rounded-[1.5rem] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-transform hover:-translate-y-0.5 ${
                        isFirst
                          ? "order-1 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 md:order-2 md:py-7"
                          : entry.rank === 2
                          ? "order-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 md:order-1"
                          : "order-3 border-orange-200/80 bg-gradient-to-br from-orange-50/70 via-white to-orange-50/40"
                      }`}
                    >
                      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-current opacity-[0.08]" />
                      <div className="relative flex items-center gap-4">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${meta.badgeBg} ${meta.badgeText}`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800">{entry.full_name}</p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{meta.label} · Rank #{entry.rank}</p>
                        </div>
                      </div>
                      <div className="relative mt-5 flex items-end justify-between border-t border-slate-200/70 pt-4">
                        <div>
                          <p className="text-2xl font-extrabold tracking-tight text-slate-800">{entry.approved_count}</p>
                          <p className="text-xs text-slate-500">approved task{entry.approved_count !== 1 ? "s" : ""}</p>
                        </div>
                        <Trophy className={`mb-1 h-5 w-5 ${isFirst ? "text-amber-500" : entry.rank === 2 ? "text-slate-400" : "text-orange-500"}`} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {remainingEntries.length > 0 && (
            <section className="animate-fade-slide-up overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]" style={{ animationDelay: "100ms" }}>
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h2 className="text-sm font-bold text-slate-800">More contributors</h2>
                <p className="mt-0.5 text-xs text-slate-500">Keep going — every approved task moves you up.</p>
              </div>
              <ol start={4} className="divide-y divide-slate-100">
                {remainingEntries.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:gap-4 sm:px-6">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold tabular-nums text-slate-600">
                      {entry.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{entry.full_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{entry.approved_count} approved task{entry.approved_count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                      #{entry.rank}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
