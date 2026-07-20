import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

function makeCode(userId: string, siteSlug: string, hourWindow: number, secret: string): string {
  const input = `${userId}:${siteSlug}:${hourWindow}:${secret}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 8).toUpperCase();
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ valid: false, reason: "unauthorized" }, { status: 401 });
  }

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ valid: false, reason: "unauthorized" }, { status: 401 });
  }

  // 20 validations per user per hour — proof codes are one-time use anyway
  const { allowed, retryAfterMs } = rateLimit(`proof-code:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { valid: false, reason: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const secret = process.env.PROOF_CODE_SECRET;
  if (!secret) {
    return NextResponse.json({ valid: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { code?: string; site_slug?: string; task_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "bad_request" }, { status: 400 });
  }

  const code     = (body.code ?? "").trim().toUpperCase();
  const siteSlug = body.site_slug ?? "";
  const taskId   = body.task_id ?? null;

  if (!code || !siteSlug) {
    return NextResponse.json({ valid: false, reason: "missing_fields" }, { status: 400 });
  }

  // Accept codes from current hour and the previous hour (handles edge cases near boundary)
  const hourNow = Math.floor(Date.now() / (1000 * 60 * 60));
  const validCodes = [
    makeCode(user.id, siteSlug, hourNow,     secret),
    makeCode(user.id, siteSlug, hourNow - 1, secret),
  ];

  if (!validCodes.includes(code)) {
    return NextResponse.json({ valid: false, reason: "invalid_code" });
  }

  // Get client IP (Vercel sets x-forwarded-for)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
          ?? req.headers.get("x-real-ip")
          ?? "unknown";

  // Record submission — the UNIQUE constraint (contributor_id, site_slug, code) prevents reuse
  const { error: insertErr } = await admin.from("proof_code_submissions").insert({
    contributor_id: user.id,
    site_slug:      siteSlug,
    task_id:        taskId,
    code,
    ip_address:     ip,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ valid: false, reason: "already_used" });
    }
    console.error("[proof-code/validate] insert error:", insertErr.message);
    return NextResponse.json({ valid: false, reason: "db_error" }, { status: 500 });
  }

  // Flag if same IP already has a submission for this site from a different user in the last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: dupes } = await admin
    .from("proof_code_submissions")
    .select("contributor_id")
    .eq("site_slug", siteSlug)
    .eq("ip_address", ip)
    .neq("contributor_id", user.id)
    .gte("created_at", since)
    .limit(1);

  if (dupes && dupes.length > 0) {
    await admin
      .from("proof_code_submissions")
      .update({ suspicious: true })
      .eq("contributor_id", user.id)
      .eq("site_slug", siteSlug)
      .eq("code", code);
  }

  return NextResponse.json({ valid: true });
}
