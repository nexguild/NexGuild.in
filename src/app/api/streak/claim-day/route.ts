import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getISTDateString(d: Date): string {
  const ist = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, "0")}-${String(ist.getDate()).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // ── Auth
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Body
    const { date } = await req.json() as { date?: string };
    const todayIST = getISTDateString(new Date());
    if (date !== todayIST) {
      return NextResponse.json({ success: false, reason: "wrong_date" }, { status: 400 });
    }

    // ── Fetch today's streak_days row
    const { data: dayRow } = await admin
      .from("streak_days")
      .select("target_met, reward_claimed")
      .eq("contributor_id", user.id)
      .eq("day_date", todayIST)
      .single();

    const row = dayRow as { target_met: boolean; reward_claimed: boolean } | null;
    if (!row?.target_met) {
      return NextResponse.json({ success: false, reason: "target_not_met" });
    }
    if (row.reward_claimed) {
      return NextResponse.json({ success: false, reason: "already_claimed" });
    }

    // ── Check for 7-day streak: were the prior 6 consecutive days all claimed?
    const sixDaysAgoIST = getISTDateString(new Date(Date.now() - 6 * 86400000));
    const { data: priorDays } = await admin
      .from("streak_days")
      .select("day_date, reward_claimed")
      .eq("contributor_id", user.id)
      .gte("day_date", sixDaysAgoIST)
      .lt("day_date", todayIST)
      .order("day_date", { ascending: true });

    const prior = (priorDays as { day_date: string; reward_claimed: boolean }[] | null) ?? [];
    const isDaySevenBonus = prior.length === 6 && prior.every(d => d.reward_claimed);

    // ── Platform settings
    const { data: settings } = await admin
      .from("platform_settings")
      .select("key, value")
      .in("key", ["streak_daily_bonus", "streak_day7_bonus"]);

    const rows = (settings as { key: string; value: string }[] | null) ?? [];
    const dailyBonus = parseInt(rows.find(r => r.key === "streak_daily_bonus")?.value ?? "10") || 10;
    const day7Bonus  = parseInt(rows.find(r => r.key === "streak_day7_bonus")?.value ?? "50") || 50;
    const rewardAmount = isDaySevenBonus ? day7Bonus : dailyBonus;

    // ── Credit contributor (full amount — streak is a platform bonus, no commission split)
    await admin.rpc("increment_nexcoins", {
      p_contributor_id: user.id,
      p_coins:          rewardAmount,
    });
    await admin.from("coin_transactions").insert({
      contributor_id: user.id,
      amount:         rewardAmount,
      type:           "earned",
      source:         "streak",
      description:    `Daily streak reward${isDaySevenBonus ? " (7-day bonus!)" : ""}`,
    });

    // ── Mark day as claimed
    await admin
      .from("streak_days")
      .update({ reward_claimed: true, reward_amount: rewardAmount })
      .eq("contributor_id", user.id)
      .eq("day_date", todayIST);

    // ── Update profile streak counters
    const { data: profileData } = await admin
      .from("profiles")
      .select("current_streak, longest_streak")
      .eq("id", user.id)
      .single();
    const prev = profileData as { current_streak: number | null; longest_streak: number | null } | null;
    const newStreak  = (prev?.current_streak ?? 0) + 1;
    const newLongest = Math.max(newStreak, prev?.longest_streak ?? 0);
    await admin
      .from("profiles")
      .update({ current_streak: newStreak, longest_streak: newLongest })
      .eq("id", user.id);

    return NextResponse.json({ success: true, reward_amount: rewardAmount, is_day7_bonus: isDaySevenBonus });
  } catch (err) {
    console.error("[streak/claim-day] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
