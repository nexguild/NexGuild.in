import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FROM_NOREPLY, getResend } from "@/lib/email";

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
  const resend = getResend();
  if (!resend) return NextResponse.json({ error: "Resend not configured" }, { status: 500 });

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

  let sent = 0;
  for (const p of (profiles ?? []) as { id: string; full_name: string | null; email: string | null; nexcoins: number }[]) {
    if (!p.email) continue;
    const weekEarned = earningsMap.get(p.id) ?? 0;
    const name = p.full_name?.split(" ")[0] ?? "there";

    const { error } = await resend.emails.send({
      from:    FROM_NOREPLY,
      to:      p.email,
      subject: `Your NexGuild week in review — +${weekEarned.toLocaleString()} NexCoins earned`,
      html:    weeklyDigestHtml(name, weekEarned, p.nexcoins),
    });

    if (!error) sent++;
  }

  return NextResponse.json({ sent, total: ids.length });
}

function weeklyDigestHtml(name: string, weekEarned: number, totalBalance: number): string {
  const n = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;">
      <tr>
        <td style="background:linear-gradient(135deg,#02b491,#029470);padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:2px;">NexGuild Weekly Digest</p>
          <h1 style="margin:8px 0 0;font-size:26px;font-weight:800;color:#fff;">Your week in review</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:16px;color:#374151;">Hi <strong>${n}</strong>,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">Here's what you earned on NexGuild this week:</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;">
                <p style="margin:0;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Earned This Week</p>
                <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:#15803d;">+${weekEarned.toLocaleString()}</p>
                <p style="margin:4px 0 0;font-size:13px;color:#16a34a;">NexCoins</p>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#f9fafb;border-radius:10px;padding:16px;">
            <tr>
              <td style="font-size:14px;color:#6b7280;">Total Balance</td>
              <td style="font-size:14px;font-weight:700;color:#111827;text-align:right;">${totalBalance.toLocaleString()} NC</td>
            </tr>
          </table>

          <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">Keep completing tasks, surveys, and offerwalls to earn more. Every NexCoin gets you closer to your next voucher.</p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="background:#02b491;border-radius:10px;">
              <a href="https://nexguild.in/earn" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Start Earning →</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you have an active NexGuild account.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} NexGuild · nexguild.in</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
