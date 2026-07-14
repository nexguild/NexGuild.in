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
  return { admin };
}

export async function GET(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: jobs, error } = await ctx.admin
    .from("jobs")
    .select("id, title, company, location, work_type, job_type, category, source, is_active, is_featured, apply_via_nexguild, posted_at, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch application counts
  const jobIds = (jobs ?? []).map((j: { id: string }) => j.id);
  let appCounts: Record<string, number> = {};
  if (jobIds.length > 0) {
    const { data: apps } = await ctx.admin
      .from("job_applications")
      .select("job_id")
      .in("job_id", jobIds);
    for (const a of apps ?? []) {
      const app = a as { job_id: string };
      appCounts[app.job_id] = (appCounts[app.job_id] ?? 0) + 1;
    }
  }

  const enriched = (jobs ?? []).map((j: Record<string, unknown>) => ({
    ...j,
    application_count: appCounts[j.id as string] ?? 0,
  }));

  return NextResponse.json({ jobs: enriched });
}

export async function POST(req: NextRequest) {
  const ctx = await verifyAdmin(req);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, company, company_logo_url, location, work_type, job_type,
    category, description, requirements, salary_range,
    apply_url, apply_via_nexguild,
    tags, source, is_active, is_featured,
    hr_name, hr_contact, commission_note, expires_at,
  } = body;

  if (!title || !company || !category || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await ctx.admin.from("jobs").insert({
    title, company,
    company_logo_url: company_logo_url || null,
    location: location || "Remote",
    work_type: work_type || "remote",
    job_type: job_type || "full-time",
    category, description,
    requirements: requirements || null,
    salary_range: salary_range || null,
    apply_url: apply_url || null,
    apply_via_nexguild: apply_via_nexguild ?? false,
    tags: tags ?? [],
    source: source || "manual",
    is_active: is_active ?? true,
    is_featured: is_featured ?? false,
    hr_name: hr_name || null,
    hr_contact: hr_contact || null,
    commission_note: commission_note || null,
    expires_at: expires_at || null,
    posted_at: new Date().toISOString(),
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
