import { createServerClient } from "@/lib/supabase-server";

type AdminClient = ReturnType<typeof createServerClient>;

const MILESTONE_COINS = 1_000;
const MILESTONE_BONUS = 250;

/**
 * After a postback credits offerwall NexCoins to a contributor, call this to
 * check whether they've crossed the 1,000-coin offerwall milestone and, if so,
 * credit the referrer 250 NexCoins. Idempotent — referral_bonus_paid prevents
 * double-pays even when two postbacks land at the same time.
 */
export async function checkReferralMilestone(
  admin: AdminClient,
  contributorId: string,
): Promise<void> {
  // Fetch contributor's referral status
  const { data: contributed } = await admin
    .from("profiles")
    .select("referred_by, referral_bonus_paid")
    .eq("id", contributorId)
    .single();

  if (!contributed?.referred_by || contributed.referral_bonus_paid) return;

  const referrerId = contributed.referred_by as string;

  // Net offerwall earnings (positive = earned, negative = reversed)
  const { data: txns } = await admin
    .from("coin_transactions")
    .select("amount")
    .eq("contributor_id", contributorId)
    .eq("source", "offerwall");

  const totalOfferwall = (txns ?? []).reduce(
    (sum: number, row: { amount: number }) => sum + (row.amount ?? 0),
    0,
  );

  if (totalOfferwall < MILESTONE_COINS) return;

  // Atomically claim the milestone by flipping the flag only when it's still false
  const { data: claimed } = await admin
    .from("profiles")
    .update({ referral_bonus_paid: true })
    .eq("id", contributorId)
    .eq("referral_bonus_paid", false)
    .select("id");

  if (!claimed?.length) return; // Already claimed by a concurrent postback

  // Read referrer's current stats before modifying
  const { data: referrer } = await admin
    .from("profiles")
    .select("nexcoins, total_referral_earnings")
    .eq("id", referrerId)
    .single();

  const currentEarnings = (referrer as { nexcoins: number | null; total_referral_earnings: number | null } | null)
    ?.total_referral_earnings ?? 0;

  // Credit 250 NexCoins to referrer
  const { error: rpcErr } = await admin.rpc("increment_nexcoins", {
    p_contributor_id: referrerId,
    p_coins:          MILESTONE_BONUS,
  });
  if (rpcErr) {
    const cur = (referrer as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles")
      .update({ nexcoins: cur + MILESTONE_BONUS })
      .eq("id", referrerId);
  }

  // Update referrer stats
  await admin.from("profiles")
    .update({ total_referral_earnings: currentEarnings + MILESTONE_BONUS })
    .eq("id", referrerId);

  // Audit trail
  await admin.from("referral_events").insert({
    referrer_id:      referrerId,
    referred_id:      contributorId,
    event_type:       "milestone_bonus",
    nexcoins_awarded: MILESTONE_BONUS,
  });

  // Coin transaction for referrer
  await admin.from("coin_transactions").insert({
    contributor_id: referrerId,
    amount:         MILESTONE_BONUS,
    type:           "earned",
    source:         "referral",
    description:    "Referral milestone bonus — your referral earned 1,000 NexCoins from surveys",
  });

  // Notify referrer
  await admin.from("notifications").insert({
    user_id: referrerId,
    title:   "Referral Milestone Bonus!",
    message: `Your referral just hit 1,000 NexCoins from surveys! +${MILESTONE_BONUS} NexCoins bonus credited`,
    type:    "bonus_coins",
  });

  console.log(
    `[referral] milestone +${MILESTONE_BONUS} → referrer=${referrerId} (referred=${contributorId}, total_offerwall=${totalOfferwall})`,
  );
}
