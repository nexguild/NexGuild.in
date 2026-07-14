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

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });

  const { existingSlugs = [] } = await req.json() as { existingSlugs?: string[] };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const avoidList = existingSlugs.slice(0, 30).join(", ");

  const prompt = `Today is ${today}.

Generate exactly 6 fresh blog topic ideas for NexGuild (nexguild.in) — a platform where people in India:
1. Earn money online by completing micro-tasks, surveys, data annotation, app testing, and offerwalls (redeem as Amazon, Flipkart, Google Play gift vouchers)
2. Browse curated remote & WFH job listings from companies like Telus International, Appen, Lionbridge, and HR-sourced work-from-home roles

Rules:
- Topics must be relevant to Indian audience — students, freshers, homemakers, gig workers, job seekers
- Mix of: how-to guides, listicles, company-specific job guides (e.g. "How to get a job at Telus India"), WFH tips, earning tips, platform reviews, remote work advice
- Include at least 2 topics related to remote/WFH jobs or specific companies hiring in India
- Must be SEO-friendly and searchable (people actively Google these)
- Timely / trending angle for today's date where possible
- Do NOT suggest topics already covered: ${avoidList || "none yet"}
- Return ONLY a JSON object: { "suggestions": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5", "topic 6"] }
- Each topic: 8–15 words, specific and compelling`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Groq error" }, { status: 500 });

  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? "{}";

  try {
    const parsed = JSON.parse(raw) as { suggestions?: string[] };
    const suggestions = (parsed.suggestions ?? []).filter((s) => typeof s === "string").slice(0, 6);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
