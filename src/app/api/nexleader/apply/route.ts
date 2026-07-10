import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MIN_DAYS     = 7;
const MIN_EARNED   = 500;

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reason, community_description, estimated_recruits } = await req.json() as {
    reason: string;
    community_description: string;
    estimated_recruits?: number;
  };

  if (!reason?.trim() || reason.trim().length < 100) {
    return NextResponse.json({ error: "Reason must be at least 100 characters." }, { status: 400 });
  }
  if (!community_description?.trim() || community_description.trim().length < 50) {
    return NextResponse.json({ error: "Community description must be at least 50 characters." }, { status: 400 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_nexleader, is_active, created_at")
    .eq("id", user.id)
    .single();

  const p = profile as { is_nexleader: boolean | null; is_active: boolean | null; created_at: string | null } | null;

  if (p?.is_nexleader) {
    return NextResponse.json({ error: "You are already a NexLeader." }, { status: 400 });
  }
  if (p?.is_active === false) {
    return NextResponse.json({ error: "Your account is not active." }, { status: 403 });
  }

  // Account age check
  const createdAt = p?.created_at ? new Date(p.created_at) : null;
  const ageMs = createdAt ? Date.now() - createdAt.getTime() : 0;
  if (ageMs < MIN_DAYS * 86400000) {
    return NextResponse.json({ error: `Your account must be at least ${MIN_DAYS} days old.` }, { status: 400 });
  }

  // Total earned check
  const { data: txs } = await admin
    .from("coin_transactions")
    .select("amount")
    .eq("contributor_id", user.id)
    .eq("type", "earned")
    .neq("source", "nexleader_commission");

  const totalEarned = (txs ?? []).reduce((s, r) => s + ((r as { amount: number }).amount ?? 0), 0);
  if (totalEarned < MIN_EARNED) {
    return NextResponse.json({ error: `You need to earn at least ${MIN_EARNED} NexCoins first.` }, { status: 400 });
  }

  // No existing pending/approved application
  const { data: existing } = await admin
    .from("nexleader_applications")
    .select("status")
    .eq("contributor_id", user.id)
    .in("status", ["pending", "approved"])
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You already have an active or pending application." }, { status: 400 });
  }

  const { error: insertErr } = await admin.from("nexleader_applications").insert({
    contributor_id:       user.id,
    reason:               reason.trim(),
    community_description: community_description.trim(),
    estimated_recruits:   estimated_recruits ?? null,
    status:               "pending",
  });

  if (insertErr) {
    console.error("[nexleader/apply] insert error:", insertErr.message);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
