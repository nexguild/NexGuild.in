import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { FROM_NOREPLY, getResend, coinsDeductedHtml } from "@/lib/email";
import { writeAdminAudit } from "@/lib/admin-audit";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { data: profile } = await admin
    .from("profiles")
    .select("nexcoins, full_name, email")
    .eq("id", contributorId)
    .single();

  if (!profile) return NextResponse.json({ error: "Contributor not found." }, { status: 404 });

  const p = profile as { nexcoins: number; full_name: string | null; email: string | null };
  const current    = p.nexcoins ?? 0;
  const newBalance = Math.max(0, current - amount);
  const deducted   = current - newBalance;

  if (deducted === 0) {
    return NextResponse.json({ error: "Contributor has 0 coins — nothing to deduct." }, { status: 400 });
  }

  const { error: updateError } = await admin.from("profiles").update({ nexcoins: newBalance }).eq("id", contributorId);
  if (updateError) return NextResponse.json({ error: "Failed to update balance." }, { status: 500 });

  await writeAdminAudit(admin, {
    actorId: user.id,
    action: "coins_deducted",
    targetType: "contributor",
    targetId: contributorId,
    summary: `Deducted ${deducted.toLocaleString()} NexCoins from ${p.full_name ?? p.email ?? contributorId}${reason?.trim() ? `: ${reason.trim()}` : ""}`,
    metadata: { amount: deducted, newBalance },
  });

  await admin.from("coin_transactions").insert({
    contributor_id: contributorId,
    amount:         deducted,
    type:           "deducted",
    source:         "admin",
    description:    reason?.trim() || "Coins deducted by admin",
    created_at:     new Date().toISOString(),
  });

  await admin.from("notifications").insert({
    user_id: contributorId,
    title:   `${deducted.toLocaleString()} NexCoins deducted from your account`,
    message: reason?.trim()
      ? `${deducted.toLocaleString()} NexCoins have been deducted. Reason: ${reason.trim()}`
      : `${deducted.toLocaleString()} NexCoins have been deducted from your account by the admin.`,
    type: "system",
  });

  // Send email (non-critical)
  const resend = getResend();
  if (resend && p.email) {
    resend.emails.send({
      from:    FROM_NOREPLY,
      to:      p.email,
      subject: `${deducted.toLocaleString()} NexCoins deducted from your account`,
      html:    coinsDeductedHtml(p.full_name ?? "Contributor", deducted, reason?.trim() || null, newBalance),
    }).catch((e: unknown) => console.error("[deduct-coins] email error:", e));
  }

  return NextResponse.json({ success: true, newBalance, amountDeducted: deducted });
}
