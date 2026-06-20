import { NextRequest, NextResponse } from "next/server";

const SECTION_KEYS = [
  "maintenance_org",
  "maintenance_contributor",
  "maintenance_dashboard",
  "maintenance_store",
  "maintenance_offerwalls",
  "maintenance_signup",
] as const;

// Returns a map of section → boolean (true = maintenance active)
async function fetchMaintenanceSections(
  supabaseUrl: string,
  serviceKey: string
): Promise<Record<string, boolean>> {
  const keyList = SECTION_KEYS.join(",");
  const res = await fetch(
    `${supabaseUrl}/rest/v1/platform_settings?select=key,value&key=in.(${keyList})`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return {};
  const rows = (await res.json()) as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key.replace("maintenance_", ""), r.value === "true"]));
}

function matchSection(pathname: string): string | null {
  // More specific paths first
  if (pathname.startsWith("/dashboard/store"))      return "store";
  if (pathname.startsWith("/dashboard/offerwalls")) return "offerwalls";
  if (pathname.startsWith("/dashboard"))            return "dashboard";
  if (pathname === "/signup")                       return "signup";
  // (gold) org pages
  if (
    pathname.startsWith("/for-organizations") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact")
  ) return "org";
  // (teal) contributor pages
  if (
    pathname.startsWith("/earn") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/faq")
  ) return "contributor";
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never block admin panel, API routes, static assets, auth pages, or maintenance pages
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/maintenance") ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const section = matchSection(pathname);
  if (!section) return NextResponse.next();

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const sections = await fetchMaintenanceSections(supabaseUrl, serviceKey);
      if (sections[section]) {
        const dest = new URL(`/maintenance/${section}`, req.url);
        dest.searchParams.set("from", pathname);
        return NextResponse.redirect(dest);
      }
    }
  } catch {
    // If fetch fails, allow through
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
