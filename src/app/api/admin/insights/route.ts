import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: p } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (p as { role: string } | null)?.role ?? "";
  if (!["owner", "admin"].includes(role)) return null;
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const [txnRes, postbackRes] = await Promise.all([
    // All earned coin transactions today
    admin
      .from("coin_transactions")
      .select("contributor_id, amount, source")
      .eq("type", "earned")
      .gte("created_at", todayIso),
    // All approved postback logs
    admin
      .from("postback_logs")
      .select("provider_slug, user_id, coins_awarded, created_at")
      .eq("status", "approved"),
  ]);

  const txns = (txnRes.data ?? []) as { contributor_id: string; amount: number; source: string }[];
  const postbacks = (postbackRes.data ?? []) as { provider_slug: string; user_id: string; coins_awarded: number; created_at: string }[];

  // ── Anomaly detection: today's earners vs. platform average ───────────────
  const earnerMap = new Map<string, number>();
  for (const t of txns) {
    earnerMap.set(t.contributor_id, (earnerMap.get(t.contributor_id) ?? 0) + t.amount);
  }

  const allAmounts = [...earnerMap.values()];
  const platformAvg = allAmounts.length > 0
    ? allAmounts.reduce((s, v) => s + v, 0) / allAmounts.length
    : 0;
  const threshold = Math.max(platformAvg * 3, 500); // at least 3x avg, min 500 coins

  const anomalyIds = [...earnerMap.entries()]
    .filter(([, amount]) => amount >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({ id, amount }));

  // Resolve names for anomalies
  let anomalies: { id: string; amount: number; name: string; email: string }[] = [];
  if (anomalyIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", anomalyIds.map((a) => a.id));
    const profileMap = new Map(
      ((profiles ?? []) as { id: string; full_name: string | null; email: string | null }[])
        .map((p) => [p.id, p])
    );
    anomalies = anomalyIds.map(({ id, amount }) => ({
      id,
      amount,
      name:  profileMap.get(id)?.full_name  ?? "Unknown",
      email: profileMap.get(id)?.email ?? "—",
    }));
  }

  // ── Offerwall per-provider summary ────────────────────────────────────────
  const providerMap = new Map<string, { totalCoins: number; txCount: number; userSet: Set<string>; topEarners: Map<string, number> }>();
  for (const pb of postbacks) {
    const slug = pb.provider_slug ?? "unknown";
    if (!providerMap.has(slug)) {
      providerMap.set(slug, { totalCoins: 0, txCount: 0, userSet: new Set(), topEarners: new Map() });
    }
    const entry = providerMap.get(slug)!;
    entry.totalCoins += pb.coins_awarded ?? 0;
    entry.txCount    += 1;
    entry.userSet.add(pb.user_id);
    entry.topEarners.set(pb.user_id, (entry.topEarners.get(pb.user_id) ?? 0) + (pb.coins_awarded ?? 0));
  }

  // Resolve names for top earners across all providers
  const allUserIds = new Set<string>();
  for (const entry of providerMap.values()) {
    for (const uid of entry.userSet) allUserIds.add(uid);
  }
  const { data: allProfiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", [...allUserIds].slice(0, 500));
  const allProfileMap = new Map(
    ((allProfiles ?? []) as { id: string; full_name: string | null; email: string | null }[])
      .map((p) => [p.id, p])
  );

  const offerwallStats = [...providerMap.entries()].map(([slug, entry]) => {
    const top5 = [...entry.topEarners.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([uid, coins]) => ({
        id:    uid,
        coins,
        name:  allProfileMap.get(uid)?.full_name  ?? "Unknown",
        email: allProfileMap.get(uid)?.email ?? "—",
      }));
    return {
      slug,
      totalCoins:  entry.totalCoins,
      txCount:     entry.txCount,
      uniqueUsers: entry.userSet.size,
      top5,
    };
  }).sort((a, b) => b.totalCoins - a.totalCoins);

  return NextResponse.json({
    platformAvgToday: Math.round(platformAvg),
    totalEarnersToday: earnerMap.size,
    anomalies,
    offerwallStats,
  });
}
