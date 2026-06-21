import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    html: `
      <div style="font-family:sans-serif; max-width:600px;">
        <h2 style="color:#14b8a6;">Contributor Inquiry</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:8px 0; color:#888; width:80px;">Name</td><td style="padding:8px 0;">${name}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
        </table>
        <h3 style="color:#14b8a6; margin-top:20px;">Message</h3>
        <p style="white-space:pre-wrap; background:#f9f9f9; padding:16px; border-radius:6px;">${message}</p>
      </div>
    `,
  });

  if (error) {
    console.error("[contributor-contact] Resend error:", error);
    return NextResponse.json({ error: (error as { message?: string }).message ?? "Failed to send message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
