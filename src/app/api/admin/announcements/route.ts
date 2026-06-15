import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "admin" && role !== "owner") return null;
  return { admin, userId: user.id };
}

export async function POST(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { title, message, target } = (body ?? {}) as { title?: string; message?: string; target?: string };
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required." }, { status: 400 });
  }

  const { admin, userId } = ctx;
  const targetVal = target ?? "all";

  // Insert the announcement record
  const { data: ann, error: insertErr } = await admin
    .from("announcements")
    .insert({ title: title.trim(), message: message.trim(), target: targetVal, created_by: userId })
    .select("id, title, message, target, created_at")
    .single();

  if (insertErr) {
    console.error("[announcements] insert error:", insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Build the profiles query based on target
  let query = admin.from("profiles").select("id");

  if (targetVal === "all") {
    // Everyone: contributors, admins, owners
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
    // Still return success for the announcement — notifications are best-effort
    return NextResponse.json({ ok: true, announcement: ann, notifsSent: 0 });
  }

  const userIds = (targetUsers ?? []) as { id: string }[];
  console.log(`[announcements] target="${targetVal}" → ${userIds.length} users`);

  if (userIds.length > 0) {
    const notifTitle = `📢 ${title.trim()}`;
    const rows = userIds.map((u) => ({
      user_id:  u.id,
      title:    notifTitle,
      message:  message.trim(),
      type:     "announcement",
      is_read:  false,
    }));

    const { error: notifErr } = await admin.from("notifications").insert(rows);
    if (notifErr) {
      console.error("[announcements] notifications insert error:", notifErr.message);
    } else {
      console.log(`[announcements] inserted ${rows.length} notifications`);
    }
  }

  return NextResponse.json({ ok: true, announcement: ann, notifsSent: userIds.length });
}
