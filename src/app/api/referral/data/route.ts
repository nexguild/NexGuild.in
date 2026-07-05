import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Current user's referral profile
  const { data: myProfile } = await admin
    .from("profiles")
    .select("referral_code, total_referrals, total_referral_earnings")
    .eq("id", user.id)
    .single();

  // All users referred by this user
  const { data: referredProfiles } = await admin
    .from("profiles")
    .select("id, full_name, created_at, referral_bonus_paid")
    .eq("referred_by", user.id)
    .order("created_at", { ascending: false });

  const referredIds = (referredProfiles ?? []).map((p: { id: string }) => p.id);

  // Offerwall earnings per referred user (for progress display)
  let earningsByUser: Record<string, number> = {};
  if (referredIds.length > 0) {
    const { data: txns } = await admin
      .from("coin_transactions")
      .select("contributor_id, amount")
      .in("contributor_id", referredIds)
      .eq("source", "offerwall");

    for (const row of (txns ?? []) as { contributor_id: string; amount: number }[]) {
      earningsByUser[row.contributor_id] = (earningsByUser[row.contributor_id] ?? 0) + row.amount;
    }
  }

  const referrals = (referredProfiles ?? []).map((p: {
    id: string;
    full_name: string | null;
    created_at: string;
    referral_bonus_paid: boolean;
  }) => {
    const name = p.full_name ?? "User";
    const masked =
      name.length <= 1
        ? name + "***"
        : name[0] + "***" + name[name.length - 1];
    const offerwall_earnings = Math.max(0, earningsByUser[p.id] ?? 0);
    return {
      masked_name:          masked,
      joined_at:            p.created_at,
      milestone_reached:    p.referral_bonus_paid,
      offerwall_earnings,
      earnings_for_referrer: p.referral_bonus_paid ? 350 : 100, // 100 signup (+ 250 milestone if reached)
    };
  });

  return NextResponse.json({
    referral_code:           myProfile?.referral_code ?? null,
    total_referrals:         (myProfile as { total_referrals: number | null } | null)?.total_referrals ?? 0,
    total_referral_earnings: (myProfile as { total_referral_earnings: number | null } | null)?.total_referral_earnings ?? 0,
    referrals,
  });
}
