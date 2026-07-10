import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Profile
  const { data: profile } = await admin
    .from("profiles")
    .select("nexcoins, is_nexleader, nexleader_approved_at, guild_total_members, guild_total_earned, referral_code, is_active")
    .eq("id", user.id)
    .single();

  const p = profile as {
    nexcoins: number | null;
    is_nexleader: boolean | null;
    nexleader_approved_at: string | null;
    guild_total_members: number | null;
    guild_total_earned: number | null;
    referral_code: string | null;
    is_active: boolean | null;
  } | null;

  // Total ever earned
  const { data: earnedData } = await admin
    .from("coin_transactions")
    .select("amount")
    .eq("contributor_id", user.id)
    .eq("type", "earned")
    .neq("source", "nexleader_commission");

  const totalEarned = (earnedData ?? []).reduce(
    (sum, r) => sum + ((r as { amount: number }).amount ?? 0), 0
  );

  // Latest application
  const { data: appData } = await admin
    .from("nexleader_applications")
    .select("id, status, reason, community_description, estimated_recruits, created_at, rejection_reason")
    .eq("contributor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const application = appData as {
    id: string;
    status: string;
    reason: string;
    community_description: string;
    estimated_recruits: number | null;
    created_at: string;
    rejection_reason: string | null;
  } | null;

  // If NexLeader: fetch stats
  let members: object[] = [];
  let commissions: object[] = [];
  let activeThisWeek = 0;

  if (p?.is_nexleader) {
    const [membersRes, commissionsRes, activeRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, created_at")
        .eq("nexleader_id", user.id)
        .neq("id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("nexleader_commissions")
        .select("id, member_id, event_type, nexleader_credit, created_at")
        .eq("nexleader_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("nexleader_commissions")
        .select("member_id")
        .eq("nexleader_id", user.id)
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    members = membersRes.data ?? [];
    commissions = commissionsRes.data ?? [];
    const uniqueActive = new Set(
      ((activeRes.data ?? []) as { member_id: string }[]).map((r) => r.member_id)
    );
    activeThisWeek = uniqueActive.size;
  }

  return NextResponse.json({
    profile: {
      nexcoins:              p?.nexcoins ?? 0,
      is_nexleader:          p?.is_nexleader ?? false,
      nexleader_approved_at: p?.nexleader_approved_at ?? null,
      guild_total_members:   p?.guild_total_members ?? 0,
      guild_total_earned:    p?.guild_total_earned ?? 0,
      referral_code:         p?.referral_code ?? null,
      is_active:             p?.is_active ?? true,
      auth_created_at:       user.created_at ?? null,
    },
    totalEarned,
    application,
    members,
    commissions,
    activeThisWeek,
  });
}
