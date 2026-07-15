import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

async function checkMembership(chatId: string, telegramUserId: number): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`
      + `?chat_id=${encodeURIComponent(chatId)}&user_id=${telegramUserId}`;
    const res  = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json() as { ok: boolean; result?: { status: string } };
    if (!data.ok || !data.result) return false;
    return ["creator", "administrator", "member"].includes(data.result.status);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ verified: false, reason: "unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ verified: false, reason: "unauthorized" }, { status: 401 });
  }

  const { allowed } = rateLimit(`tg-verify:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ verified: false, reason: "rate_limited" }, { status: 429 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ verified: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { task_id?: string; step_index?: number; telegram_channel?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false, reason: "bad_request" }, { status: 400 });
  }

  const { task_id, step_index = 0, telegram_channel } = body;
  if (!task_id || !telegram_channel) {
    return NextResponse.json({ verified: false, reason: "missing_fields" }, { status: 400 });
  }

  // Prevent double-claiming the same step
  const { data: existing } = await supabase
    .from("telegram_verifications")
    .select("id")
    .eq("contributor_id", user.id)
    .eq("task_id", task_id)
    .eq("step_index", step_index)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ verified: true, already_verified: true });
  }

  // Get linked Telegram ID
  const { data: tgAccount } = await supabase
    .from("telegram_accounts")
    .select("telegram_id")
    .eq("contributor_id", user.id)
    .maybeSingle();

  if (!tgAccount) {
    return NextResponse.json({ verified: false, reason: "not_linked" });
  }

  // Normalize channel name — ensure @ prefix
  const chatId = telegram_channel.startsWith("@")
    ? telegram_channel
    : `@${telegram_channel}`;

  const isMember = await checkMembership(chatId, tgAccount.telegram_id);
  if (!isMember) {
    return NextResponse.json({ verified: false, reason: "not_member" });
  }

  // Record so the same task step can't be claimed again
  const { error } = await supabase.from("telegram_verifications").insert({
    contributor_id:    user.id,
    telegram_channel:  chatId,
    task_id,
    step_index,
  });

  if (error && error.code !== "23505") {
    console.error("[telegram/verify-join] insert error:", error.message);
    return NextResponse.json({ verified: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
