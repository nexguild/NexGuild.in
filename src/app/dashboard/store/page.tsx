"use client";

import { useEffect, useState } from "react";
import { Coins, ShoppingBag, Gift, CheckCircle, X, Loader2, Copy, Check, Clock, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface MyRequest {
  id: string;
  voucher_type: string;
  coins_spent: number;
  status: string;
  voucher_code: string | null;
  requested_at: string;
  delivered_at: string | null;
}

interface VoucherItem {
  id: string;
  name: string;
  description: string;
  coins: number;
  category: string;
  badge?: string;
}

const VOUCHERS: VoucherItem[] = [
  { id: "amazon-100", name: "Amazon Gift Card", description: "₹100 Amazon India gift voucher", coins: 500, category: "Shopping", badge: "Popular" },
  { id: "amazon-250", name: "Amazon Gift Card", description: "₹250 Amazon India gift voucher", coins: 1200, category: "Shopping" },
  { id: "amazon-500", name: "Amazon Gift Card", description: "₹500 Amazon India gift voucher", coins: 2300, category: "Shopping" },
  { id: "flipkart-100", name: "Flipkart Gift Card", description: "₹100 Flipkart gift voucher", coins: 500, category: "Shopping" },
  { id: "flipkart-250", name: "Flipkart Gift Card", description: "₹250 Flipkart gift voucher", coins: 1200, category: "Shopping" },
  { id: "paytm-100", name: "Paytm Cash", description: "₹100 Paytm wallet credit", coins: 520, category: "Payments", badge: "Fast" },
  { id: "paytm-250", name: "Paytm Cash", description: "₹250 Paytm wallet credit", coins: 1250, category: "Payments" },
  { id: "phonepe-100", name: "PhonePe Voucher", description: "₹100 PhonePe voucher", coins: 520, category: "Payments" },
  { id: "google-play-100", name: "Google Play", description: "₹100 Google Play credit", coins: 530, category: "Apps & Games" },
  { id: "google-play-250", name: "Google Play", description: "₹250 Google Play credit", coins: 1280, category: "Apps & Games" },
  { id: "swiggy-100", name: "Swiggy Voucher", description: "₹100 Swiggy food voucher", coins: 520, category: "Food" },
  { id: "zomato-100", name: "Zomato Credits", description: "₹100 Zomato credits", coins: 520, category: "Food" },
];

const CATEGORIES = ["All", ...Array.from(new Set(VOUCHERS.map((v) => v.category)))];

const REQUEST_STATUS: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    style: "bg-yellow-500/10 text-yellow-400",  icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: "Processing", style: "bg-blue-500/10 text-blue-400",     icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  delivered:  { label: "Delivered",  style: "bg-green-500/10 text-green-400",   icon: <PackageCheck className="h-3.5 w-3.5" /> },
};

export default function StorePage() {
  const [nexcoins, setNexcoins]           = useState<number | null>(null);
  const [loading, setLoading]             = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [confirmItem, setConfirmItem]     = useState<VoucherItem | null>(null);
  const [redeeming, setRedeeming]         = useState(false);
  const [successItem, setSuccessItem]     = useState<VoucherItem | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [myRequests, setMyRequests]       = useState<MyRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [copied, setCopied]               = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: requestsData }] = await Promise.all([
        supabase.from("profiles").select("nexcoins").eq("id", user.id).single(),
        supabase
          .from("voucher_requests")
          .select("id, voucher_type, coins_spent, status, voucher_code, requested_at, delivered_at")
          .eq("contributor_id", user.id)
          .order("requested_at", { ascending: false }),
      ]);

      setNexcoins(profileData?.nexcoins ?? 0);
      setMyRequests((requestsData as MyRequest[]) ?? []);
      setLoading(false);
      setLoadingRequests(false);
    }
    fetchData();
  }, []);

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRedeem() {
    if (!confirmItem) return;
    setRedeeming(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); setRedeeming(false); return; }

    if ((nexcoins ?? 0) < confirmItem.coins) {
      setError("Insufficient NexCoins balance.");
      setRedeeming(false);
      return;
    }

    const { error: insertError } = await supabase.from("voucher_requests").insert({
      contributor_id: user.id,
      voucher_type: confirmItem.name + " — " + confirmItem.description,
      voucher_value: null,
      coins_spent: confirmItem.coins,
      status: "pending",
    });

    if (insertError) {
      setError("Failed to submit request. Please try again.");
      setRedeeming(false);
      return;
    }

    // Deduct coins from profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ nexcoins: (nexcoins ?? 0) - confirmItem.coins })
      .eq("id", user.id);

    if (updateError) {
      setError("Voucher requested but balance update failed — contact support.");
    } else {
      setNexcoins((prev) => (prev ?? 0) - confirmItem.coins);
    }

    setRedeeming(false);
    setSuccessItem(confirmItem);
    setConfirmItem(null);
  }

  const filtered = selectedCategory === "All"
    ? VOUCHERS
    : VOUCHERS.filter((v) => v.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Store</h1>
          <p className="text-sm text-[var(--text-secondary)]">Redeem your NexCoins for gift vouchers.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2">
          <Coins className="h-4 w-4 text-[var(--brand-500)]" />
          <span className="text-sm font-semibold text-[var(--brand-500)]">
            {loading ? "—" : (nexcoins ?? 0).toLocaleString()} coins
          </span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-[var(--brand-500)] text-white"
                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Ad Banner — replace div with AdBanner once Adsterra key is ready */}
      <div className="flex justify-center py-2">
        {/* <AdBanner atKey="YOUR_KEY_HERE" width={728} height={90} /> */}
        <div className="w-full max-w-[728px] h-[90px] rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-center">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Advertisement</span>
        </div>
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const canAfford = (nexcoins ?? 0) >= item.coins;
          return (
            <div
              key={item.id}
              className={`rounded-xl border bg-[var(--surface-card)] p-5 flex flex-col gap-4 transition-opacity ${
                canAfford ? "border-[var(--border-default)]" : "border-[var(--border-default)] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="h-10 w-10 rounded-lg bg-[var(--brand-100)] flex items-center justify-center flex-shrink-0">
                  <Gift className="h-5 w-5 text-[var(--brand-500)]" />
                </div>
                {item.badge && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--brand-500)] text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{item.category}</p>
                <h3 className="font-semibold text-[var(--text-primary)] mb-0.5">{item.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-[var(--brand-500)]" />
                  <span className="font-bold text-[var(--brand-500)]">{item.coins.toLocaleString()}</span>
                </div>
                <Button
                  size="sm"
                  disabled={!canAfford || loading}
                  onClick={() => setConfirmItem(item)}
                >
                  {canAfford ? "Redeem" : "Need more coins"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Modal */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Confirm Redemption</h2>
              <button onClick={() => { setConfirmItem(null); setError(null); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-lg bg-[var(--surface-subtle)] p-4 mb-5">
              <p className="font-semibold text-[var(--text-primary)]">{confirmItem.name}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{confirmItem.description}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <Coins className="h-4 w-4 text-[var(--brand-500)]" />
                <span className="font-bold text-[var(--brand-500)]">{confirmItem.coins.toLocaleString()} coins</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Balance after redemption:</p>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-5">
              {((nexcoins ?? 0) - confirmItem.coins).toLocaleString()} coins
            </p>
            {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Your voucher will be delivered to your registered email within 24–48 hours after approval.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => { setConfirmItem(null); setError(null); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleRedeem} disabled={redeeming}>
                {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                {redeeming ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl text-center">
            <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Request Submitted!</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-1">{successItem.name}</p>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              Your voucher will be delivered to your registered email within 24–48 hours. Track it below in My Requests.
            </p>
            <Button className="w-full" onClick={() => setSuccessItem(null)}>Done</Button>
          </div>
        </div>
      )}

      {/* ── My Requests ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">My Requests</h2>

        {loadingRequests ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
            ))}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-12 flex flex-col items-center gap-3 text-center">
            <Gift className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">No redemption requests yet. Redeem a voucher above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {myRequests.map((r) => {
              const st = REQUEST_STATUS[r.status] ?? REQUEST_STATUS.pending;
              const isDelivered = r.status === "delivered";
              return (
                <li
                  key={r.id}
                  className={`rounded-xl border bg-[var(--surface-card)] p-5 transition-colors ${
                    isDelivered ? "border-green-500/30" : "border-[var(--border-default)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{r.voucher_type}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {r.coins_spent.toLocaleString()} coins ·{" "}
                        {new Date(r.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {r.delivered_at && (
                          <span className="text-green-400">
                            {" "}· Delivered {new Date(r.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${st.style}`}>
                      {st.icon}
                      {st.label}
                    </span>
                  </div>

                  {isDelivered && r.voucher_code && (
                    <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                      <p className="text-xs text-green-400/70 uppercase tracking-wider mb-2 font-medium">Your Voucher Code</p>
                      <div className="flex items-center gap-3">
                        <code className="flex-1 text-lg font-bold font-mono text-green-400 tracking-widest break-all">
                          {r.voucher_code}
                        </code>
                        <button
                          onClick={() => copyCode(r.id, r.voucher_code!)}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium transition-colors"
                        >
                          {copied === r.id ? (
                            <><Check className="h-3.5 w-3.5" /> Copied!</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Copy Code</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isDelivered && (
                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      {r.status === "pending"
                        ? "Your request is being reviewed. Voucher will be emailed within 24–48 hours."
                        : "Your voucher is being processed. You will receive it shortly."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
