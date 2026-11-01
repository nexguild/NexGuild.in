import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { notifyAdmins, supportTicketCreatedHtml } from "@/lib/email";

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
        to:      "admin@nexguild.in",
        subject: `New Support Ticket: ${subject.trim()}`,
        html: supportTicketCreatedHtml(
          subject.trim(),
          contributorName,
          contributorEmail,
          CAT_LABELS[category] ?? category,
          ticket.id,
          message.trim(),
        ),
      }).catch((e: unknown) => console.error("[create-ticket] email error:", e));
    } else {
      console.warn("[create-ticket] RESEND_API_KEY not set — email skipped");
    }

    // Notify role-based admin users async
    notifyAdmins(svc, "new_support_ticket", {
      contributorName: contributorName,
      detail:    `${CAT_LABELS[category] ?? category}: ${subject.trim()}`,
      actionUrl: "https://nexguild.in/admin/support",
    });

    return NextResponse.json({ ticket });
  } catch (err) {
    console.error("[create-ticket] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
