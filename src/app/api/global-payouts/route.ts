import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  GLOBAL_PAYOUT_PACKAGES,
  isGlobalPayoutMethod,
  validatePayoutDestination,
} from "@/lib/global-payout";

async function getContributor(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { error: NextResponse.json({ error: "Sign in to access contributor cashout." }, { status: 401 }) };
  }

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return { error: NextResponse.json({ error: "Your session is invalid or expired. Sign in again." }, { status: 401 }) };
  }

  const { data: profile, error } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error) {
    console.error("[global-payouts] contributor profile lookup failed:", error.message);
    return { error: NextResponse.json({ error: "Unable to verify your account. Please try again." }, { status: 500 }) };
  }
  if (!profile) {
    return { error: NextResponse.json({ error: "Your account profile is missing. Sign out and back in; contact support if this continues." }, { status: 403 }) };
  }
  if (profile.role !== "contributor") {
    return { error: NextResponse.json({ error: "Contributor account required. Cashout is available only to contributor accounts." }, { status: 403 }) };
  }
  return { admin, user };
}

export async function GET(req: NextRequest) {
  const ctx = await getContributor(req);
  if ("error" in ctx) return ctx.error;

  const { data, error } = await ctx.admin
    .from("global_payout_requests")
    .select("id, coins_requested, usdt_amount, payout_method, status, payment_reference, rejection_reason, created_at, paid_at")
    .eq("contributor_id", ctx.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[global-payouts] contributor history query failed:", error.message);
    return NextResponse.json({ error: "Unable to load payout history." }, { status: 500 });
  }
  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContributor(req);
  if ("error" in ctx) return ctx.error;

  let body: {
    coinsRequested?: unknown;
    payoutMethod?: unknown;
    destination?: unknown;
    confirmation?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const coinsRequested = body.coinsRequested;
  if (typeof coinsRequested !== "number" || !GLOBAL_PAYOUT_PACKAGES.some((item) => item.coins === coinsRequested)) {
    return NextResponse.json({ error: "Choose an available payout amount." }, { status: 400 });
  }
  if (typeof body.payoutMethod !== "string" || !isGlobalPayoutMethod(body.payoutMethod)) {
    return NextResponse.json({ error: "Choose a supported payout method." }, { status: 400 });
  }
  if (typeof body.destination !== "string") {
    return NextResponse.json({ error: "Enter your payout destination." }, { status: 400 });
  }
  const destinationError = validatePayoutDestination(body.payoutMethod, body.destination);
  if (destinationError) return NextResponse.json({ error: destinationError }, { status: 400 });
  if (body.confirmation !== true) {
    return NextResponse.json({ error: "Confirm that your payout details are correct." }, { status: 400 });
  }

  const usdtAmount = coinsRequested / 1_000;
  const { data: requestId, error } = await ctx.admin.rpc("create_global_payout_request", {
    p_contributor_id: ctx.user.id,
    p_coins: coinsRequested,
    p_usdt: usdtAmount,
    p_method: body.payoutMethod,
    p_destination: body.destination.trim(),
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already have a payout request awaiting review." }, { status: 409 });
    }
    if (error.message.includes("insufficient_balance")) {
      return NextResponse.json({ error: "You do not have enough NexCoins for this payout." }, { status: 400 });
    }
    if (error.message.includes("invalid_payout_request")) {
      return NextResponse.json({ error: "The payout details are invalid." }, { status: 400 });
    }
    console.error("[global-payouts] request creation failed:", error.message);
    return NextResponse.json({ error: "Unable to submit the payout request." }, { status: 500 });
  }

  return NextResponse.json({ success: true, requestId }, { status: 201 });
}
