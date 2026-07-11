"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, TrendingUp, History, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import Link from "next/link";
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
  pending:    "bg-amber-100 text-amber-600",
  processing: "bg-blue-100 text-blue-600",
  delivered:  "bg-green-100 text-green-600",
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
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <NexCoinIcon size={16} />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Wallet</span>
            </div>
            <p className="mb-1 text-sm text-white/75">Available Balance</p>
            <p className="text-5xl font-extrabold text-white">
              {loading ? "—" : (nexcoins ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-white/60">NexCoins</p>
          </div>
          <Link
            href="/dashboard/store"
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/25"
          >
            <ShoppingBag className="h-4 w-4" /> Redeem in Store
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────── */}
      <div className="animate-fade-slide-up grid grid-cols-2 gap-3" style={{ animationDelay: "100ms" }}>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs text-green-600">Total Earned</span>
          </div>
          <p className="text-xl font-extrabold text-green-700">{loading ? "—" : totalEarned.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-green-500">From tasks &amp; offers</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-2 flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-xs text-indigo-600">Total Spent</span>
          </div>
          <p className="text-xl font-extrabold text-indigo-700">{loading ? "—" : totalSpent.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-indigo-400">Redeemed for vouchers</p>
        </div>
      </div>

      {/* ── VOUCHER REQUESTS ─────────────────────────────────────── */}
      {vouchers.length > 0 && (
        <div className="animate-fade-slide-up overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm" style={{ animationDelay: "150ms" }}>
          <div
            className="border-b border-slate-50 px-5 py-4"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(20,184,166,0.03))" }}
          >
            <h2 className="font-bold text-slate-800">Voucher Requests</h2>
          </div>
          <ul className="divide-y divide-slate-50">
            {vouchers.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{v.voucher_type}</p>
                  <p className="text-xs text-slate-400">
                    {v.coins_spent.toLocaleString()} coins ·{" "}
                    {new Date(v.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[v.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── TRANSACTION HISTORY ──────────────────────────────────── */}
      <div className="animate-fade-slide-up overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm" style={{ animationDelay: "200ms" }}>
        <div
          className="flex items-center gap-2 border-b border-slate-50 px-5 py-4"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(20,184,166,0.02))" }}
        >
          <History className="h-4 w-4 text-indigo-400" />
          <h2 className="font-bold text-slate-800">Transaction History</h2>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-40 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-2 w-24 animate-pulse rounded-full bg-slate-100" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <History className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="mb-1 font-bold text-slate-700">No transactions yet</p>
              <p className="text-sm text-slate-400">Complete tasks or offers to start earning NexCoins.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {transactions.map((tx) => {
              const isEarned = tx.type === "earned";
              return (
                <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50">
                  {/* Direction icon */}
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    isEarned ? "bg-green-100" : "bg-indigo-100"
                  }`}>
                    {isEarned
                      ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      : <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">
                      {tx.description ?? tx.source ?? tx.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {tx.source && <span> · {tx.source}</span>}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-sm font-bold ${isEarned ? "text-green-600" : "text-indigo-500"}`}>
                    {isEarned ? "+" : "−"}{Math.abs(tx.amount).toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
