import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const revalidate = 21600; // 6 hours

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
  tags: string[];
}

const CATEGORY_MAP: Record<string, string> = {
  "Customer Service": "customer-service",
  "Data Entry": "data",
  "Content": "writing",
  "Marketing": "marketing",
  "QA / Testing": "quality-assurance",
  "Translation": "writing",
};

// Keep only jobs open to India: worldwide/unrestricted or explicitly Asia/India
function isIndiaFriendly(location: string): boolean {
  if (!location) return true;
  const l = location.toLowerCase();
  // Reject geo-locked regions that exclude India
  const blocked = ["usa", "us only", "united states", "canada", "europe", "uk only", "united kingdom", "latin america", "latam", "south america", "americas", "brazil", "australia", "new zealand", "emea"];
  if (blocked.some((b) => l.includes(b))) return false;
  return true;
}

async function fetchRemotiveJobs(category?: string): Promise<RemotiveJob[]> {
  try {
    const params = new URLSearchParams({ limit: "100" });
    if (category && CATEGORY_MAP[category]) {
      params.set("category", CATEGORY_MAP[category]);
    }
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`, {
      next: { revalidate: 21600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: RemotiveJob[] = data.jobs ?? [];
    return jobs.filter((j) => isIndiaFriendly(j.candidate_required_location));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const work_type = searchParams.get("work_type") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const admin = createServerClient();

  // Fetch manual/HR-lead jobs from Supabase
  let query = admin
    .from("jobs")
    .select("id, title, company, company_logo_url, location, work_type, job_type, category, description, salary_range, apply_url, apply_via_nexguild, tags, source, is_featured, posted_at")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("posted_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (work_type) query = query.eq("work_type", work_type);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data: manualJobs } = await query;

  // Fetch from Remotive only if no work_type filter (Remotive is all-remote)
  let remotiveJobs: ReturnType<typeof normalizeRemotive>[] = [];
  if (!work_type || work_type === "remote") {
    const raw = await fetchRemotiveJobs(category);
    remotiveJobs = raw
      .filter((j) => !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company_name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 40)
      .map(normalizeRemotive);
  }

  // Manual jobs go first (featured first), then Remotive
  return NextResponse.json({
    jobs: [...(manualJobs ?? []), ...remotiveJobs],
  });
}

function normalizeRemotive(j: RemotiveJob) {
  return {
    id: `remotive-${j.id}`,
    title: j.title,
    company: j.company_name,
    company_logo_url: j.company_logo ?? null,
    location: j.candidate_required_location || "Remote",
    work_type: "remote",
    job_type: j.job_type || "full-time",
    category: mapRemotiveCategory(j.category),
    description: j.description,
    salary_range: j.salary || null,
    apply_url: j.url,
    apply_via_nexguild: false,
    tags: j.tags ?? [],
    source: "remotive",
    is_featured: false,
    posted_at: j.publication_date,
  };
}

function mapRemotiveCategory(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes("customer")) return "Customer Service";
  if (lower.includes("data")) return "Data Entry";
  if (lower.includes("writing") || lower.includes("content")) return "Content";
  if (lower.includes("marketing")) return "Marketing";
  if (lower.includes("quality") || lower.includes("qa")) return "QA / Testing";
  if (lower.includes("translat")) return "Translation";
  return cat;
}
