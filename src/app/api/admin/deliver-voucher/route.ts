import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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

    if (callerProfile?.role !== "admin") {
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
      .select("id, voucher_type, coins_spent, contributor_id, profiles(full_name, email)")
      .eq("id", requestId)
      .single();

    if (fetchErr || !vr) {
      console.error("[deliver-voucher] fetch error:", fetchErr?.message);
      return NextResponse.json({ error: "Voucher request not found" }, { status: 404 });
    }

    // ── Update status to delivered ───────────────────────────────
    const deliveredAt = new Date().toISOString();
    const { error: updateErr } = await admin
      .from("voucher_requests")
      .update({
        status:       "delivered",
        voucher_code: voucherCode.trim(),
        delivered_at: deliveredAt,
      })
      .eq("id", requestId);

    if (updateErr) {
      console.error("[deliver-voucher] update error:", updateErr.message);
      return NextResponse.json({ error: "Failed to update: " + updateErr.message }, { status: 500 });
    }

    // ── Gather contributor details ───────────────────────────────
    type Profile = { full_name: string | null; email: string | null };
    const contributor = vr.profiles as unknown as Profile | null;
    const name        = contributor?.full_name ?? "Contributor";
    const email       = contributor?.email ?? null;
    const voucherType = vr.voucher_type;
    const code        = voucherCode.trim();

    // ── Send email via Resend ────────────────────────────────────
    if (process.env.RESEND_API_KEY && email) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error: emailErr } = await resend.emails.send({
        from:    "NexGuild <noreply@nexguild.in>",
        to:      email,
        subject: "Your NexGuild Voucher is Ready!",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #0f0f0f; color: #e5e5e5; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 32px 40px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">NexGuild</h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Your Voucher is Ready!</p>
            </div>

            <div style="padding: 32px 40px;">
              <p style="margin: 0 0 20px; font-size: 15px; color: #d4d4d4;">Hi <strong style="color: #ffffff;">${name}</strong>,</p>
              <p style="margin: 0 0 24px; font-size: 15px; color: #d4d4d4; line-height: 1.6;">
                Great news! Your <strong style="color: #ffffff;">${voucherType}</strong> voucher has been delivered.
              </p>

              <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #737373;">Your Voucher Code</p>
                <p style="margin: 0; font-size: 28px; font-weight: 700; font-family: 'Courier New', monospace; color: #14b8a6; letter-spacing: 3px;">${code}</p>
              </div>

              <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #a3a3a3; line-height: 1.6;">
                  <strong style="color: #e5e5e5;">Valid for:</strong> ${voucherType}<br>
                  <strong style="color: #e5e5e5;">Coins spent:</strong> ${vr.coins_spent.toLocaleString()} NexCoins
                </p>
              </div>

              <p style="margin: 0 0 8px; font-size: 14px; color: #a3a3a3; line-height: 1.6;">
                You can also view and copy your code anytime from the <strong style="color: #e5e5e5;">Store → My Requests</strong> section in your dashboard.
              </p>

              <p style="margin: 24px 0 0; font-size: 14px; color: #737373;">
                Thank you for contributing to NexGuild! Keep earning and redeeming.
              </p>
            </div>

            <div style="padding: 16px 40px; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #525252;">© 2025 NexGuild · nexguild.in</p>
            </div>
          </div>
        `,
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
      title:   "Your Voucher is Ready!",
      message: `Your ${voucherType} has been delivered. Code: ${code}`,
      type:    "voucher_delivered",
    });
    if (notifErr) console.error("[deliver-voucher] notification error:", notifErr.message);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[deliver-voucher] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
