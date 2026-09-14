"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, WalletCards } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  const coinAmount = Number(coins) || 0;
  const usdtAmount = coinAmount / 1000;
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
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl">₮</div>
        <div>
          <h2 className="font-bold text-slate-800">Redeem via Binance Pay</h2>
          <p className="text-sm text-slate-500">Receive USDT through a manual finance payout.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-slate-600">NexCoins
          <input value={coins} onChange={(e) => setCoins(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-slate-800 focus:border-teal-500 focus:outline-none" />
        </label>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">You receive<div className="font-bold text-slate-800">{usdtAmount > 0 ? `${usdtAmount} USDT` : "—"}</div></div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Minimum<div className="font-bold text-slate-800">10 USDT</div></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mt-3">
        <label className="text-sm text-slate-600">Binance UID
          <input value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Your Binance UID" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-slate-800 focus:border-teal-500 focus:outline-none" />
        </label>
        <label className="text-sm text-slate-600">Binance username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your Binance username" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-slate-800 focus:border-teal-500 focus:outline-none" />
        </label>
      </div>
      <label className="mt-3 flex items-start gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
        I confirm that my Binance UID and username are correct. Incorrect details may delay or prevent payment.
      </label>
      {message && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>}
      <button disabled={!canSubmit || submitting} onClick={submit} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />} Submit redemption
      </button>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">Your Binance Pay redemptions</p>
        {loading ? <p className="text-sm text-slate-400">Loading…</p> : requests.length === 0 ? <p className="text-sm text-slate-400">No requests yet.</p> : (
          <div className="space-y-2">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">{request.coins_requested.toLocaleString()} coins · {request.usdt_amount} USDT</span>
                <span className="inline-flex items-center gap-1 font-semibold capitalize text-slate-700">{request.status === "paid" && <CheckCircle2 className="h-4 w-4 text-green-500" />}{request.status}</span>
                {request.rejection_reason && <span className="basis-full text-xs text-red-600">Reason: {request.rejection_reason}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
