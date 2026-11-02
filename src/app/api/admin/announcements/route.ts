import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { announcementHtml } from "@/lib/email";
import { isBrevoConfigured, sendBrevoEmails } from "@/lib/brevo";
import { getCountryName, isCountryCode } from "@/lib/countries";

type AnnouncementTarget = "all" | "active" | "new" | "country" | "users";

function isAnnouncementTarget(target: string | null): target is AnnouncementTarget {
  return target === "all" || target === "active" || target === "new" || target === "country" || target === "users";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

  if (target === "users" && req.nextUrl.searchParams.has("search")) {
    const search = (req.nextUrl.searchParams.get("search") ?? "").trim().slice(0, 100);
    if (search.length < 2) return NextResponse.json({ users: [] });

    const { data, error } = await ctx.admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "contributor")
      .or(`full_name.ilike.%${search.replace(/[,%()"\\]/g, " ")}%,email.ilike.%${search.replace(/[,%()"\\]/g, " ")}%`)
      .order("full_name", { ascending: true })
      .limit(20);

    if (error) {
      console.error("[announcements] user search error:", error.message);
      return NextResponse.json({ error: "Unable to search contributors." }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  }

  if (target === "country" && !isCountryCode(req.nextUrl.searchParams.get("country"))) {
    return NextResponse.json({ error: "Choose a valid country." }, { status: 400 });
  }

  const selectedIds = (req.nextUrl.searchParams.get("userIds") ?? "").split(",").filter(Boolean);
  if (target === "users" && (
    selectedIds.length > 100 ||
    selectedIds.some((id) => !isUuid(id))
  )) {
    return NextResponse.json({ error: "Choose up to 100 valid contributors." }, { status: 400 });
  }
  if (target === "users" && selectedIds.length === 0) {
    return NextResponse.json({ recipientCount: 0 });
  }

  let query = ctx.admin.from("profiles").select("id", { count: "exact", head: true });

  if (target === "all") {
    query = query.in("role", ["contributor", "admin", "owner"]);
  } else if (target === "active") {
    query = query.eq("role", "contributor").eq("status", "active");
  } else if (target === "new") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.eq("role", "contributor").gte("joined_at", thirtyDaysAgo);
  } else if (target === "country") {
    const countryCode = req.nextUrl.searchParams.get("country")!;
    const countryName = getCountryName(countryCode).replace(/"/g, '\\"');
    query = query.eq("role", "contributor").or(
      `country_code.eq.${countryCode},country.eq."${countryName}"`,
    );
  } else {
    query = query.eq("role", "contributor").in("id", selectedIds);
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
  const { title, message, target, countryCode, userIds, expectedRecipientCount } = (body ?? {}) as {
    title?: string;
    message?: string;
    target?: string;
    countryCode?: string;
    userIds?: string[];
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

  if (targetVal === "country" && !isCountryCode(countryCode)) {
    return NextResponse.json({ error: "Choose a valid country." }, { status: 400 });
  }
  if (targetVal === "users" && (
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    userIds.length > 100 ||
    new Set(userIds).size !== userIds.length ||
    userIds.some((id) => typeof id !== "string" || !isUuid(id))
  )) {
    return NextResponse.json({ error: "Choose between 1 and 100 valid contributors." }, { status: 400 });
  }

  let query = admin.from("profiles").select("id, full_name, email");

  if (targetVal === "all") {
    query = query.in("role", ["contributor", "admin", "owner"]);
  } else if (targetVal === "active") {
    query = query.eq("role", "contributor").eq("status", "active");
  } else if (targetVal === "new") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.eq("role", "contributor").gte("joined_at", thirtyDaysAgo);
  } else if (targetVal === "country") {
    const countryName = getCountryName(countryCode!).replace(/"/g, '\\"');
    query = query.eq("role", "contributor").or(
      `country_code.eq.${countryCode},country.eq."${countryName}"`,
    );
  } else {
    query = query.eq("role", "contributor").in("id", userIds!);
  }

  const { data: targetUsers, error: usersErr } = await query;

  if (usersErr) {
    console.error("[announcements] target users query error:", usersErr.message);
    return NextResponse.json({ error: "Unable to load announcement recipients." }, { status: 500 });
  }

  const users = (targetUsers ?? []) as { id: string; full_name: string | null; email: string | null }[];
  if (typeof expectedRecipientCount !== "number" || expectedRecipientCount !== users.length) {
    return NextResponse.json(
      { error: "The audience changed since preview. Review the updated audience and try again." },
      { status: 409 },
    );
  }

  const storedTarget = targetVal === "country"
    ? `country:${countryCode}`
    : targetVal === "users"
    ? `users:${users.length}`
    : targetVal;
  const { data: ann, error: insertErr } = await admin
    .from("announcements")
    .insert({ title: title.trim(), message: message.trim(), target: storedTarget, created_by: userId })
    .select("id, title, message, target, created_at")
    .single();

  if (insertErr) {
    console.error("[announcements] insert error:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  console.log(`[announcements] target="${storedTarget}" → ${users.length} users`);

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
