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

interface CartItem {
  voucherType: string;
  coins: number;
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items, couponCode } = await req.json() as { items: CartItem[]; couponCode: string | null };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // 48-hour account age gate for first withdrawal
  const { data: ageProfile } = await admin
    .from("profiles")
    .select("joined_at")
    .eq("id", user.id)
    .single();
  const joinedAt = new Date((ageProfile as { joined_at: string | null } | null)?.joined_at ?? 0);
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

  const totalCoins = items.reduce((s, i) => s + i.coins, 0);

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

  // Check contributor's balance
  const { data: profile } = await admin
    .from("profiles")
    .select("nexcoins")
    .eq("id", user.id)
    .single();

  const currentBalance = (profile as { nexcoins: number } | null)?.nexcoins ?? 0;
  if (currentBalance < finalTotal) {
    return NextResponse.json({ error: "Insufficient NexCoins balance." }, { status: 400 });
  }

  // Insert all voucher requests
  const inserts = items.map((item) => ({
    contributor_id: user.id,
    voucher_type:   item.voucherType,
    voucher_value:  null,
    coins_spent:    item.coins,
    status:         "pending",
  }));

  const { error: insertErr } = await admin.from("voucher_requests").insert(inserts);
  if (insertErr) {
    return NextResponse.json({ error: "Failed to create voucher requests." }, { status: 500 });
  }

  // Deduct coins
  const newBalance = currentBalance - finalTotal;
  await admin.from("profiles").update({ nexcoins: newBalance }).eq("id", user.id);

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

  // Notify admins async — fire and forget
  const { data: requesterProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).single();
  const requesterName = (requesterProfile as { full_name: string | null } | null)?.full_name ?? "A contributor";
  const voucherSummary = items.length === 1 ? items[0].voucherType : `${items.length} vouchers`;
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
