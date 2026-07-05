import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { FROM_NOREPLY, getResend, accountBannedHtml } from "@/lib/email";

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
