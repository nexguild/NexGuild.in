"use client";

import { useEffect, useState } from "react";
import { Trophy, ArrowLeft, Medal } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  approved_count: number;
}

const RANK_STYLES: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",   icon: <Trophy className="h-4 w-4 text-amber-500" /> },
  2: { bg: "bg-slate-50 border-slate-200",   text: "text-slate-600",   icon: <Medal  className="h-4 w-4 text-slate-400" /> },
  3: { bg: "bg-orange-50 border-orange-200", text: "text-orange-700",  icon: <Medal  className="h-4 w-4 text-orange-400" /> },
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
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="h-6 w-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900">Top Contributors</h1>
        </div>
        <p className="text-sm text-slate-500">All-time rankings by approved task count.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-[#99F6D9] border-t-[#02b491] animate-spin" />
            <p className="text-sm text-slate-400">Loading leaderboard…</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">No data yet</p>
            <p className="text-sm text-slate-400 mt-1">Complete and get tasks approved to appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {entries.map((entry) => {
              const style = RANK_STYLES[entry.rank] ?? { bg: "bg-white border-slate-100", text: "text-slate-500", icon: null };
              return (
                <li key={entry.id} className={`flex items-center gap-4 px-6 py-4 ${entry.rank <= 3 ? style.bg + " border-b" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${entry.rank <= 3 ? style.bg + " border " + style.text : "bg-slate-100 text-slate-500"}`}>
                    {entry.rank <= 3 ? style.icon : entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{entry.full_name}</p>
                    <p className="text-xs text-slate-400">{entry.approved_count} approved task{entry.approved_count !== 1 ? "s" : ""}</p>
                  </div>
                  {entry.rank <= 3 && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
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
