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

const SYSTEM_PROMPT = `You are an expert SEO content writer for NexGuild (nexguild.in), a global digital workforce community where contributors earn NexCoins by completing surveys and tasks, redeemable for Amazon, Flipkart, Google Play, and Zomato gift vouchers.

Write a comprehensive, Google-friendly blog post following ALL these rules:

SEO RULES:
- Title: 50-60 characters, includes target keyword naturally
- Meta description: exactly 150-155 characters, compelling, includes keyword, has a clear value proposition
- First paragraph: mention target keyword in first 100 words
- Use target keyword 3-5 times naturally throughout
- Use LSI/related keywords naturally
- URL slug: lowercase, hyphens, keyword-focused, max 60 chars

CONTENT RULES:
- Minimum 1,200 words (aim for 1,400-1,600)
- Start with a compelling hook (question or bold statement)
- Use H2 headings (##) for main sections — minimum 5 H2s
- Use H3 headings (###) for subsections where appropriate
- Include at least one bulleted list
- Include at least one numbered list
- Add a "Key Takeaways" or "Quick Summary" section
- End with a clear CTA paragraph mentioning NexGuild
- Write in a friendly, helpful, conversational tone
- No fluff — every paragraph adds value
- No keyword stuffing — natural language only

ADSENSE COMPATIBILITY:
- No gambling, adult, or controversial content
- Factual, helpful, original content only
- No copied content — fully original
- No excessive repetition

NEXGUILD INTEGRATION:
- Mention NexGuild naturally 2-3 times (not forced)
- Link to nexguild.in where relevant
- Keep brand mentions helpful, not salesy

OUTPUT FORMAT (return valid JSON only, no markdown wrapping, no code fences):
{"title":"SEO optimized title here","slug":"url-slug-here","description":"Meta description exactly 150-155 chars","category":"Remote Work","date":"YYYY-MM-DD","content":"Full markdown content here with ## headings"}`;

export async function POST(req: NextRequest) {
  const ok = await verifyAdmin(req);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "GROQ_API_KEY not configured." }, { status: 500 });

  const { topic, keyword, angle, audience } = await req.json() as {
    topic: string; keyword?: string; angle?: string; audience?: string;
  };
  if (!topic?.trim()) return NextResponse.json({ error: "topic is required." }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];

  const userPrompt = [
    `Topic: ${topic.trim()}`,
    keyword?.trim() ? `Target keyword: ${keyword.trim()}` : "",
    angle?.trim() ? `Post angle: ${angle.trim()}` : "",
    audience?.trim() ? `Target audience: ${audience.trim()}` : "",
    `Today's date: ${today}`,
    "",
    "Write the blog post now. Return ONLY valid JSON with no code fences.",
  ].filter(Boolean).join("\n");

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    console.error("[blog/generate] Groq error:", err);
    return NextResponse.json({ error: "Groq API error. Check your GROQ_API_KEY." }, { status: 502 });
  }

  const groqData = await groqRes.json() as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  const raw = groqData.choices?.[0]?.message?.content ?? "";
  if (!raw) return NextResponse.json({ error: "Empty response from Groq." }, { status: 502 });

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Failed to parse Groq response as JSON.", raw }, { status: 502 });
  }

  const required = ["title", "slug", "description", "category", "date", "content"];
  const missing = required.filter((k) => !parsed[k]);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing fields: ${missing.join(", ")}`, parsed }, { status: 502 });
  }

  // Sanitise slug
  parsed.slug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

  return NextResponse.json({ ok: true, post: parsed });
}
