import { SupabaseClient } from "@supabase/supabase-js";

const SOMEN_ID = "6c95c54a-33e6-489b-9175-3626c774635e";
const CONTRIBUTOR_PCT = 0.66;
const NEXLEADER_PCT   = 0.08;

export interface CommissionResult {
  contributorCredit: number;
  nexleaderCredit:   number;
  platformCut:       number;
}

/**
 * Credits NexCoins to a contributor with the NexLeader commission split:
 *   Contributor 66% | NexLeader 8% | Platform 26%
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
  const contributorCredit = Math.floor(grossAmount * CONTRIBUTOR_PCT);
  const nexleaderCredit   = Math.floor(grossAmount * NEXLEADER_PCT);
  const platformCut       = grossAmount - contributorCredit - nexleaderCredit;

  // Resolve the contributor's NexLeader
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nexleader_id")
    .eq("id", contributorId)
    .single();

  const nexleaderId =
    (profile as { nexleader_id: string | null } | null)?.nexleader_id ?? SOMEN_ID;

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
      description:    "Commission from member earning",
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
