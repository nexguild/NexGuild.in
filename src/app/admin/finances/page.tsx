"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, Coins, Gift, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface FinanceStat {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}

interface MonthBucket {
  month: string;
  earned: number;
  redeemed: number;
}

export default function FinancesPage() {
  const [loading, setLoading]             = useState(true);
  const [totalCoinsEarned, setTotalCoinsEarned]   = useState(0);
  const [totalCoinsRedeemed, setTotalCoinsRedeemed] = useState(0);
  const [totalApproved, setTotalApproved]         = useState(0);
  const [totalVouchers, setTotalVouchers]         = useState(0);
  const [totalDelivered, setTotalDelivered]       = useState(0);
  const [activeContributors, setActiveContributors] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [monthlyData, setMonthlyData]     = useState<MonthBucket[]>([]);

  useEffect(() => {
    async function load() {
      const [
        { data: earnedTxns },
        { data: redeemedTxns },
        { data: approvedSubs },
        { data: vouchers },
        { data: profiles },
        { data: pendingSubs },
      ] = await Promise.all([
        supabase.from("coin_transactions").select("amount").eq("type", "earned"),
        supabase.from("coin_transactions").select("amount").eq("type", "redeemed"),
        supabase.from("submissions").select("coins_awarded, submitted_at").eq("status", "approved"),
        supabase.from("voucher_requests").select("status, coins_spent, delivered_at"),
        supabase.from("profiles").select("id").eq("role", "contributor").eq("status", "active"),
        supabase.from("submissions").select("id").eq("status", "submitted"),
      ]);

      const earned   = (earnedTxns ?? []).reduce((s: number, t: { amount: number }) => s + (t.amount ?? 0), 0);
      const redeemed = (redeemedTxns ?? []).reduce((s: number, t: { amount: number }) => s + (t.amount ?? 0), 0);
      const approved = (approvedSubs ?? []).reduce((s: number, t: { coins_awarded: number | null }) => s + (t.coins_awarded ?? 0), 0);
      const vTotal   = vouchers?.length ?? 0;
      const vDelivered = (vouchers ?? []).filter((v: { status: string }) => v.status === "delivered").length;

      setTotalCoinsEarned(earned);
      setTotalCoinsRedeemed(redeemed);
      setTotalApproved(approved);
      setTotalVouchers(vTotal);
      setTotalDelivered(vDelivered);
      setActiveContributors(profiles?.length ?? 0);
      setPendingSubmissions(pendingSubs?.length ?? 0);

      // Build monthly buckets from approvedSubs and vouchers
      const buckets: Record<string, MonthBucket> = {};
      for (const sub of (approvedSubs ?? []) as { coins_awarded: number | null; submitted_at: string }[]) {
        const d     = new Date(sub.submitted_at);
        const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
        if (!buckets[key]) buckets[key] = { month: label, earned: 0, redeemed: 0 };
        buckets[key].earned += sub.coins_awarded ?? 0;
      }
      for (const v of (vouchers ?? []) as { status: string; coins_spent: number; delivered_at: string | null }[]) {
        if (v.status === "delivered" && v.delivered_at) {
          const d     = new Date(v.delivered_at);
          const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
          if (!buckets[key]) buckets[key] = { month: label, earned: 0, redeemed: 0 };
          buckets[key].redeemed += v.coins_spent ?? 0;
        }
      }
      const sorted = Object.keys(buckets).sort().slice(-6).map((k) => buckets[k]);
      setMonthlyData(sorted);
      setLoading(false);
    }
    load();
  }, []);

  const stats: FinanceStat[] = [
    {
      label: "Total Coins Issued",
      value: totalCoinsEarned.toLocaleString(),
      sub: "via approved task submissions",
      icon: <Coins className="h-5 w-5 text-[var(--brand-500)]" />,
    },
    {
      label: "Total Coins Redeemed",
      value: totalCoinsRedeemed.toLocaleString(),
      sub: "via voucher requests",
      icon: <Gift className="h-5 w-5 text-[var(--brand-500)]" />,
    },
    {
      label: "Vouchers Delivered",
      value: `${totalDelivered} / ${totalVouchers}`,
      sub: "delivered vs requested",
      icon: <CheckCircle2 className="h-5 w-5 text-green-400" />,
    },
    {
      label: "Active Contributors",
      value: activeContributors.toLocaleString(),
      sub: `${pendingSubmissions} submissions pending review`,
      icon: <Users className="h-5 w-5 text-[var(--brand-500)]" />,
    },
  ];

  const maxCoins = Math.max(...monthlyData.map((m) => Math.max(m.earned, m.redeemed)), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Finances</h1>
          <p className="text-sm text-[var(--text-secondary)]">NexCoins issued, redeemed, and platform overview.</p>
        </div>
        <Button variant="secondary" size="sm" disabled>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{s.label}</p>
                  {s.icon}
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
                {s.sub && <p className="text-xs text-[var(--text-muted)]">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Coin Balance */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">NexCoins Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-[var(--brand-500)]">{totalCoinsEarned.toLocaleString()}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Total Issued</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-400">{totalCoinsRedeemed.toLocaleString()}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Total Redeemed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-400">{(totalCoinsEarned - totalCoinsRedeemed).toLocaleString()}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Circulating</p>
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-6">Monthly Activity (last 6 months)</h2>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Coins className="h-8 w-8 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">No activity data yet. Approve submissions to see coins flow.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex gap-5 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand-500)] inline-block" /> Coins Issued</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-400 inline-block" /> Coins Redeemed</span>
                </div>
                <div className="space-y-3">
                  {monthlyData.map((m) => (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="w-24 flex-shrink-0">{m.month}</span>
                        <span className="text-[var(--brand-500)]">{m.earned.toLocaleString()} issued</span>
                        <span className="text-red-400">{m.redeemed.toLocaleString()} redeemed</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                            style={{ width: `${(m.earned / maxCoins) * 100}%` }}
                          />
                        </div>
                        <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-400 transition-all"
                            style={{ width: `${(m.redeemed / maxCoins) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
