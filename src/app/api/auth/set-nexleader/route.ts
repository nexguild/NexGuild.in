import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SOMEN_ID = "6c95c54a-33e6-489b-9175-3626c774635e";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Idempotency: skip if nexleader_id already set
  const { data: profile } = await admin
    .from("profiles")
    .select("nexleader_id")
    .eq("id", user.id)
    .single();

  if ((profile as { nexleader_id: string | null } | null)?.nexleader_id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Determine nexleader_id from referral code in user metadata
  const referralCode = user.user_metadata?.referral_code_used as string | undefined;
  let nexleaderId = SOMEN_ID;

  if (referralCode) {
    const { data: referrer } = await admin
      .from("profiles")
      .select("id, is_nexleader, nexleader_id")
      .eq("referral_code", referralCode.toUpperCase())
      .neq("id", user.id)
      .single();

    const r = referrer as { id: string; is_nexleader: boolean | null; nexleader_id: string | null } | null;
    if (r) {
      if (r.is_nexleader) {
        // Referrer IS a NexLeader → assign them
        nexleaderId = r.id;
      } else {
        // Referrer is NOT a NexLeader → pass up the chain to their NexLeader
        nexleaderId = r.nexleader_id ?? SOMEN_ID;
      }
    }
  }

  // Set nexleader_id on profile
  await admin
    .from("profiles")
    .update({ nexleader_id: nexleaderId })
    .eq("id", user.id);

  // Increment the NexLeader's guild member count
  await admin.rpc("increment_guild_members", {
    p_nexleader_id: nexleaderId,
    p_amount:       1,
  });

  return NextResponse.json({ ok: true, nexleader_id: nexleaderId });
}
