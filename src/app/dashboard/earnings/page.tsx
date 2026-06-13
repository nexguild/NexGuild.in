import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";
import type { BadgeVariant } from "@/components/ui/badge";

const TRANSACTIONS = [
  { date: "Jun 12, 2025", source: "Consumer Habits Survey",    type: "Task",     amount: 1.20, status: "confirmed" },
  { date: "Jun 11, 2025", source: "CPX Research",              type: "Offerwall",amount: 0.85, status: "confirmed" },
  { date: "Jun 11, 2025", source: "Audio Clip Transcription",  type: "Task",     amount: 0.90, status: "pending" },
  { date: "Jun 10, 2025", source: "Brand Awareness Study",     type: "Task",     amount: 0.60, status: "confirmed" },
  { date: "Jun 9, 2025",  source: "Recipe Article Writing",    type: "Task",     amount: 3.50, status: "confirmed" },
  { date: "Jun 8, 2025",  source: "Lootably",                  type: "Offerwall",amount: 1.20, status: "confirmed" },
  { date: "Jun 7, 2025",  source: "Text Sentiment Task",       type: "Task",     amount: 0.04, status: "rejected" },
  { date: "Jun 6, 2025",  source: "PayPal Withdrawal",         type: "Withdrawal",amount: -20.00, status: "completed" },
];

const statusVariants: Record<string, BadgeVariant> = {
  confirmed: "success",
  pending:   "warning",
  rejected:  "danger",
  completed: "neutral",
};

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Earnings</h1>
          <p className="text-sm text-[var(--text-secondary)]">Your complete transaction history.</p>
        </div>
        <Button variant="secondary" size="sm">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Earned" value={formatCurrency(214.60)} />
        <StatCard label="Total Withdrawn" value={formatCurrency(176.15)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {["Date Range", "Type", "Status"].map((f) => (
          <select
            key={f}
            className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
          >
            <option>{f}</option>
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Date</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Source</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Type</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--text-secondary)]">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {TRANSACTIONS.map((tx, i) => (
              <tr key={i} className="hover:bg-[var(--surface-subtle)] transition-colors">
                <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{tx.date}</td>
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{tx.source}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{tx.type}</td>
                <td className={`px-4 py-3 text-right font-semibold ${tx.amount < 0 ? "text-[var(--danger-text)]" : "text-[var(--success-text)]"}`}>
                  {tx.amount < 0 ? `-${formatCurrency(Math.abs(tx.amount))}` : `+${formatCurrency(tx.amount)}`}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariants[tx.status]}>{tx.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
