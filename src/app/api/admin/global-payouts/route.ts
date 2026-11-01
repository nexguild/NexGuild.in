import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { writeAdminAudit } from "@/lib/admin-audit";
import { createServerClient } from "@/lib/supabase-server";

async function getFinanceAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return null;

  const { data: profile, error } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (error || !ADMIN_ROLES.FINANCE.some((role) => role === profile?.role)) return null;
  return { admin, userId: user.id };
}

export async function GET(req: NextRequest) {
  const ctx = await getFinanceAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await ctx.admin
    .from("global_payout_requests")
    .select("id, contributor_id, coins_requested, usdt_amount, payout_method, destination, status, payment_reference, rejection_reason, admin_notes, reviewed_by, reviewed_at, paid_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/global-payouts] request query failed:", error.message);
    return NextResponse.json({ error: "Unable to load payout requests." }, { status: 500 });
  }

  const contributorIds = [...new Set((data ?? []).map((request) => request.contributor_id))];
  const { data: profiles, error: profilesError } = contributorIds.length
    ? await ctx.admin.from("profiles").select("id, full_name, email").in("id", contributorIds)
    : { data: [], error: null };
  if (profilesError) {
    console.error("[admin/global-payouts] contributor lookup failed:", profilesError.message);
    return NextResponse.json({ error: "Unable to load payout contributors." }, { status: 500 });
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return NextResponse.json({
    requests: (data ?? []).map((request) => ({
      ...request,
      profiles: profilesById.get(request.contributor_id) ?? null,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getFinanceAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: {
    id?: unknown;
    action?: unknown;
    paymentReference?: unknown;
    rejectionReason?: unknown;
    adminNotes?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
  }
  if (body.action !== "paid" && body.action !== "rejected" && body.action !== "under_review") {
    return NextResponse.json({ error: "Select a valid payout action." }, { status: 400 });
  }
  const paymentReference = typeof body.paymentReference === "string" ? body.paymentReference.trim() : "";
  const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : "";
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : "";
  if (body.action === "paid" && (paymentReference.length < 1 || paymentReference.length > 200)) {
    return NextResponse.json({ error: "A payment reference of 1–200 characters is required." }, { status: 400 });
  }
  if (body.action === "rejected" && (rejectionReason.length < 1 || rejectionReason.length > 500)) {
    return NextResponse.json({ error: "A rejection reason of 1–500 characters is required." }, { status: 400 });
  }
  if (adminNotes.length > 1_000) {
    return NextResponse.json({ error: "Admin notes must be 1,000 characters or fewer." }, { status: 400 });
  }

  const { error } = await ctx.admin.rpc("update_global_payout_request", {
    p_request_id: body.id,
    p_actor_id: ctx.userId,
    p_action: body.action,
    p_payment_reference: paymentReference || null,
    p_rejection_reason: rejectionReason || null,
    p_admin_notes: adminNotes || null,
  });

  if (error) {
    if (error.message.includes("request_not_found")) return NextResponse.json({ error: "Payout request not found." }, { status: 404 });
    if (error.message.includes("request_finalized")) return NextResponse.json({ error: "This payout has already been finalized." }, { status: 409 });
    if (error.code === "23505") return NextResponse.json({ error: "That payment reference is already in use." }, { status: 409 });
    console.error("[admin/global-payouts] status update failed:", error.message);
    return NextResponse.json({ error: "Unable to update the payout request." }, { status: 500 });
  }

  await writeAdminAudit(ctx.admin, {
    actorId: ctx.userId,
    action: "global_payout_updated",
    targetType: "global_payout",
    targetId: body.id,
    summary: `${body.action === "under_review" ? "Moved" : body.action === "paid" ? "Paid" : "Rejected"} a global payout request.`,
    metadata: { status: body.action },
  });

  return NextResponse.json({ success: true, status: body.action });
}
