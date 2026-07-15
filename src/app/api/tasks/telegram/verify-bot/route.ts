import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

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

  const { allowed } = rateLimit(`tg-bot-verify:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ verified: false, reason: "rate_limited" }, { status: 429 });
  }

  let body: { task_id?: string; step_index?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false, reason: "bad_request" }, { status: 400 });
  }

  const { task_id, step_index = 0 } = body;
  if (!task_id) {
    return NextResponse.json({ verified: false, reason: "missing_fields" }, { status: 400 });
  }

  // Prevent double-claiming
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

  // Check if user has started the bot (telegram_accounts row exists)
  const { data: tgAccount } = await supabase
    .from("telegram_accounts")
    .select("telegram_id")
    .eq("contributor_id", user.id)
    .maybeSingle();

  if (!tgAccount) {
    return NextResponse.json({ verified: false, reason: "not_started" });
  }

  // Record verification using __bot__ as the channel sentinel
  const { error } = await supabase.from("telegram_verifications").insert({
    contributor_id:   user.id,
    telegram_channel: "__bot__",
    task_id,
    step_index,
  });

  if (error && error.code !== "23505") {
    console.error("[telegram/verify-bot] insert error:", error.message);
    return NextResponse.json({ verified: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ verified: true });
}
