import nodemailer from "nodemailer";

export type BrevoEmail = {
  to: string;
  subject: string;
  html: string;
};

const BREVO_HOST = "smtp-relay.brevo.com";
const BREVO_PORT = 587;

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_KEY);
}

function getTransporter() {
  const smtpKey = process.env.BREVO_SMTP_KEY;
  const smtpUser = process.env.BREVO_SMTP_USER;
  if (!smtpKey || !smtpUser) {
    throw new Error("BREVO_SMTP_USER and BREVO_SMTP_KEY are required");
  }

  return nodemailer.createTransport({
    host: BREVO_HOST,
    port: BREVO_PORT,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpKey,
    },
  });
}

async function sendBrevoEmail(email: BrevoEmail): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"NexGuild" <${process.env.BREVO_FROM_EMAIL ?? "noreply@nexguild.in"}>`,
    to: email.to,
    subject: email.subject,
    html: email.html,
  });
}

export async function sendBrevoEmails(emails: BrevoEmail[]): Promise<number> {
  let sent = 0;
  const CONCURRENCY = 10;

  for (let i = 0; i < emails.length; i += CONCURRENCY) {
    const batch = emails.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(sendBrevoEmail));
    for (const result of results) {
      if (result.status === "fulfilled") sent++;
      else console.error("[brevo] email error:", result.reason);
    }
  }

  return sent;
}
