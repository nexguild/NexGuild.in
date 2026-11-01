import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactFormHtml } from "@/lib/email";

const TO_EMAIL = "admin@nexguild.in";
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
    html: contactFormHtml(name, email, message, { company, projectType, budget, timeline }),
  });

  if (error) {
    console.error("[contact] Resend error:", error);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
