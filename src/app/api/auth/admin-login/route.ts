import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase-server";
import { clientIp, isRateLimited, recordFailure, resetRateLimit } from "@/lib/rate-limit";

const MAX    = 5;
const WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST(req: NextRequest) {
  const ip  = clientIp(req);
  const key = `login:admin:${ip}`;

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
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  // Verify admin role with service-role client (bypasses RLS)
  const admin = createServerClient();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", data.user!.id)
    .single();

  if (profileErr) {
    console.error("[admin-login] profile query failed:", profileErr.message);
    await admin.auth.admin.signOut(data.user!.id, "global").catch(() => {});
    recordFailure(key, MAX, WINDOW);
    return NextResponse.json({ error: "Server error verifying permissions." }, { status: 500 });
  }

  const role = (profile as { role: string } | null)?.role ?? "contributor";
  if (role === "contributor") {
    await admin.auth.admin.signOut(data.user!.id, "global").catch(() => {});
    recordFailure(key, MAX, WINDOW);
    return NextResponse.json(
      { error: "Access denied. This account does not have admin privileges." },
      { status: 403 }
    );
  }

  resetRateLimit(key);

  return NextResponse.json({
    session: {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
    role,
  });
}
