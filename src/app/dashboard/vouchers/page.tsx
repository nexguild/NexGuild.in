"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Clock, PackageCheck, Loader2, RefreshCw, Ticket } from "lucide-react";
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

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg">
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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <Gift className="h-7 w-7 text-indigo-400" />
          </div>
          <div>
            <p className="mb-1 font-bold text-slate-800">No vouchers yet</p>
            <p className="text-sm text-slate-500">Earn NexCoins by completing tasks, then redeem them for vouchers.</p>
          </div>
          <Link
            href="/dashboard/store"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700"
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
                <PackageCheck className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-700">
                  Ready to Use
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    {delivered.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {delivered.map((r) => (
                  <div
                    key={r.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    {/* Top accent stripe */}
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />

                    <div className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                            <Ticket className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{r.voucher_type}</p>
                            <p className="text-xs text-slate-400">
                              🪙 {r.coins_spent.toLocaleString()} NexCoins
                              {r.delivered_at && (
                                <> · 📅 {new Date(r.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                          ✓ Delivered
                        </span>
                      </div>

                      {/* Code box */}
                      {r.voucher_code ? (
                        <div className="mt-4">
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Your Voucher Code
                          </p>
                          <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-4 py-3">
                            <code className="flex-1 break-all font-mono text-lg font-bold tracking-wider text-emerald-700 select-all">
                              {r.voucher_code}
                            </code>
                            <button
                              onClick={() => copyCode(r.id, r.voucher_code!)}
                              className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95"
                            >
                              {copied === r.id ? (
                                <><Check className="h-3.5 w-3.5" /> Copied!</>
                              ) : (
                                <><Copy className="h-3.5 w-3.5" /> Copy</>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">Code will appear once delivered.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── In Progress ── */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-700">
                  In Progress
                  <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
                    {pending.length}
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {pending.map((r) => (
                  <div key={r.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-orange-400" />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                            <Clock className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{r.voucher_type}</p>
                            <p className="text-xs text-slate-400">
                              {r.coins_spent.toLocaleString()} coins · {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          r.status === "processing"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          {r.status === "processing" ? "Processing" : "Pending"}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 flex items-center gap-1">
                        {(["Requested", "Processing", "Delivered"] as const).map((step, i) => {
                          const done   = i === 0 || (i === 1 && r.status === "processing");
                          const active = (i === 0 && r.status === "pending") || (i === 1 && r.status === "processing");
                          return (
                            <div key={step} className={`flex flex-1 flex-col items-center gap-1 ${i < 2 ? "flex-row" : ""}`}>
                              <div className="flex flex-col items-center gap-1 shrink-0">
                                <div className={`h-2 w-2 rounded-full ${
                                  done ? "bg-indigo-500" : active ? "bg-amber-400 ring-2 ring-amber-100" : "bg-slate-200"
                                }`} />
                                <span className={`text-[9px] font-medium whitespace-nowrap ${done || active ? "text-slate-600" : "text-slate-300"}`}>
                                  {step}
                                </span>
                              </div>
                              {i < 2 && (
                                <div className={`mb-3 flex-1 h-px mx-1 ${
                                  i === 0 && r.status !== "pending" ? "bg-indigo-300" : "bg-slate-200"
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
        </div>
      )}
    </div>
  );
}
