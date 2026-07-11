"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Clock, PackageCheck, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface VoucherRequest {
  id: string;
  voucher_type: string;
  coins_spent: number;
  status: string;
  voucher_code: string | null;
  requested_at: string;
  delivered_at: string | null;
}

const STATUS_META: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    style: "bg-amber-100 text-amber-600 border-amber-200",   icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: "Processing", style: "bg-blue-100 text-blue-600 border-blue-200",      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  delivered:  { label: "Delivered",  style: "bg-green-100 text-green-600 border-green-200",   icon: <PackageCheck className="h-3.5 w-3.5" /> },
};

export default function MyVouchersPage() {
  const [requests, setRequests]     = useState<VoucherRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("voucher_requests")
      .select("id, voucher_type, coins_spent, status, voucher_code, requested_at, delivered_at")
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

      // Real-time: auto-update when admin delivers
      // .on() must be registered BEFORE .subscribe()
      channel = supabase
        .channel(`voucher_requests_page:${user.id}`)
        .on(
          "postgres_changes",
          {
            event:  "UPDATE",
            schema: "public",
            table:  "voucher_requests",
            filter: `contributor_id=eq.${user.id}`,
          },
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

  async function handleRefresh() {
    setRefreshing(true);
    await fetchRequests();
  }

  const delivered = requests.filter((r) => r.status === "delivered");
  const pending   = requests.filter((r) => r.status !== "delivered");

  return (
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Gift className="h-4 w-4 text-white/70" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Redemptions</span>
            </div>
            <h1 className="mb-1 text-2xl font-extrabold text-white">My Vouchers</h1>
            <p className="text-sm text-white/75">All your voucher requests and delivered codes in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              href="/dashboard/store"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25"
            >
              Redeem More
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
          >
            <Gift className="h-7 w-7 text-indigo-500" />
          </div>
          <div>
            <p className="mb-1 font-bold text-slate-800">No vouchers yet</p>
            <p className="text-sm text-slate-500">Earn NexCoins by completing tasks, then redeem them for vouchers.</p>
          </div>
          <Link
            href="/dashboard/store"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
          >
            Browse Store
          </Link>
        </div>
      ) : (
        <div className="animate-fade-slide-up space-y-6" style={{ animationDelay: "100ms" }}>

          {/* ── Delivered ────────────────────────────────────────── */}
          {delivered.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-green-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Ready to Use <span className="ml-1 font-normal text-slate-400">· {delivered.length}</span>
                </h2>
              </div>
              <ul className="space-y-4">
                {delivered.map((r) => (
                  <li
                    key={r.id}
                    className="overflow-hidden rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    style={{ border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    {/* ── GRADIENT HEADER ── */}
                    <div
                      className="relative overflow-hidden px-5 pt-5 pb-6"
                      style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}
                    >
                      <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                      <div aria-hidden className="pointer-events-none absolute right-10 bottom-0 h-14 w-14 rounded-full bg-white/5" />
                      <div aria-hidden className="pointer-events-none absolute -left-4 top-6 h-16 w-16 rounded-full bg-white/5" />
                      <div className="relative">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-white/65" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">Gift Voucher</span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white">
                            <Check className="h-3 w-3" /> Delivered
                          </span>
                        </div>
                        <p className="text-2xl font-extrabold leading-tight text-white">{r.voucher_type}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="text-xs text-white/65">🪙 {r.coins_spent.toLocaleString()} NexCoins</span>
                          {r.delivered_at && (
                            <span className="text-xs text-white/65">
                              📅 {new Date(r.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── TEAR-LINE DIVIDER ── */}
                    <div className="flex items-center bg-white py-1">
                      <div className="ml-5 flex-1 border-t-2 border-dashed border-slate-200" />
                      <div className="mx-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-emerald-200 bg-emerald-50">
                        <Gift className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="mr-5 flex-1 border-t-2 border-dashed border-slate-200" />
                    </div>

                    {/* ── CODE SECTION ── */}
                    <div className="bg-white px-5 pb-5">
                      {r.voucher_code ? (
                        <>
                          <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Your Voucher Code
                          </p>
                          <div className="mb-4 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
                            <code className="break-all font-mono text-2xl font-extrabold tracking-[0.2em] text-emerald-700 select-all">
                              {r.voucher_code}
                            </code>
                          </div>
                          <button
                            onClick={() => copyCode(r.id, r.voucher_code!)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}
                          >
                            {copied === r.id ? (
                              <><Check className="h-4 w-4" /> Copied to Clipboard!</>
                            ) : (
                              <><Copy className="h-4 w-4" /> Copy Code</>
                            )}
                          </button>
                        </>
                      ) : (
                        <p className="py-2 text-center text-sm text-slate-400">Code will appear once delivered.</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── In Progress ──────────────────────────────────────── */}
          {pending.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  In Progress <span className="ml-1 font-normal text-slate-400">· {pending.length}</span>
                </h2>
              </div>
              <ul className="space-y-3">
                {pending.map((r) => {
                  const st = STATUS_META[r.status] ?? STATUS_META.pending;
                  return (
                    <li key={r.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      {/* Top accent bar */}
                      <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                      <div className="p-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{r.voucher_type}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {r.coins_spent.toLocaleString()} coins ·{" "}
                              {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${st.style}`}>
                            {st.icon} {st.label}
                          </span>
                        </div>

                        {/* 3-step progress tracker */}
                        <div className="flex items-center">
                          {(["Requested", "Processing", "Delivered"] as const).map((step, i) => {
                            const stepDone =
                              i === 0 ||
                              (i === 1 && r.status === "processing");
                            const stepActive =
                              (i === 0 && r.status === "pending") ||
                              (i === 1 && r.status === "processing");
                            return (
                              <div key={step} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center gap-1">
                                  <div className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                    stepDone
                                      ? "bg-indigo-500"
                                      : stepActive
                                      ? "bg-amber-400 ring-2 ring-amber-200"
                                      : "bg-slate-200"
                                  }`} />
                                  <span className={`whitespace-nowrap text-[9px] font-semibold ${
                                    stepDone || stepActive ? "text-slate-600" : "text-slate-300"
                                  }`}>{step}</span>
                                </div>
                                {i < 2 && (
                                  <div className={`mb-3 h-0.5 flex-1 mx-1 ${
                                    i === 0 && r.status !== "pending" ? "bg-indigo-300" : "bg-slate-200"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                          {r.status === "pending"
                            ? "Your request is queued for review. Expect delivery within 24–48 hours."
                            : "Your voucher is being processed and will be ready shortly."}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
