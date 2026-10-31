import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_NEXCOINS_AMOUNT, normalizeNexcoins } from "@/lib/nexcoins";

const DAILY_CAP = 15000;

export interface CommissionResult {
  contributorCredit: number;
  ownerCommission: number;
}

export async function creditTaskWithPlatformCommission(
  supabaseAdmin: SupabaseClient,
  contributorId: string,
  grossAmount: number,
  sourceEventId: string,
  description: string,
): Promise<CommissionResult> {
  const gross = normalizeNexcoins(grossAmount);
  if (!Number.isFinite(gross) || gross < 0 || gross > MAX_NEXCOINS_AMOUNT || !contributorId || !sourceEventId.trim()) {
    throw new Error("Invalid task commission input");
  }
  if (gross === 0) return { contributorCredit: 0, ownerCommission: 0 };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayTxns, error: todayTxnsError } = await supabaseAdmin
    .from("coin_transactions")
    .select("amount")
    .eq("contributor_id", contributorId)
    .eq("type", "earned")
    .or("source.is.null,source.neq.platform_commission")
    .gte("created_at", todayStart.toISOString());

  if (todayTxnsError) {
    throw new Error(`Failed to check the task earnings limit: ${todayTxnsError.message}`);
  }

  const earnedToday = (todayTxns ?? []).reduce(
    (sum, transaction) => sum + Number((transaction as { amount: number }).amount ?? 0),
    0,
  );
  const intendedContributorCredit = Math.floor(gross * 0.66);
  const contributorCredit = normalizeNexcoins(
    Math.min(intendedContributorCredit, Math.max(0, DAILY_CAP - earnedToday)),
  );
  const ownerCommission = normalizeNexcoins(gross * 0.34);

  const { data, error } = await supabaseAdmin.rpc("credit_task_with_platform_commission", {
    p_contributor_id: contributorId,
    p_source_event_id: sourceEventId,
    p_gross_amount: gross,
    p_contributor_credit: contributorCredit,
    p_owner_credit: ownerCommission,
    p_description: description,
  });

  if (error) {
    throw new Error(`Failed to credit task and platform commission: ${error.message}`);
  }
  if (typeof data !== "object" || data === null) {
    throw new Error("Task commission RPC returned an invalid response");
  }

  const result = data as Record<string, unknown>;
  const creditedContributor = Number(result.contributor_credit);
  const creditedOwner = Number(result.owner_credit);
  if (!Number.isFinite(creditedContributor) || !Number.isFinite(creditedOwner)) {
    throw new Error("Task commission RPC returned invalid credit amounts");
  }

  return {
    contributorCredit: normalizeNexcoins(creditedContributor),
    ownerCommission: normalizeNexcoins(creditedOwner),
  };
}
