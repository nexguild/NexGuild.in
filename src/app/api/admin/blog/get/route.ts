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

const REPO = "nexguild/NexGuild.in";
const BLOG_PATH = "src/content/blog";

export async function GET(req: NextRequest) {
  const ok = await verifyAdmin(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ghPat = process.env.GITHUB_BLOG_PAT;
  if (!ghPat) return NextResponse.json({ error: "GITHUB_BLOG_PAT not configured." }, { status: 500 });

  const filename = req.nextUrl.searchParams.get("filename");
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  const fileRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${BLOG_PATH}/${filename}`,
    {
      headers: {
        Authorization: `token ${ghPat}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "NexGuild-Admin",
      },
      next: { revalidate: 0 },
    }
  );

  if (!fileRes.ok) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const file = await fileRes.json() as { content: string; sha: string; name: string };
  const rawContent = Buffer.from(file.content, "base64").toString("utf-8");

  // Extract frontmatter block
  const fmMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm: Record<string, string> = {};
  let tags: string[] = [];

  if (fmMatch) {
    const fmText = fmMatch[1];
    // Parse tags array separately
    const tagsMatch = fmText.match(/^tags:\s*\[([^\]]*)\]/m);
    if (tagsMatch) {
      tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/^"|"$/g, "")).filter(Boolean);
    }
    // Parse simple key: "value" fields
    for (const line of fmText.split("\n")) {
      const m = line.match(/^(\w+):\s*"(.+)"$/);
      if (m) fm[m[1]] = m[2];
    }
  }

  // Body = everything after frontmatter
  const body = rawContent.replace(/^---[\s\S]*?---\n?/, "");

  return NextResponse.json({
    filename: file.name,
    sha: file.sha,
    title:       fm.title       ?? "",
    slug:        fm.slug        ?? filename.replace(/^\d+-/, "").replace(".md", ""),
    description: fm.description ?? "",
    category:    fm.category    ?? "Remote Work",
    date:        fm.date        ?? "",
    tags,
    content: body,
  });
}
