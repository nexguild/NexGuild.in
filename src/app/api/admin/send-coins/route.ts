import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { FROM_NOREPLY, getResend, coinsReceivedHtml } from "@/lib/email";
import { writeAdminAudit } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if ((caller as { role: string } | null)?.role !== "admin" && (caller as { role: string } | null)?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { contributorId, amount, reason } = await req.json() as {
    contributorId: string;
    amount: number;
    reason?: string;
  };

  if (!contributorId) return NextResponse.json({ error: "contributorId is required." }, { status: 400 });
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    return NextResponse.json({ error: "Amount must be a positive integer." }, { status: 400 });
  }

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("nexcoins, full_name, email")
    .eq("id", contributorId)
    .single();

  if (profErr || !profile) {
    return NextResponse.json({ error: "Contributor not found." }, { status: 404 });
  }

  const p = profile as { nexcoins: number; full_name: string | null; email: string | null };
  const current    = p.nexcoins ?? 0;
  const newBalance = current + amount;

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ nexcoins: newBalance })
    .eq("id", contributorId);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to update balance." }, { status: 500 });
  }

  await writeAdminAudit(admin, {
    actorId: user.id,
    action: "coins_sent",
    targetType: "contributor",
    targetId: contributorId,
    summary: `Sent ${amount.toLocaleString()} NexCoins to ${p.full_name ?? p.email ?? contributorId}${reason?.trim() ? `: ${reason.trim()}` : ""}`,
    metadata: { amount, newBalance },
  });

  await admin.from("coin_transactions").insert({
    contributor_id: contributorId,
    amount,
    type:        "bonus",
    source:      "admin",
    description: reason?.trim() || "Bonus NexCoins from admin",
    created_at:  new Date().toISOString(),
  });

  await admin.from("notifications").insert({
    user_id: contributorId,
    title:   `You received ${amount.toLocaleString()} bonus NexCoins!`,
    message: reason?.trim()
      ? `${amount.toLocaleString()} NexCoins added to your account. Reason: ${reason.trim()}`
      : `${amount.toLocaleString()} NexCoins have been added to your account by the admin.`,
    type: "bonus_coins",
  });

  // Send email (non-critical)
  const resend = getResend();
  if (resend && p.email) {
    resend.emails.send({
      from:    FROM_NOREPLY,
      to:      p.email,
      subject: `You received ${amount.toLocaleString()} NexCoins! 🎉`,
      html:    coinsReceivedHtml(p.full_name ?? "Contributor", amount, reason?.trim() || null, newBalance),
    }).catch((e: unknown) => console.error("[send-coins] email error:", e));
  }

  return NextResponse.json({ success: true, newBalance, amountSent: amount });
}
