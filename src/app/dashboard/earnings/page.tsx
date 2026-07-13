"use client";

import { useEffect, useState } from "react";
import { ReceiptText, TrendingUp, Download } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
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

type SourceFilter = "all" | "task" | "offerwall" | "streak_bonus" | "nexleader_commission";
type DateRange    = "week" | "month" | "all" | "custom";

const SOURCE_LABELS: Record<SourceFilter, string> = {
  all:                  "All Sources",
  task:                 "Tasks",
  offerwall:            "Offerwall",
  streak_bonus:         "Streak Bonus",
  nexleader_commission: "NexLeader Commission",
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
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.6" />
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
  const pendingCoins = pending.reduce((s, p) => s + (p.tasks?.pay_per_task != null ? Math.floor(p.tasks.pay_per_task * 0.66) : 0), 0);

  const filtered    = applyFilters(transactions, sourceFilter, dateRange, customFrom, customTo);
  const chartData   = buildChartData(transactions, chartRange);

  const activePill   = "text-white shadow-sm";
  const inactivePill = "bg-slate-100 text-slate-500 hover:bg-slate-200";
  const pillBase     = "px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap";

  return (
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white/70" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">NexCoins</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-1">Earnings</h1>
            <p className="text-sm text-white/75">Your complete NexCoins earning history.</p>
          </div>
          {!loading && (
            <div className="flex-shrink-0 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-center">
              <p className="text-xs text-white/70 mb-0.5">Balance</p>
              <p className="text-xl font-extrabold text-white">🪙 {nexcoins.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <NexCoinIcon size={14} />
            <span className="text-xs text-slate-400">Total Earned</span>
          </div>
          <p className="text-xl font-extrabold text-slate-800">{loading ? "—" : totalEarned.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-slate-400">NexCoins</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs text-amber-600">Pending</span>
          </div>
          <p className="text-xl font-extrabold text-amber-700">{loading ? "—" : pendingCoins.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-amber-500">Awaiting approval</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <ReceiptText className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs text-green-600">Transactions</span>
          </div>
          <p className="text-xl font-extrabold text-green-700">{loading ? "—" : transactions.length}</p>
          <p className="mt-0.5 text-xs text-green-500">All time</p>
        </div>
      </div>

      {/* ── CHART ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
              <NexCoinIcon size={14} />
            </div>
            <h2 className="font-bold text-slate-800">Earnings Overview</h2>
          </div>
          <div className="flex gap-1.5">
            {(["week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`${pillBase} ${chartRange === r ? activePill : inactivePill}`}
                style={chartRange === r ? { background: "linear-gradient(135deg, #6366f1, #14b8a6)" } : undefined}
              >
                {r === "week" ? "This Week" : r === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <EarningsBarChart data={chartData} />
        )}
      </div>

      {/* ── PENDING SUBMISSIONS ───────────────────────────────────── */}
      {!loading && pending.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div
            className="border-b border-amber-50 px-5 py-4"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))" }}
          >
            <h2 className="font-bold text-slate-800">Pending Review</h2>
            <p className="mt-0.5 text-xs text-slate-400">These submissions are awaiting admin approval.</p>
          </div>
          <ul className="divide-y divide-slate-50">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{p.tasks?.title ?? "Task"}</p>
                  <p className="text-xs text-slate-400">
                    Submitted {new Date(p.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2.5">
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-600">
                    Under Review
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                    +<NexCoinIcon size={13} />{(p.tasks?.pay_per_task != null ? Math.floor(p.tasks.pay_per_task * 0.66) : 0).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── FILTERS + HISTORY ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div
          className="space-y-3 border-b border-slate-50 px-5 py-4"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(20,184,166,0.02))" }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-bold text-slate-800">Earned History</h2>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={loading || filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>

          {/* Source filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", "task", "offerwall", "streak_bonus", "nexleader_commission"] as SourceFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`${pillBase} ${sourceFilter === s ? activePill : inactivePill}`}
                style={sourceFilter === s ? { background: "linear-gradient(135deg, #6366f1, #14b8a6)" } : undefined}
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
                className={`${pillBase} ${dateRange === r ? activePill : inactivePill}`}
                style={dateRange === r ? { background: "linear-gradient(135deg, #6366f1, #14b8a6)" } : undefined}
              >
                {DATE_LABELS[r]}
              </button>
            ))}
            {dateRange === "custom" && (
              <div className="mt-1.5 flex w-full items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}
          </div>

          {/* Result count */}
          {!loading && (
            <p className="text-xs text-slate-400">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-semibold text-indigo-600">
                {filtered.reduce((s, t) => s + t.amount, 0).toLocaleString()} NexCoins
              </span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-48 rounded-full bg-slate-100 animate-pulse" />
                  <div className="h-2 w-28 rounded-full bg-slate-100 animate-pulse" />
                </div>
                <div className="h-5 w-20 rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <ReceiptText className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="mb-1 font-bold text-slate-700">
                {transactions.length === 0 ? "No earnings yet" : "No transactions match"}
              </p>
              <p className="text-sm text-slate-400">
                {transactions.length === 0
                  ? "Complete and get tasks approved to earn NexCoins."
                  : "Try adjusting the source or date filter."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {filtered.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {t.description ?? t.source ?? "Task Reward"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {t.source && <span> · {SOURCE_LABELS[t.source as SourceFilter] ?? t.source}</span>}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2.5">
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">
                    Confirmed
                  </span>
                  <span className="flex items-center gap-1 text-sm font-bold text-green-600">
                    +<NexCoinIcon size={13} />{t.amount.toLocaleString()}
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
