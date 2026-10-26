import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const DEFAULT_DOMAINS = ["gmail.com", "outlook.com"];

export async function GET() {
  const admin = createServerClient();
  const { data, error } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "allowed_signup_domains")
    .maybeSingle();

  if (error) {
    console.error("[signup-domains] Failed to load allowed domains:", error.message);
    return NextResponse.json({ error: "Could not load allowed signup domains." }, { status: 500 });
  }

  if (!data?.value) {
    return NextResponse.json({ allowedDomains: DEFAULT_DOMAINS });
  }

  let domains: unknown;
  try {
    domains = JSON.parse(data.value);
  } catch {
    console.error("[signup-domains] Saved allowed domains are not valid JSON.");
    return NextResponse.json({ error: "Signup domain settings are invalid." }, { status: 500 });
  }

  if (!Array.isArray(domains) || domains.length === 0 || domains.some((domain) => typeof domain !== "string")) {
    console.error("[signup-domains] Saved allowed domains are not a non-empty string array.");
    return NextResponse.json({ error: "Signup domain settings are invalid." }, { status: 500 });
  }

  return NextResponse.json({
    allowedDomains: domains.map((domain: string) => domain.trim().toLowerCase()).filter(Boolean),
  });
}
