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

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const avoidList = existingSlugs.slice(0, 30).join(", ");

  const prompt = `Today is ${today}.

Generate exactly 8 fresh blog topic ideas for NexGuild (nexguild.in) — a global platform where contributors worldwide earn NexCoins by completing micro-tasks and surveys, redeemable for Amazon, Flipkart, Google Play, and Zomato gift vouchers.

NexGuild's blog covers: online earning, freelancing, crowdsourcing platforms, AI data annotation, survey platforms, remote work, and work-from-home guides — all for a GLOBAL audience.

PROVEN SEO STRATEGY — topics that rank at low domain authority:
Platform-specific queries: "[Platform name] review [year]", "is [platform] legit", "how to earn on [platform]", "how to start on [platform] for beginners". These exact-match searches convert well. Prioritize specific platform names over generic terms.

Platforms to cover (pick from these for review/guide topics):
- Freelancing: Fiverr, Upwork, Freelancer.com, Toptal, PeoplePerHour, 99designs
- AI/Data annotation: Appen, DataAnnotation.tech, Remotasks, Scale AI, Labelbox, Surge AI
- Transcription/content: Rev.com, TranscribeMe, GoTranscript, Scribie
- Search quality / microtask: Telus International AI, Lionbridge AI, Clickworker, Amazon Mechanical Turk
- Survey / offerwall adjacent: CPX Research, TheoremReach, ClixWall, Toloka, Prolific
- YouTube / content creation: starting a YouTube channel, monetization, affiliate marketing

Rules:
- Topics must target a GLOBAL audience — never India-only
- Mix: platform reviews (at least 3), how-to guides, comparisons, earning tips, WFH guides
- Include at least 1 topic with a regional angle (Philippines, Nigeria, Pakistan, Bangladesh, or another active market)
- Must be SEO-friendly and searchable (people actively Google these exact phrases)
- Timely / trending angle for today's date where possible
- Do NOT suggest topics already covered: ${avoidList || "none yet"}
- Return ONLY a JSON object: { "suggestions": ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5", "topic 6", "topic 7", "topic 8"] }
- Each topic: 8–15 words, specific and compelling (include year where it helps SEO, e.g. "Rev.com Review 2026: Is It Worth It?")`;

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
    const suggestions = (parsed.suggestions ?? []).filter((s) => typeof s === "string").slice(0, 8);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
