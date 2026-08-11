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

// Replace a single key: "value" field in raw frontmatter string
function setField(fm: string, key: string, value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const regex = new RegExp(`^(${key}:\\s*)"[^"]*"`, "m");
  return regex.test(fm)
    ? fm.replace(regex, `$1"${escaped}"`)
    : `${fm}\n${key}: "${escaped}"`;
}

// Replace tags: [...] field in raw frontmatter string
function setTags(fm: string, tags: string[]): string {
  const tagsStr = `[${tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`;
  const regex = /^tags:\s*\[[^\]]*\]/m;
  return regex.test(fm)
    ? fm.replace(regex, `tags: ${tagsStr}`)
    : `${fm}\ntags: ${tagsStr}`;
}

export async function POST(req: NextRequest) {
  const ok = await verifyAdmin(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ghPat = process.env.GITHUB_BLOG_PAT;
  if (!ghPat) return NextResponse.json({ error: "GITHUB_BLOG_PAT not configured." }, { status: 500 });

  const { filename, title, description, category, date, tags, content } = await req.json() as {
    filename:    string;
    title:       string;
    description: string;
    category:    string;
    date:        string;
    tags:        string[];
    content:     string;
  };

  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });
  if (!title || !description || !content) {
    return NextResponse.json({ error: "title, description, and content are required." }, { status: 400 });
  }

  const filePath = `${BLOG_PATH}/${filename}`;

  // Always re-fetch for latest sha and current frontmatter (preserves FAQs and any other fields)
  const fetchRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${filePath}`,
    {
      headers: {
        Authorization: `token ${ghPat}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "NexGuild-Admin",
      },
    }
  );

  if (!fetchRes.ok) return NextResponse.json({ error: "File not found on GitHub." }, { status: 404 });

  const file = await fetchRes.json() as { content: string; sha: string };
  const rawContent = Buffer.from(file.content, "base64").toString("utf-8");
  const sha = file.sha;

  const fmMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return NextResponse.json({ error: "Could not parse frontmatter." }, { status: 400 });

  // Update only the fields the editor touched — everything else (FAQs, etc.) is preserved
  let fm = fmMatch[1];
  fm = setField(fm, "title",       title);
  fm = setField(fm, "description", description);
  fm = setField(fm, "category",    category);
  fm = setField(fm, "date",        date);
  fm = setTags(fm, tags);

  const newFileContent = `---\n${fm}\n---\n${content}`;
  const encoded = Buffer.from(newFileContent, "utf-8").toString("base64");

  const pushRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${ghPat}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "NexGuild-Admin",
      },
      body: JSON.stringify({
        message: `content: update blog post - ${title}`,
        content: encoded,
        sha,
      }),
    }
  );

  if (!pushRes.ok) {
    const err = await pushRes.text();
    return NextResponse.json({ error: "GitHub push failed.", detail: err }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
