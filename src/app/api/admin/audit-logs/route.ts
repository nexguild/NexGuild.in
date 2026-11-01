import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: caller, error: roleError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError) {
    console.error("[admin/audit-logs] staff lookup error:", roleError.message);
    return NextResponse.json({ error: "Unable to verify staff access." }, { status: 500 });
  }
  if (!ADMIN_ROLES.UPPER.some((role) => role === caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.min(10_000, Math.max(1, requestedPage)) : 1;
  const action = params.get("action")?.trim();
  const search = params.get("search")?.trim();
  const pageSize = 50;

  let query = admin
    .from("admin_audit_logs")
    .select("id, actor_id, action, target_type, target_id, summary, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (action) query = query.eq("action", action);
  if (search) query = query.ilike("summary", `%${search}%`);

  const { data: logs, count, error } = await query;
  if (error) {
    console.error("[admin/audit-logs] query error:", error.message);
    return NextResponse.json({ error: "Failed to load audit history." }, { status: 500 });
  }

  const actorIds = [...new Set((logs ?? []).map((log) => log.actor_id).filter((id): id is string => id !== null))];
  const { data: profiles, error: profilesError } = actorIds.length
    ? await admin.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [], error: null };
  if (profilesError) {
    console.error("[admin/audit-logs] actor lookup error:", profilesError.message);
    return NextResponse.json({ error: "Failed to load audit actors." }, { status: 500 });
  }

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  return NextResponse.json({
    logs: (logs ?? []).map((log) => ({ ...log, actor: log.actor_id ? profilesById.get(log.actor_id) ?? null : null })),
    total: count ?? 0,
    page,
    pageSize,
  });
}
