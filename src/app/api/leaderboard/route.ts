import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = parseInt(new URL(req.url).searchParams.get("limit") ?? "5");

  // Fetch all approved submissions to count per contributor
  const { data: approved } = await admin
    .from("submissions")
    .select("contributor_id")
    .eq("status", "approved");

  if (!approved || approved.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // Count per contributor
  const counts: Record<string, number> = {};
  for (const row of approved) {
    counts[row.contributor_id] = (counts[row.contributor_id] ?? 0) + 1;
  }

  // Top N by count
  const topEntries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.min(limit, 50));

  if (topEntries.length === 0) return NextResponse.json({ leaderboard: [] });

  const topIds = topEntries.map(([id]) => id);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", topIds)
    .neq("status", "banned");

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  );

  const leaderboard = topEntries
    .map(([id, count], i) => ({
      rank: i + 1,
      id,
      full_name: profileMap[id] ?? "Anonymous",
      approved_count: count,
    }))
    .filter((entry) => entry.full_name !== undefined);

  return NextResponse.json({ leaderboard });
}
