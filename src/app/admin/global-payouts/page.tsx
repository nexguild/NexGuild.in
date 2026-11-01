"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, RefreshCw, Search, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { GLOBAL_PAYOUT_METHODS, type GlobalPayoutMethod } from "@/lib/global-payout";

interface PayoutRequest {
  id: string;
  contributor_id: string;
  coins_requested: number;
  usdt_amount: number;
  payout_method: GlobalPayoutMethod;
  destination: string;
  status: "pending" | "under_review" | "paid" | "rejected";
  payment_reference: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_STYLES: Record<PayoutRequest["status"], string> = {
  pending: "bg-amber-500/10 text-amber-400",
  under_review: "bg-blue-500/10 text-blue-400",
  paid: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
};

export default function GlobalPayoutsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.FINANCE);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reference, setReference] = useState<Record<string, string>>({});
  const [reason, setReason] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to load payout requests.");
      const response = await fetch("/api/admin/global-payouts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json() as { requests?: PayoutRequest[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load payout requests.");
      setRequests(data.requests ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load payout requests.";
      console.error("[admin/global-payouts] load failed:", message);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function copyDestination(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1500);
    } catch (error) {
      console.error("[admin/global-payouts] destination copy failed:", error);
      setErrors((previous) => ({ ...previous, [id]: "Could not copy destination. Select and copy it manually." }));
    }
  }

  async function update(request: PayoutRequest, action: "paid" | "rejected" | "under_review") {
    if (action === "paid" && !reference[request.id]?.trim()) {
      setErrors((previous) => ({ ...previous, [request.id]: "Payment reference is required." }));
      return;
    }
    if (action === "rejected" && !reason[request.id]?.trim()) {
      setErrors((previous) => ({ ...previous, [request.id]: "Rejection reason is required." }));
      return;
    }

    setBusy(request.id);
    setErrors((previous) => ({ ...previous, [request.id]: "" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again before updating a payout.");
      const response = await fetch("/api/admin/global-payouts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: request.id,
          action,
          paymentReference: reference[request.id],
          rejectionReason: reason[request.id],
          adminNotes: notes[request.id],
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to update payout.");
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update payout.";
      setErrors((previous) => ({ ...previous, [request.id]: message }));
    } finally {
      setBusy(null);
    }
  }

  const visible = requests.filter((request) => {
    const term = search.trim().toLowerCase();
    return !term
      || request.profiles?.full_name?.toLowerCase().includes(term)
      || request.profiles?.email?.toLowerCase().includes(term)
      || request.destination.toLowerCase().includes(term)
      || request.payout_method.toLowerCase().includes(term);
  });

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payouts</h1>
          <p className="text-sm text-[var(--text-secondary)]">New requests for Binance Pay, USDT TRC20, BEP20, and ERC20. Rejections refund reserved NexCoins.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
          </button>
        </div>
      </div>

      <label className="flex h-10 max-w-md items-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-3">
        <Search className="h-4 w-4 text-[var(--text-muted)]" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contributor, method, or destination" className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none" />
      </label>

      {loadError && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadError}</div>}
      {loading ? <div className="h-24 animate-pulse rounded-lg bg-[var(--surface-card)]" /> : loadError ? null : visible.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 text-center text-[var(--text-secondary)]">No payout requests found.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((request) => {
            const methodLabel = GLOBAL_PAYOUT_METHODS.find((method) => method.value === request.payout_method)?.label ?? request.payout_method;
            const open = request.status === "pending" || request.status === "under_review";
            return (
              <article key={request.id} className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-[var(--brand-500)]" />
                      <p className="font-semibold text-[var(--text-primary)]">{request.profiles?.full_name ?? "Unknown contributor"}</p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{request.profiles?.email ?? "—"}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--text-primary)]">{request.usdt_amount} USDT · {methodLabel}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{request.coins_requested.toLocaleString()} NexCoins</p>
                    <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[request.status]}`}>{request.status.replace("_", " ")}</span>
                  </div>
                </div>

                <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Payout destination</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="min-w-0 flex-1 break-all font-mono text-sm text-[var(--text-primary)]">{request.destination}</p>
                      <button type="button" onClick={() => void copyDestination(request.id, request.destination)} aria-label="Copy payout destination" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--brand-500)]/15 hover:text-[var(--brand-500)]">
                        {copied === request.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <label className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Admin notes
                    <input value={notes[request.id] ?? request.admin_notes ?? ""} onChange={(event) => setNotes((previous) => ({ ...previous, [request.id]: event.target.value }))} maxLength={1000} disabled={!open} className="mt-1 h-8 w-full bg-transparent text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none disabled:opacity-60" />
                  </label>
                </div>

                {request.payment_reference && <p className="px-5 pb-2 text-xs text-[var(--text-secondary)]">Payment reference: {request.payment_reference}</p>}
                {request.rejection_reason && <p className="px-5 pb-2 text-xs text-red-400">Rejection reason: {request.rejection_reason}</p>}

                {open && (
                  <div className="space-y-3 border-t border-[var(--border-default)] px-5 py-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-medium text-[var(--text-secondary)]">
                        Payment reference (required to mark paid)
                        <input value={reference[request.id] ?? ""} onChange={(event) => setReference((previous) => ({ ...previous, [request.id]: event.target.value }))} maxLength={200} className="mt-1 h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-500)]" />
                      </label>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">
                        Rejection reason (required to reject)
                        <input value={reason[request.id] ?? ""} onChange={(event) => setReason((previous) => ({ ...previous, [request.id]: event.target.value }))} maxLength={500} className="mt-1 h-9 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-500)]" />
                      </label>
                    </div>
                    {errors[request.id] && <p className="text-sm text-red-400">{errors[request.id]}</p>}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busy === request.id} onClick={() => void update(request, "under_review")} className="h-9 rounded-md border border-[var(--border-default)] px-3 text-sm font-semibold text-[var(--text-primary)] disabled:opacity-50">
                        {busy === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark under review"}
                      </button>
                      <button type="button" disabled={busy === request.id} onClick={() => void update(request, "paid")} className="h-9 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-50">Mark paid</button>
                      <button type="button" disabled={busy === request.id} onClick={() => void update(request, "rejected")} className="h-9 rounded-md bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-50">Reject and refund</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
