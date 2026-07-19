import { SupabaseClient } from "@supabase/supabase-js";

const SOMEN_ID = "6c95c54a-33e6-489b-9175-3626c774635e";
const CONTRIBUTOR_PCT = 0.66;
const NEXLEADER_PCT   = 0.10;
const DAILY_CAP = 15000; // max NexCoins a contributor can earn per day

export interface CommissionResult {
  contributorCredit: number;
  nexleaderCredit:   number;
  platformCut:       number;
}

/**
 * Credits NexCoins to a contributor with the NexLeader commission split:
 *   Contributor 66% | NexLeader 10% | Platform 24%
 *
 * @param supabaseAdmin  Service-role Supabase client
 * @param contributorId  User receiving the earnings
 * @param grossAmount    Total NexCoins before split (what CPX/TheoremReach/task awarded)
 * @param source         'offerwall' or 'task'
 * @param description    Text logged in coin_transactions for the contributor
 */
export async function creditWithCommission(
  supabaseAdmin: SupabaseClient,
  contributorId: string,
  grossAmount:   number,
  source:        "offerwall" | "task",
  description:   string,
): Promise<CommissionResult> {
  // Check daily cap — sum today's earned coin_transactions for this contributor
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayTxns } = await supabaseAdmin
    .from("coin_transactions")
    .select("amount")
    .eq("contributor_id", contributorId)
    .eq("type", "earned")
    .gte("created_at", todayStart.toISOString());
  const earnedToday = (todayTxns ?? []).reduce((s, t) => s + ((t as { amount: number }).amount ?? 0), 0);

  if (earnedToday >= DAILY_CAP) {
    console.log(`[nexleader-commission] daily cap hit for ${contributorId} (earned today: ${earnedToday})`);
    return { contributorCredit: 0, nexleaderCredit: 0, platformCut: grossAmount };
  }

  // Clamp contributor credit to remaining allowance
  const rawContributorCredit = Math.floor(grossAmount * CONTRIBUTOR_PCT);
  const contributorCredit = Math.min(rawContributorCredit, DAILY_CAP - earnedToday);
  const nexleaderCredit   = Math.floor(grossAmount * NEXLEADER_PCT);
  const platformCut       = grossAmount - contributorCredit - nexleaderCredit;

  // Resolve the contributor's NexLeader + name for commission description
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nexleader_id, full_name")
    .eq("id", contributorId)
    .single();

  const memberProfile = profile as { nexleader_id: string | null; full_name: string | null } | null;
  const nexleaderId   = memberProfile?.nexleader_id ?? SOMEN_ID;
  const memberName    = memberProfile?.full_name?.trim() || "Member";

  // ── Credit contributor ───────────────────────────────────────────────────
  const { error: contribRpcErr } = await supabaseAdmin.rpc("increment_nexcoins", {
    p_contributor_id: contributorId,
    p_coins:          contributorCredit,
  });
  if (contribRpcErr) {
    console.warn("[nexleader-commission] increment_nexcoins (contributor) fallback:", contribRpcErr.message);
    const { data: p } = await supabaseAdmin
      .from("profiles").select("nexcoins").eq("id", contributorId).single();
    const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await supabaseAdmin
      .from("profiles")
      .update({ nexcoins: cur + contributorCredit })
      .eq("id", contributorId);
  }

  // Log contributor transaction (visible on their earnings page)
  await supabaseAdmin.from("coin_transactions").insert({
    contributor_id: contributorId,
    amount:         contributorCredit,
    type:           "earned",
    source,
    description,
  });

  // ── Credit NexLeader silently ─────────────────────────────────────────────
  if (nexleaderCredit > 0) {
    const { error: nlRpcErr } = await supabaseAdmin.rpc("increment_nexcoins", {
      p_contributor_id: nexleaderId,
      p_coins:          nexleaderCredit,
    });
    if (nlRpcErr) {
      console.warn("[nexleader-commission] increment_nexcoins (nexleader) fallback:", nlRpcErr.message);
      const { data: nlp } = await supabaseAdmin
        .from("profiles").select("nexcoins").eq("id", nexleaderId).single();
      const nlCur = (nlp as { nexcoins: number | null } | null)?.nexcoins ?? 0;
      await supabaseAdmin
        .from("profiles")
        .update({ nexcoins: nlCur + nexleaderCredit })
        .eq("id", nexleaderId);
    }

    // Log NexLeader transaction (not shown to contributor)
    await supabaseAdmin.from("coin_transactions").insert({
      contributor_id: nexleaderId,
      amount:         nexleaderCredit,
      type:           "earned",
      source:         "nexleader_commission",
      description:    `Commission: ${memberName} (${contributorId.slice(0, 8)}) · ${description}`,
    });

    // Audit row
    await supabaseAdmin.from("nexleader_commissions").insert({
      nexleader_id:       nexleaderId,
      member_id:          contributorId,
      event_type:         source,
      gross_amount:       grossAmount,
      contributor_credit: contributorCredit,
      nexleader_credit:   nexleaderCredit,
      platform_cut:       platformCut,
    });

    // Update NexLeader guild stats (atomic via RPC)
    await supabaseAdmin.rpc("increment_guild_earned", {
      p_nexleader_id: nexleaderId,
      p_amount:       nexleaderCredit,
    });
  }

  return { contributorCredit, nexleaderCredit, platformCut };
}

/**
 * Credits offerwall NexCoins where the postback amount IS already the user's share.
 *
 * Use this for ALL offerwall postbacks — never creditWithCommission for offerwalls.
 *
 * Two scenarios:
 *   S1 — Percentage-based providers (e.g. ClixWall): set publisher percentage = 66%.
 *        Postback sends user's coin amount directly.
 *   S2 — Exchange-rate providers (e.g. CPX, TheoremReach, MyLead): set exchange rate = 660.
 *        Postback sends 660 per $1 = exactly what user receives.
 *
 * NexLeader gets (userCoins × 10/66) on top. Platform keeps (userCoins × 24/66).
 * Total minted = userCoins + NexLeader + Platform (proportions stay 66/10/24).
 */
export async function creditOfferwallUserShare(
  supabaseAdmin: SupabaseClient,
  contributorId: string,
  userCoins:     number,
  description:   string,
): Promise<CommissionResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayTxns } = await supabaseAdmin
    .from("coin_transactions")
    .select("amount")
    .eq("contributor_id", contributorId)
    .eq("type", "earned")
    .gte("created_at", todayStart.toISOString());
  const earnedToday = (todayTxns ?? []).reduce((s, t) => s + ((t as { amount: number }).amount ?? 0), 0);

  if (earnedToday >= DAILY_CAP) {
    console.log(`[nexleader-commission] daily cap hit for ${contributorId} (earned today: ${earnedToday})`);
    return { contributorCredit: 0, nexleaderCredit: 0, platformCut: userCoins };
  }

  const contributorCredit = Math.min(userCoins, DAILY_CAP - earnedToday);
  const nexleaderCredit   = Math.floor(contributorCredit * 10 / 66);
  const platformCut       = Math.floor(contributorCredit * 24 / 66);
  const impliedGross      = contributorCredit + nexleaderCredit + platformCut;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nexleader_id, full_name")
    .eq("id", contributorId)
    .single();

  const memberProfile = profile as { nexleader_id: string | null; full_name: string | null } | null;
  const nexleaderId   = memberProfile?.nexleader_id ?? SOMEN_ID;
  const memberName    = memberProfile?.full_name?.trim() || "Member";

  // ── Credit contributor ───────────────────────────────────────────────────
  const { error: contribRpcErr } = await supabaseAdmin.rpc("increment_nexcoins", {
    p_contributor_id: contributorId,
    p_coins:          contributorCredit,
  });
  if (contribRpcErr) {
    console.warn("[nexleader-commission] increment_nexcoins (contributor) fallback:", contribRpcErr.message);
    const { data: p } = await supabaseAdmin
      .from("profiles").select("nexcoins").eq("id", contributorId).single();
    const cur = (p as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await supabaseAdmin.from("profiles").update({ nexcoins: cur + contributorCredit }).eq("id", contributorId);
  }

  await supabaseAdmin.from("coin_transactions").insert({
    contributor_id: contributorId,
    amount:         contributorCredit,
    type:           "earned",
    source:         "offerwall",
    description,
  });

  // ── Credit NexLeader silently ─────────────────────────────────────────────
  if (nexleaderCredit > 0) {
    const { error: nlRpcErr } = await supabaseAdmin.rpc("increment_nexcoins", {
      p_contributor_id: nexleaderId,
      p_coins:          nexleaderCredit,
    });
    if (nlRpcErr) {
      console.warn("[nexleader-commission] increment_nexcoins (nexleader) fallback:", nlRpcErr.message);
      const { data: nlp } = await supabaseAdmin
        .from("profiles").select("nexcoins").eq("id", nexleaderId).single();
      const nlCur = (nlp as { nexcoins: number | null } | null)?.nexcoins ?? 0;
      await supabaseAdmin.from("profiles").update({ nexcoins: nlCur + nexleaderCredit }).eq("id", nexleaderId);
    }

    await supabaseAdmin.from("coin_transactions").insert({
      contributor_id: nexleaderId,
      amount:         nexleaderCredit,
      type:           "earned",
      source:         "nexleader_commission",
      description:    `Commission: ${memberName} (${contributorId.slice(0, 8)}) · ${description}`,
    });

    await supabaseAdmin.from("nexleader_commissions").insert({
      nexleader_id:       nexleaderId,
      member_id:          contributorId,
      event_type:         "offerwall",
      gross_amount:       impliedGross,
      contributor_credit: contributorCredit,
      nexleader_credit:   nexleaderCredit,
      platform_cut:       platformCut,
    });

    await supabaseAdmin.rpc("increment_guild_earned", {
      p_nexleader_id: nexleaderId,
      p_amount:       nexleaderCredit,
    });
  }

  return { contributorCredit, nexleaderCredit, platformCut };
}
