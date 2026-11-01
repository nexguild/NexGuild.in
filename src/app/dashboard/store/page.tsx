"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, X, Loader2, CheckCircle, Tag, Plus, Minus, Trash2, Gift, Globe2 } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";
import { GlobalPayoutCard } from "@/components/dashboard/GlobalPayoutCard";
import { formatNexcoins } from "@/lib/nexcoins";
import { getCountryName, isCountryCode } from "@/lib/countries";
import { VOUCHER_CATEGORIES } from "@/lib/voucher-categories";

interface DbVoucher {
  id: string;
  brand_name: string;
  description: string;
  value_inr: number | null;
  coins_required: number;
  category: string;
  emoji: string;
  country_codes: string[];
  country_codes_verified: boolean;
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

// Modal icon colors (kept for brand detail modal header)
const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  "Amazon":      { bg: "bg-orange-500/15", text: "text-orange-400" },
  "Amazon.com":  { bg: "bg-orange-500/15", text: "text-orange-400" },
  "Flipkart":    { bg: "bg-blue-500/15",   text: "text-blue-400" },
  "Google Play": { bg: "bg-green-500/15",  text: "text-green-400" },
  "Zomato":      { bg: "bg-red-500/15",    text: "text-red-400" },
  "Steam":       { bg: "bg-sky-500/15",    text: "text-sky-400" },
};

// Card top-banner gradients
const BRAND_GRADIENTS: Record<string, string> = {
  "Amazon":      "from-orange-400 to-orange-500",
  "Amazon.com":  "from-orange-400 to-orange-500",
  "Flipkart":    "from-blue-500 to-blue-600",
  "Google Play": "from-green-400 to-green-500",
  "Zomato":      "from-red-400 to-red-500",
  "Steam":       "from-sky-500 to-sky-600",
};

function brandColor(brand: string) {
  return BRAND_COLORS[brand] ?? { bg: "bg-[var(--brand-500)]/15", text: "text-[var(--brand-500)]" };
}
function brandGradient(brand: string): string {
  return BRAND_GRADIENTS[brand] ?? "from-teal-400 to-teal-500";
}
function formatValue(v: DbVoucher, countryCode: string | null): string {
  if (countryCode === "IN" && v.value_inr && v.value_inr > 0) return `₹${v.value_inr}`;
  return "—";
}

const CATEGORIES = [{ value: "all", label: "All", emoji: "🎁" }, ...VOUCHER_CATEGORIES];

const HOW_TO_USE = [
  "Click Redeem in your cart to submit a request",
  "Our team reviews the request; processing times vary",
  "Your voucher code appears in My Vouchers",
  "Check the issuer's terms before using your code",
];

const TERMS = [
  "Vouchers are non-refundable once redeemed",
  "Validity and usage follow the issuer's terms",
  "Cannot be exchanged for NexCoins or cash",
  "One voucher code per redemption request",
];

export default function StorePage() {
  const tokenRef = useRef<string | null>(null);

  const [nexcoins, setNexcoins]   = useState<number | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [vouchers, setVouchers]   = useState<DbVoucher[]>([]);
  const [activeSection, setActiveSection] = useState<"rewards" | "payouts">("rewards");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAffordable, setShowAffordable]     = useState(false);

  const [detailBrand, setDetailBrand]             = useState<string | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>("");

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

      const [profileResult, voucherResult] = await Promise.all([
        supabase.from("profiles").select("nexcoins, country_code").eq("id", user.id).single(),
        supabase
          .from("voucher_inventory")
          .select("id, brand_name, description, value_inr, coins_required, category, emoji, country_codes, country_codes_verified, is_available")
          .order("brand_name", { ascending: true })
          .order("coins_required", { ascending: true }),
      ]);

      if (profileResult.error || !profileResult.data) {
        console.error("[store] contributor profile lookup failed:", profileResult.error?.message ?? "No profile row returned.");
        setCatalogError("We couldn't load your country settings. Refresh the page or contact support.");
        setLoading(false);
        return;
      }
      if (voucherResult.error || !voucherResult.data) {
        console.error("[store] voucher inventory lookup failed:", voucherResult.error?.message ?? "No catalog rows returned.");
        setCatalogError("We couldn't load the reward catalog. Please try again later.");
        setLoading(false);
        return;
      }
      const profile = profileResult.data as { nexcoins: number; country_code: string | null };
      setNexcoins(profile?.nexcoins ?? 0);
      const contributorCountry = isCountryCode(profile?.country_code) ? profile.country_code : null;
      setCountryCode(contributorCountry);
      setVouchers(contributorCountry === "IN"
        ? ((voucherResult.data as DbVoucher[]) ?? []).filter((voucher) =>
          voucher.country_codes_verified && voucher.country_codes?.includes("IN")
        )
        : []);
      setLoading(false);
    }
    fetchData();
  }, []);

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

  const modalVouchers   = detailBrand ? brandVouchers(detailBrand) : [];
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
              voucherId: e.voucher.id,
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
    if (selectedCategory !== "all" && category !== selectedCategory) return false;
    if (showAffordable) {
      const minCoins = Math.min(...brandVouchers(brand).map((v) => v.coins_required));
      if ((nexcoins ?? 0) < minCoins) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative isolate overflow-hidden rounded-[1.6rem] bg-[#103f38] p-6 text-white shadow-[0_18px_45px_rgba(15,76,69,0.14)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(214,182,110,0.22),transparent_35%),radial-gradient(ellipse_at_5%_100%,rgba(20,184,166,0.16),transparent_42%)]" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">Cashout</p>
            <h1 className="text-2xl font-bold text-white mb-1">Cashout &amp; Rewards</h1>
            <p className="text-sm text-white/75">Redeem NexCoins for vouchers or request a global USDT payout.</p>
            <p className="mt-1 text-xs text-white/60">
              Gift vouchers are limited to India. Showing options for {countryCode ? getCountryName(countryCode) : "your account"}.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link href="/dashboard/vouchers" className="inline-flex text-sm font-semibold text-[#e4c787] transition-colors hover:text-white">
                View my vouchers →
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Premium balance card */}
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <div>
                  <p className="text-white font-bold text-lg leading-tight">
                    {loading ? "—" : formatNexcoins(nexcoins ?? 0)}
                    <span className="text-white/80 font-semibold text-sm ml-1">NexCoins</span>
                  </p>
                  <p className="text-white/70 text-xs">Available to redeem</p>
                </div>
              </div>
            </div>
            {/* Cart button */}
            {activeSection === "rewards" && <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative h-10 w-10 flex items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-sm transition-colors hover:bg-white/20"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </button>}
          </div>
        </div>
      </div>

      <div role="tablist" aria-label="Cashout and rewards options" className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-1.5">
        <button
          type="button"
          role="tab"
          id="store-rewards-tab"
          aria-controls="store-rewards-panel"
          aria-selected={activeSection === "rewards"}
          onClick={() => { setActiveSection("rewards"); setDetailBrand(null); }}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
            activeSection === "rewards"
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Gift className="h-4 w-4" />
          Gift vouchers
          <span className="rounded-full bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px]">{brandList.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="store-payouts-tab"
          aria-controls="store-payouts-panel"
          aria-selected={activeSection === "payouts"}
          onClick={() => { setActiveSection("payouts"); setDetailBrand(null); }}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
            activeSection === "payouts"
              ? "bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Globe2 className="h-4 w-4" />
          Global Payout
        </button>
      </div>

      {activeSection === "rewards" && (
      <div id="store-rewards-panel" role="tabpanel" aria-labelledby="store-rewards-tab" tabIndex={0} className="space-y-8">
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedCategory === cat.value
                  ? "bg-[var(--brand-500)] text-white border-[var(--brand-500)]"
                  : "bg-[var(--surface-card)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--brand-500)] hover:text-[var(--brand-500)]"
              }`}
            >
              <span aria-hidden="true">{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Affordability toggle */}
        <div className="flex items-center justify-end gap-2.5">
          <span className="text-sm text-[var(--text-secondary)] select-none">Show only what I can afford</span>
          <button
            type="button"
            role="switch"
            aria-checked={showAffordable}
            disabled={loading}
            onClick={() => setShowAffordable(!showAffordable)}
            className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-200 ${
              showAffordable ? "bg-[var(--brand-500)]" : "bg-[var(--border-strong)]"
            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${showAffordable ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
          </button>
        </div>
      </div>

      {/* ── Brand Grid ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse shadow-sm" />
          ))}
        </div>
      ) : displayedBrands.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-sm py-16 text-center px-6">
          {showAffordable && brandList.length > 0 ? (
            <>
              <p className="text-4xl mb-3">🏆</p>
              <p className="font-bold text-[var(--text-primary)] text-lg mb-1">Almost there!</p>
              <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
                Complete a few more tasks to unlock vouchers — you&apos;re getting close!
              </p>
              <Link
                href="/dashboard/opportunities"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-500)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Browse Opportunities →
              </Link>
            </>
          ) : (
            <>
              <p className="text-4xl mb-3">🎁</p>
              <p className="font-bold text-[var(--text-primary)] text-lg mb-1">
                {countryCode === "IN" ? "No Indian vouchers are currently stocked" : "Gift-card vouchers are currently available only in India"}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {countryCode === "IN"
                  ? "We’ll list Indian vouchers again when their purchase source and delivery availability are confirmed."
                  : "Switch to the Global Payout tab to request a global USDT payout."}
              </p>
            </>
          )}
          {catalogError && (
            <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500">
              {catalogError}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedBrands.map(({ brand }) => {
            const bv        = brandVouchers(brand);
            const available = isBrandAvailable(brand);
            const minCoins  = Math.min(...bv.map((v) => v.coins_required));
            const emoji     = bv[0]?.emoji ?? "🎁";
            const canAfford = available && (nexcoins ?? 0) >= minCoins;
            const gradient  = brandGradient(brand);
            const needed    = minCoins - (nexcoins ?? 0);

            return (
              <button
                type="button"
                key={brand}
                onClick={() => !loading && openBrandModal(brand)}
                aria-label={`View ${brand} voucher options`}
                className={`flex w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] text-left
                  shadow-sm hover:shadow-lg
                  hover:-translate-y-1 transition-all duration-200 cursor-pointer
                  ${!available ? "opacity-60" : ""}`}
              >
                {/* Top gradient banner */}
                <div className={`h-20 bg-gradient-to-r ${gradient} flex items-center justify-center flex-shrink-0`}>
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                    {emoji}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-base leading-tight">{brand}</h3>

                  {/* Denomination pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {bv.map((v) => (
                      <span
                        key={v.id}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          v.is_available
                            ? "bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]"
                            : "bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)] line-through"
                        }`}
                      >
                        {formatValue(v, countryCode)}
                      </span>
                    ))}
                  </div>

                  {/* Coin cost — prominent */}
                  <div className="flex items-center gap-1.5">
                    <NexCoinIcon size={18} />
                    <span className="text-xl font-bold text-[var(--text-primary)]">{minCoins.toLocaleString()}</span>
                    <span className="text-sm text-[var(--text-muted)]">NexCoins</span>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* CTA — visual only, card click opens modal */}
                  {!available ? (
                    <div className="w-full rounded-xl bg-[var(--surface-subtle)] text-[var(--text-muted)] text-sm font-semibold text-center py-2.5">
                      Sold Out
                    </div>
                  ) : !canAfford ? (
                    <div className="w-full rounded-xl bg-[var(--surface-subtle)] text-[var(--text-muted)] text-sm font-medium text-center py-2.5 leading-tight">
                      Need {needed.toLocaleString()} more coins
                    </div>
                  ) : (
                    <div className="w-full rounded-xl bg-[var(--brand-500)] text-white text-sm font-semibold text-center py-2.5">
                      Redeem Now →
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <Link href="/dashboard/vouchers" className="text-sm text-[var(--text-link)] hover:underline">
          View your redeemed vouchers →
        </Link>
      </div>
      </div>
      )}

      {activeSection === "payouts" && (
        <div id="store-payouts-panel" role="tabpanel" aria-labelledby="store-payouts-tab" tabIndex={0}>
          <GlobalPayoutCard
            nexcoins={nexcoins ?? 0}
            onBalanceChange={setNexcoins}
          />
        </div>
      )}

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
                        {formatValue(v, countryCode)}
                        {!avail && <span className="block text-[10px] font-normal">Sold out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Voucher Value</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{formatValue(selectedVoucher, countryCode)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Coins Required</p>
                  <div className="flex items-center gap-1.5 justify-end">
                    <NexCoinIcon size={16} />
                    <span className="text-xl font-bold text-[var(--brand-500)]">{selectedVoucher.coins_required.toLocaleString()}</span>
                  </div>
                </div>
              </div>

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
                          <p className="text-xs text-[var(--text-muted)]">{formatValue(entry.voucher, countryCode)} · {entry.voucher.coins_required.toLocaleString()} coins each</p>
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
                        {formatNexcoins(nexcoins ?? 0)} coins
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

      {activeSection === "rewards" && <BlogTipCard
        slug="nexcoins-to-vouchers-redemption"
        title="How to Redeem NexCoins for Vouchers"
        excerpt="A step-by-step guide to converting your NexCoins into real gift vouchers."
      />}

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
              Your request is in the review queue. Processing times vary; track its status in My Vouchers.
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
