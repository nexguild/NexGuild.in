import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // ── Env sanity check ────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[admin-check] SUPABASE_URL present:", !!supabaseUrl);
  console.log("[admin-check] SERVICE_ROLE_KEY present:", !!serviceKey);

  // ── Parse body ───────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.access_token;
  console.log("[admin-check] access_token present:", !!token);

  if (!token) {
    console.error("[admin-check] No access_token in request body");
    return NextResponse.json({ isAdmin: false, reason: "no_token" }, { status: 400 });
  }

  const admin = createServerClient();

  // ── Verify JWT and get user ──────────────────────────────────────
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  console.log("[admin-check] getUser → id:", user?.id, "email:", user?.email);
  if (userError) console.error("[admin-check] getUser error:", userError.message);

  if (userError || !user) {
    return NextResponse.json({ isAdmin: false, reason: "invalid_token" }, { status: 401 });
  }

  // ── Query profile with service role (bypasses RLS) ───────────────
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  console.log("[admin-check] profile:", JSON.stringify(profile));
  if (profileError) console.error("[admin-check] profileError:", profileError.message, "code:", profileError.code);

  if (profileError) {
    return NextResponse.json({ isAdmin: false, reason: "profile_error" }, { status: 500 });
  }

  const role = profile?.role ?? "contributor";
  const isAdmin = role !== "contributor";
  console.log("[admin-check] role:", role, "→ isAdmin:", isAdmin);

  return NextResponse.json({ isAdmin, role });
}
