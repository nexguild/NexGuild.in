"use client";

import { useEffect, useState } from "react";
import { Coins, ShoppingBag, Gift, CheckCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

export default function StorePage() {
  const [nexcoins, setNexcoins] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [confirmItem, setConfirmItem] = useState<VoucherItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [successItem, setSuccessItem] = useState<VoucherItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("nexcoins")
        .eq("id", user.id)
        .single();
      setNexcoins(data?.nexcoins ?? 0);
      setLoading(false);
    }
    fetchBalance();
  }, []);

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
              Your voucher will be delivered to your registered email within 24–48 hours.
            </p>
            <Button className="w-full" onClick={() => setSuccessItem(null)}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}
