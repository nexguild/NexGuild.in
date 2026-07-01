import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();

  // Verify the token belongs to a real user
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the user is an admin
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // All queries run with service_role — no RLS restrictions
  const [
    { count: contributors },
    { count: activeTasks },
    { count: pendingReviews },
    { count: pendingAssignments },
    { count: pendingVouchers },
    { data: coinsData },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "contributor"),
    admin.from("tasks").select("*", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    admin.from("submissions").select("*", { count: "exact", head: true }).in("status", ["submitted", "pending"]),
    admin.from("assignments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("voucher_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("submissions").select("coins_awarded").eq("status", "approved"),
  ]);

  const totalCoins = (coinsData ?? []).reduce(
    (s: number, r: { coins_awarded: number | null }) => s + (r.coins_awarded ?? 0),
    0
  );

  return NextResponse.json({
    contributors:       contributors       ?? 0,
    activeTasks:        activeTasks        ?? 0,
    pendingReviews:     pendingReviews     ?? 0,
    pendingAssignments: pendingAssignments ?? 0,
    pendingVouchers:    pendingVouchers    ?? 0,
    totalCoins,
  });
}
