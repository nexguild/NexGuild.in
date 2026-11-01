import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { writeAdminAudit } from "@/lib/admin-audit";
import { voucherDeliveredHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // ── Auth check ───────────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!["admin", "owner", "finance"].includes(callerProfile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Parse body ───────────────────────────────────────────────
    const { requestId, voucherCode } = await req.json() as {
      requestId: string;
      voucherCode: string;
    };

    if (!requestId || !voucherCode?.trim()) {
      return NextResponse.json({ error: "requestId and voucherCode are required" }, { status: 400 });
    }

    // ── Fetch voucher request + contributor profile ───────────────
    const { data: vr, error: fetchErr } = await admin
      .from("voucher_requests")
      .select("id, voucher_type, coins_spent, contributor_id, status, profiles(full_name, email)")
      .eq("id", requestId)
      .single();

    if (fetchErr || !vr) {
      console.error("[deliver-voucher] fetch error:", fetchErr?.message);
      return NextResponse.json({ error: "Voucher request not found" }, { status: 404 });
    }

    // ── Update status to delivered ───────────────────────────────
    const deliveredAt = new Date().toISOString();
    const { data: updatedRequest, error: updateErr } = await admin
      .from("voucher_requests")
      .update({
        status:       "delivered",
        voucher_code: voucherCode.trim(),
        delivered_at: deliveredAt,
      })
      .eq("id", requestId)
      .in("status", ["pending", "processing"])
      .select("id")
      .maybeSingle();

    if (updateErr) {
      console.error("[deliver-voucher] update error:", updateErr.message);
      return NextResponse.json({ error: "Failed to update: " + updateErr.message }, { status: 500 });
    }
    if (!updatedRequest) {
      return NextResponse.json({ error: "This voucher request is no longer available for delivery." }, { status: 409 });
    }

    // ── Gather contributor details ───────────────────────────────
    type Profile = { full_name: string | null; email: string | null };
    const contributor = vr.profiles as unknown as Profile | null;
    const name        = contributor?.full_name ?? "Contributor";
    const email       = contributor?.email ?? null;
    const voucherType = vr.voucher_type;
    const code        = voucherCode.trim();

    await writeAdminAudit(admin, {
      actorId: user.id,
      action: "voucher_delivered",
      targetType: "voucher_request",
      targetId: requestId,
      summary: `Delivered ${voucherType} voucher to ${contributor?.full_name ?? email ?? vr.contributor_id}.`,
    });

    // ── Send email via Resend ────────────────────────────────────
    if (process.env.RESEND_API_KEY && email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailErr } = await resend.emails.send({
        from:    "NexGuild <noreply@nexguild.in>",
        to:      email,
        subject: "Your NexGuild Voucher is Ready!",
        html: voucherDeliveredHtml(name, voucherType, code, vr.coins_spent),
      });
      if (emailErr) {
        console.error("[deliver-voucher] email error:", emailErr);
      }
    } else {
      if (!process.env.RESEND_API_KEY) console.warn("[deliver-voucher] RESEND_API_KEY not set — email skipped");
      if (!email) console.warn("[deliver-voucher] contributor has no email — email skipped");
    }

    // ── Insert in-app notification ───────────────────────────────
    const { error: notifErr } = await admin.from("notifications").insert({
      user_id: vr.contributor_id,
      title:   "Voucher Delivered!",
      message: `Your ${voucherType} code is ready. Check My Vouchers in your dashboard.`,
      type:    "voucher",
    });
    if (notifErr) console.error("[deliver-voucher] notification error:", notifErr.message);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[deliver-voucher] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
