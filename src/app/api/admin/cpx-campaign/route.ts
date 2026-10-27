import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const CAMPAIGN_START = "2026-10-27T18:30:00.000Z";
const CAMPAIGN_END = "2026-10-31T18:29:59.999Z";
const PAGE_SIZE = 1000;
const PROFILE_BATCH_SIZE = 200;
const MILESTONE_COINS = 5000;
const BONUS_PER_MILESTONE = 1000;

interface CampaignTransaction {
  contributor_id: string;
  nexcoins_awarded: number;
  raw_payload: {
    query?: Record<string, unknown>;
  } | null;
}

async function getAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !["owner", "admin"].includes((profile as { role: string } | null)?.role ?? "")) {
    return null;
  }
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error: providerError } = await admin
    .from("offerwall_providers")
    .select("id")
    .eq("slug", "cpx_research")
    .single();

  if (providerError || !provider) {
    console.error("[admin/cpx-campaign] CPX provider lookup failed:", providerError?.message);
    return NextResponse.json({ error: "Could not load CPX Research provider" }, { status: 500 });
  }

  const transactions: CampaignTransaction[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("offerwall_transactions")
      .select("contributor_id, nexcoins_awarded, raw_payload")
      .eq("provider_id", provider.id)
      .eq("status", "credited")
      .gte("created_at", CAMPAIGN_START)
      .lte("created_at", CAMPAIGN_END)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("[admin/cpx-campaign] transaction query failed:", error.message);
      return NextResponse.json({ error: "Could not load CPX campaign transactions" }, { status: 500 });
    }

    const page = (data ?? []) as CampaignTransaction[];
    transactions.push(...page.filter((tx) => tx.raw_payload?.query?.type === "complete"));
    if (page.length < PAGE_SIZE) break;
  }

  const totals = new Map<string, { coins: number; transactions: number }>();
  for (const tx of transactions) {
    const current = totals.get(tx.contributor_id) ?? { coins: 0, transactions: 0 };
    current.coins += tx.nexcoins_awarded;
    current.transactions += 1;
    totals.set(tx.contributor_id, current);
  }

  const contributorIds = [...totals.keys()];
  const profiles: { id: string; full_name: string | null; email: string | null }[] = [];
  for (let from = 0; from < contributorIds.length; from += PROFILE_BATCH_SIZE) {
    const ids = contributorIds.slice(from, from + PROFILE_BATCH_SIZE);
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    if (error) {
      console.error("[admin/cpx-campaign] contributor lookup failed:", error.message);
      return NextResponse.json({ error: "Could not load contributor details" }, { status: 500 });
    }
    profiles.push(...(data ?? []));
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const contributors = [...totals.entries()]
    .map(([id, total]) => {
      const profile = profileById.get(id);
      return {
        id,
        name: profile?.full_name?.trim() || "Contributor",
        email: profile?.email ?? "",
        eligibleCoins: total.coins,
        transactions: total.transactions,
        bonusDue: Math.floor(total.coins / MILESTONE_COINS) * BONUS_PER_MILESTONE,
      };
    })
    .sort((a, b) => b.eligibleCoins - a.eligibleCoins);

  return NextResponse.json({
    campaign: {
      startsAt: CAMPAIGN_START,
      endsAt: CAMPAIGN_END,
      milestoneCoins: MILESTONE_COINS,
      bonusPerMilestone: BONUS_PER_MILESTONE,
    },
    summary: {
      contributors: contributors.length,
      eligibleCoins: contributors.reduce((sum, user) => sum + user.eligibleCoins, 0),
      bonusDue: contributors.reduce((sum, user) => sum + user.bonusDue, 0),
      qualifyingTransactions: transactions.length,
    },
    contributors,
  });
}
