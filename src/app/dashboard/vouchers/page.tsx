"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Clock, PackageCheck, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  pending:    { label: "Pending",    style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",  icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: "Processing", style: "bg-blue-500/10 text-blue-400 border-blue-500/20",       icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  delivered:  { label: "Delivered",  style: "bg-green-500/10 text-green-400 border-green-500/20",    icon: <PackageCheck className="h-3.5 w-3.5" /> },
};

export default function MyVouchersPage() {
  const [requests, setRequests]   = useState<VoucherRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [copied, setCopied]       = useState<string | null>(null);
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
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      await fetchRequests();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Real-time: auto-update when admin delivers
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
    return () => { if (channel) supabase.removeChannel(channel); };
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

  const delivered  = requests.filter((r) => r.status === "delivered");
  const pending    = requests.filter((r) => r.status !== "delivered");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">My Vouchers</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            All your voucher requests and delivered codes in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/store">Redeem More</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-20 flex flex-col items-center gap-4 text-center px-6">
          <div className="h-14 w-14 rounded-full bg-[var(--brand-100)] flex items-center justify-center">
            <Gift className="h-7 w-7 text-[var(--brand-500)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">No vouchers yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Earn NexCoins by completing tasks, then redeem them for vouchers.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/store">Browse Store</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Delivered vouchers */}
          {delivered.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Ready to Use · {delivered.length}
              </h2>
              <ul className="space-y-3">
                {delivered.map((r) => {
                  const st = STATUS_META.delivered;
                  return (
                    <li key={r.id} className="rounded-xl border border-green-500/30 bg-[var(--surface-card)] p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{r.voucher_type}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {r.coins_spent.toLocaleString()} coins ·{" "}
                            Requested {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            {r.delivered_at && (
                              <span className="text-green-400">
                                {" "}· Delivered {new Date(r.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${st.style}`}>
                          {st.icon} {st.label}
                        </span>
                      </div>

                      {r.voucher_code && (
                        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                          <p className="text-xs text-green-400/70 uppercase tracking-wider mb-3 font-medium">Your Voucher Code</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <code className="flex-1 text-xl font-bold font-mono text-green-400 tracking-[0.2em] break-all select-all">
                              {r.voucher_code}
                            </code>
                            <button
                              onClick={() => copyCode(r.id, r.voucher_code!)}
                              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-sm font-semibold transition-colors"
                            >
                              {copied === r.id ? (
                                <><Check className="h-4 w-4" /> Copied!</>
                              ) : (
                                <><Copy className="h-4 w-4" /> Copy Code</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Pending/processing vouchers */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                In Progress · {pending.length}
              </h2>
              <ul className="space-y-3">
                {pending.map((r) => {
                  const st = STATUS_META[r.status] ?? STATUS_META.pending;
                  return (
                    <li key={r.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{r.voucher_type}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {r.coins_spent.toLocaleString()} coins ·{" "}
                            {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-2">
                            {r.status === "pending"
                              ? "Your request is being reviewed. Expect delivery within 24–48 hours."
                              : "Your voucher is being processed and will be ready shortly."}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${st.style}`}>
                          {st.icon} {st.label}
                        </span>
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
