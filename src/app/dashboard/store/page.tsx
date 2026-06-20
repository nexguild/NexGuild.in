"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, X, Loader2, CheckCircle, Tag, Plus, Minus, Trash2 } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface DbVoucher {
  id: string;
  brand_name: string;
  description: string;
  value_inr: number;
  coins_required: number;
  category: string;
  emoji: string;
  is_available: boolean;
}

interface CartEntry {
  voucher: DbVoucher;
  qty: number;
}

interface CouponResult {
  code: string;
  discountCoins: number;
  discountPercent: number;
  couponId: string;
}

// UI-only color mapping per brand (DB stores emoji; colors stay here)
const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  "Amazon":      { bg: "bg-orange-500/15", text: "text-orange-400" },
  "Flipkart":    { bg: "bg-blue-500/15",   text: "text-blue-400" },
  "Google Play": { bg: "bg-green-500/15",  text: "text-green-400" },
  "Zomato":      { bg: "bg-red-500/15",    text: "text-red-400" },
};

function brandColor(brand: string) {
  return BRAND_COLORS[brand] ?? { bg: "bg-[var(--brand-500)]/15", text: "text-[var(--brand-500)]" };
}

const CATEGORIES = ["All", "Shopping", "Apps", "Food"];

const CATEGORY_MAP: Record<string, string> = {
  Shopping: "shopping", Apps: "apps", Food: "food",
};

const HOW_TO_USE = [
  "Click Redeem in your cart to submit a request",
  "We process your request within 24–48 hours",
  "Your voucher code appears in My Vouchers",
  "Use the code on the brand's website or app",
];

const TERMS = [
  "Vouchers are non-refundable once redeemed",
  "Valid for 12 months from the date of issue",
  "Cannot be exchanged for NexCoins or cash",
  "One voucher code per redemption request",
];

export default function StorePage() {
  const tokenRef = useRef<string | null>(null);

  const [nexcoins, setNexcoins]   = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);
  const [vouchers, setVouchers]   = useState<DbVoucher[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAffordable, setShowAffordable]     = useState(false);

  // Modal — open by brand; user picks denomination
  const [detailBrand, setDetailBrand]               = useState<string | null>(null);
  const [selectedVoucherId, setSelectedVoucherId]   = useState<string>("");

  const [cart, setCart]         = useState<CartEntry[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [couponCode, setCouponCode]         = useState("");
  const [coupon, setCoupon]                 = useState<CouponResult | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError]       = useState<string | null>(null);

  const [redeeming, setRedeeming]       = useState(false);
  const [redeemError, setRedeemError]   = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [showSuccess, setShowSuccess]   = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      const [{ data: profileData }, { data: voucherData }] = await Promise.all([
        supabase.from("profiles").select("nexcoins").eq("id", user.id).single(),
        supabase
          .from("voucher_inventory")
          .select("id, brand_name, description, value_inr, coins_required, category, emoji, is_available")
          .order("brand_name", { ascending: true })
          .order("value_inr", { ascending: true }),
      ]);

      setNexcoins((profileData as { nexcoins: number } | null)?.nexcoins ?? 0);
      setVouchers((voucherData as DbVoucher[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Unique ordered brand list from fetched vouchers
  const brandList = Array.from(new Map(vouchers.map((v) => [v.brand_name, v.category])).entries()).map(
    ([brand, category]) => ({ brand, category })
  );

  function brandVouchers(brand: string) {
    return vouchers.filter((v) => v.brand_name === brand);
  }

  function isBrandAvailable(brand: string) {
    return brandVouchers(brand).some((v) => v.is_available);
  }

  function openBrandModal(brand: string) {
    const bv = brandVouchers(brand);
    const def = bv.find((v) => v.is_available) ?? bv[0];
    if (!def) return;
    setSelectedVoucherId(def.id);
    setDetailBrand(brand);
  }

  const modalVouchers  = detailBrand ? brandVouchers(detailBrand) : [];
  const selectedVoucher = vouchers.find((v) => v.id === selectedVoucherId) ?? null;

  const cartTotal  = cart.reduce((s, e) => s + e.voucher.coins_required * e.qty, 0);
  const discount   = coupon
    ? coupon.discountPercent > 0
      ? Math.floor(cartTotal * coupon.discountPercent / 100)
      : coupon.discountCoins
    : 0;
  const finalTotal = Math.max(0, cartTotal - discount);
  const cartCount  = cart.reduce((s, e) => s + e.qty, 0);

  function addToCart(v: DbVoucher) {
    setCart((prev) => {
      const idx = prev.findIndex((e) => e.voucher.id === v.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { voucher: v, qty: 1 }];
    });
    setDetailBrand(null);
    setCartOpen(true);
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((e) => e.voucher.id !== id));
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((e) => e.voucher.id === id ? { ...e, qty: e.qty + delta } : e).filter((e) => e.qty > 0)
    );
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    setCoupon(null);
    try {
      const res = await fetch("/api/store/apply-coupon", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body:    JSON.stringify({ code: couponCode.trim(), totalCoins: cartTotal }),
      });
      const data = await res.json() as CouponResult & { error?: string };
      if (!res.ok) setCouponError(data.error ?? "Invalid coupon.");
      else setCoupon(data);
    } catch {
      setCouponError("Failed to validate coupon.");
    }
    setApplyingCoupon(false);
  }

  async function redeemCart() {
    if (cart.length === 0) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const res = await fetch("/api/store/redeem-cart", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body:    JSON.stringify({
          items: cart.flatMap((e) =>
            Array.from({ length: e.qty }, () => ({
              voucherType: `${e.voucher.brand_name} ₹${e.voucher.value_inr} Voucher`,
              coins:       e.voucher.coins_required,
            }))
          ),
          couponCode: coupon?.code ?? null,
        }),
      });
      const data = await res.json() as { error?: string; voucherCount?: number; newBalance?: number };
      if (!res.ok) {
        setRedeemError(data.error ?? "Redemption failed. Please try again.");
      } else {
        setSuccessCount(data.voucherCount ?? cart.length);
        setNexcoins(data.newBalance ?? null);
        setCart([]);
        setCoupon(null);
        setCouponCode("");
        setCartOpen(false);
        setShowSuccess(true);
      }
    } catch {
      setRedeemError("Network error. Please try again.");
    }
    setRedeeming(false);
  }

  const displayedBrands = brandList.filter(({ brand, category }) => {
    if (selectedCategory !== "All" && category !== CATEGORY_MAP[selectedCategory]) return false;
    if (showAffordable) {
      const minCoins = Math.min(...brandVouchers(brand).map((v) => v.coins_required));
      if ((nexcoins ?? 0) < minCoins) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">NexStore</h1>
          <p className="text-sm text-[var(--text-secondary)]">Redeem your NexCoins for gift vouchers.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2">
            <NexCoinIcon size={16} />
            <span className="text-sm font-semibold text-[var(--brand-500)]">
              {loading ? "—" : (nexcoins ?? 0).toLocaleString()} coins
            </span>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] transition-colors"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5 text-[var(--text-secondary)]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-[var(--brand-500)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category + Affordability Filters */}
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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowAffordable(!showAffordable)}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 ${
              showAffordable
                ? "bg-green-500/15 border-green-500/40 text-green-400"
                : "bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${showAffordable ? "bg-green-400" : "bg-[var(--text-muted)]"}`} />
            I can afford
          </button>
        </div>
      </div>

      {/* Brand Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : displayedBrands.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 text-center px-6">
          {showAffordable ? (
            <>
              <p className="text-2xl mb-3">🏆</p>
              <p className="font-semibold text-[var(--text-primary)] mb-1">Almost there!</p>
              <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
                Complete a few more tasks to unlock vouchers — you&apos;re getting close!
              </p>
              <Link
                href="/dashboard/opportunities"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-500)] hover:underline"
              >
                Browse Opportunities →
              </Link>
            </>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">No vouchers available in this category.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {displayedBrands.map(({ brand }) => {
            const colors      = brandColor(brand);
            const bv          = brandVouchers(brand);
            const available   = isBrandAvailable(brand);
            const minCoins    = Math.min(...bv.map((v) => v.coins_required));
            const emoji       = bv[0]?.emoji ?? "🎁";
            const canAfford   = available && (nexcoins ?? 0) >= minCoins;

            return (
              <div
                key={brand}
                onClick={() => !loading && openBrandModal(brand)}
                className={`rounded-xl border bg-[var(--surface-card)] p-4 flex flex-col gap-3 cursor-pointer transition-colors group ${
                  canAfford
                    ? "border-green-500/40 hover:border-green-500/70"
                    : "border-[var(--border-default)] hover:border-[var(--brand-500)]"
                } ${!available ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                    {emoji}
                  </div>
                  {!available ? (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)] leading-none">
                      Sold Out
                    </span>
                  ) : canAfford ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 leading-none">
                      ✓ Affordable
                    </span>
                  ) : null}
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{brand}</h3>
                  <div className="flex flex-wrap gap-1">
                    {bv.map((v) => (
                      <span
                        key={v.id}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          v.is_available
                            ? `${colors.bg} ${colors.text}`
                            : "bg-[var(--surface-subtle)] text-[var(--text-muted)] line-through"
                        }`}
                      >
                        ₹{v.value_inr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1 border-t border-[var(--border-default)]">
                  <p className="text-[10px] text-[var(--text-muted)] mb-0.5">From</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <NexCoinIcon size={12} />
                      <span className="text-xs font-bold text-[var(--brand-500)]">{minCoins.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-medium text-[var(--brand-500)] group-hover:underline">
                      {available ? "Select →" : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/vouchers" className="text-sm text-[var(--text-link)] hover:underline">
          View your redeemed vouchers →
        </Link>
      </div>

      {/* ── Brand Detail Modal ────────────────────────────────────────── */}
      {detailBrand && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 rounded-xl ${brandColor(detailBrand).bg} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {modalVouchers[0]?.emoji ?? "🎁"}
                </div>
                <div>
                  <h2 className="font-semibold text-[var(--text-primary)]">{detailBrand}</h2>
                  <p className="text-xs text-[var(--text-muted)]">Gift Voucher</p>
                </div>
              </div>
              <button onClick={() => setDetailBrand(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Value selector */}
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Select Value</p>
                <div className="flex flex-wrap gap-2">
                  {modalVouchers.map((v) => {
                    const avail    = v.is_available;
                    const selected = v.id === selectedVoucherId;
                    return (
                      <button
                        key={v.id}
                        disabled={!avail}
                        onClick={() => setSelectedVoucherId(v.id)}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                          selected
                            ? "border-[var(--brand-500)] bg-[var(--brand-500)]/10 text-[var(--brand-500)]"
                            : avail
                            ? "border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand-500)]"
                            : "border-[var(--border-default)] text-[var(--text-muted)] opacity-50 cursor-not-allowed line-through"
                        }`}
                      >
                        ₹{v.value_inr}
                        {!avail && <span className="block text-[10px] font-normal">Sold out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected summary */}
              <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Voucher Value</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">₹{selectedVoucher.value_inr}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Coins Required</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <NexCoinIcon size={16} />
                    <span className="text-xl font-bold text-[var(--brand-500)]">{selectedVoucher.coins_required.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* How to use */}
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">How to use</p>
                <ol className="space-y-2.5">
                  {HOW_TO_USE.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-[var(--brand-500)]/15 text-[var(--brand-500)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-[var(--text-secondary)]">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Terms */}
              <div className="rounded-lg bg-[var(--surface-subtle)] p-4">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Terms &amp; Conditions</p>
                <ul className="space-y-1.5">
                  {TERMS.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <span className="mt-0.5 flex-shrink-0">·</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-default)] flex gap-3 flex-shrink-0">
              <Button variant="ghost" className="flex-1" onClick={() => setDetailBrand(null)}>Close</Button>
              <Button
                className="flex-1"
                disabled={!selectedVoucher.is_available || (nexcoins ?? 0) < selectedVoucher.coins_required || loading}
                onClick={() => addToCart(selectedVoucher)}
              >
                {!selectedVoucher.is_available
                  ? "Sold Out"
                  : (nexcoins ?? 0) < selectedVoucher.coins_required
                  ? "Need more coins"
                  : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Sidebar ──────────────────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-[var(--surface-card)] border-l border-[var(--border-default)] flex flex-col h-full">
            <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--border-default)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[var(--brand-500)]" />
                <h2 className="font-semibold text-[var(--text-primary)]">Cart</h2>
                {cartCount > 0 && (
                  <span className="h-5 min-w-[20px] px-1 rounded-full bg-[var(--brand-500)] text-white text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <ShoppingCart className="h-10 w-10 text-[var(--text-muted)]" />
                <p className="font-semibold text-[var(--text-primary)]">Your cart is empty</p>
                <p className="text-sm text-[var(--text-secondary)]">Browse vouchers and add them to your cart.</p>
                <Button variant="secondary" size="sm" onClick={() => setCartOpen(false)}>Browse Vouchers</Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {cart.map((entry) => {
                    const colors = brandColor(entry.voucher.brand_name);
                    return (
                      <div key={entry.voucher.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg ${colors.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                          {entry.voucher.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{entry.voucher.brand_name}</p>
                          <p className="text-xs text-[var(--text-muted)]">₹{entry.voucher.value_inr} · {entry.voucher.coins_required.toLocaleString()} coins each</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => updateQty(entry.voucher.id, -1)} className="h-6 w-6 rounded-md border border-[var(--border-default)] flex items-center justify-center hover:bg-[var(--surface-card)]">
                            <Minus className="h-3 w-3 text-[var(--text-muted)]" />
                          </button>
                          <span className="text-sm font-semibold text-[var(--text-primary)] w-6 text-center">{entry.qty}</span>
                          <button onClick={() => updateQty(entry.voucher.id, 1)} className="h-6 w-6 rounded-md border border-[var(--border-default)] flex items-center justify-center hover:bg-[var(--surface-card)]">
                            <Plus className="h-3 w-3 text-[var(--text-muted)]" />
                          </button>
                          <button onClick={() => removeFromCart(entry.voucher.id)} className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 ml-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--border-default)] px-5 py-4 space-y-4 flex-shrink-0">
                  <div>
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-2 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] h-9">
                        <Tag className="h-3.5 w-3.5 text-[var(--text-muted)] flex-shrink-0" />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null); setCouponError(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") applyCoupon(); }}
                          placeholder="Coupon code"
                          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                        />
                        {coupon && <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />}
                      </div>
                      <Button size="sm" variant="secondary" disabled={!couponCode.trim() || applyingCoupon} onClick={applyCoupon} className="h-9 px-3 flex-shrink-0">
                        {applyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {couponError && <p className="text-xs text-red-400 mt-1.5">{couponError}</p>}
                    {coupon && (
                      <p className="text-xs text-green-400 mt-1.5">
                        ✓ {coupon.discountPercent > 0 ? `${coupon.discountPercent}% off` : `${coupon.discountCoins.toLocaleString()} coins off`} applied!
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Subtotal</span>
                      <span className="text-[var(--text-primary)]">{cartTotal.toLocaleString()} coins</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-green-400">Coupon discount</span>
                        <span className="text-green-400">−{discount.toLocaleString()} coins</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-[var(--text-primary)]">Total</span>
                      <span className="text-[var(--brand-500)]">{finalTotal.toLocaleString()} coins</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Your balance</span>
                      <span className={`font-medium ${(nexcoins ?? 0) >= finalTotal ? "text-[var(--text-muted)]" : "text-red-400"}`}>
                        {(nexcoins ?? 0).toLocaleString()} coins
                      </span>
                    </div>
                  </div>

                  {redeemError && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{redeemError}</p>}

                  <Button className="w-full" disabled={redeeming || (nexcoins ?? 0) < finalTotal || loading} onClick={redeemCart}>
                    {redeeming
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</>
                      : (nexcoins ?? 0) < finalTotal
                      ? "Insufficient coins"
                      : `Redeem All · ${finalTotal.toLocaleString()} coins`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Success Modal ────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl text-center">
            <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {successCount === 1 ? "Voucher Requested!" : `${successCount} Vouchers Requested!`}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Your vouchers will be processed within 24–48 hours. Track them in My Vouchers.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowSuccess(false)}>Keep Shopping</Button>
              <Button className="flex-1" asChild>
                <Link href="/dashboard/vouchers">My Vouchers</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
