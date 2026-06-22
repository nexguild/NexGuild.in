import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const SECTION_KEYS = [
  "maintenance_org",
  "maintenance_contributor",
  "maintenance_dashboard",
  "maintenance_store",
  "maintenance_offerwalls",
  "maintenance_signup",
] as const;

type SectionKey = typeof SECTION_KEYS[number];

const TEAM_ROLES = ["admin", "reviewer", "finance", "support", "moderator"] as const;
type TeamRole = typeof TEAM_ROLES[number];

function isTeamRole(r: unknown): r is TeamRole {
  return TEAM_ROLES.includes(r as TeamRole);
}

const ALL_STAFF_ROLES = ["owner", "admin", "reviewer", "finance", "support", "moderator"] as const;

async function verifyAdminOrOwner(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || role === "contributor") return null;
  return { admin, userId: user.id, role };
}

export async function GET(req: NextRequest) {
  const ctx = await verifyAdminOrOwner(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { admin } = ctx;

  const SETTING_KEYS = [
    ...SECTION_KEYS,
    "streak_daily_bonus",
    "streak_day7_bonus",
    "streak_tasks_required_per_day",
    "allowed_signup_domains",
    "nexcoin_per_inr",
    "nexcoin_per_usd",
  ] as const;

  const [{ data: staff }, { data: settings }] = await Promise.all([
    admin.from("profiles")
      .select("id, full_name, email, role, joined_at")
      .in("role", [...ALL_STAFF_ROLES])
      .order("joined_at", { ascending: true }),
    admin.from("platform_settings")
      .select("key, value")
      .in("key", [...SETTING_KEYS]),
  ]);

  const rows = settings as { key: string; value: string }[] | null ?? [];

  const maintenanceSections = Object.fromEntries(
    SECTION_KEYS.map((k) => [
      k.replace("maintenance_", ""),
      rows.find((r) => r.key === k)?.value === "true",
    ])
  ) as Record<string, boolean>;

  const streakDailyBonus    = parseInt(rows.find((r) => r.key === "streak_daily_bonus")?.value              ?? "10") || 10;
  const streakDay7Bonus     = parseInt(rows.find((r) => r.key === "streak_day7_bonus")?.value               ?? "50") || 50;
  const streakTasksRequired = parseInt(rows.find((r) => r.key === "streak_tasks_required_per_day")?.value   ?? "5")  || 5;

  const allowedDomainsRaw = rows.find((r) => r.key === "allowed_signup_domains")?.value ?? '["gmail.com","outlook.com"]';
  let allowedDomains: string[] = ["gmail.com", "outlook.com"];
  try { allowedDomains = JSON.parse(allowedDomainsRaw) as string[]; } catch { /* use fallback */ }

  const nexcoinPerInr = parseFloat(rows.find((r) => r.key === "nexcoin_per_inr")?.value ?? "12.5") || 12.5;
  const nexcoinPerUsd = parseFloat(rows.find((r) => r.key === "nexcoin_per_usd")?.value ?? "1000") || 1000;

  return NextResponse.json({
    admins: staff ?? [],
    maintenanceSections,
    streakDailyBonus,
    streakDay7Bonus,
    streakTasksRequired,
    allowedDomains,
    nexcoinPerInr,
    nexcoinPerUsd,
  });
}

export async function PATCH(req: NextRequest) {
  const ctx = await verifyAdminOrOwner(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { admin, role } = ctx;

  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "action required" }, { status: 400 });

  // Section maintenance — owner only
  if (body.action === "maintenance_section") {
    if (role !== "owner") return NextResponse.json({ error: "Only the owner can toggle maintenance mode." }, { status: 403 });
    const section = body.section as string;
    const key = `maintenance_${section}` as SectionKey;
    if (!SECTION_KEYS.includes(key)) return NextResponse.json({ error: "Invalid section." }, { status: 400 });
    const value = body.value === true ? "true" : "false";
    const { error } = await admin.from("platform_settings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Team role actions — owner only
  if (["promote", "demote", "change_role"].includes(body.action)) {
    if (role !== "owner") return NextResponse.json({ error: "Only the owner can manage team roles." }, { status: 403 });
  }

  if (body.action === "promote") {
    const email = body.email?.trim()?.toLowerCase();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
    const newRole: unknown = body.role ?? "admin";
    if (!isTeamRole(newRole)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    const { data: target } = await admin.from("profiles").select("id, role").eq("email", email).single();
    if (!target) return NextResponse.json({ error: "No account found with that email address." }, { status: 404 });
    const tgt = target as { id: string; role: string };
    if (tgt.role === "owner") return NextResponse.json({ error: "Cannot modify the owner account." }, { status: 403 });
    const { error } = await admin.from("profiles").update({ role: newRole }).eq("id", tgt.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: updated } = await admin.from("profiles")
      .select("id, full_name, email, role, joined_at")
      .in("role", [...ALL_STAFF_ROLES])
      .order("joined_at", { ascending: true });
    return NextResponse.json({ ok: true, admins: updated ?? [] });
  }

  if (body.action === "change_role") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const newRole: unknown = body.role;
    if (!isTeamRole(newRole)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    const { data: target } = await admin.from("profiles").select("role").eq("id", body.id).single();
    if ((target as { role: string } | null)?.role === "owner") return NextResponse.json({ error: "Cannot modify the owner account." }, { status: 403 });
    const { error } = await admin.from("profiles").update({ role: newRole }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const { data: updated } = await admin.from("profiles")
      .select("id, full_name, email, role, joined_at")
      .in("role", [...ALL_STAFF_ROLES])
      .order("joined_at", { ascending: true });
    return NextResponse.json({ ok: true, admins: updated ?? [] });
  }

  if (body.action === "demote") {
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { data: target } = await admin.from("profiles").select("role").eq("id", body.id).single();
    if ((target as { role: string } | null)?.role === "owner") return NextResponse.json({ error: "Cannot modify the owner account." }, { status: 403 });
    await admin.from("profiles").update({ role: "contributor" }).eq("id", body.id);
    return NextResponse.json({ ok: true });
  }

  // Streak settings — owner only
  if (body.action === "update_streak_settings") {
    if (role !== "owner") return NextResponse.json({ error: "Only the owner can update streak settings." }, { status: 403 });
    const daily    = parseInt(body.dailyBonus, 10);
    const day7     = parseInt(body.day7Bonus, 10);
    const required = parseInt(body.tasksRequired, 10);
    if (isNaN(daily) || daily < 1 || isNaN(day7) || day7 < 1) return NextResponse.json({ error: "Bonus values must be positive integers." }, { status: 400 });
    if (isNaN(required) || required < 1) return NextResponse.json({ error: "Tasks required must be a positive integer." }, { status: 400 });
    const { error } = await admin.from("platform_settings").upsert([
      { key: "streak_daily_bonus",            value: String(daily),    updated_at: new Date().toISOString() },
      { key: "streak_day7_bonus",             value: String(day7),     updated_at: new Date().toISOString() },
      { key: "streak_tasks_required_per_day", value: String(required), updated_at: new Date().toISOString() },
    ], { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Allowed signup domains — owner AND admin
  if (body.action === "update_signup_domains") {
    if (role !== "owner" && role !== "admin") return NextResponse.json({ error: "Only owner or admin can manage signup domains." }, { status: 403 });
    const domains = body.domains as unknown;
    if (!Array.isArray(domains)) return NextResponse.json({ error: "domains must be an array." }, { status: 400 });
    const cleaned = (domains as string[])
      .map((d) => d.trim().toLowerCase())
      .filter((d) => d.length > 0 && d.includes("."));
    if (cleaned.length === 0) return NextResponse.json({ error: "At least one valid domain is required." }, { status: 400 });
    const { error } = await admin.from("platform_settings").upsert(
      { key: "allowed_signup_domains", value: JSON.stringify(cleaned), updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, allowedDomains: cleaned });
  }

  // Exchange rates — owner only
  if (body.action === "update_exchange_rates") {
    if (role !== "owner") return NextResponse.json({ error: "Only the owner can update exchange rates." }, { status: 403 });
    const perInr = parseFloat(body.nexcoinPerInr);
    const perUsd = parseFloat(body.nexcoinPerUsd);
    if (isNaN(perInr) || perInr <= 0 || isNaN(perUsd) || perUsd <= 0) {
      return NextResponse.json({ error: "Rates must be positive numbers." }, { status: 400 });
    }
    const { error } = await admin.from("platform_settings").upsert([
      { key: "nexcoin_per_inr", value: String(perInr), updated_at: new Date().toISOString() },
      { key: "nexcoin_per_usd", value: String(perUsd), updated_at: new Date().toISOString() },
    ], { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
