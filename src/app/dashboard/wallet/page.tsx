"use client";

import { useEffect, useState } from "react";
import { Coins, ShoppingBag, TrendingUp, History } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  source: string | null;
  description: string | null;
  created_at: string;
}

interface VoucherRequest {
  id: string;
  voucher_type: string;
  voucher_value: number | null;
  coins_spent: number;
  status: string;
  requested_at: string;
  delivered_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400",
  processing: "bg-blue-500/10 text-blue-400",
  delivered:  "bg-green-500/10 text-green-400",
};

export default function NexCoinsPage() {
  const [nexcoins, setNexcoins] = useState<number | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profileData },
        { data: txData },
        { data: voucherData },
      ] = await Promise.all([
        supabase.from("profiles").select("nexcoins").eq("id", user.id).single(),
        supabase
          .from("coin_transactions")
          .select("id, amount, type, source, description, created_at")
          .eq("contributor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("voucher_requests")
          .select("id, voucher_type, voucher_value, coins_spent, status, requested_at, delivered_at")
          .eq("contributor_id", user.id)
          .order("requested_at", { ascending: false }),
      ]);

      setNexcoins(profileData?.nexcoins ?? 0);

      const txList = txData ?? [];
      setTransactions(txList);
      setTotalEarned(txList.filter((t) => t.type === "earned").reduce((s, t) => s + t.amount, 0));
      setTotalSpent(txList.filter((t) => t.type === "redeemed").reduce((s, t) => s + Math.abs(t.amount), 0));
      setVouchers(voucherData ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">NexCoins</h1>
        <p className="text-sm text-[var(--text-secondary)]">Your coin balance and redemption history.</p>
      </div>

      {/* Balance Hero */}
      <div className="rounded-xl border border-[var(--brand-200)] bg-[var(--surface-card)] p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-full bg-[var(--brand-100)] flex items-center justify-center flex-shrink-0">
            <Coins className="h-7 w-7 text-[var(--brand-500)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Available NexCoins</p>
            <p className="text-5xl font-bold text-[var(--brand-500)]">
              {loading ? "—" : (nexcoins ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/store">
            <ShoppingBag className="h-5 w-5" /> Redeem in Store
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Earned"
          value={loading ? "—" : totalEarned.toLocaleString()}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="Coins earned from tasks & offers"
        />
        <StatCard
          label="Total Spent"
          value={loading ? "—" : totalSpent.toLocaleString()}
          icon={<ShoppingBag className="h-5 w-5" />}
          trend="Coins redeemed for vouchers"
        />
      </div>

      {/* Pending Voucher Requests */}
      {vouchers.length > 0 && (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Voucher Requests</h2>
          </div>
          <ul className="divide-y divide-[var(--border-default)]">
            {vouchers.map((v) => (
              <li key={v.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{v.voucher_type}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {v.coins_spent.toLocaleString()} coins ·{" "}
                    {new Date(v.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[v.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
                  {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transaction History */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--text-muted)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">Transaction History</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-[var(--border-default)]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-40 rounded bg-[var(--surface-subtle)] animate-pulse" />
                  <div className="h-2 w-24 rounded bg-[var(--surface-subtle)] animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded bg-[var(--surface-subtle)] animate-pulse" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-14 flex flex-col items-center gap-3 text-center px-6">
            <History className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="font-semibold text-[var(--text-primary)]">No transactions yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Complete tasks or offers to start earning NexCoins.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {transactions.map((tx) => (
              <li key={tx.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {tx.description ?? (tx.source ?? tx.type)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {tx.source && <span> · {tx.source}</span>}
                  </p>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${tx.type === "earned" ? "text-green-400" : "text-[var(--brand-500)]"}`}>
                  {tx.type === "earned" ? "+" : "−"}{Math.abs(tx.amount).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
