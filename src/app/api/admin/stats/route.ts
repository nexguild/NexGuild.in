import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ADMIN_ROLES, isAdminRole } from "@/lib/admin-permissions";

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
  if (!isAdminRole(profile?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const canViewFinancialStats = ADMIN_ROLES.FINANCE.some((allowedRole) => allowedRole === profile?.role);

  // All queries run with service_role — no RLS restrictions
  const [
    contributorsResult,
    activeTasksResult,
    pendingReviewsResult,
    pendingAssignmentsResult,
    pendingVouchersResult,
    pendingGlobalPayoutsResult,
    openSupportTicketsResult,
    suspiciousSubmissionsResult,
    coinsResult,
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "contributor"),
    admin.from("tasks").select("*", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
    admin.from("submissions").select("*", { count: "exact", head: true }).in("status", ["submitted", "pending"]),
    admin.from("assignments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("voucher_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("global_payout_requests").select("*", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    admin.from("submissions").select("*", { count: "exact", head: true }).eq("suspicious", true).eq("reviewed", false),
    canViewFinancialStats
      ? admin.rpc("admin_dashboard_earned_coins")
      : Promise.resolve({ data: null, error: null }),
  ]);

  const queryErrors = [
    { name: "contributors", result: contributorsResult },
    { name: "active tasks", result: activeTasksResult },
    { name: "submission reviews", result: pendingReviewsResult },
    { name: "assignments", result: pendingAssignmentsResult },
    { name: "voucher requests", result: pendingVouchersResult },
    { name: "global payouts", result: pendingGlobalPayoutsResult },
    { name: "support tickets", result: openSupportTicketsResult },
    { name: "suspicious submissions", result: suspiciousSubmissionsResult },
    ...(canViewFinancialStats ? [{ name: "coin totals", result: coinsResult }] : []),
  ];
  const failedQuery = queryErrors.find(({ result }) => result.error);
  if (failedQuery) {
    console.error(`[admin/stats] ${failedQuery.name} query error:`, failedQuery.result.error?.message);
    return NextResponse.json({ error: `Unable to load ${failedQuery.name}.` }, { status: 500 });
  }

  const totalCoins = canViewFinancialStats ? Number(coinsResult.data ?? 0) : null;
  const visibleCount = (count: number | null, roles: readonly string[]) =>
    roles.some((allowedRole) => allowedRole === profile?.role) ? count ?? 0 : null;

  return NextResponse.json({
    contributors: visibleCount(contributorsResult.count, ADMIN_ROLES.USERS),
    activeTasks: visibleCount(activeTasksResult.count, ADMIN_ROLES.CONTENT),
    pendingReviews: visibleCount(pendingReviewsResult.count, ADMIN_ROLES.CONTENT),
    pendingAssignments: visibleCount(pendingAssignmentsResult.count, ADMIN_ROLES.REVIEW),
    pendingVouchers: visibleCount(pendingVouchersResult.count, ADMIN_ROLES.FINANCE),
    pendingGlobalPayouts: visibleCount(pendingGlobalPayoutsResult.count, ADMIN_ROLES.FINANCE),
    openSupportTickets: visibleCount(openSupportTicketsResult.count, ADMIN_ROLES.SUPPORT),
    suspiciousItems: visibleCount(suspiciousSubmissionsResult.count, ADMIN_ROLES.UPPER),
    totalCoins,
  });
}
