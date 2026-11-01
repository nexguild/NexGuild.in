import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { writeAdminAudit } from "@/lib/admin-audit";

async function verifyContributorAccess(req: NextRequest, requireAction = false) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  const allowedRoles = requireAction ? ADMIN_ROLES.UPPER : ADMIN_ROLES.USERS;
  if (!allowedRoles.some((allowedRole) => allowedRole === role)) return null;
  return { admin, userId: user.id, callerRole: role };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyContributorAccess(req);
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
  const ctx = await verifyContributorAccess(req, true);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { admin } = ctx;

  // Protect owner from deletion
  const { data: target, error: targetError } = await admin.from("profiles").select("role, full_name, email").eq("id", id).single();
  if (targetError || !target) return NextResponse.json({ error: "Contributor not found." }, { status: 404 });
  if ((target as { role: string }).role === "owner") {
    return NextResponse.json({ error: "Cannot delete the owner account." }, { status: 403 });
  }

  const { error: profileDeleteError } = await admin.from("profiles").delete().eq("id", id);
  if (profileDeleteError) return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    await writeAdminAudit(admin, {
      actorId: ctx.userId,
      action: "contributor_profile_deleted",
      targetType: "contributor",
      targetId: id,
      summary: `Removed the profile for ${target.full_name ?? target.email ?? id}; authentication cleanup failed.`,
      metadata: { authCleanupFailed: true },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAudit(admin, {
    actorId: ctx.userId,
    action: "contributor_deleted",
    targetType: "contributor",
    targetId: id,
    summary: `Deleted contributor account ${target.full_name ?? target.email ?? id}.`,
  });

  return NextResponse.json({ ok: true });
}
