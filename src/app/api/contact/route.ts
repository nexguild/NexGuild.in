import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const TO_EMAIL = "nexguild.in@gmail.com";
const FROM_EMAIL = "noreply@nexguild.in";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, company, projectType, budget, timeline, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: `NexGuild Contact Form <${FROM_EMAIL}>`,
    to: TO_EMAIL,
    replyTo: email,
    subject: `New Contact: ${esc(name)}${company ? ` — ${esc(company)}` : ""}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #F59E0B;">New Contact Form Submission</h2>
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:8px 0; color:#888; width:130px;">Name</td><td style="padding:8px 0;">${esc(name)}</td></tr>
          <tr><td style="padding:8px 0; color:#888;">Email</td><td style="padding:8px 0;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
          ${company ? `<tr><td style="padding:8px 0; color:#888;">Company</td><td style="padding:8px 0;">${esc(company)}</td></tr>` : ""}
          ${projectType ? `<tr><td style="padding:8px 0; color:#888;">Project Type</td><td style="padding:8px 0;">${esc(projectType)}</td></tr>` : ""}
          ${budget ? `<tr><td style="padding:8px 0; color:#888;">Budget</td><td style="padding:8px 0;">${esc(budget)}</td></tr>` : ""}
          ${timeline ? `<tr><td style="padding:8px 0; color:#888;">Timeline</td><td style="padding:8px 0;">${esc(timeline)}</td></tr>` : ""}
        </table>
        <h3 style="color:#F59E0B; margin-top:20px;">Message</h3>
        <p style="white-space:pre-wrap; background:#f9f9f9; padding:16px; border-radius:6px;">${esc(message)}</p>
      </div>
    `,
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
