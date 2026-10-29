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
  const { data: provider, error: providerError } = await admin
    .from("offerwall_providers")
    .select("id")
    .eq("slug", "theoremreach")
    .single();
  if (providerError || !provider) {
    console.error("[webhook/theoremreach] provider lookup failed:", providerError?.message);
    return NextResponse.json({ error: "Provider configuration unavailable" }, { status: 500 });
  }

  for (const reversal of reversals) {
    const txId = reversal.transaction_id;
    if (!txId) continue;

    const { data: reversed, error: reversalError } = await admin.rpc("reverse_offerwall_conversion", {
      p_provider_id: provider.id,
      p_provider_transaction_id: txId,
    });
    if (reversalError) {
      console.error("[webhook/theoremreach] atomic reversal failed:", reversalError.message);
      return NextResponse.json({ error: "Unable to apply reversal" }, { status: 500 });
    }
    if (!reversed) {
      console.log(`[webhook/theoremreach] tx ${txId} not found or already reversed`);
      continue;
    }

    console.log(`[webhook/theoremreach] reversed tx=${txId}`);
  }

  return NextResponse.json({ ok: true });
}
