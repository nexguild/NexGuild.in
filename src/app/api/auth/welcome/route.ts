import { NextRequest, NextResponse } from "next/server";
import { FROM_NOREPLY, getResend, welcomeHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, name } = (body ?? {}) as { email?: string; name?: string };

  if (!email || !name) {
    return NextResponse.json({ error: "email and name required" }, { status: 400 });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ ok: true, skipped: "no RESEND_API_KEY" });
  }

  const { error } = await resend.emails.send({
    from:    FROM_NOREPLY,
    to:      email,
    subject: "Welcome to NexGuild! 🎉",
    html:    welcomeHtml(name),
  });

  if (error) {
    console.error("[welcome-email] Resend error:", error);
  }

  return NextResponse.json({ ok: true });
}
