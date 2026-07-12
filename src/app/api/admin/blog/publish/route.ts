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

function buildFrontmatter(post: {
  title: string; slug: string; description: string; category: string; date: string;
}): string {
  return [
    "---",
    `title: "${post.title.replace(/"/g, '\\"')}"`,
    `slug: "${post.slug}"`,
    `description: "${post.description.replace(/"/g, '\\"')}"`,
    `category: "${post.category}"`,
    `date: "${post.date}"`,
    "---",
    "",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const ok = await verifyAdmin(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ghPat = process.env.GITHUB_BLOG_PAT;
  if (!ghPat) return NextResponse.json({ error: "GITHUB_BLOG_PAT not configured." }, { status: 500 });

  const { title, slug, description, category, date, content, filename } = await req.json() as {
    title: string; slug: string; description: string; category: string;
    date: string; content: string; filename?: string;
  };

  if (!title || !slug || !description || !content) {
    return NextResponse.json({ error: "title, slug, description, content required." }, { status: 400 });
  }

  const finalFilename = filename ?? `${slug}.md`;
  const filePath = `${BLOG_PATH}/${finalFilename}`;
  const fileContent = buildFrontmatter({ title, slug, description, category: category ?? "Remote Work", date: date ?? new Date().toISOString().split("T")[0] }) + content;
  const encoded = Buffer.from(fileContent, "utf-8").toString("base64");

  // Check if file already exists to get SHA (needed for update)
  let existingSha: string | undefined;
  const checkRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    headers: {
      Authorization: `token ${ghPat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "NexGuild-Admin",
    },
  });
  if (checkRes.ok) {
    const existing = await checkRes.json() as { sha?: string };
    existingSha = existing.sha;
  }

  const body: Record<string, string> = {
    message: `content: add blog post - ${title}`,
    content: encoded,
  };
  if (existingSha) {
    body.sha = existingSha;
    body.message = `content: update blog post - ${title}`;
  }

  const pushRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${ghPat}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "NexGuild-Admin",
    },
    body: JSON.stringify(body),
  });

  if (!pushRes.ok) {
    const err = await pushRes.text();
    console.error("[blog/publish] GitHub error:", err);
    return NextResponse.json({ error: "GitHub push failed.", detail: err }, { status: 502 });
  }

  const result = await pushRes.json() as { content?: { html_url?: string } };
  return NextResponse.json({
    ok: true,
    slug,
    url: `https://nexguild.in/blog/${slug}`,
    github_url: result.content?.html_url,
  });
}
