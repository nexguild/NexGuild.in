import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const SIGNUP_BONUS = 100;

export async function POST(req: NextRequest) {
  console.log("REFERRAL TRACK SIGNUP HIT");

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (!user) {
    console.error("[referral/track-signup] auth failed —", userErr?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 5 requests per IP per hour — prevents abuse from the same network
  const { allowed, retryAfterMs } = rateLimit(`track-signup:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const referralCodeUsed = user.user_metadata?.referral_code_used as string | null | undefined;
  console.log("[referral/track-signup] user=", user.id, "referral_code_used=", referralCodeUsed ?? "(none)");
  if (!referralCodeUsed) return NextResponse.json({ ok: true, skipped: "no_code" });

  // Check if this user already has referred_by set (idempotent)
  const { data: newProfile } = await admin
    .from("profiles")
    .select("id, referred_by")
    .eq("id", user.id)
    .single();

  if (!newProfile) {
    console.warn("[referral/track-signup] profile not found for user", user.id);
    return NextResponse.json({ ok: true, skipped: "profile_not_found" });
  }
  if (newProfile.referred_by) {
    console.log("[referral/track-signup] already tracked for user", user.id);
    return NextResponse.json({ ok: true, skipped: "already_tracked" });
  }

  // Find referrer by code (normalise to uppercase)
  const { data: referrer } = await admin
    .from("profiles")
    .select("id, nexcoins, total_referrals, total_referral_earnings")
    .eq("referral_code", referralCodeUsed.toUpperCase())
    .single();

  if (!referrer) {
    console.warn("[referral/track-signup] code not found:", referralCodeUsed.toUpperCase());
    return NextResponse.json({ ok: true, skipped: "code_not_found" });
  }

  // Prevent self-referral
  if (referrer.id === user.id) {
    console.warn("[referral/track-signup] self-referral attempted by", user.id);
    return NextResponse.json({ ok: true, skipped: "self_referral" });
  }

  const ref = referrer as {
    id: string;
    nexcoins: number | null;
    total_referrals: number | null;
    total_referral_earnings: number | null;
  };

  // 1. Store referred_by on the new user's profile
  await admin.from("profiles").update({ referred_by: ref.id }).eq("id", user.id);

  // 2. Credit 100 NexCoins to referrer
  const { error: rpcErr } = await admin.rpc("increment_nexcoins", {
    p_contributor_id: ref.id,
    p_coins:          SIGNUP_BONUS,
  });
  if (rpcErr) {
    console.warn("[referral/track-signup] RPC fallback:", rpcErr.message);
    await admin.from("profiles")
      .update({ nexcoins: (ref.nexcoins ?? 0) + SIGNUP_BONUS })
      .eq("id", ref.id);
  }

  // 3. Update referrer stats
  await admin.from("profiles")
    .update({
      total_referrals:         (ref.total_referrals ?? 0) + 1,
      total_referral_earnings: (ref.total_referral_earnings ?? 0) + SIGNUP_BONUS,
    })
    .eq("id", ref.id);

  // 4. Audit trail
  await admin.from("referral_events").insert({
    referrer_id:      ref.id,
    referred_id:      user.id,
    event_type:       "signup_bonus",
    nexcoins_awarded: SIGNUP_BONUS,
  });

  // 5. Coin transaction for referrer
  await admin.from("coin_transactions").insert({
    contributor_id: ref.id,
    amount:         SIGNUP_BONUS,
    type:           "earned",
    source:         "referral",
    description:    "Referral signup bonus",
  });

  // 6. Notify referrer
  await admin.from("notifications").insert({
    user_id: ref.id,
    title:   "New Referral Signup!",
    message: `Someone joined NexGuild using your referral link! +${SIGNUP_BONUS} NexCoins`,
    type:    "bonus_coins",
  });

  console.log(`[referral/track-signup] +${SIGNUP_BONUS} → referrer=${ref.id} (new_user=${user.id})`);
  return NextResponse.json({ ok: true, credited: SIGNUP_BONUS });
}
