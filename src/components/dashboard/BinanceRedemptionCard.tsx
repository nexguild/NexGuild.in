"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDollarSign, Clock3, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { supabase } from "@/lib/supabase";

const REDEMPTION_PACKAGES = [
  { coins: 10_000, usdt: 10 },
  { coins: 20_000, usdt: 20 },
  { coins: 50_000, usdt: 50 },
];

interface Redemption {
  id: string;
  coins_requested: number;
  usdt_amount: number;
  binance_uid: string;
  binance_username: string;
  status: string;
  payment_reference: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export function BinanceRedemptionCard({ nexcoins, onBalanceChange }: { nexcoins: number; onBalanceChange: (balance: number) => void }) {
  const [coins, setCoins] = useState("10000");
  const [uid, setUid] = useState("");
  const [username, setUsername] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [requests, setRequests] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadRequests() {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/redemptions/binance-pay", {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (res.ok) setRequests((await res.json() as { requests: Redemption[] }).requests ?? []);
    setLoading(false);
  }

  useEffect(() => { loadRequests(); }, []);

  const coinAmount = Number(coins);
  const selectedPackage = REDEMPTION_PACKAGES.find((item) => item.coins === coinAmount);
  const usdtAmount = selectedPackage?.usdt ?? 0;
  const canSubmit = coinAmount >= 10000 && coinAmount % 1000 === 0 && coinAmount <= nexcoins && uid.trim() && username.trim() && confirmed;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setMessage(null);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/redemptions/binance-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ coinsRequested: coinAmount, binanceUid: uid, binanceUsername: username, confirmation: confirmed }),
    });
    const data = await res.json() as { error?: string; request?: Redemption };
    if (!res.ok) {
      setMessage(data.error ?? "Could not submit redemption.");
    } else {
      setMessage("Redemption submitted. Finance will review it within 24–48 hours.");
      onBalanceChange(nexcoins - coinAmount);
      setUid("");
      setUsername("");
      setConfirmed(false);
      await loadRequests();
    }
    setSubmitting(false);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-teal-100/60 blur-3xl" />
      <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-teal-200 ring-1 ring-white/20">
              <CircleDollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-white">Redeem via Binance Pay</h2>
              <p className="mt-0.5 text-sm text-slate-300">Convert your NexCoins into USDT.</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-300/20 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5" /> Manual review
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:max-w-md">
          <div className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Rate</p>
            <p className="mt-0.5 text-sm font-bold text-white">1,000 = $1</p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Minimum</p>
            <p className="mt-0.5 text-sm font-bold text-white">$10 USDT</p>
          </div>
          <div className="rounded-xl bg-white/10 px-2 py-2.5 ring-1 ring-white/10">
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Processing</p>
            <p className="mt-0.5 text-sm font-bold text-white">24–48 hrs</p>
          </div>
        </div>
      </div>
      <div className="relative space-y-4 p-5 sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Choose your payout</p>
            <p className="mt-0.5 text-xs text-slate-500">Select a package that matches your balance.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            {(nexcoins ?? 0).toLocaleString()} coins
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {REDEMPTION_PACKAGES.map((item) => {
            const selected = item.coins === coinAmount;
            const affordable = item.coins <= nexcoins;
            return (
              <button
                key={item.coins}
                type="button"
                onClick={() => setCoins(String(item.coins))}
                disabled={!affordable}
                className={`rounded-2xl border px-2 py-3 text-center transition-all ${
                  selected
                    ? "border-teal-500 bg-teal-50 shadow-[0_0_0_3px_rgba(20,184,166,0.12)]"
                    : affordable
                      ? "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50"
                      : "cursor-not-allowed border-slate-100 bg-slate-50 opacity-45"
                }`}
              >
                <span className={`block text-lg font-extrabold ${selected ? "text-teal-700" : "text-slate-800"}`}>${item.usdt}</span>
                <span className="mt-0.5 block text-[11px] font-medium text-slate-500">{item.coins.toLocaleString()} coins</span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs text-slate-500">You will receive</p>
            <p className="mt-1 text-xl font-extrabold text-teal-700">{usdtAmount > 0 ? `${usdtAmount} USDT` : "—"}</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs text-slate-500">Coins reserved</p>
            <p className="mt-1 text-xl font-extrabold text-slate-800">{coinAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Binance UID
            <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Enter your Binance UID" className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
          </label>
          <label className="text-sm font-medium text-slate-700">Binance username
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your Binance username" className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-800 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
          </label>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5 text-xs leading-5 text-amber-800">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 accent-teal-600" />
          <span>I confirm that my Binance UID and username are correct. Incorrect details may delay or prevent payment.</span>
        </div>
        {message && <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600 ring-1 ring-slate-100">{message}</p>}
        <button disabled={!canSubmit || submitting} onClick={submit} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:from-teal-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:w-fit">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />} Submit redemption
        </button>
        <div className="border-t border-slate-100 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-bold text-slate-700">Your redemption history</p>
          </div>
          {loading ? <p className="text-sm text-slate-400">Loading…</p> : requests.length === 0 ? <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-400">No requests yet. Your submitted redemptions will appear here.</p> : (
            <div className="space-y-2">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-sm">
                  <span className="text-slate-600">{request.coins_requested.toLocaleString()} coins · {request.usdt_amount} USDT</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${request.status === "paid" ? "bg-emerald-100 text-emerald-700" : request.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{request.status === "paid" && <CheckCircle2 className="h-3.5 w-3.5" />}{request.status}</span>
                  {request.rejection_reason && <span className="basis-full text-xs text-red-600">Reason: {request.rejection_reason}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
