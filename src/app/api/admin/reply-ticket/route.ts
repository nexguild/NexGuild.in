import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { supportReplyHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  try {
    // ── Auth: verify admin ───────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: caller } = await admin
      .from("profiles").select("role").eq("id", user.id).single();
    if (!["admin", "owner", "support"].includes(caller?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ticketId, reply, closeTicket } = await req.json() as {
      ticketId: string; reply?: string; closeTicket?: boolean;
    };
    if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });

    // ── Fetch ticket + contributor profile ───────────────────────────
    const { data: ticket, error: fetchErr } = await admin
      .from("support_tickets")
      .select("id, subject, contributor_id, profiles(full_name, email)")
      .eq("id", ticketId)
      .single();

    if (fetchErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    type Profile = { full_name: string | null; email: string | null };
    const contributor  = ticket.profiles as unknown as Profile | null;
    const contribEmail = contributor?.email ?? null;
    const contribName  = contributor?.full_name ?? "Contributor";

    // ── Update ticket status ─────────────────────────────────────────
    const now       = new Date().toISOString();
    const newStatus = closeTicket ? "closed" : reply ? "replied" : "closed";

    const { error: updateErr } = await admin
      .from("support_tickets")
      .update({
        ...(reply ? { admin_reply: reply, replied_at: now } : {}),
        status:     newStatus,
        updated_at: now,
      })
      .eq("id", ticketId);

    if (updateErr) {
      console.error("[reply-ticket] update error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // ── Insert into ticket_messages conversation thread ──────────────
    let newMsg = null;
    if (reply) {
      const { data: msgData, error: msgErr } = await admin
        .from("ticket_messages")
        .insert({ ticket_id: ticketId, sender_id: user.id, sender_type: "admin", message: reply })
        .select("id, ticket_id, sender_id, sender_type, message, created_at")
        .single();
      if (msgErr) console.error("[reply-ticket] ticket_messages insert:", msgErr.message);
      else newMsg = msgData;
    }

    // ── In-app notification ──────────────────────────────────────────
    if (reply || closeTicket) {
      const title   = closeTicket && !reply ? "Support Ticket Closed" : "Support Ticket Replied";
      const message = reply
        ? `Your ticket "${ticket.subject}" has a new reply from support.`
        : `Your ticket "${ticket.subject}" has been closed.`;

      const { error: notifErr } = await admin.from("notifications").insert({
        user_id: ticket.contributor_id, title, message, type: "support",
      });
      if (notifErr) console.error("[reply-ticket] notification error:", notifErr.message);
    }

    // ── Email to contributor ─────────────────────────────────────────
    if (reply && process.env.RESEND_API_KEY && contribEmail) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    "NexGuild <noreply@nexguild.in>",
        to:      contribEmail,
        subject: `Re: ${ticket.subject}`,
        html: supportReplyHtml(ticket.subject, contribName, reply),
      }).catch((e: unknown) => console.error("[reply-ticket] email error:", e));
    } else if (!process.env.RESEND_API_KEY) {
      console.warn("[reply-ticket] RESEND_API_KEY not set — email skipped");
    }

    return NextResponse.json({ success: true, status: newStatus, message: newMsg });
  } catch (err) {
    console.error("[reply-ticket] unhandled:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
