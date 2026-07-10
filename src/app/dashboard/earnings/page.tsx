"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ReceiptText, TrendingUp, Download } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";

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

type SourceFilter = "all" | "task" | "offerwall" | "streak_bonus";
type DateRange    = "week" | "month" | "all" | "custom";

const SOURCE_LABELS: Record<SourceFilter, string> = {
  all:          "All Sources",
  task:         "Tasks",
  offerwall:    "Offerwall",
  streak_bonus: "Streak Bonus",
};

const DATE_LABELS: Record<DateRange, string> = {
  week:   "This Week",
  month:  "This Month",
  all:    "All Time",
  custom: "Custom",
};

/* ─── Bar chart ──────────────────────────────────────────────────── */
function EarningsBarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-[var(--text-muted)]">
        No earnings in this period
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 500; const H = 90; const pad = 4;
  const barW = Math.max(4, ((W - 2 * pad) / data.length) * 0.65);
  const gap  = (W - 2 * pad) / data.length;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" preserveAspectRatio="none">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#02b491" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#02b491" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const x = pad + i * gap + gap / 2 - barW / 2;
          const barH = Math.max(2, ((d.value / max) * (H - pad - 4)));
          const y = H - pad - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="2" fill="url(#barGrad)" />
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-[var(--text-muted)]" style={{ width: `${100 / data.length}%`, textAlign: "center" }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Build chart buckets ────────────────────────────────────────── */
function buildChartData(
  txs: Transaction[],
  chartRange: "week" | "month" | "all"
): { label: string; value: number }[] {
  const now = new Date();

  if (chartRange === "week") {
    const buckets: { label: string; key: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key   = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      buckets.push({ label, key, value: 0 });
    }
    for (const t of txs) {
      const key = t.created_at.split("T")[0];
      const b = buckets.find((b) => b.key === key);
      if (b) b.value += t.amount;
    }
    return buckets;
  }

  if (chartRange === "month") {
    // Group by week within last 4 weeks
    const buckets: { label: string; from: Date; to: Date; value: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const to   = new Date(Date.now() - i * 7 * 86400000);
      const from = new Date(Date.now() - (i + 1) * 7 * 86400000);
      to.setHours(23, 59, 59);
      const label = from.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      buckets.push({ label, from, to, value: 0 });
    }
    for (const t of txs) {
      const d = new Date(t.created_at);
      const b = buckets.find((b) => d >= b.from && d <= b.to);
      if (b) b.value += t.amount;
    }
    return buckets;
  }

  // All time — last 12 months
  const buckets: { label: string; key: string; value: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    buckets.push({ label, key, value: 0 });
  }
  for (const t of txs) {
    const d   = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b   = buckets.find((b) => b.key === key);
    if (b) b.value += t.amount;
  }
  return buckets;
}

/* ─── Filter helpers ─────────────────────────────────────────────── */
function applyFilters(
  txs: Transaction[],
  source: SourceFilter,
  range: DateRange,
  customFrom: string,
  customTo: string
): Transaction[] {
  let out = txs;

  if (source !== "all") {
    out = out.filter((t) => t.source === source);
  }

  const now = new Date();
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    out = out.filter((t) => new Date(t.created_at) >= start);
  } else if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    out = out.filter((t) => new Date(t.created_at) >= start);
  } else if (range === "custom" && customFrom && customTo) {
    const from = new Date(customFrom + "T00:00:00");
    const to   = new Date(customTo   + "T23:59:59");
    out = out.filter((t) => {
      const d = new Date(t.created_at);
      return d >= from && d <= to;
    });
  }

  return out;
}

/* ─── CSV export ─────────────────────────────────────────────────── */
function exportCsv(txs: Transaction[]) {
  const rows: string[][] = [
    ["Date", "Description", "Source", "Type", "Amount (NexCoins)"],
    ...txs.map((t) => [
      new Date(t.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      t.description ?? t.source ?? "Task Reward",
      t.source ?? "",
      t.type === "earned" ? "Earned" : "Redeemed",
      String(t.amount),
    ]),
  ];
  const csv  = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `nexguild-earnings-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function EarningsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pending, setPending]           = useState<PendingSubmission[]>([]);
  const [nexcoins, setNexcoins]         = useState<number>(0);
  const [loading, setLoading]           = useState(true);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [dateRange, setDateRange]       = useState<DateRange>("all");
  const [customFrom, setCustomFrom]     = useState("");
  const [customTo, setCustomTo]         = useState("");
  const [chartRange, setChartRange]     = useState<"week" | "month" | "all">("week");

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

  const totalEarned  = transactions.reduce((s, t) => s + t.amount, 0);
  const pendingCoins = pending.reduce((s, p) => s + (p.tasks?.pay_per_task ?? 0), 0);

  const filtered    = applyFilters(transactions, sourceFilter, dateRange, customFrom, customTo);
  const chartData   = buildChartData(transactions, chartRange);

  const pillBase    = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap";
  const pillActive  = `${pillBase} bg-[var(--brand-500)] text-white`;
  const pillInactive= `${pillBase} bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Earnings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Your complete NexCoins earning history.</p>
      </div>

      {/* Stat cards */}
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

      {/* Earnings overview chart */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <NexCoinIcon size={16} />
            <h2 className="font-semibold text-[var(--text-primary)]">Earnings Overview</h2>
          </div>
          <div className="flex gap-1">
            {(["week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={chartRange === r ? pillActive : pillInactive}
              >
                {r === "week" ? "This Week" : r === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-24 rounded-lg bg-[var(--surface-subtle)] animate-pulse" />
        ) : (
          <EarningsBarChart data={chartData} />
        )}
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
                  <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                    +<NexCoinIcon size={13} className="opacity-80" />{(p.tasks?.pay_per_task ?? 0).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters + history */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-semibold text-[var(--text-primary)]">Earned History</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportCsv(filtered)}
              disabled={loading || filtered.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>

          {/* Source filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", "task", "offerwall", "streak_bonus"] as SourceFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={sourceFilter === s ? pillActive : pillInactive}
              >
                {SOURCE_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Date range filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "week", "month", "custom"] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={dateRange === r ? pillActive : pillInactive}
              >
                {DATE_LABELS[r]}
              </button>
            ))}
            {dateRange === "custom" && (
              <div className="flex items-center gap-2 mt-1.5 w-full">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 px-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
                />
                <span className="text-xs text-[var(--text-muted)]">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 px-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
                />
              </div>
            )}
          </div>

          {/* Result count */}
          {!loading && (
            <p className="text-xs text-[var(--text-muted)]">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} ·{" "}
              {filtered.reduce((s, t) => s + t.amount, 0).toLocaleString()} NexCoins
            </p>
          )}
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
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <ReceiptText className="h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-semibold text-[var(--text-primary)]">
              {transactions.length === 0 ? "No earnings yet" : "No transactions match these filters"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {transactions.length === 0
                ? "Complete and get tasks approved to earn NexCoins."
                : "Try adjusting the source or date filter."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {filtered.map((t) => (
              <li key={t.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {t.description ?? t.source ?? "Task Reward"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {t.source && <span> · {SOURCE_LABELS[t.source as SourceFilter] ?? t.source}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400">
                    Confirmed
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-green-400">
                    +<NexCoinIcon size={13} className="opacity-80" />{t.amount.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BlogTipCard
        slug="how-online-surveys-work-what-you-earn"
        title="How Online Surveys Work & What You Earn"
        excerpt="Understand survey payouts, disqualifications, and how to maximize earnings."
      />
    </div>
  );
}
