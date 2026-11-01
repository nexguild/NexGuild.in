import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { supportContributorReplyAlertHtml } from "@/lib/email";

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

    const { ticketId, message } = await req.json() as { ticketId: string; message: string };
    if (!ticketId || !message?.trim()) {
      return NextResponse.json({ error: "ticketId and message required" }, { status: 400 });
    }

    // Verify ticket ownership + check not closed
    const { data: ticket, error: ticketErr } = await svc
      .from("support_tickets")
      .select("id, subject, status, contributor_id")
      .eq("id", ticketId)
      .eq("contributor_id", user.id)
      .single();

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.status === "closed") {
      return NextResponse.json({ error: "Ticket is closed" }, { status: 400 });
    }

    // Insert message
    const { data: newMsg, error: msgErr } = await svc
      .from("ticket_messages")
      .insert({ ticket_id: ticketId, sender_id: user.id, sender_type: "contributor", message: message.trim() })
      .select("id, ticket_id, sender_id, sender_type, message, created_at")
      .single();

    if (msgErr || !newMsg) {
      console.error("[send-message] insert error:", msgErr?.message);
      return NextResponse.json({ error: msgErr?.message ?? "Insert failed" }, { status: 500 });
    }

    // Re-open ticket so admin sees new activity
    await svc.from("support_tickets")
      .update({ status: "open", updated_at: new Date().toISOString() })
      .eq("id", ticketId);

    // Fetch contributor name for email
    const { data: profile } = await svc
      .from("profiles").select("full_name").eq("id", user.id).single();
    const contributorName = profile?.full_name ?? "Contributor";

    // Email admin inbox
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    "NexGuild <noreply@nexguild.in>",
        to:      "admin@nexguild.in",
        subject: `Re: ${ticket.subject} [new reply from ${contributorName}]`,
        html: supportContributorReplyAlertHtml(ticket.subject, contributorName, message.trim()),
      }).catch((e: unknown) => console.error("[send-message] email error:", e));
    }

    return NextResponse.json({ message: newMsg });
  } catch (err) {
    console.error("[send-message] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
