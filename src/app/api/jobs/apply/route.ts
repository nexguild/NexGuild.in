import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { job_id, full_name, email, phone, applicant_role, experience_years, message } = body;

  if (!job_id || !full_name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createServerClient();

  // Verify the job exists, is active, and accepts nexguild applications
  const { data: job } = await admin
    .from("jobs")
    .select("id, title, apply_via_nexguild")
    .eq("id", job_id)
    .eq("is_active", true)
    .single();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!job.apply_via_nexguild) return NextResponse.json({ error: "Direct apply only" }, { status: 400 });

  const { error } = await admin.from("job_applications").insert({
    job_id,
    full_name,
    email,
    phone: phone || null,
    applicant_role: applicant_role || null,
    experience_years: experience_years || null,
    message: message || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
