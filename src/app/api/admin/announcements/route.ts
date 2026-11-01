import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { announcementHtml } from "@/lib/email";
import { isBrevoConfigured, sendBrevoEmails } from "@/lib/brevo";

type AnnouncementTarget = "all" | "active" | "new";

function isAnnouncementTarget(target: string | null): target is AnnouncementTarget {
  return target === "all" || target === "active" || target === "new";
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  const ANNOUNCE_ROLES = ["owner", "admin", "support", "moderator"];
  if (!ANNOUNCE_ROLES.includes(role ?? "")) return null;
  return { admin, userId: user.id };
}

export async function GET(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = req.nextUrl.searchParams.get("target");
  if (!isAnnouncementTarget(target)) {
    return NextResponse.json({ error: "Choose a valid announcement audience." }, { status: 400 });
  }

  let query = ctx.admin.from("profiles").select("id", { count: "exact", head: true });

  if (target === "all") {
    query = query.in("role", ["contributor", "admin", "owner"]);
  } else if (target === "active") {
    query = query.eq("role", "contributor").eq("status", "active");
  } else {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.eq("role", "contributor").gte("joined_at", thirtyDaysAgo);
  }

  const { count, error } = await query;
  if (error) {
    console.error("[announcements] audience preview error:", error.message);
    return NextResponse.json({ error: "Unable to load the audience size." }, { status: 500 });
  }

  return NextResponse.json({ recipientCount: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { title, message, target, expectedRecipientCount } = (body ?? {}) as {
    title?: string;
    message?: string;
    target?: string;
    expectedRecipientCount?: number;
  };
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }
  if (!isAnnouncementTarget(target ?? "all")) {
    return NextResponse.json({ error: "Choose a valid announcement audience." }, { status: 400 });
  }

  const { admin, userId } = ctx;
  const targetVal = target ?? "all";

  let query = admin.from("profiles").select("id, full_name, email");

  if (targetVal === "all") {
    query = query.in("role", ["contributor", "admin", "owner"]);
  } else if (targetVal === "active") {
    query = query.eq("role", "contributor").eq("status", "active");
  } else if (targetVal === "new") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.eq("role", "contributor").gte("joined_at", thirtyDaysAgo);
  } else {
    query = query.in("role", ["contributor", "admin", "owner"]);
  }

  const { data: targetUsers, error: usersErr } = await query;

  if (usersErr) {
    console.error("[announcements] target users query error:", usersErr.message);
    return NextResponse.json({ error: "Unable to load announcement recipients." }, { status: 500 });
  }

  const users = (targetUsers ?? []) as { id: string; full_name: string | null; email: string | null }[];
  if (typeof expectedRecipientCount === "number" && expectedRecipientCount !== users.length) {
    return NextResponse.json(
      { error: "The audience changed since preview. Review the updated audience and try again." },
      { status: 409 },
    );
  }

  const { data: ann, error: insertErr } = await admin
    .from("announcements")
    .insert({ title: title.trim(), message: message.trim(), target: targetVal, created_by: userId })
    .select("id, title, message, target, created_at")
    .single();

  if (insertErr) {
    console.error("[announcements] insert error:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  console.log(`[announcements] target="${targetVal}" → ${users.length} users`);

  let notifsSent = 0;
  let emailsSent = 0;
  const deliveryWarnings: string[] = [];
  if (users.length > 0) {
    const notifTitle = `📢 ${title.trim()}`;
    const rows = users.map((u) => ({
      user_id: u.id,
      title:   notifTitle,
      message: message.trim(),
      type:    "announcement",
      is_read: false,
    }));

    const { error: notifErr } = await admin.from("notifications").insert(rows);
    if (notifErr) {
      console.error("[announcements] notifications insert error:", notifErr.message);
      deliveryWarnings.push("Some dashboard notifications could not be created.");
    } else {
      notifsSent = rows.length;
      console.log(`[announcements] inserted ${rows.length} notifications`);
    }

    // ── Email blast ────────────────────────────────────────────────────────
    if (isBrevoConfigured()) {
      const withEmail = users.filter((u) => !!u.email);
      const emails = withEmail.map((u) => ({
        to:      u.email!,
        subject: `[NexGuild] ${title.trim()}`,
        html:    announcementHtml(u.full_name ?? "Contributor", title.trim(), message.trim()),
      }));

      emailsSent = await sendBrevoEmails(emails);
      if (emailsSent < emails.length) {
        deliveryWarnings.push("Some emails could not be sent.");
      }
    }
  }

  return NextResponse.json({
    ok: true,
    announcement: ann,
    recipientCount: users.length,
    notifsSent,
    emailsSent,
    emailConfigured: isBrevoConfigured(),
    deliveryWarning: deliveryWarnings.length > 0
      ? `The announcement was saved, but ${deliveryWarnings.join(" and ").toLowerCase()}`
      : null,
  });
}
