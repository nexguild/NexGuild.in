import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyAdminOrOwner(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "admin" && role !== "owner") return null;
  return { admin, userId: user.id, callerRole: role };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdminOrOwner(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { admin } = ctx;

  const [
    { data: profile },
    { data: submissions },
    { data: transactions },
    { data: tickets },
  ] = await Promise.all([
    admin.from("profiles")
      .select("id, full_name, email, country, status, nexcoins, xp, level, current_streak, longest_streak, last_streak_claim_date, joined_at, role")
      .eq("id", id)
      .single(),
    admin.from("submissions")
      .select("id, status, coins_awarded, submitted_at, tasks(title)")
      .eq("contributor_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    admin.from("coin_transactions")
      .select("id, type, amount, description, created_at")
      .eq("contributor_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("support_tickets")
      .select("id, subject, status, created_at")
      .eq("contributor_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    profile,
    submissions: submissions ?? [],
    transactions: transactions ?? [],
    tickets: tickets ?? [],
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdminOrOwner(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { admin } = ctx;

  // Protect owner from deletion
  const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
  if ((target as { role: string } | null)?.role === "owner") {
    return NextResponse.json({ error: "Cannot delete the owner account." }, { status: 403 });
  }

  await admin.from("profiles").delete().eq("id", id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
