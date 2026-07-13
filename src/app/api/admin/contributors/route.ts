import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { FROM_NOREPLY, getResend, accountBannedHtml } from "@/lib/email";

const SOMEN_ID = "6c95c54a-33e6-489b-9175-3626c774635e";

const VIEW_ROLES   = ["owner", "admin", "reviewer", "support", "moderator"];
const ACTION_ROLES = ["owner", "admin"];

async function verifyContributorAccess(req: NextRequest, requireAction = false) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  const allowed = requireAction ? ACTION_ROLES : VIEW_ROLES;
  if (!allowed.includes(role ?? "")) return null;
  return { admin, role };
}

export async function GET(req: NextRequest) {
  const ctx = await verifyContributorAccess(req, false);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let result = await ctx.admin
    .from("profiles")
    .select("id, full_name, email, country, status, nexcoins, joined_at, is_active")
    .or("role.eq.contributor,role.is.null")
    .order("joined_at", { ascending: false });

  // is_active column may not exist yet — fall back to query without it
  if (result.error) {
    result = await ctx.admin
      .from("profiles")
      .select("id, full_name, email, country, status, nexcoins, joined_at")
      .or("role.eq.contributor,role.is.null")
      .order("joined_at", { ascending: false }) as typeof result;
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ contributors: result.data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const ctx = await verifyContributorAccess(req, true);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { contributorId, status, reason, is_active } = (body ?? {}) as {
    contributorId?: string;
    status?: string;
    reason?: string;
    is_active?: boolean;
  };

  if (!contributorId) {
    return NextResponse.json({ error: "contributorId is required." }, { status: 400 });
  }

  // Protect owner account
  const { data: target } = await ctx.admin
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", contributorId)
    .single();

  const t = target as { role: string; full_name: string | null; email: string | null } | null;
  if (t?.role === "owner") {
    return NextResponse.json({ error: "Cannot modify the owner account." }, { status: 403 });
  }

  // Reactivation path — set is_active = true
  if (is_active === true) {
    const { error } = await ctx.admin.from("profiles").update({ is_active: true }).eq("id", contributorId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Status path — ban / unban / suspend
  if (!["active", "suspended", "banned"].includes(status ?? "")) {
    return NextResponse.json({ error: "Valid status or is_active required." }, { status: 400 });
  }

  if (status === "banned" && !reason?.trim()) {
    return NextResponse.json({ error: "A ban reason is required." }, { status: 400 });
  }

  const { error } = await ctx.admin.from("profiles").update({ status }).eq("id", contributorId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status === "banned") {
    await ctx.admin.auth.admin.signOut(contributorId, "others").catch(() => {});

    const resend = getResend();
    if (resend && t?.email) {
      resend.emails.send({
        from:    FROM_NOREPLY,
        to:      t.email,
        subject: "Your NexGuild account has been suspended",
        html:    accountBannedHtml(t.full_name ?? "Contributor", reason!.trim()),
      }).catch((e: unknown) => console.error("[ban] email error:", e));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const ctx = await verifyContributorAccess(req, true);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contributorId = searchParams.get("id");
  if (!contributorId) return NextResponse.json({ error: "id is required." }, { status: 400 });

  // Protect owner account
  const { data: target } = await ctx.admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", contributorId)
    .single();

  const t = target as { role: string; full_name: string | null } | null;
  if (t?.role === "owner") {
    return NextResponse.json({ error: "Cannot delete the owner account." }, { status: 403 });
  }

  // Reassign any guild members this user leads back to Somen
  await ctx.admin.from("profiles")
    .update({ nexleader_id: SOMEN_ID })
    .eq("nexleader_id", contributorId);

  // Delete all user-related data
  await Promise.all([
    ctx.admin.from("coin_transactions").delete().eq("contributor_id", contributorId),
    ctx.admin.from("submissions").delete().eq("contributor_id", contributorId),
    ctx.admin.from("assignments").delete().eq("contributor_id", contributorId),
    ctx.admin.from("offerwall_transactions").delete().eq("contributor_id", contributorId),
    ctx.admin.from("nexleader_commissions").delete().or(`nexleader_id.eq.${contributorId},member_id.eq.${contributorId}`),
    ctx.admin.from("notifications").delete().eq("user_id", contributorId),
    ctx.admin.from("nexleader_applications").delete().eq("contributor_id", contributorId),
    ctx.admin.from("voucher_requests").delete().eq("contributor_id", contributorId),
    ctx.admin.from("postback_logs").delete().eq("user_id", contributorId),
  ]);

  // Delete profile row
  await ctx.admin.from("profiles").delete().eq("id", contributorId);

  // Delete auth user (removes login ability permanently)
  const { error: authErr } = await ctx.admin.auth.admin.deleteUser(contributorId);
  if (authErr) {
    console.error("[contributors/delete] auth delete error:", authErr.message);
    return NextResponse.json({ error: "Data deleted but auth user removal failed: " + authErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
