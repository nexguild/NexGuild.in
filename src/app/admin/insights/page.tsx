"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, TrendingUp, Coins, Users, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Anomaly {
  id: string;
  name: string;
  email: string;
  amount: number;
}

interface TopEarner {
  id: string;
  name: string;
  email: string;
  coins: number;
}

interface OfferwallStat {
  slug: string;
  totalCoins: number;
  txCount: number;
  uniqueUsers: number;
  top5: TopEarner[];
}

interface InsightsData {
  platformAvgToday: number;
  totalEarnersToday: number;
  anomalies: Anomaly[];
  offerwallStats: OfferwallStat[];
}

export default function InsightsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.USERS);
  const tokenRef = useRef<string | null>(null);
  const [data, setData]       = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchInsights() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    tokenRef.current = session?.access_token ?? null;
    const res = await fetch("/api/admin/insights", {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.ok) setData(await res.json() as InsightsData);
    setLoading(false);
  }

  useEffect(() => { fetchInsights(); }, []);

  if (!allowed) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Insights</h1>
          <p className="text-sm text-[var(--text-secondary)]">Earnings anomalies and offerwall performance.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchInsights} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Earners Today",
            value: loading ? "—" : (data?.totalEarnersToday ?? 0).toLocaleString(),
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Avg Earned Today",
            value: loading ? "—" : `${(data?.platformAvgToday ?? 0).toLocaleString()} NC`,
            icon: <TrendingUp className="h-4 w-4" />,
          },
          {
            label: "Flagged Accounts",
            value: loading ? "—" : (data?.anomalies.length ?? 0).toLocaleString(),
            icon: <AlertTriangle className="h-4 w-4" />,
            warn: (data?.anomalies.length ?? 0) > 0,
          },
          {
            label: "Offerwall Providers",
            value: loading ? "—" : (data?.offerwallStats.length ?? 0).toLocaleString(),
            icon: <Coins className="h-4 w-4" />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-5 flex flex-col gap-3 ${card.warn ? "border-amber-500/40 bg-amber-500/5" : "border-[var(--border-default)] bg-[var(--surface-card)]"}`}
          >
            <div className={`flex items-center justify-between ${card.warn ? "text-amber-400" : "text-[var(--brand-500)]"}`}>
              <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{card.label}</span>
              {card.icon}
            </div>
            <p className={`text-2xl font-bold ${card.warn ? "text-amber-400" : "text-[var(--text-primary)]"}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Anomaly detection ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h2 className="font-semibold text-[var(--text-primary)]">Earnings Anomalies — Today</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">Accounts earning ≥ 3× platform average</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded bg-[var(--surface-subtle)] animate-pulse" />)}
          </div>
        ) : !data || data.anomalies.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">
            No anomalies today — platform earnings look normal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                  {["#", "Name", "Email", "Earned Today", "vs. Avg"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {data.anomalies.map((a, i) => (
                  <tr key={a.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{a.name}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{a.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-amber-400 font-semibold">{a.amount.toLocaleString()} NC</span>
                    </td>
                    <td className="px-4 py-3">
                      {data.platformAvgToday > 0 ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          {(a.amount / data.platformAvgToday).toFixed(1)}×
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Offerwall summary ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2">
          <Coins className="h-4 w-4 text-[var(--brand-500)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">Offerwall Earning Summary</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">All-time per provider</span>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-[var(--surface-subtle)] animate-pulse" />)}
          </div>
        ) : !data || data.offerwallStats.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">No approved offerwall transactions yet.</div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {data.offerwallStats.map((stat) => (
              <div key={stat.slug}>
                {/* Provider row */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-subtle)] transition-colors text-left"
                  onClick={() => setExpanded(expanded === stat.slug ? null : stat.slug)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[var(--text-primary)] capitalize">{stat.slug}</span>
                      <span className="text-xs text-[var(--text-muted)]">{stat.txCount.toLocaleString()} transactions · {stat.uniqueUsers.toLocaleString()} users</span>
                    </div>
                  </div>
                  <span className="text-[var(--brand-500)] font-bold text-sm whitespace-nowrap">
                    {stat.totalCoins.toLocaleString()} NC total
                  </span>
                  {expanded === stat.slug
                    ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                  }
                </button>

                {/* Top earners expand */}
                {expanded === stat.slug && (
                  <div className="px-5 pb-4 bg-[var(--surface-subtle)]">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 pt-2">Top earners</p>
                    <div className="space-y-2">
                      {stat.top5.map((u, i) => (
                        <div key={u.id} className="flex items-center gap-3">
                          <span className="text-xs text-[var(--text-muted)] w-4 flex-shrink-0">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-[var(--text-primary)] font-medium truncate">{u.name}</span>
                            <span className="text-xs text-[var(--text-muted)] ml-2">{u.email}</span>
                          </div>
                          <span className="text-sm font-semibold text-[var(--brand-500)] whitespace-nowrap">{u.coins.toLocaleString()} NC</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
