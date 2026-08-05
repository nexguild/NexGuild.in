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
  return true;
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashKey) return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY not configured." }, { status: 500 });

  const { query } = await req.json() as { query: string };
  if (!query?.trim()) return NextResponse.json({ error: "query required." }, { status: 400 });

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query.trim())}&per_page=8&orientation=landscape&content_filter=high`,
    { headers: { Authorization: `Client-ID ${unsplashKey}` } },
  );
  if (!res.ok) return NextResponse.json({ error: "Unsplash API error." }, { status: 502 });

  const data = await res.json() as {
    results: {
      id: string;
      urls: { regular: string; thumb: string };
      alt_description: string | null;
      description: string | null;
      user: { name: string };
      links: { download_location: string };
      width: number;
      height: number;
    }[];
  };

  // Trigger download tracking for Unsplash API compliance
  for (const photo of data.results.slice(0, 2)) {
    fetch(`${photo.links.download_location}&client_id=${unsplashKey}`).catch(() => {});
  }

  const photos = data.results.map((p) => ({
    id: p.id,
    url: p.urls.regular.split("?")[0] + "?w=800&auto=format&fit=crop&q=80",
    thumb: p.urls.thumb,
    alt: p.alt_description ?? p.description ?? query,
    credit: p.user.name,
    aspectRatio: p.width / p.height,
  }));

  return NextResponse.json({ photos });
}
