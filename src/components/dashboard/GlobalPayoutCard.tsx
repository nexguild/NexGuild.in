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
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  under_review: "border-blue-200 bg-blue-50 text-blue-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
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
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="relative border-b border-[var(--border-default)] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-5 py-5 text-white sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-teal-200 ring-1 ring-white/15">
              <Globe2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold">Global USDT payouts</h2>
              <p className="mt-0.5 text-sm text-slate-300">Choose a payout rail and submit a request for finance review.</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/20 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Manual review
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:max-w-md">
          <div className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Rate</p>
            <p className="mt-0.5 text-sm font-bold text-white">1,000 = 1 USDT</p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Minimum</p>
            <p className="mt-0.5 text-sm font-bold text-white">10 USDT</p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Processing</p>
            <p className="mt-0.5 text-sm font-bold text-white">Manual</p>
          </div>
        </div>
      </div>

      <div className="relative space-y-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Choose payout amount</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Your selected NexCoins are reserved while the request is open.</p>
          </div>
          <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)]">
            {formatNexcoins(nexcoins)} coins available
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {GLOBAL_PAYOUT_PACKAGES.map((item) => {
            const selected = item.coins === coins;
            const affordable = item.coins <= nexcoins;
            return (
              <button
                key={item.coins}
                type="button"
                onClick={() => setCoins(item.coins)}
                disabled={!affordable}
                className={`rounded-2xl border px-2 py-3 text-center transition-all ${
                  selected
                    ? "border-teal-500 bg-teal-500/10 shadow-[0_0_0_3px_rgba(20,184,166,0.12)]"
                    : affordable
                      ? "border-[var(--border-default)] bg-[var(--surface-card)] hover:border-teal-400"
                      : "cursor-not-allowed border-[var(--border-default)] bg-[var(--surface-subtle)] opacity-45"
                }`}
              >
                <span className={`block text-lg font-extrabold ${selected ? "text-teal-600" : "text-[var(--text-primary)]"}`}>{item.usdt} USDT</span>
                <span className="mt-0.5 block text-[11px] font-medium text-[var(--text-secondary)]">{item.coins.toLocaleString()} coins</span>
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
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
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
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-teal-500"
            />
          </label>
        </div>

        <div className="rounded-2xl bg-[var(--surface-subtle)] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">You will receive</span>
            <strong className="text-lg text-[var(--text-primary)]">{selectedPackage?.usdt ?? 0} USDT</strong>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Coins reserved</span>
            <strong className="text-[var(--text-primary)]">{coins.toLocaleString()}</strong>
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs leading-5 text-[var(--text-secondary)]">
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
          Submit payout request
        </button>

        <div className="border-t border-[var(--border-default)] pt-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Payout history</p>
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
