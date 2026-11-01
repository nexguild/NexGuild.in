import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmails } from "@/lib/brevo";
import { formatNexcoins } from "@/lib/nexcoins";
import { weeklyDigestHtml } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel can call this
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
    return NextResponse.json({ error: "Brevo not configured" }, { status: 500 });
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // Get all contributors who earned something this week
  const { data: txns } = await admin
    .from("coin_transactions")
    .select("contributor_id, amount")
    .eq("type", "earned")
    .gte("created_at", weekStart.toISOString());

  if (!txns || txns.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Sum earnings per contributor
  const earningsMap = new Map<string, number>();
  for (const t of txns as { contributor_id: string; amount: number }[]) {
    earningsMap.set(t.contributor_id, (earningsMap.get(t.contributor_id) ?? 0) + t.amount);
  }

  // Fetch profiles for those contributors
  const ids = Array.from(earningsMap.keys());
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, nexcoins")
    .in("id", ids)
    .eq("status", "active");

  const emails = [];
  for (const p of (profiles ?? []) as { id: string; full_name: string | null; email: string | null; nexcoins: number }[]) {
    if (!p.email) continue;
    const weekEarned = earningsMap.get(p.id) ?? 0;
    const name = p.full_name?.split(" ")[0] ?? "there";

    emails.push({
      to:      p.email,
      subject: `Your NexGuild week in review — +${formatNexcoins(weekEarned)} NexCoins earned`,
      html:    weeklyDigestHtml(name, weekEarned, p.nexcoins),
    });
  }

  const sent = await sendBrevoEmails(emails);
  return NextResponse.json({ sent, total: ids.length });
}
