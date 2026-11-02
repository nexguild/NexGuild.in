"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Clock, PackageCheck, Loader2, RefreshCw, Ticket, Eye, Lock, Ban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface VoucherRequest {
  id: string;
  voucher_type: string;
  coins_spent: number;
  charged_coins: number | null;
  status: string;
  voucher_code: string | null;
  requested_at: string;
  delivered_at: string | null;
  refund_reason: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
}

export default function MyVouchersPage() {
  const [requests, setRequests]     = useState<VoucherRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [revealed, setRevealed]     = useState<Record<string, boolean>>({});
  const [sparkling, setSparkling]   = useState<Record<string, boolean>>({});

  async function fetchRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("voucher_requests")
      .select("id, voucher_type, coins_spent, charged_coins, status, voucher_code, requested_at, delivered_at, refund_reason, refund_amount, refunded_at")
      .eq("contributor_id", user.id)
      .order("requested_at", { ascending: false });

    if (error) console.error("[my-vouchers] fetch error:", error.message);
    setRequests((data as VoucherRequest[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      await fetchRequests();
      if (cancelled) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`voucher_requests_page:${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "voucher_requests", filter: `contributor_id=eq.${user.id}` },
          (payload) => {
            setRequests((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as VoucherRequest) : r))
            );
          }
        )
        .subscribe();
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function revealCode(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: true }));
    setSparkling((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setSparkling((prev) => ({ ...prev, [id]: false })), 800);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchRequests();
  }

  const delivered = requests.filter((r) => r.status === "delivered");
  const pending   = requests.filter((r) => r.status === "pending" || r.status === "processing");
  const cancelled = requests.filter((r) => r.status === "cancelled");

  return (
    <>
      <style>{`
        @keyframes sparkle-ring {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          60%  { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .sparkle-active { animation: sparkle-ring 0.7s ease-out; }

        @keyframes code-in {
          0%   { opacity: 0; transform: translateY(4px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0)  scale(1); }
        }
        .code-reveal { animation: code-in 0.35s ease-out both; }

        @keyframes btn-out {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        .btn-hide { animation: btn-out 0.2s ease-in both; }
      `}</style>

      <div className="mx-auto w-full max-w-[1600px] space-y-6">

        {/* ── HERO ── */}
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#102b3f] via-[#14504b] to-[#0f766e] p-5 text-white shadow-[0_20px_55px_rgba(15,76,69,0.2)] sm:p-7">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(245,158,11,0.2),transparent_35%),radial-gradient(ellipse_at_0%_100%,rgba(45,212,191,0.16),transparent_42%)]" />
          <div aria-hidden className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/[0.08]" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/80">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    <Gift className="h-4 w-4" />
                  </span>
                  <span>Redemptions</span>
                </div>
                <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">My Vouchers</h1>
                <p className="text-sm text-teal-50/80">Your voucher codes, requests, and redemption history in one place.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                </button>
                <Link
                  href="/dashboard/store"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Redeem More
                </Link>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 sm:max-w-xl sm:gap-3">
              {[
                { label: "Ready to use", count: delivered.length, icon: PackageCheck, tone: "text-teal-100" },
                { label: "In progress", count: pending.length, icon: Clock, tone: "text-amber-200" },
                { label: "Cancelled", count: cancelled.length, icon: Ban, tone: "text-white/70" },
              ].map(({ label, count, icon: Icon, tone }) => (
                <div key={label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                  <div className={`mb-1 flex items-center gap-1.5 text-xs font-semibold ${tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{label}</span>
                  </div>
                  <p className="text-lg font-extrabold leading-none text-white">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-100">
              <Gift className="h-7 w-7 text-teal-600" />
            </div>
            <div>
              <p className="mb-1 font-bold text-slate-800">No vouchers yet</p>
              <p className="text-sm text-slate-500">Earn NexCoins by completing tasks, then redeem them for vouchers.</p>
            </div>
            <Link
              href="/dashboard/store"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-teal-800 hover:to-teal-700"
            >
              Browse Store
            </Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Ready to Use ── */}
            {delivered.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-800">
                    Ready to Use
                    <span className="ml-1.5 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                      {delivered.length}
                    </span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {delivered.map((r) => {
                    const isRevealed  = revealed[r.id] ?? false;
                    const isSparkling = sparkling[r.id] ?? false;
                    const isCopied    = copied === r.id;

                    return (
                      <div
                        key={r.id}
                        className="group overflow-hidden rounded-[1.5rem] border border-teal-100 bg-gradient-to-br from-white via-white to-teal-50/50 shadow-[0_10px_30px_rgba(15,76,69,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_16px_36px_rgba(15,76,69,0.12)]"
                      >
                        {/* Top accent stripe */}
                        <div className="h-1 w-full bg-gradient-to-r from-teal-700 via-teal-500 to-amber-400" />

                        <div className="p-4 sm:p-6">
                          {/* Header row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 ring-1 ring-teal-100">
                                <Ticket className="h-5 w-5 text-teal-700" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800">{r.voucher_type}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                                  <span className="font-semibold text-amber-700">{(r.charged_coins ?? r.coins_spent).toLocaleString()} NexCoins</span>
                                  {r.delivered_at && (
                                    <span>· {new Date(r.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                              <Check className="h-3 w-3" /> Delivered
                            </span>
                          </div>

                          {/* Code reveal section */}
                          {r.voucher_code ? (
                            <div className="mt-4">
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                Your voucher code
                              </p>

                              <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                                isRevealed ? "border-teal-200 bg-teal-50/80 shadow-inner" : "border-slate-200 bg-slate-50"
                              } ${isSparkling ? "sparkle-active" : ""}`}>

                                {/* The code — blurred until revealed */}
                                <div className={`flex min-h-[58px] items-center gap-3 px-4 py-3.5 transition-all duration-500 ${
                                  isRevealed ? "" : "opacity-30 blur-sm pointer-events-none select-none"
                                }`}>
                                  <code className={`min-w-0 flex-1 break-all font-mono text-sm font-bold tracking-wide text-teal-800 sm:text-base ${
                                    isRevealed ? "code-reveal" : ""
                                  }`}>
                                    {r.voucher_code}
                                  </code>
                                  {isRevealed && (
                                    <button
                                      onClick={() => copyCode(r.id, r.voucher_code!)}
                                      className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 ${
                                        isCopied ? "bg-teal-500" : "bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700"
                                      }`}
                                    >
                                      {isCopied ? (
                                        <><Check className="h-3.5 w-3.5" /> Copied!</>
                                      ) : (
                                        <><Copy className="h-3.5 w-3.5" /> Copy</>
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Reveal overlay — sits on top while hidden */}
                                {!isRevealed && (
                                  <button
                                    onClick={() => revealCode(r.id)}
                                    aria-label="Reveal voucher code"
                                    className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl transition-all hover:bg-white/50 active:scale-[0.98]"
                                  >
                                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all group-hover:border-teal-200 group-hover:shadow-md">
                                      <Lock className="h-3.5 w-3.5 text-teal-700" />
                                      <span className="text-xs font-bold text-slate-700">Reveal voucher code</span>
                                      <Eye className="h-3.5 w-3.5 text-teal-600" />
                                    </div>
                                  </button>
                                )}
                              </div>

                              {/* Hide again option */}
                              {isRevealed && (
                                <button
                                  onClick={() => setRevealed((prev) => ({ ...prev, [r.id]: false }))}
                                  className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <Lock className="h-2.5 w-2.5" /> Hide code
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">Code will appear once delivered.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── In Progress ── */}
            {pending.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-800">
                    In Progress
                    <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
                      {pending.length}
                    </span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {pending.map((r) => (
                    <div key={r.id} className="overflow-hidden rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/50 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
                      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                              <Clock className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{r.voucher_type}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                <span className="font-semibold text-amber-700">{(r.charged_coins ?? r.coins_spent).toLocaleString()} NexCoins</span> · {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            r.status === "processing" ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {r.status === "processing" ? "Processing" : "Pending"}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4 flex items-center">
                          {(["Requested", "Processing", "Delivered"] as const).map((step, i) => {
                            const done   = i === 0 || (i === 1 && r.status === "processing");
                            const active = (i === 0 && r.status === "pending") || (i === 1 && r.status === "processing");
                            return (
                              <div key={step} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                  <div className={`h-2 w-2 rounded-full ${
                                    done ? "bg-teal-600" : active ? "bg-amber-400 ring-2 ring-amber-100" : "bg-slate-200"
                                  }`} />
                                  <span className={`text-[9px] font-medium whitespace-nowrap ${done || active ? "text-slate-600" : "text-slate-300"}`}>
                                    {step}
                                  </span>
                                </div>
                                {i < 2 && (
                                  <div className={`mb-3 flex-1 h-px mx-1 ${
                                    i === 0 && r.status !== "pending" ? "bg-teal-300" : "bg-slate-200"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          {r.status === "pending"
                            ? "Queued for review — expect delivery within 24–48 hours."
                            : "Being processed and will be ready shortly."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {cancelled.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-slate-500" />
                  <h2 className="text-sm font-bold text-slate-700">
                    Cancelled
                    <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {cancelled.length}
                    </span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {cancelled.map((request) => (
                    <div key={request.id} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
                      <div className="h-1 w-full bg-slate-300" />
                      <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6">
                        <div>
                          <p className="font-semibold text-slate-800">{request.voucher_type}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Requested {new Date(request.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {request.refund_amount?.toLocaleString() ?? (request.charged_coins ?? request.coins_spent).toLocaleString()} coins refunded
                            {request.refunded_at && ` on ${new Date(request.refunded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                          </p>
                          {request.refund_reason && (
                            <p className="mt-1 text-xs text-slate-500">Reason: {request.refund_reason}</p>
                          )}
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          Cancelled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
