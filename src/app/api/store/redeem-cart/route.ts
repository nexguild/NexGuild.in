/*
  Required SQL (run once in Supabase SQL editor):

  CREATE TABLE IF NOT EXISTS voucher_inventory (
    voucher_id   TEXT PRIMARY KEY,
    is_available BOOLEAN DEFAULT true,
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code             TEXT UNIQUE NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    discount_coins   INTEGER DEFAULT 0,
    max_uses         INTEGER DEFAULT 1,
    used_count       INTEGER DEFAULT 0,
    expires_at       TIMESTAMPTZ,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT NOW()
  );
*/

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { notifyAdmins } from "@/lib/email";
import { getProfileCountryCode } from "@/lib/countries";
import { getVoucherDiscountedCoins } from "@/lib/voucher-pricing";

interface CartItem {
  voucherId: string;
}

interface Voucher {
  id: string;
  brand_name: string;
  value_inr: number | null;
  value_usd: number | null;
  coins_required: number;
  discount_percent: number;
  country_codes: string[];
  country_codes_verified: boolean;
  is_available: boolean;
}

function formatVoucherValue(voucher: Voucher, countryCode: string | null): string {
  if (countryCode === "IN" && voucher.value_inr && voucher.value_inr > 0) return `₹${voucher.value_inr}`;
  return "value unavailable";
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { items?: CartItem[]; couponCode?: string | null };
  const { items, couponCode } = body;

  if (!Array.isArray(items) || items.length === 0 || items.length > 100
    || items.some((item) => !item || typeof item.voucherId !== "string" || !item.voucherId)) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("joined_at, country, country_code")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) {
    console.error("[redeem-cart] contributor profile lookup failed:", profileError?.message ?? "No profile row returned.");
    return NextResponse.json({ error: "Unable to verify your account details." }, { status: 500 });
  }
  const countryCode = getProfileCountryCode(profile.country_code, profile.country);
  if (countryCode !== "IN") {
    return NextResponse.json({ error: "Gift-card vouchers are currently available only to contributors in India." }, { status: 403 });
  }

  const voucherIds = [...new Set(items.map((item) => item.voucherId))];
  const { data: catalog, error: catalogError } = await admin
    .from("voucher_inventory")
    .select("id, brand_name, value_inr, value_usd, coins_required, discount_percent, country_codes, country_codes_verified, is_available")
    .in("id", voucherIds);
  if (catalogError) {
    console.error("[redeem-cart] voucher catalog lookup failed:", catalogError.message);
    return NextResponse.json({ error: "Unable to verify the selected rewards." }, { status: 500 });
  }

  const vouchersById = new Map(((catalog ?? []) as Voucher[]).map((voucher) => [voucher.id, voucher]));
  const selectedVouchers: Voucher[] = [];
  for (const item of items) {
    const voucher = vouchersById.get(item.voucherId);
    if (!voucher) return NextResponse.json({ error: "A selected reward is no longer available." }, { status: 400 });
    if (!voucher.is_available) return NextResponse.json({ error: `${voucher.brand_name} is currently unavailable.` }, { status: 400 });
    if (!voucher.country_codes_verified) {
      return NextResponse.json({ error: `${voucher.brand_name} is temporarily unavailable while its country eligibility is being confirmed.` }, { status: 400 });
    }
    if (!voucher.country_codes?.includes("IN")) {
      return NextResponse.json({ error: `${voucher.brand_name} is not available in your country.` }, { status: 400 });
    }
    if (!Number.isSafeInteger(voucher.coins_required) || voucher.coins_required <= 0
      || !Number.isSafeInteger(voucher.discount_percent) || voucher.discount_percent < 0 || voucher.discount_percent > 99
      || typeof voucher.value_inr !== "number" || !Number.isSafeInteger(voucher.value_inr) || voucher.value_inr <= 0
      || voucher.value_usd !== null) {
      console.error("[redeem-cart] invalid catalog price for voucher:", voucher.id);
      return NextResponse.json({ error: "A selected reward has an invalid price. Please contact support." }, { status: 500 });
    }
    selectedVouchers.push(voucher);
  }

  // 48-hour account age gate for first withdrawal
  const joinedAt = new Date((profile as { joined_at: string | null } | null)?.joined_at ?? 0);
  const hoursSinceJoin = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceJoin < 48) {
    const { count: prevDelivered } = await admin
      .from("voucher_requests")
      .select("*", { count: "exact", head: true })
      .eq("contributor_id", user.id)
      .eq("status", "delivered");
    if ((prevDelivered ?? 0) === 0) {
      const hoursLeft = Math.ceil(48 - hoursSinceJoin);
      return NextResponse.json({
        error: `Your account must be at least 48 hours old before your first withdrawal. Please wait ${hoursLeft} more hour${hoursLeft === 1 ? "" : "s"}.`,
      }, { status: 400 });
    }
  }

  const salePrices = selectedVouchers.map((voucher) => getVoucherDiscountedCoins(voucher.coins_required, voucher.discount_percent));
  const totalCoins = salePrices.reduce((sum, coins) => sum + coins, 0);
  if (!Number.isSafeInteger(totalCoins)) {
    return NextResponse.json({ error: "Cart total is too large." }, { status: 400 });
  }

  // Validate coupon if provided
  let discountCoins = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("id, discount_percent, discount_coins, max_uses, used_count, expires_at, is_active")
      .eq("code", couponCode.trim().toUpperCase())
      .single();

    if (coupon?.is_active) {
      const expired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
      const exhausted = coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses;
      if (!expired && !exhausted) {
        couponId = coupon.id;
        if (coupon.discount_percent > 0) {
          discountCoins = Math.floor(totalCoins * coupon.discount_percent / 100);
        } else if (coupon.discount_coins > 0) {
          discountCoins = Math.min(coupon.discount_coins, totalCoins);
        }
      }
    }
  }

  const finalTotal = Math.max(0, totalCoins - discountCoins);
  const chargedCoins = salePrices.map((coins) => Math.floor(coins * finalTotal / totalCoins));
  let undistributedCoins = finalTotal - chargedCoins.reduce((sum, coins) => sum + coins, 0);
  for (let index = 0; undistributedCoins > 0; index = (index + 1) % chargedCoins.length) {
    chargedCoins[index] += 1;
    undistributedCoins -= 1;
  }

  // Reserve coins atomically so concurrent redemptions cannot spend the same balance.
  const { data: reserved, error: reserveErr } = await admin.rpc("reserve_nexcoins", {
    p_contributor_id: user.id,
    p_coins: finalTotal,
  });
  if (reserveErr) {
    console.error("[redeem-cart] coin reservation error:", reserveErr.message);
    return NextResponse.json({ error: "Unable to reserve NexCoins. Please try again." }, { status: 500 });
  }
  if (!reserved) {
    return NextResponse.json({ error: "Insufficient NexCoins balance." }, { status: 400 });
  }

  // Insert all voucher requests
  const inserts = selectedVouchers.map((voucher, index) => ({
    contributor_id: user.id,
    voucher_type:   `${voucher.brand_name} ${formatVoucherValue(voucher, countryCode)} Voucher`,
    voucher_value:  null,
    coins_spent:    voucher.coins_required,
    charged_coins:  chargedCoins[index],
    status:         "pending",
  }));

  const { error: insertErr } = await admin.from("voucher_requests").insert(inserts);
  if (insertErr) {
    const { error: refundErr } = await admin.rpc("refund_nexcoins", {
      p_contributor_id: user.id,
      p_coins: finalTotal,
    });
    if (refundErr) {
      console.error("[redeem-cart] reservation refund error:", refundErr.message);
    }
    return NextResponse.json({ error: "Failed to create voucher requests." }, { status: 500 });
  }

  // Log coin transaction (single entry for the whole cart)
  await admin.from("coin_transactions").insert({
    contributor_id: user.id,
    amount:         finalTotal,
    type:           "redeemed",
    source:         "voucher",
    description:    `Redeemed ${items.length} voucher${items.length > 1 ? "s" : ""} from store`,
    created_at:     new Date().toISOString(),
  });

  // Increment coupon used_count
  if (couponId) {
    const { data: cur } = await admin
      .from("coupons")
      .select("used_count")
      .eq("id", couponId)
      .single();
    if (cur) {
      await admin.from("coupons").update({ used_count: (cur as { used_count: number }).used_count + 1 }).eq("id", couponId);
    }
  }

  const { data: balanceProfile } = await admin
    .from("profiles")
    .select("nexcoins")
    .eq("id", user.id)
    .single();
  const newBalance = (balanceProfile as { nexcoins: number } | null)?.nexcoins ?? null;

  // Notify admins async — fire and forget
  const { data: requesterProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
  const requesterName = (requesterProfile as { full_name: string | null } | null)?.full_name ?? "A contributor";
  const voucherSummary = selectedVouchers.length === 1
    ? `${selectedVouchers[0].brand_name} ${formatVoucherValue(selectedVouchers[0], countryCode)} Voucher`
    : `${selectedVouchers.length} vouchers`;
  notifyAdmins(admin, "new_voucher_request", {
    contributorName: requesterName,
    detail:    voucherSummary,
    actionUrl: "https://nexguild.in/admin/vouchers",
  });

  return NextResponse.json({
    success:      true,
    voucherCount: items.length,
    newBalance,
    coinsDeducted: finalTotal,
  });
}
