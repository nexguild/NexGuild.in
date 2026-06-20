"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ReceiptText, TrendingUp } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  amount: number;
  type: "earned" | "redeemed";
  source: string | null;
  description: string | null;
  created_at: string;
}

interface PendingSubmission {
  id: string;
  submitted_at: string;
  tasks: { title: string | null; pay_per_task: number | null } | null;
}

export default function EarningsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pending, setPending]           = useState<PendingSubmission[]>([]);
  const [nexcoins, setNexcoins]         = useState<number>(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: txns, error: txnErr },
        { data: subs },
        { data: profile },
      ] = await Promise.all([
        supabase
          .from("coin_transactions")
          .select("id, amount, type, source, description, created_at")
          .eq("contributor_id", user.id)
          .eq("type", "earned")
          .order("created_at", { ascending: false }),
        supabase
          .from("submissions")
          .select("id, submitted_at, tasks(title, pay_per_task)")
          .eq("contributor_id", user.id)
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("nexcoins")
          .eq("id", user.id)
          .single(),
      ]);

      if (txnErr) console.error("coin_transactions fetch error:", txnErr.message);

      setTransactions((txns as Transaction[]) ?? []);
      setPending((subs as unknown as PendingSubmission[]) ?? []);
      setNexcoins((profile as { nexcoins: number | null } | null)?.nexcoins ?? 0);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalEarned = transactions.reduce((s, t) => s + t.amount, 0);
  const pendingCoins = pending.reduce((s, p) => s + (p.tasks?.pay_per_task ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Earnings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Your complete NexCoins earning history.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Current Balance"
          value={loading ? "—" : nexcoins.toLocaleString() + " coins"}
          icon={<NexCoinIcon size={20} />}
        />
        <StatCard
          label="Total Earned"
          value={loading ? "—" : totalEarned.toLocaleString() + " coins"}
          icon={<NexCoinIcon size={20} />}
        />
        <StatCard
          label="Pending Review"
          value={loading ? "—" : pendingCoins.toLocaleString() + " coins"}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="Awaiting approval"
        />
      </div>

      {/* Pending submissions */}
      {!loading && pending.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5">
          <div className="px-5 py-4 border-b border-yellow-500/20">
            <h2 className="font-semibold text-[var(--text-primary)]">Pending Review</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">These submissions are awaiting admin approval.</p>
          </div>
          <ul className="divide-y divide-yellow-500/10">
            {pending.map((p) => (
              <li key={p.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {p.tasks?.title ?? "Task"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Submitted {new Date(p.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400">
                    Under Review
                  </span>
                  <span className="text-sm font-bold text-yellow-400">
                    +{(p.tasks?.pay_per_task ?? 0).toLocaleString()} coins
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confirmed earnings history */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Earned History</h2>
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
        ) : transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <ReceiptText className="h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-semibold text-[var(--text-primary)]">No earnings yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Complete and get tasks approved to earn NexCoins.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {transactions.map((t) => (
              <li key={t.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {t.description ?? t.source ?? "Task Reward"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {t.source && <span> · {t.source}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">
                    Confirmed
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    +{t.amount.toLocaleString()} coins
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
