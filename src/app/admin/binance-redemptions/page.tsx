"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle, Copy, Loader2, Search, UserRound, WalletCards, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Request {
  id: string;
  contributor_id: string;
  coins_requested: number;
  usdt_amount: number;
  binance_uid: string;
  binance_username: string;
  status: string;
  payment_reference: string | null;
  rejection_reason: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  under_review: "bg-blue-500/10 text-blue-400",
  paid: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

function CopyField({
  label,
  value,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copyKey: string;
  copied: string;
  onCopy: (key: string, value: string) => void;
}) {
  const isCopied = copied === copyKey;
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text-primary)]">{value}</p>
        <button
          type="button"
          onClick={() => onCopy(copyKey, value.replace(/^@/, ""))}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--brand-500)]/15 hover:text-[var(--brand-500)]"
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
        >
          {isCopied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      {isCopied && <p className="mt-1 text-[10px] font-medium text-green-400">Copied</p>}
    </div>
  );
}

export default function BinanceRedemptionsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.FINANCE);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reference, setReference] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    setLoadError("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/binance-redemptions", { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} });
    const data = await res.json() as { requests?: Request[]; error?: string };
    if (res.ok) setRequests(data.requests ?? []);
    else setLoadError(data.error ?? "Unable to load redemption requests.");
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function copyValue(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function update(request: Request, action: "paid" | "rejected" | "under_review") {
    if (action === "paid" && !reference[request.id]?.trim()) return setError((p) => ({ ...p, [request.id]: "Payment reference is required." }));
    if (action === "rejected" && !reason[request.id]?.trim()) return setError((p) => ({ ...p, [request.id]: "Rejection reason is required." }));
    setBusy(request.id);
    setError((p) => ({ ...p, [request.id]: "" }));
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/binance-redemptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ id: request.id, action, paymentReference: reference[request.id], rejectionReason: reason[request.id] }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) setError((p) => ({ ...p, [request.id]: data.error ?? "Update failed." }));
    else await load();
    setBusy(null);
  }

  const visible = requests.filter((r) => {
    const term = search.toLowerCase();
    return !term || r.profiles?.full_name?.toLowerCase().includes(term) || r.profiles?.email?.toLowerCase().includes(term) || r.binance_uid.toLowerCase().includes(term);
  });

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Binance Pay Redemptions</h1>
        <p className="text-sm text-[var(--text-secondary)]">Review manual USDT payouts and keep the NexCoin ledger auditable.</p>
      </div>
      <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] max-w-sm">
        <Search className="h-4 w-4 text-[var(--text-muted)]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contributor or UID…" className="flex-1 bg-transparent text-sm text-[var(--text-primary)] focus:outline-none" />
      </div>
      {loadError && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadError}</div>}
      {loading ? <div className="h-24 rounded-lg bg-[var(--surface-card)] animate-pulse" /> : loadError ? null : visible.length === 0 ? <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 text-center text-[var(--text-secondary)]">No redemption requests.</div> : (
        <div className="space-y-3">
          {visible.map((request) => (
            <div key={request.id} className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
              <div className="border-b border-[var(--border-default)] bg-gradient-to-r from-[#17130a] to-[var(--surface-card)] px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-[var(--brand-500)]" />
                    <p className="font-semibold text-[var(--text-primary)]">{request.profiles?.full_name ?? "Unknown contributor"}</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">{request.profiles?.email ?? "—"}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[request.status] ?? ""}`}>{request.status.replace("_", " ")}</span>
              </div>
              </div>
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
                <CopyField label="Binance UID" value={request.binance_uid} copyKey={`${request.id}-uid`} copied={copied} onCopy={copyValue} />
                <CopyField label="Binance username" value={`@${request.binance_username}`} copyKey={`${request.id}-username`} copied={copied} onCopy={copyValue} />
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Payout</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]"><WalletCards className="h-3.5 w-3.5 text-[var(--brand-500)]" /> {request.usdt_amount} USDT</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{request.coins_requested.toLocaleString()} NexCoins · {new Date(request.created_at).toLocaleString("en-IN")}</p>
                </div>
              </div>
              {request.status === "pending" || request.status === "under_review" ? (
                <div className="border-t border-[var(--border-default)] px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Complete this payout</p>
                  <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input value={reference[request.id] ?? ""} onChange={(e) => setReference((p) => ({ ...p, [request.id]: e.target.value }))} placeholder="Required Binance transaction reference" className="h-9 min-w-[260px] flex-1 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] focus:outline-none" />
                    <button onClick={() => update(request, "paid")} disabled={busy === request.id} className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === request.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />} Mark Paid</button>
                    {request.status === "pending" && <button onClick={() => update(request, "under_review")} disabled={busy === request.id} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Under Review</button>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input value={reason[request.id] ?? ""} onChange={(e) => setReason((p) => ({ ...p, [request.id]: e.target.value }))} placeholder="Required reason when rejecting" className="h-9 min-w-[260px] flex-1 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] focus:outline-none" />
                    <button onClick={() => update(request, "rejected")} disabled={busy === request.id} className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /> Reject and Refund</button>
                  </div>
                  {error[request.id] && <p className="text-xs text-red-400">{error[request.id]}</p>}
                  </div>
                </div>
              ) : request.status === "paid" ? <div className="border-t border-[var(--border-default)] px-5 py-3"><CopyField label="Transaction reference" value={request.payment_reference ?? "—"} copyKey={`${request.id}-reference`} copied={copied} onCopy={copyValue} /></div> : <p className="border-t border-[var(--border-default)] px-5 py-3 text-xs text-red-400">Reason: {request.rejection_reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
