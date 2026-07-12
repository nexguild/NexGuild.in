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

interface GHFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  download_url: string | null;
}

export async function GET(req: NextRequest) {
  const ok = await verifyAdmin(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ghPat = process.env.GH_PAT;
  if (!ghPat) return NextResponse.json({ error: "GH_PAT not configured." }, { status: 500 });

  const listRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${BLOG_PATH}`, {
    headers: {
      Authorization: `token ${ghPat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "NexGuild-Admin",
    },
    next: { revalidate: 0 },
  });

  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to list blog files from GitHub." }, { status: 502 });
  }

  const files = (await listRes.json()) as GHFile[];
  const mdFiles = files.filter((f) => f.type === "file" && f.name.endsWith(".md"));

  // Fetch first few bytes of each file to extract frontmatter (title, slug, date, description)
  const posts = await Promise.all(
    mdFiles.map(async (f) => {
      if (!f.download_url) return { filename: f.name, sha: f.sha, slug: f.name.replace(".md", ""), title: f.name, date: "", description: "", wordCount: 0 };

      try {
        const contentRes = await fetch(f.download_url, { headers: { "User-Agent": "NexGuild-Admin" } });
        const text = await contentRes.text();

        // Parse frontmatter manually (no gray-matter in edge/server functions without fs)
        const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
        const fm: Record<string, string> = {};
        if (fmMatch) {
          for (const line of fmMatch[1].split("\n")) {
            const m = line.match(/^(\w+):\s*"?(.+?)"?$/);
            if (m) fm[m[1]] = m[2];
          }
        }

        const body = text.replace(/^---[\s\S]*?---\n?/, "");
        const wordCount = body.trim().split(/\s+/).length;

        return {
          filename: f.name,
          sha: f.sha,
          slug: fm.slug ?? f.name.replace(".md", ""),
          title: fm.title ?? f.name,
          date: fm.date ?? "",
          description: fm.description ?? "",
          category: fm.category ?? "",
          wordCount,
        };
      } catch {
        return { filename: f.name, sha: f.sha, slug: f.name.replace(".md", ""), title: f.name, date: "", description: "", category: "", wordCount: 0 };
      }
    })
  );

  // Sort by date desc, fallback to filename
  posts.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.filename.localeCompare(a.filename)));

  return NextResponse.json({ posts });
}

export async function DELETE(req: NextRequest) {
  const ok = await verifyAdmin(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ghPat = process.env.GH_PAT;
  if (!ghPat) return NextResponse.json({ error: "GH_PAT not configured." }, { status: 500 });

  const { filename, sha } = await req.json() as { filename: string; sha: string };
  if (!filename || !sha) return NextResponse.json({ error: "filename and sha required." }, { status: 400 });

  const delRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${BLOG_PATH}/${filename}`, {
    method: "DELETE",
    headers: {
      Authorization: `token ${ghPat}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "NexGuild-Admin",
    },
    body: JSON.stringify({ message: `content: remove blog post ${filename}`, sha }),
  });

  if (!delRes.ok) {
    const err = await delRes.text();
    return NextResponse.json({ error: "GitHub delete failed.", detail: err }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
