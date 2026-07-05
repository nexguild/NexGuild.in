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
  return { admin, userId: user.id };
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await verifyAdmin(token);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { admin } = ctx;

  // Platform-wide referral events stats
  const { data: events } = await admin
    .from("referral_events")
    .select("event_type, nexcoins_awarded, flagged, created_at");

  const allEvents = (events ?? []) as {
    event_type: string;
    nexcoins_awarded: number;
    flagged: boolean;
    created_at: string;
  }[];

  const totalReferrals      = allEvents.filter((e) => e.event_type === "signup_bonus").length;
  const totalMilestones     = allEvents.filter((e) => e.event_type === "milestone_bonus").length;
  const totalNexcoinsPaid   = allEvents.reduce((sum, e) => sum + (e.nexcoins_awarded ?? 0), 0);
  const signupBonusPaid     = allEvents.filter((e) => e.event_type === "signup_bonus")
    .reduce((sum, e) => sum + e.nexcoins_awarded, 0);
  const milestoneBonusPaid  = allEvents.filter((e) => e.event_type === "milestone_bonus")
    .reduce((sum, e) => sum + e.nexcoins_awarded, 0);

  // Top referrers
  const { data: referrers } = await admin
    .from("profiles")
    .select("id, full_name, email, total_referrals, total_referral_earnings")
    .gt("total_referrals", 0)
    .order("total_referrals", { ascending: false })
    .limit(100);

  return NextResponse.json({
    stats: {
      total_referrals:      totalReferrals,
      total_milestones:     totalMilestones,
      total_nexcoins_paid:  totalNexcoinsPaid,
      signup_bonus_paid:    signupBonusPaid,
      milestone_bonus_paid: milestoneBonusPaid,
    },
    referrers: referrers ?? [],
  });
}
