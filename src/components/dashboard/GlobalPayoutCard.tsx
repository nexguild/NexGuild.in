"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Globe2, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatNexcoins } from "@/lib/nexcoins";
import {
  GLOBAL_PAYOUT_METHODS,
  GLOBAL_PAYOUT_PACKAGES,
  type GlobalPayoutMethod,
} from "@/lib/global-payout";

interface PayoutRequest {
  id: string;
  coins_requested: number;
  usdt_amount: number;
  payout_method: GlobalPayoutMethod;
  status: "pending" | "under_review" | "paid" | "rejected";
  payment_reference: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<PayoutRequest["status"], string> = {
  pending: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  under_review: "border-blue-400/25 bg-blue-400/10 text-blue-200",
  paid: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  rejected: "border-red-400/25 bg-red-400/10 text-red-200",
};

export function GlobalPayoutCard({
  nexcoins,
  onBalanceChange,
}: {
  nexcoins: number;
  onBalanceChange: (balance: number) => void;
}) {
  const [coins, setCoins] = useState<number>(GLOBAL_PAYOUT_PACKAGES[0].coins);
  const [method, setMethod] = useState<GlobalPayoutMethod>("binance_pay");
  const [destination, setDestination] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedPackage = GLOBAL_PAYOUT_PACKAGES.find((item) => item.coins === coins);
  const selectedMethod = GLOBAL_PAYOUT_METHODS.find((item) => item.value === method) ?? GLOBAL_PAYOUT_METHODS[0];
  const hasOpenRequest = requests.some((request) => request.status === "pending" || request.status === "under_review");

  async function loadRequests() {
    setLoadError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again to view payout history.");
      const response = await fetch("/api/global-payouts", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const data = await response.json() as { requests?: PayoutRequest[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load payout history.");
      setRequests(data.requests ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load payout history.";
      console.error("[global-payouts] history load failed:", message);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function submitRequest() {
    if (!selectedPackage || !destination.trim() || !confirmed || hasOpenRequest) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitted(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in again before requesting a payout.");
      const response = await fetch("/api/global-payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          coinsRequested: coins,
          payoutMethod: method,
          destination: destination.trim(),
          confirmation: confirmed,
        }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to submit your payout request.");
      onBalanceChange(nexcoins - coins);
      setDestination("");
      setConfirmed(false);
      setSubmitted(true);
      await loadRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit your payout request.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[0_16px_46px_rgba(0,0,0,0.2)]">
      <div aria-hidden className="absolute -right-10 -top-14 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="relative border-b border-white/10 bg-[linear-gradient(120deg,#101d31_0%,#102b3c_54%,#103d3c_100%)] px-5 py-6 text-white sm:px-8 sm:py-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] text-teal-200 shadow-inner">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-teal-200/80">Worldwide rewards</p>
              <h2 className="text-xl font-bold tracking-tight">Global USDT payouts</h2>
              <p className="mt-1 max-w-xl text-sm leading-5 text-slate-300">Turn NexCoins into a USDT payout using a supported payment method.</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Manual review
          </span>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2.5 text-center sm:max-w-lg">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Conversion</p>
            <p className="mt-1 text-sm font-bold text-white">1,000 = 1 USDT</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Minimum request</p>
            <p className="mt-1 text-sm font-bold text-white">10 USDT</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Review</p>
            <p className="mt-1 text-sm font-bold text-white">By finance</p>
          </div>
        </div>
      </div>

      <div className="relative space-y-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-base font-bold text-[var(--text-primary)]">Choose payout amount</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Your selected NexCoins are reserved while the request is open.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-bold text-[var(--text-primary)]">
            <WalletCards className="h-3.5 w-3.5 text-[var(--brand-400)]" /> {formatNexcoins(nexcoins)} coins available
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {GLOBAL_PAYOUT_PACKAGES.map((item) => {
            const selected = item.coins === coins;
            const affordable = item.coins <= nexcoins;
            return (
              <button
                key={item.coins}
                type="button"
                onClick={() => setCoins(item.coins)}
                disabled={!affordable}
                aria-pressed={selected}
                className={`rounded-2xl border px-2 py-3.5 text-center transition-all ${
                  selected
                    ? "border-teal-400/70 bg-teal-400/10 shadow-[0_0_0_2px_rgba(20,184,166,0.12)]"
                    : affordable
                      ? "border-[var(--border-default)] bg-[var(--surface-subtle)] hover:border-teal-400/60 hover:bg-teal-400/[0.04]"
                      : "cursor-not-allowed border-[var(--border-default)] bg-[var(--surface-subtle)] opacity-45"
                }`}
              >
                <span className={`block text-xl font-extrabold ${selected ? "text-teal-300" : "text-[var(--text-primary)]"}`}>{item.usdt} USDT</span>
                <span className="mt-1 block text-[11px] font-medium text-[var(--text-secondary)]">{item.coins.toLocaleString()} NexCoins</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Payout method
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as GlobalPayoutMethod)}
              className="payout-form-control mt-1 h-11 w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            >
              {GLOBAL_PAYOUT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {selectedMethod.destinationLabel}
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              autoComplete="off"
              maxLength={200}
              placeholder={method === "binance_pay" ? "Enter your Binance Pay UID" : "Paste the wallet address for this network"}
              className="payout-form-control mt-1 h-11 w-full rounded-xl border-2 border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[linear-gradient(120deg,var(--surface-subtle),var(--surface-card))] p-4 sm:p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Estimated payout</span>
            <strong className="text-xl text-teal-300">{selectedPackage?.usdt ?? 0} USDT</strong>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Coins reserved</span>
            <strong className="text-[var(--text-primary)]">{coins.toLocaleString()}</strong>
          </div>
        </div>

        <label className="flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 accent-teal-600" />
          <span>I confirm the payout method and destination are correct. Transfer availability, fees, identity checks, and local rules may vary; payouts are manually reviewed.</span>
        </label>

        {hasOpenRequest && <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-sm text-[var(--text-secondary)]">You already have a payout request awaiting review.</p>}
        {loadError && <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-500">{loadError}</p>}
        {submitError && <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-500">{submitError}</p>}
        {submitted && <p className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Request submitted for finance review.</p>}

        <button
          type="button"
          disabled={!selectedPackage || coins > nexcoins || !destination.trim() || !confirmed || hasOpenRequest || submitting}
          onClick={submitRequest}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand-600)] px-6 text-sm font-bold text-white shadow-[0_8px_22px_rgba(13,148,136,0.2)] transition hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
          Submit payout request
        </button>

        <div className="border-t border-[var(--border-default)] pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Recent payout requests</p>
          </div>
          {loading ? <p className="text-sm text-[var(--text-secondary)]">Loading payout history…</p> : requests.length === 0 ? (
            <p className="rounded-xl bg-[var(--surface-subtle)] px-3 py-3 text-sm text-[var(--text-secondary)]">Your submitted payout requests will appear here.</p>
          ) : (
            <div className="space-y-2">
              {requests.slice(0, 10).map((request) => {
                const methodLabel = GLOBAL_PAYOUT_METHODS.find((item) => item.value === request.payout_method)?.label ?? request.payout_method;
                return (
                  <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3.5 py-3">
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{request.usdt_amount} USDT · {methodLabel}</p>
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{request.coins_requested.toLocaleString()} NexCoins · {new Date(request.created_at).toLocaleDateString()}</p>
                      {request.payment_reference && <p className="mt-1 text-xs text-[var(--text-secondary)]">Reference: {request.payment_reference}</p>}
                      {request.rejection_reason && <p className="mt-1 text-xs text-red-500">Reason: {request.rejection_reason}</p>}
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[request.status]}`}>{request.status.replace("_", " ")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
