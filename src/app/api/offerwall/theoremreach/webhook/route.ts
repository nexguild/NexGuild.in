import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

function computeHash(secret: string, urlStr: string): string {
  const raw = createHmac("sha1", secret).update(urlStr).digest("base64");
  return raw.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// TheoremReach reversal/ban webhook
// Hash is computed over the request URL (not body), same base64url format
export async function POST(req: NextRequest) {
  const secret = process.env.THEOREMREACH_SECRET_KEY;
  if (secret) {
    const incomingHash = new URL(req.url).searchParams.get("hash") ?? "";
    if (incomingHash) {
      const urlForHash = new URL(req.url);
      urlForHash.searchParams.delete("hash");
      if (computeHash(secret, urlForHash.toString()) !== incomingHash) {
        console.warn("[webhook/theoremreach] hash mismatch");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  let body: {
    data?: {
      event_type?: string;
      user_id?: string;
      reversed_transactions?: { transaction_id: string; amount_in_currency?: string }[];
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const eventType = body?.data?.event_type ?? "";
  const reversals = body?.data?.reversed_transactions ?? [];

  console.log("[webhook/theoremreach]", { eventType, reversalCount: reversals.length });

  if (eventType !== "reversal" && eventType !== "ban") {
    return NextResponse.json({ ok: true });
  }

  const admin = createServerClient();

  for (const reversal of reversals) {
    const txId = reversal.transaction_id;
    if (!txId) continue;

    const { data: existing } = await admin
      .from("offerwall_transactions")
      .select("id, nexcoins_awarded, contributor_id, status")
      .eq("provider_transaction_id", txId)
      .single();

    if (!existing || existing.status !== "credited") {
      console.log(`[webhook/theoremreach] tx ${txId} not found or already reversed`);
      continue;
    }

    const coinsToReverse = existing.nexcoins_awarded as number;
    const contributorId  = existing.contributor_id  as string;

    await admin.from("offerwall_transactions").update({ status: "reversed" }).eq("id", existing.id);

    const { data: profile } = await admin.from("profiles").select("nexcoins").eq("id", contributorId).single();
    const cur = (profile as { nexcoins: number | null } | null)?.nexcoins ?? 0;
    await admin.from("profiles").update({ nexcoins: Math.max(0, cur - coinsToReverse) }).eq("id", contributorId);

    await admin.from("coin_transactions").insert({
      contributor_id: contributorId,
      amount:         -coinsToReverse,
      type:           "reversed",
      source:         "offerwall",
      description:    `TheoremReach ${eventType} reversal (tx: ${txId})`,
    });

    await admin.from("notifications").insert({
      user_id: contributorId,
      title:   "Earning Reversed",
      message: `A TheoremReach reward of ${coinsToReverse} NexCoins was reversed.`,
      type:    "system",
    });

    console.log(`[webhook/theoremreach] reversed ${coinsToReverse} coins from ${contributorId} (tx=${txId})`);
  }

  return NextResponse.json({ ok: true });
}
