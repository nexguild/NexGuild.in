import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

interface TelegramMessage {
  from: { id: number; username?: string; first_name: string };
  chat: { id: number };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

const BOT_TOKEN      = process.env.TELEGRAM_BOT_TOKEN      ?? "";
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

async function sendMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function POST(req: NextRequest) {
  // Verify webhook secret when configured
  if (WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== WEBHOOK_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const msg = update.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const telegramId = msg.from.id;
  const chatId     = msg.chat.id;
  const text       = msg.text.trim();

  // /start nexguild_{userId} — link account
  if (text.startsWith("/start nexguild_")) {
    const nexguildUserId = text.replace("/start nexguild_", "").trim();

    if (!nexguildUserId) {
      await sendMessage(chatId, "❌ Invalid link. Please use the task link from your NexGuild dashboard.");
      return NextResponse.json({ ok: true });
    }

    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", nexguildUserId)
      .maybeSingle();

    if (!profile) {
      await sendMessage(chatId, "❌ NexGuild account not found. Please check your task link and try again.");
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase.from("telegram_accounts").upsert({
      contributor_id:    nexguildUserId,
      telegram_id:       telegramId,
      telegram_username: msg.from.username ?? null,
    }, { onConflict: "contributor_id" });

    if (error) {
      console.error("[telegram/webhook] upsert error:", error.message);
      await sendMessage(chatId, "❌ Failed to link your account. Please try again.");
      return NextResponse.json({ ok: true });
    }

    const name = profile.full_name ?? "there";
    await sendMessage(
      chatId,
      `✅ <b>Account linked!</b>\n\nHi ${name}, your Telegram is now connected to NexGuild.\n\nReturn to your task and click <b>Verify Join</b> after joining the required channel.`
    );
    return NextResponse.json({ ok: true });
  }

  // Plain /start — welcome message
  if (text === "/start") {
    await sendMessage(
      chatId,
      `👋 <b>Welcome to NexGuildBot!</b>\n\nThis bot verifies NexGuild task completions.\n\nTo link your account, click the task link from your NexGuild dashboard and tap <b>Open @NexGuildBot</b>.`
    );
  }

  return NextResponse.json({ ok: true });
}
