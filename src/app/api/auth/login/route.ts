import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { clientIp, isRateLimited, recordFailure, resetRateLimit } from "@/lib/rate-limit";
import { getIpReputation } from "@/lib/ip-reputation";

const MAX      = 10;
const WINDOW   = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const ip  = clientIp(req);
  const key = `login:contrib:${ip}`;

  const rl = isRateLimited(key, MAX);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  let body: { email?: string; password?: string; captchaToken?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }

  const { email, password, captchaToken } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  // Use anon key so Supabase still validates the hCaptcha token
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });

  if (authError || !data.session) {
    recordFailure(key, MAX, WINDOW);
    const msg = authError?.message === "Invalid login credentials"
      ? "Incorrect email or password."
      : (authError?.message ?? "Login failed.");
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  // Check is_active with admin client (bypasses RLS)
  const admin = createServerClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_active")
    .eq("id", data.user!.id)
    .single();

  if ((profile as { is_active: boolean | null } | null)?.is_active === false) {
    await admin.auth.admin.signOut(data.user!.id, "global").catch(() => {});
    return NextResponse.json({ deactivated: true }, { status: 403 });
  }

  resetRateLimit(key);

  // Update login IP and run VPN/proxy check (fire-and-forget, cached per IP)
  void (async () => {
    const userId = data.user!.id;
    const update: Record<string, unknown> = { last_seen_ip: ip };
    if (ip) {
      const rep = await getIpReputation(ip);
      if (rep !== null) {
        update.ip_vpn_detected = rep.vpnDetected;
        update.ip_fraud_score  = rep.fraudScore;
      }
    }
    await admin.from("profiles").update(update).eq("id", userId);
  })();

  return NextResponse.json({
    session: {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
}
