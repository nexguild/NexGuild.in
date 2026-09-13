export type BrevoEmail = {
  to: string;
  subject: string;
  html: string;
};

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

async function sendBrevoEmail(email: BrevoEmail): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY is not configured");

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.BREVO_FROM_EMAIL ?? "noreply@nexguild.in",
        name: "NexGuild",
      },
      to: [{ email: email.to }],
      subject: email.subject,
      htmlContent: email.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${detail}`);
  }
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
