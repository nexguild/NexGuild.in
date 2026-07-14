import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 1800;

export async function GET() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: approved } = await db
      .from("submissions")
      .select("contributor_id")
      .eq("status", "approved");

    if (!approved || approved.length === 0) return NextResponse.json({ leaderboard: [] });

    const counts: Record<string, number> = {};
    for (const row of approved) {
      counts[row.contributor_id] = (counts[row.contributor_id] ?? 0) + 1;
    }

    const topEntries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const topIds = topEntries.map(([id]) => id);

    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name")
      .in("id", topIds)
      .neq("status", "banned");

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name as string])
    );

    const leaderboard = topEntries.map(([id, count], i) => ({
      rank:           i + 1,
      id,
      full_name:      profileMap[id] ?? "Anonymous",
      approved_count: count,
    }));

    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ leaderboard: [] });
  }
}
