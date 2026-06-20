import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_ROLES = ["owner", "admin", "finance"] as const;

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function authorize(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = makeAdmin();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role ?? "";
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) return null;
  return { admin, userId: user.id, role };
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await ctx.admin
    .from("voucher_requests")
    .select("id, contributor_id, voucher_type, voucher_value, coins_spent, status, voucher_code, requested_at, delivered_at, profiles(full_name, email)")
    .order("requested_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}
