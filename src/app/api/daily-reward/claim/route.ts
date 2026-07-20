import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DAILY_REWARD = 5;

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function GET(req: NextRequest) {
  const admin = makeAdmin();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: existing } = await admin
    .from("coin_transactions")
    .select("id")
    .eq("contributor_id", user.id)
    .eq("source", "daily_login")
    .gte("created_at", todayStart.toISOString())
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ claimed: !!existing });
}

export async function POST(req: NextRequest) {
  const admin = makeAdmin();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: existing } = await admin
    .from("coin_transactions")
    .select("id")
    .eq("contributor_id", user.id)
    .eq("source", "daily_login")
    .gte("created_at", todayStart.toISOString())
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ already_claimed: true });

  await admin.rpc("increment_nexcoins", { p_contributor_id: user.id, p_coins: DAILY_REWARD });
  await admin.from("coin_transactions").insert({
    contributor_id: user.id,
    amount: DAILY_REWARD,
    type: "earned",
    source: "daily_login",
    description: "Daily login reward",
  });

  return NextResponse.json({ success: true, amount: DAILY_REWARD });
}
