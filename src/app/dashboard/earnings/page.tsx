"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ReceiptText, TrendingUp, Coins } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Earning {
  id: string;
  source_type: string | null;
  source_label: string | null;
  amount: number;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-yellow-500/10 text-yellow-400",
  confirmed: "bg-green-500/10 text-green-400",
  rejected:  "bg-red-500/10 text-red-400",
};

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("earnings")
        .select("id, source_type, source_label, amount, status, created_at")
        .eq("contributor_id", user.id)
        .order("created_at", { ascending: false });
      setEarnings(data ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalCoins = earnings.filter((e) => e.status === "confirmed").reduce((s, e) => s + e.amount, 0);
  const pendingCoins = earnings.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Earnings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Your complete NexCoins earning history.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Confirmed"
          value={loading ? "—" : totalCoins.toLocaleString() + " coins"}
          icon={<Coins className="h-5 w-5" />}
        />
        <StatCard
          label="Pending"
          value={loading ? "—" : pendingCoins.toLocaleString() + " coins"}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="Awaiting review"
        />
      </div>

      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Transaction History</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-[var(--border-default)]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-48 rounded bg-[var(--surface-subtle)] animate-pulse" />
                  <div className="h-2 w-28 rounded bg-[var(--surface-subtle)] animate-pulse" />
                </div>
                <div className="h-5 w-20 rounded bg-[var(--surface-subtle)] animate-pulse" />
              </div>
            ))}
          </div>
        ) : earnings.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <ReceiptText className="h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-semibold text-[var(--text-primary)]">No earnings yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Complete tasks or offers to start earning NexCoins.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {earnings.map((e) => (
              <li key={e.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {e.source_label ?? e.source_type ?? "Earning"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {e.source_type && <span> · {e.source_type}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[e.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
                    {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    +{e.amount.toLocaleString()} coins
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
