import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/admin-check
// Body: { access_token: string }
// Returns: { isAdmin: boolean }
//
// Uses the service role client (bypasses RLS) to check the profiles table.
// The service role key never leaves the server.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.access_token;

  if (!token) {
    return NextResponse.json({ isAdmin: false }, { status: 400 });
  }

  const admin = createServerClient();

  // Verify the JWT and get the user identity
  const { data: { user }, error: userError } = await admin.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  // Query profiles with service role — no RLS applies
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[admin-check] profile query error:", profileError.message);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }

  return NextResponse.json({ isAdmin: profile?.role === "admin" });
}
