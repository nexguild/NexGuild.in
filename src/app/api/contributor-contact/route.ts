import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contributorInquiryHtml } from "@/lib/email";

const TO_EMAIL   = "admin@nexguild.in";
const FROM_EMAIL = "noreply@nexguild.in";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, message } = body as { name?: string; email?: string; message?: string };

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: `NexGuild <${FROM_EMAIL}>`,
    to: TO_EMAIL,
    replyTo: email,
    subject: `Contributor Inquiry from ${name}`,
    html: contributorInquiryHtml(name, email, message),
  });

  if (error) {
    console.error("[contributor-contact] Resend error:", error);
    return NextResponse.json({ error: (error as { message?: string }).message ?? "Failed to send message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
