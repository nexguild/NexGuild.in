import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

async function verifyAdmin(token: string) {
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile as { role: string | null } | null)?.role;
  if (!role || !(ADMIN_ROLES.UPPER as readonly string[]).includes(role)) return null;
  return { admin };
}

/**
 * POST /api/admin/referrals/void
 * Body: { referrerId: string }
 *
 * Flags all referral events for the given referrer and deducts the awarded
 * NexCoins from their balance. Used when fraud is detected.
 */
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAdmin(token);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { admin } = ctx;

  let body: { referrerId?: string } = {};
  try { body = await req.json(); } catch {}

  const { referrerId } = body;
  if (!referrerId) return NextResponse.json({ error: "referrerId required" }, { status: 400 });

  // Get all unflagged referral events for this referrer
  const { data: events } = await admin
    .from("referral_events")
    .select("id, nexcoins_awarded")
    .eq("referrer_id", referrerId)
    .eq("flagged", false);

  if (!events?.length) return NextResponse.json({ ok: true, voided: 0 });

  const totalToDeduct = events.reduce((sum, e) => sum + (e.nexcoins_awarded ?? 0), 0);
  const eventIds      = events.map((e) => e.id);

  // Flag all events
  await admin.from("referral_events").update({ flagged: true }).in("id", eventIds);

  // Deduct NexCoins from referrer's balance
  const { data: ref } = await admin.from("profiles").select("nexcoins, total_referral_earnings").eq("id", referrerId).single();
  const cur = (ref as { nexcoins: number | null; total_referral_earnings: number | null } | null);
  await admin.from("profiles").update({
    nexcoins:                Math.max(0, (cur?.nexcoins ?? 0) - totalToDeduct),
    total_referral_earnings: Math.max(0, (cur?.total_referral_earnings ?? 0) - totalToDeduct),
  }).eq("id", referrerId);

  // Coin transaction record for the deduction
  await admin.from("coin_transactions").insert({
    contributor_id: referrerId,
    amount:         -totalToDeduct,
    type:           "reversed",
    source:         "referral",
    description:    `Referral program voided (fraud review) — ${totalToDeduct} NexCoins deducted`,
  });

  console.log(`[admin/referrals/void] voided ${totalToDeduct} coins from referrer=${referrerId}`);
  return NextResponse.json({ ok: true, voided: totalToDeduct });
}
