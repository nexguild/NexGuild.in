import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getResend, FROM_NOREPLY, accountDeactivatedHtml } from "@/lib/email";

const SUPPORT_EMAIL = "admin@nexguild.in";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch name before deactivating for the email
  const { data: profile } = await admin.from("profiles").select("full_name, email").eq("id", user.id).single();
  const p = profile as { full_name: string | null; email: string | null } | null;

  const { error } = await admin.from("profiles").update({ is_active: false }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate all sessions for this user immediately
  await admin.auth.admin.signOut(user.id, "global").catch(() => {});

  // Send deactivation notice email (fire-and-forget)
  const userEmail = p?.email ?? user.email;
  if (userEmail) {
    const resend = getResend();
    resend?.emails.send({
      from:    FROM_NOREPLY,
      to:      userEmail,
      subject: "Your NexGuild account has been deactivated",
      html:    accountDeactivatedHtml(p?.full_name ?? "Contributor", SUPPORT_EMAIL),
    }).catch((e: unknown) => console.error("[account/deactivate] email error:", e));
  }

  console.log(`[account/deactivate] user ${user.id} deactivated`);
  return NextResponse.json({ ok: true });
}
