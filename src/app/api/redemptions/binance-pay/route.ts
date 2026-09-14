import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getResend, FROM_NOREPLY } from "@/lib/email";

const COINS_PER_USDT = 1_000;
const ALLOWED_PACKAGES = [10_000, 20_000, 50_000];

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  return user ? { admin, user } : null;
}

export async function GET(req: NextRequest) {
  const ctx = await getUser(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await ctx.admin
    .from("binance_redemption_requests")
    .select("id, coins_requested, usdt_amount, binance_uid, binance_username, status, payment_reference, rejection_reason, created_at, paid_at")
    .eq("contributor_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getUser(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    coinsRequested?: number;
    binanceUid?: string;
    binanceUsername?: string;
    confirmation?: boolean;
  };
  const coinsRequested = Number(body.coinsRequested);
  const uid = body.binanceUid?.trim();
  const username = body.binanceUsername?.trim();

  if (!Number.isInteger(coinsRequested) || !ALLOWED_PACKAGES.includes(coinsRequested)) {
    return NextResponse.json({ error: "Please select one of the available redemption packages: 10, 20, or 50 USDT." }, { status: 400 });
  }
  if (!uid || uid.length < 4 || !username || username.length < 2) {
    return NextResponse.json({ error: "Binance UID and username are required." }, { status: 400 });
  }
  if (body.confirmation !== true) {
    return NextResponse.json({ error: "Please confirm that your Binance details are correct." }, { status: 400 });
  }

  const { count } = await ctx.admin
    .from("binance_redemption_requests")
    .select("id", { count: "exact", head: true })
    .eq("contributor_id", ctx.user.id)
    .in("status", ["pending", "under_review"]);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "You already have a pending Binance Pay redemption." }, { status: 409 });
  }

  const { data: reserved, error: reserveError } = await ctx.admin.rpc("reserve_nexcoins", {
    p_contributor_id: ctx.user.id,
    p_coins: coinsRequested,
  });
  if (reserveError || reserved !== true) {
    return NextResponse.json({ error: "Insufficient NexCoins balance." }, { status: 400 });
  }

  const usdtAmount = coinsRequested / COINS_PER_USDT;
  const { data: request, error: insertError } = await ctx.admin
    .from("binance_redemption_requests")
    .insert({
      contributor_id: ctx.user.id,
      coins_requested: coinsRequested,
      usdt_amount: usdtAmount,
      binance_uid: uid,
      binance_username: username,
      status: "pending",
    })
    .select("id, coins_requested, usdt_amount, status, created_at")
    .single();

  if (insertError || !request) {
    await ctx.admin.rpc("refund_nexcoins", { p_contributor_id: ctx.user.id, p_coins: coinsRequested });
    return NextResponse.json({ error: "Could not create the redemption request." }, { status: 500 });
  }

  await ctx.admin.from("coin_transactions").insert({
    contributor_id: ctx.user.id,
    amount: coinsRequested,
    type: "redeemed",
    source: "binance_pay",
    description: `Reserved ${usdtAmount} USDT Binance Pay redemption`,
  });

  const { data: profile } = await ctx.admin.from("profiles").select("email, full_name").eq("id", ctx.user.id).single();
  await ctx.admin.from("notifications").insert({
    user_id: ctx.user.id,
    type: "system",
    title: "Binance Pay redemption submitted",
    message: `Your request for ${usdtAmount} USDT is pending finance review.`,
  });
  const resend = getResend();
  if (resend && profile?.email) {
    await resend.emails.send({
      from: FROM_NOREPLY,
      to: profile.email,
      subject: "Binance Pay redemption submitted",
      html: `<p>Hi ${profile.full_name ?? "there"},</p><p>Your request for <strong>${usdtAmount} USDT</strong> (${coinsRequested.toLocaleString()} NexCoins) is pending finance review.</p><p>We will update you when it is paid or rejected.</p>`,
    });
  }

  return NextResponse.json({ success: true, request });
}
