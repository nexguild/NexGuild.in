import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { binanceRedemptionPaidHtml, binanceRedemptionRejectedHtml, FROM_NOREPLY, getResend } from "@/lib/email";

const ALLOWED_ROLES = ["owner", "admin", "finance"] as const;

function makeAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

async function authorize(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = makeAdmin();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role ?? "";
  return ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number]) ? { admin, userId: user.id } : null;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await ctx.admin
    .from("binance_redemption_requests")
    .select("id, contributor_id, coins_requested, usdt_amount, binance_uid, binance_username, status, payment_reference, payment_proof_url, rejection_reason, admin_notes, reviewed_by, reviewed_at, paid_at, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { id?: string; action?: "paid" | "rejected" | "under_review"; paymentReference?: string; rejectionReason?: string; adminNotes?: string; paymentProofUrl?: string };
  if (!body.id || !body.action) return NextResponse.json({ error: "Request ID and action are required." }, { status: 400 });

  const { data: item } = await ctx.admin.from("binance_redemption_requests").select("*").eq("id", body.id).single();
  if (!item) return NextResponse.json({ error: "Redemption request not found." }, { status: 404 });
  if (!["pending", "under_review"].includes(item.status)) return NextResponse.json({ error: "This request has already been finalized." }, { status: 409 });
  if (body.action === "paid" && !body.paymentReference?.trim()) return NextResponse.json({ error: "Payment transaction reference is required." }, { status: 400 });
  if (body.action === "rejected" && !body.rejectionReason?.trim()) return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: body.action,
    reviewed_by: ctx.userId,
    reviewed_at: now,
    updated_at: now,
    admin_notes: body.adminNotes?.trim() || null,
    payment_proof_url: body.paymentProofUrl?.trim() || null,
  };
  if (body.action === "paid") {
    update.payment_reference = body.paymentReference!.trim();
    update.paid_at = now;
  }
  if (body.action === "rejected") update.rejection_reason = body.rejectionReason!.trim();

  const { error } = await ctx.admin.from("binance_redemption_requests").update(update).eq("id", body.id).eq("status", item.status);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "That payment reference is already in use." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.action === "rejected") {
    const { error: refundError } = await ctx.admin.rpc("refund_nexcoins", { p_contributor_id: item.contributor_id, p_coins: item.coins_requested });
    if (refundError) return NextResponse.json({ error: "Request rejected but coin refund failed; contact the database administrator." }, { status: 500 });
    await ctx.admin.from("coin_transactions").insert({
      contributor_id: item.contributor_id,
      amount: item.coins_requested,
      type: "earned",
      source: "binance_pay_refund",
      description: `Refund for rejected Binance Pay redemption ${item.id}`,
    });
  }

  await ctx.admin.from("notifications").insert({
    user_id: item.contributor_id,
    type: "system",
    title: body.action === "paid" ? "Binance Pay redemption paid" : body.action === "rejected" ? "Binance Pay redemption rejected" : "Binance Pay redemption under review",
    message: body.action === "paid" ? `Your ${item.usdt_amount} USDT redemption was paid. Reference: ${body.paymentReference}` : body.action === "rejected" ? `Your redemption was rejected and ${item.coins_requested.toLocaleString()} NexCoins were refunded. Reason: ${body.rejectionReason}` : "Your Binance Pay redemption is now under review.",
  });

  const { data: contributor } = await ctx.admin
    .from("profiles")
    .select("email, full_name")
    .eq("id", item.contributor_id)
    .single();
  const resend = getResend();
  if (resend && contributor?.email && body.action !== "under_review") {
    const paid = body.action === "paid";
    await resend.emails.send({
      from: FROM_NOREPLY,
      to: contributor.email,
      subject: paid ? "Your Binance Pay redemption was paid" : "Your Binance Pay redemption was rejected",
      html: paid
        ? binanceRedemptionPaidHtml(contributor.full_name ?? "there", item.usdt_amount, body.paymentReference!)
        : binanceRedemptionRejectedHtml(contributor.full_name ?? "there", item.coins_requested, body.rejectionReason!),
    });
  }

  return NextResponse.json({ success: true, status: body.action });
}
