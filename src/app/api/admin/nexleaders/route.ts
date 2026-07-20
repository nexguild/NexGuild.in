import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getResend, FROM_NOREPLY, nexleaderApprovedHtml, nexleaderRejectedHtml } from "@/lib/email";

const SOMEN_ID = "6c95c54a-33e6-489b-9175-3626c774635e";
const PROMOTION_FEE = 500;

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function verifyUpper(req: NextRequest) {
  const admin = makeAdmin();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: p } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (p as { role: string | null } | null)?.role ?? "";
  if (!["owner", "admin"].includes(role)) return null;
  return { admin, user };
}

// ── GET — return applications + active nexleaders + commission stats ──────────
export async function GET(req: NextRequest) {
  const ctx = await verifyUpper(req);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin } = ctx;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [appsRes, leadersRes, commStatsRes, activeWeekRes] = await Promise.all([
    admin
      .from("nexleader_applications")
      .select(`
        id, status, reason, community_description, estimated_recruits,
        created_at, reviewed_at, rejection_reason,
        contributor_id,
        profiles ( full_name, email, nexleader_id )
      `)
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, full_name, email, is_nexleader, nexleader_approved_at, guild_total_members, guild_total_earned, is_active")
      .eq("is_nexleader", true)
      .order("nexleader_approved_at", { ascending: false }),
    admin
      .from("nexleader_commissions")
      .select("nexleader_id, nexleader_credit"),
    // Distinct (nexleader_id, member_id) pairs active this week
    admin
      .from("nexleader_commissions")
      .select("nexleader_id, member_id")
      .gte("created_at", weekAgo),
  ]);

  // Resolve NexLeader names for applications
  const apps = (appsRes.data ?? []) as unknown as Array<{
    id: string;
    status: string;
    reason: string;
    community_description: string;
    estimated_recruits: number | null;
    created_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
    contributor_id: string;
    profiles: { full_name: string | null; email: string | null; nexleader_id: string | null } | null;
  }>;

  // Resolve current NexLeader names for applicants
  const nlIds = [...new Set(apps.map((a) => a.profiles?.nexleader_id).filter(Boolean))] as string[];
  const nlMap = new Map<string, string>();
  if (nlIds.length > 0) {
    const { data: nlProfiles } = await admin
      .from("profiles").select("id, full_name").in("id", nlIds);
    for (const p of (nlProfiles ?? []) as { id: string; full_name: string | null }[]) {
      nlMap.set(p.id, p.full_name ?? "Unknown");
    }
  }

  // Commission totals per NexLeader
  const commsByLeader = new Map<string, number>();
  for (const c of (commStatsRes.data ?? []) as { nexleader_id: string; nexleader_credit: number }[]) {
    commsByLeader.set(c.nexleader_id, (commsByLeader.get(c.nexleader_id) ?? 0) + c.nexleader_credit);
  }

  // Active members this week per NexLeader
  const activeByLeader = new Map<string, Set<string>>();
  for (const r of (activeWeekRes.data ?? []) as { nexleader_id: string; member_id: string }[]) {
    if (!activeByLeader.has(r.nexleader_id)) activeByLeader.set(r.nexleader_id, new Set());
    activeByLeader.get(r.nexleader_id)!.add(r.member_id);
  }

  const totalNcPaid = [...commsByLeader.values()].reduce((s, v) => s + v, 0);
  const topEntry = [...commsByLeader.entries()].sort((a, b) => b[1] - a[1])[0];

  // Top NexLeader name
  let topLeaderName = "";
  if (topEntry) {
    const { data: tp } = await admin.from("profiles").select("full_name").eq("id", topEntry[0]).single();
    topLeaderName = (tp as { full_name: string | null } | null)?.full_name ?? "";
  }

  return NextResponse.json({
    applications: apps.map((a) => ({
      ...a,
      contributor_name:         a.profiles?.full_name ?? null,
      contributor_email:        a.profiles?.email ?? null,
      current_nexleader_id:     a.profiles?.nexleader_id ?? null,
      current_nexleader_name:   a.profiles?.nexleader_id ? nlMap.get(a.profiles.nexleader_id) ?? "Unknown" : "Platform",
    })),
    nexleaders: ((leadersRes.data ?? []) as {
      id: string; full_name: string | null; email: string | null;
      is_nexleader: boolean; nexleader_approved_at: string | null;
      guild_total_members: number; guild_total_earned: number; is_active: boolean | null;
    }[]).map((l) => ({
      ...l,
      active_this_week: activeByLeader.get(l.id)?.size ?? 0,
    })),
    stats: {
      total_active:     (leadersRes.data ?? []).length,
      pending_apps:     (appsRes.data ?? []).filter((a) => (a as { status: string }).status === "pending").length,
      total_nc_paid:    totalNcPaid,
      top_leader_name:  topLeaderName,
      top_leader_nc:    topEntry?.[1] ?? 0,
    },
  });
}

// ── POST — approve | reject | revoke ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await verifyUpper(req);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { admin, user: caller } = ctx;

  const body = await req.json() as {
    action: "approve" | "reject" | "revoke";
    applicationId?: string;
    nexleaderId?: string;
    reason?: string;
  };

  // ── APPROVE ──────────────────────────────────────────────────────────────────
  if (body.action === "approve") {
    if (!body.applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

    const { data: app } = await admin
      .from("nexleader_applications")
      .select("contributor_id, status")
      .eq("id", body.applicationId)
      .single();

    const a = app as { contributor_id: string; status: string } | null;
    if (!a || a.status !== "pending") {
      return NextResponse.json({ error: "Application not found or not pending" }, { status: 404 });
    }

    const applicantId = a.contributor_id;

    // Get applicant profile
    const { data: applicantProfile } = await admin
      .from("profiles")
      .select("nexcoins, nexleader_id, full_name, email, referral_code")
      .eq("id", applicantId)
      .single();

    const ap = applicantProfile as { nexcoins: number; nexleader_id: string | null; full_name: string | null; email: string | null; referral_code: string | null } | null;
    const currentNexleaderId = ap?.nexleader_id ?? SOMEN_ID;
    const hasRealNexleader = currentNexleaderId !== SOMEN_ID;

    if (hasRealNexleader) {
      // Promotion fee: deduct 500 NC from applicant, credit their NexLeader
      const balance = ap?.nexcoins ?? 0;
      if (balance < PROMOTION_FEE) {
        return NextResponse.json({
          error: `Applicant needs at least ${PROMOTION_FEE} NC for the promotion fee. Current balance: ${balance} NC.`,
        }, { status: 400 });
      }

      // Deduct from applicant
      await admin.rpc("increment_nexcoins", {
        p_contributor_id: applicantId,
        p_coins: -PROMOTION_FEE,
      });
      await admin.from("coin_transactions").insert({
        contributor_id: applicantId,
        amount: -PROMOTION_FEE,
        type: "deducted",
        source: "promotion_fee",
        description: "NexLeader promotion transfer fee",
      });

      // Credit previous NexLeader
      await admin.rpc("increment_nexcoins", {
        p_contributor_id: currentNexleaderId,
        p_coins: PROMOTION_FEE,
      });
      await admin.from("coin_transactions").insert({
        contributor_id: currentNexleaderId,
        amount: PROMOTION_FEE,
        type: "earned",
        source: "nexleader_commission",
        description: `Promotion bonus — ${ap?.full_name ?? "member"} became NexLeader`,
      });

      // Log in nexleader_commissions
      await admin.from("nexleader_commissions").insert({
        nexleader_id:       currentNexleaderId,
        member_id:          applicantId,
        event_type:         "promotion_bonus",
        gross_amount:       PROMOTION_FEE,
        contributor_credit: 0,
        nexleader_credit:   PROMOTION_FEE,
        platform_cut:       0,
      });

      // Notify previous NexLeader
      await admin.from("notifications").insert({
        user_id: currentNexleaderId,
        title:   "🎉 Promotion Bonus!",
        message: `${ap?.full_name ?? "A member"} has been promoted to NexLeader! +${PROMOTION_FEE} NC transfer bonus credited.`,
        type:    "bonus_coins",
      });

      // Notify new NexLeader
      await admin.from("notifications").insert({
        user_id: applicantId,
        title:   "🎊 You are now a NexLeader!",
        message: `Congratulations! ${PROMOTION_FEE} NC has been transferred to your previous NexLeader as a one-time fee.`,
        type:    "system",
      });

      // Reassign to Somen
      await admin.from("profiles").update({ nexleader_id: SOMEN_ID }).eq("id", applicantId);
    } else {
      // No transfer fee — under Somen or no NexLeader
      await admin.from("notifications").insert({
        user_id: applicantId,
        title:   "🎊 Congratulations, NexLeader!",
        message: "You have been approved as a NexLeader. Share your link and start building your guild!",
        type:    "system",
      });
    }

    // Promote
    await admin.from("profiles").update({
      is_nexleader:          true,
      nexleader_approved_at: new Date().toISOString(),
    }).eq("id", applicantId);

    // Update application
    await admin.from("nexleader_applications").update({
      status:      "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: caller.id,
    }).eq("id", body.applicationId);

    // Send welcome email (fire-and-forget)
    const applicantEmail = ap?.email ?? null;
    if (applicantEmail) {
      const resend = getResend();
      const recruitLink = `https://nexguild.in/signup?ref=${ap?.referral_code ?? ""}`;
      resend?.emails.send({
        from:    FROM_NOREPLY,
        to:      applicantEmail,
        subject: "🎉 Welcome to the NexGuild NexLeader Program!",
        html:    nexleaderApprovedHtml(ap?.full_name ?? "NexLeader", recruitLink),
      }).catch((e: unknown) => console.error("[nexleaders/approve] email error:", e));
    }

    return NextResponse.json({ ok: true });
  }

  // ── REJECT ───────────────────────────────────────────────────────────────────
  if (body.action === "reject") {
    if (!body.applicationId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });
    const reason = body.reason?.trim() ?? "";

    const { data: app } = await admin
      .from("nexleader_applications")
      .select("contributor_id, status")
      .eq("id", body.applicationId)
      .single();

    const a = app as { contributor_id: string; status: string } | null;
    if (!a || a.status !== "pending") {
      return NextResponse.json({ error: "Application not found or not pending" }, { status: 404 });
    }

    await admin.from("nexleader_applications").update({
      status:           "rejected",
      rejection_reason: reason || null,
      reviewed_at:      new Date().toISOString(),
      reviewed_by:      caller.id,
    }).eq("id", body.applicationId);

    await admin.from("notifications").insert({
      user_id: a.contributor_id,
      title:   "NexLeader Application Update",
      message: reason
        ? `Your NexLeader application was not approved. Reason: ${reason}`
        : "Your NexLeader application was not approved at this time.",
      type: "system",
    });

    // Send rejection email
    const { data: rejProfile } = await admin
      .from("profiles").select("full_name, email").eq("id", a.contributor_id).single();
    const rp = rejProfile as { full_name: string | null; email: string | null } | null;
    if (rp?.email) {
      const resend = getResend();
      resend?.emails.send({
        from:    FROM_NOREPLY,
        to:      rp.email,
        subject: "NexLeader Application Update",
        html:    nexleaderRejectedHtml(rp.full_name ?? "there", reason || null),
      }).catch((e: unknown) => console.error("[nexleaders/reject] email error:", e));
    }

    return NextResponse.json({ ok: true });
  }

  // ── REVOKE ───────────────────────────────────────────────────────────────────
  if (body.action === "revoke") {
    if (!body.nexleaderId) return NextResponse.json({ error: "nexleaderId required" }, { status: 400 });

    const nlId = body.nexleaderId;

    // Revoke status
    await admin.from("profiles").update({
      is_nexleader:          false,
      nexleader_approved_at: null,
    }).eq("id", nlId);

    // Reassign all their members to Somen
    await admin.from("profiles")
      .update({ nexleader_id: SOMEN_ID })
      .eq("nexleader_id", nlId)
      .neq("id", nlId);

    // Notify
    await admin.from("notifications").insert({
      user_id: nlId,
      title:   "NexLeader Status Revoked",
      message: "Your NexLeader status has been revoked. Please contact admin@nexguild.in for details.",
      type:    "system",
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
