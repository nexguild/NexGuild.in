"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingCart, X, Loader2, CheckCircle, Tag, Plus, Minus, Trash2, Gift, Globe2, ArrowUpRight, Sparkles, TicketCheck } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";
import { GlobalPayoutCard } from "@/components/dashboard/GlobalPayoutCard";
import { formatNexcoins } from "@/lib/nexcoins";
import { getCountryName, getProfileCountryCode } from "@/lib/countries";
import { VOUCHER_CATEGORIES } from "@/lib/voucher-categories";
import { getVoucherDiscountedCoins } from "@/lib/voucher-pricing";

interface DbVoucher {
  id: string;
  brand_name: string;
  description: string;
  value_inr: number | null;
  coins_required: number;
  discount_percent: number;
  category: string;
  emoji: string;
  how_to_use: string[];
  terms_and_conditions: string[];
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

function brandColor(brand: string) {
  return BRAND_COLORS[brand] ?? { bg: "bg-[var(--brand-500)]/15", text: "text-[var(--brand-500)]" };
}
function formatValue(v: DbVoucher, countryCode: string | null): string {
  if (countryCode === "IN" && v.value_inr && v.value_inr > 0) return `₹${v.value_inr}`;
  return "—";
}

const CATEGORIES = [{ value: "all", label: "All", emoji: "🎁" }, ...VOUCHER_CATEGORIES];

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
        supabase.from("profiles").select("nexcoins, country, country_code").eq("id", user.id).single(),
        supabase
          .from("voucher_inventory")
          .select("id, brand_name, description, value_inr, coins_required, discount_percent, category, emoji, how_to_use, terms_and_conditions, country_codes, country_codes_verified, is_available")
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
      const profile = profileResult.data as { nexcoins: number; country: string | null; country_code: string | null };
      setNexcoins(profile?.nexcoins ?? 0);
      const contributorCountry = getProfileCountryCode(profile?.country_code, profile?.country);
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
  function openBrandModal(brand: string) {
    const bv = brandVouchers(brand);
    const def = bv.find((v) => v.is_available) ?? bv[0];
    if (!def) return;
    setSelectedVoucherId(def.id);
    setDetailBrand(brand);
  }

  const modalVouchers   = detailBrand ? brandVouchers(detailBrand) : [];
  const selectedVoucher = vouchers.find((v) => v.id === selectedVoucherId) ?? null;

  const cartTotal  = cart.reduce((s, e) => s + getVoucherDiscountedCoins(e.voucher.coins_required, e.voucher.discount_percent) * e.qty, 0);
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
      const availableVouchers = brandVouchers(brand).filter((voucher) => voucher.is_available);
      if (availableVouchers.length === 0) return false;
      const minCoins = Math.min(...availableVouchers.map((v) => getVoucherDiscountedCoins(v.coins_required, v.discount_percent)));
      if ((nexcoins ?? 0) < minCoins) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(120deg,#0d2929_0%,#10443e_52%,#0b2738_100%)] p-6 text-white shadow-[0_24px_70px_rgba(4,20,34,0.32)] sm:p-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(214,182,110,0.2),transparent_34%),radial-gradient(ellipse_at_5%_100%,rgba(20,184,166,0.18),transparent_42%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border border-white/5" />
        <div aria-hidden className="pointer-events-none absolute -right-3 -top-9 h-44 w-44 rounded-full border border-white/5" />
        <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100">
              <Sparkles className="h-3.5 w-3.5 text-amber-200" /> Rewards &amp; cashout
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Make your NexCoins count.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75 sm:text-base">Choose a gift voucher or request a global USDT payout — all from one place.</p>
            <p className="mt-2 text-xs text-white/55">
              Gift vouchers are limited to India. Showing options for {countryCode ? getCountryName(countryCode) : "your account"}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/dashboard/vouchers" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/[0.13]">
                View my vouchers <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-[220px] rounded-2xl border border-white/15 bg-slate-950/25 px-4 py-3 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <NexCoinIcon size={20} />
                <div>
                  <p className="text-white font-bold text-xl leading-tight">
                    {loading ? "—" : formatNexcoins(nexcoins ?? 0)}
                    <span className="text-white/80 font-semibold text-sm ml-1">NexCoins</span>
                  </p>
                  <p className="mt-1 text-xs text-white/60">Your available balance</p>
                </div>
              </div>
            </div>
            {activeSection === "rewards" && <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.08] shadow-sm transition-colors hover:bg-white/[0.15]"
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

      <div role="tablist" aria-label="Cashout and rewards options" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          role="tab"
          id="store-rewards-tab"
          aria-controls="store-rewards-panel"
          aria-selected={activeSection === "rewards"}
          onClick={() => { setActiveSection("rewards"); setDetailBrand(null); }}
          className={`group relative flex min-h-[92px] items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 ${
            activeSection === "rewards"
              ? "border-teal-700 bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-[0_8px_24px_rgba(15,118,110,0.24)]"
              : "border-[var(--border-default)] bg-[var(--surface-card)] hover:border-teal-400/35 hover:bg-[var(--surface-subtle)]"
          }`}
        >
          <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border transition-colors ${
            activeSection === "rewards"
              ? "border-white/20 bg-white/15 text-white shadow-sm"
              : "border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] group-hover:text-teal-300"
          }`}>
            <Gift className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-base font-bold ${activeSection === "rewards" ? "text-white" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>Gift vouchers</span>
            <span className={`mt-1 block text-xs leading-4 ${activeSection === "rewards" ? "text-white/85" : "text-[var(--text-secondary)]"}`}>Shop available brands and redeem NexCoins</span>
          </span>
          <span className="flex flex-shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              activeSection === "rewards"
                ? "bg-white/15 text-white"
                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
            }`}>{brandList.length} {brandList.length === 1 ? "brand" : "brands"}</span>
            <span className={`text-[10px] font-semibold ${activeSection === "rewards" ? "text-white" : "text-[var(--text-secondary)]"}`}>{activeSection === "rewards" ? "Selected" : "Explore"}</span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          id="store-payouts-tab"
          aria-controls="store-payouts-panel"
          aria-selected={activeSection === "payouts"}
          onClick={() => { setActiveSection("payouts"); setDetailBrand(null); }}
          className={`group relative flex min-h-[92px] items-center gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5 ${
            activeSection === "payouts"
              ? "border-cyan-800 bg-gradient-to-r from-cyan-800 to-blue-800 text-white shadow-[0_8px_24px_rgba(8,145,178,0.24)]"
              : "border-[var(--border-default)] bg-[var(--surface-card)] hover:border-cyan-400/35 hover:bg-[var(--surface-subtle)]"
          }`}
        >
          <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border transition-colors ${
            activeSection === "payouts"
              ? "border-white/20 bg-white/15 text-white shadow-sm"
              : "border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] group-hover:text-cyan-300"
          }`}>
            <Globe2 className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-base font-bold ${activeSection === "payouts" ? "text-white" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`}>Global Payout</span>
            <span className={`mt-1 block text-xs leading-4 ${activeSection === "payouts" ? "text-white/85" : "text-[var(--text-secondary)]"}`}>Request a USDT payout from anywhere</span>
          </span>
          <span className="flex flex-shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              activeSection === "payouts"
                ? "bg-white/15 text-white"
                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"
            }`}>USDT</span>
            <span className={`text-[10px] font-semibold ${activeSection === "payouts" ? "text-white" : "text-[var(--text-secondary)]"}`}>{activeSection === "payouts" ? "Selected" : "Worldwide"}</span>
          </span>
        </button>
      </div>

      {activeSection === "rewards" && (
      <div id="store-rewards-panel" role="tabpanel" aria-labelledby="store-rewards-tab" tabIndex={0} className="space-y-8">
      {/* ── Filters ─────────────────────────────────────────────────── */}
      <div className="space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-sm sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Gift vouchers</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Pick a brand to compare available values and redeem.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-[var(--text-muted)] sm:flex"><TicketCheck className="h-4 w-4" /> {brandList.length} {brandList.length === 1 ? "brand" : "brands"}</span>
        </div>
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all ${
                selectedCategory === cat.value
                  ? "border-[var(--brand-500)] bg-[var(--brand-500)]/15 text-[var(--brand-400)] shadow-[inset_0_0_0_1px_rgba(20,184,166,0.12)]"
                  : "border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:border-[var(--brand-500)]/60 hover:text-[var(--text-primary)]"
              }`}
            >
              <span aria-hidden="true">{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Affordability toggle */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border-default)] pt-3">
          <span className="text-xs text-[var(--text-secondary)] select-none">Show rewards within my balance</span>
          <button
            type="button"
            role="switch"
            aria-label="Show only vouchers I can afford"
            aria-checked={showAffordable}
            disabled={loading}
            onClick={() => setShowAffordable(!showAffordable)}
            className={`flex h-6 w-10 flex-shrink-0 items-center rounded-full p-[2px] transition-colors duration-200 ${
              showAffordable ? "bg-[var(--brand-500)]" : "bg-[var(--border-strong)]"
            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2`}
            style={{ justifyContent: showAffordable ? "flex-end" : "flex-start" }}
          >
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>
      </div>

      {/* ── Brand Grid ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid justify-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 360px))" }}>
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
        <div className="grid justify-start gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 360px))" }}>
          {displayedBrands.map(({ brand }) => {
            const bv        = brandVouchers(brand);
            const availableVouchers = bv.filter((voucher) => voucher.is_available);
            const available = availableVouchers.length > 0;
            const minCoins  = Math.min(...(available ? availableVouchers : bv).map((v) => getVoucherDiscountedCoins(v.coins_required, v.discount_percent)));
            const canAfford = available && (nexcoins ?? 0) >= minCoins;
            const needed    = minCoins - (nexcoins ?? 0);
            const category  = VOUCHER_CATEGORIES.find((item) => item.value === bv[0]?.category);

            return (
              <button
                type="button"
                key={brand}
                onClick={() => !loading && openBrandModal(brand)}
                aria-label={`View ${brand} voucher options`}
                className={`group relative flex min-h-[206px] w-full overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-500)]/50 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${!available ? "opacity-70" : ""}`}
              >
                <div className="flex w-[68px] flex-shrink-0 flex-col items-center justify-between bg-[var(--brand-700)] px-2 py-4 text-white">
                  <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--brand-700)] bg-white text-xl shadow-inner">
                    {category?.emoji ?? "🎁"}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-200)]">Reward</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-[var(--text-secondary)]">{category?.label ?? "Reward"}</p>
                      <h3 className="mt-1 truncate text-lg font-bold leading-tight text-[var(--text-primary)]">{brand}</h3>
                    </div>
                    <span className={`mt-0.5 inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-semibold ${available ? "text-emerald-700 dark:text-emerald-300" : "text-[var(--text-muted)]"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-[var(--text-muted)]"}`} />
                      {available ? "In stock" : "Sold out"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold text-[var(--text-secondary)]">Available values</p>
                    <div className="flex min-h-8 flex-wrap gap-1.5">
                      {bv.map((v) => (
                        <span
                          key={v.id}
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                            v.is_available
                              ? "border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)]"
                              : "border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)] line-through"
                          }`}
                        >
                          <span>{formatValue(v, countryCode)}</span>
                          {v.discount_percent > 0 && <span className="ml-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{v.discount_percent}% off</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-medium text-[var(--text-secondary)]">From</span>
                      <span className="mt-0.5 flex items-center gap-1">
                        <NexCoinIcon size={16} />
                        <span className="text-sm font-bold text-[var(--text-primary)]">{minCoins.toLocaleString()}</span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)]">NexCoins</span>
                      </span>
                    </div>
                    <span className={`flex flex-shrink-0 items-center gap-1 rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors ${!available ? "border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-muted)]" : !canAfford ? "border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]" : "bg-[var(--brand-700)] text-white group-hover:bg-[var(--brand-600)]"}`}>
                      {!available ? "Unavailable" : !canAfford ? `Need ${needed.toLocaleString()}` : "View"}
                      {available && <ArrowUpRight className="h-3 w-3" />}
                    </span>
                  </div>
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
                        <span className="block">{formatValue(v, countryCode)}</span>
                        {v.discount_percent > 0 ? (
                          <span className="mt-1 flex items-center justify-center gap-1 text-[10px] font-medium">
                            <span className="text-[var(--text-muted)] line-through">{v.coins_required.toLocaleString()}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{getVoucherDiscountedCoins(v.coins_required, v.discount_percent).toLocaleString()} coins</span>
                          </span>
                        ) : <span className="mt-1 block text-[10px] font-medium text-[var(--text-secondary)]">{v.coins_required.toLocaleString()} coins</span>}
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
                    {selectedVoucher.discount_percent > 0 && <span className="text-xs text-[var(--text-muted)] line-through">{selectedVoucher.coins_required.toLocaleString()}</span>}
                    <span className="text-xl font-bold text-[var(--brand-500)]">{getVoucherDiscountedCoins(selectedVoucher.coins_required, selectedVoucher.discount_percent).toLocaleString()}</span>
                    {selectedVoucher.discount_percent > 0 && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{selectedVoucher.discount_percent}% off</span>}
                  </div>
                </div>
              </div>

              {selectedVoucher.how_to_use?.length > 0 && <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">How to use</p>
                <ol className="space-y-2.5">
                  {selectedVoucher.how_to_use.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="h-5 w-5 rounded-full bg-[var(--brand-500)]/15 text-[var(--brand-500)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-[var(--text-secondary)]">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>}

              {selectedVoucher.terms_and_conditions?.length > 0 && <div className="rounded-lg bg-[var(--surface-subtle)] p-4">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Terms &amp; Conditions</p>
                <ul className="space-y-1.5">
                  {selectedVoucher.terms_and_conditions.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <span className="mt-0.5 flex-shrink-0">·</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-default)] flex gap-3 flex-shrink-0">
              <Button variant="ghost" className="flex-1" onClick={() => setDetailBrand(null)}>Close</Button>
              <Button
                className="flex-1"
                disabled={!selectedVoucher.is_available || (nexcoins ?? 0) < getVoucherDiscountedCoins(selectedVoucher.coins_required, selectedVoucher.discount_percent) || loading}
                onClick={() => addToCart(selectedVoucher)}
              >
                {!selectedVoucher.is_available
                  ? "Sold Out"
                  : (nexcoins ?? 0) < getVoucherDiscountedCoins(selectedVoucher.coins_required, selectedVoucher.discount_percent)
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
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatValue(entry.voucher, countryCode)} ·{" "}
                            {entry.voucher.discount_percent > 0 && <span className="mr-1 line-through">{entry.voucher.coins_required.toLocaleString()}</span>}
                            <span className={entry.voucher.discount_percent > 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : ""}>
                              {getVoucherDiscountedCoins(entry.voucher.coins_required, entry.voucher.discount_percent).toLocaleString()} coins each
                            </span>
                          </p>
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
        title="How to Redeem NexCoins for Rewards"
        excerpt="Compare India-only gift vouchers with global USDT payout requests."
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
