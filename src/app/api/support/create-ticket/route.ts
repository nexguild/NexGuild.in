import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const CAT_LABELS: Record<string, string> = {
  general: "General Inquiry", task: "Task Issue", coins: "Payment / Coins Issue",
  account: "Account Problem", voucher: "Voucher Issue", bug: "Bug Report",
};

export async function POST(req: NextRequest) {
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await svc.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, message, category = "general" } = await req.json() as {
      subject: string; message: string; category?: string;
    };

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "subject and message required" }, { status: 400 });
    }

    // Fetch contributor profile for email
    const { data: profile } = await svc
      .from("profiles").select("full_name, email").eq("id", user.id).single();
    const contributorName  = profile?.full_name ?? "Contributor";
    const contributorEmail = profile?.email ?? user.email ?? "unknown";

    // Insert support ticket
    const { data: ticket, error: ticketErr } = await svc
      .from("support_tickets")
      .insert({
        contributor_id: user.id,
        subject:        subject.trim(),
        message:        message.trim(),
        category,
        status:         "open",
      })
      .select("id, subject, message, category, status, priority, admin_reply, replied_at, created_at, updated_at")
      .single();

    if (ticketErr || !ticket) {
      console.error("[create-ticket] insert error:", ticketErr?.message);
      return NextResponse.json({ error: ticketErr?.message ?? "Insert failed" }, { status: 500 });
    }

    // Send email notification to nexguild admin inbox
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    "NexGuild <noreply@nexguild.in>",
        to:      "nexguild.in@gmail.com",
        subject: `New Support Ticket: ${subject.trim()}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0f0f0f;color:#e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#14b8a6,#0d9488);padding:24px 32px;">
              <h1 style="margin:0;font-size:18px;font-weight:700;color:#fff;">New Support Ticket</h1>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${subject.trim()}</p>
            </div>
            <div style="padding:24px 32px;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
                <tr><td style="padding:6px 0;color:#737373;width:120px;">From</td><td style="padding:6px 0;color:#e5e5e5;">${contributorName} (${contributorEmail})</td></tr>
                <tr><td style="padding:6px 0;color:#737373;">Category</td><td style="padding:6px 0;color:#e5e5e5;">${CAT_LABELS[category] ?? category}</td></tr>
                <tr><td style="padding:6px 0;color:#737373;">Ticket ID</td><td style="padding:6px 0;color:#a3a3a3;font-size:12px;">${ticket.id}</td></tr>
              </table>
              <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#737373;">Message</p>
                <p style="margin:0;font-size:14px;color:#e5e5e5;line-height:1.6;white-space:pre-wrap;">${message.trim()}</p>
              </div>
              <p style="font-size:13px;color:#737373;">
                Reply at <a href="https://nexguild.in/admin/support" style="color:#14b8a6;">nexguild.in/admin/support</a>
              </p>
            </div>
          </div>
        `,
      }).catch((e: unknown) => console.error("[create-ticket] email error:", e));
    } else {
      console.warn("[create-ticket] RESEND_API_KEY not set — email skipped");
    }

    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("[create-ticket] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
