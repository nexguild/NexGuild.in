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

// ── Groq helper ────────────────────────────────────────────────────────────────
async function groqChat(
  groqKey: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { max_tokens?: number; temperature?: number; json?: boolean } = {},
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 512,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// Strip surrounding quotes the model sometimes adds
function stripQuotes(s: string): string {
  return s.replace(/^["'`]+|["'`]+$/g, "").trim();
}

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert SEO content writer for NexGuild (nexguild.in), a global digital earning community where contributors worldwide earn NexCoins by completing surveys and tasks, redeemable for Amazon, Flipkart, Google Play, and Zomato gift vouchers.

Write a comprehensive, Google-friendly blog post following ALL these rules:

WORD COUNT — CRITICAL:
Your response MUST be minimum 1,500 words of actual content. Aim for 1,600-2,000 words. Do not submit under 1,300 words under any circumstances. If you finish early, expand each section with more detail, real examples, and actionable tips until you reach 1,500 words.

SEO RULES:
- Title MUST be 50-60 characters. Count characters before finalizing. Never submit a title shorter than 50 characters.
- Meta description MUST be between 150-160 characters. Count carefully.
- First paragraph: mention target keyword naturally in first 100 words — never announce it explicitly
- Use target keyword 3-5 times naturally throughout
- Use LSI/related keywords naturally
- URL slug: lowercase, hyphens, keyword-focused, max 60 chars

CONTENT STRUCTURE — REQUIRED:
- Do NOT include a # H1 heading — the page template renders the title as H1. Start with an intro paragraph or first ## section.
- Do NOT name the first section "Introduction" — use a compelling descriptive heading or open with a hook paragraph before the first ##
- Each H2 section must have at least 2-3 substantial paragraphs (not bullet points alone)
- Each paragraph must be 3-5 sentences minimum — no one-line paragraphs
- Use H2 headings (##) for main sections — minimum 5 H2s
- Use H3 headings (###) for subsections where appropriate
- Include at least one bulleted list and one numbered list
- Add a "Key Takeaways" section at the end
- Start with a compelling hook in the opening paragraph
- End with a clear CTA paragraph mentioning NexGuild
- Write in a friendly, helpful, authoritative tone — no fluff, every paragraph adds real value

REVIEW POST STRUCTURE — use this when angle is "Review":
- Opening: what this platform is and why readers should care (2-3 paragraphs, no H2 yet)
- ## What Is [Platform] and How Does It Work
- ## What Tasks / Work Is Available
- ## How Much Does [Platform] Pay
- ## How Payments Work
- ## The Real Downsides (honest, not just positive)
- ## Is [Platform] Worth It in [Year]
- ## Key Takeaways
Position NexGuild naturally as a complementary earning option, not a direct replacement.

IMAGES — REQUIRED (include exactly 2):
Place images between major sections using this exact HTML format inside the markdown:

<figure>
  <img src="https://images.unsplash.com/photo-XXXXXXXXXX?w=800&auto=format&fit=crop&q=80" alt="descriptive alt text matching the topic" />
  <figcaption>A specific, informative caption about what the image shows and why it relates to the topic.</figcaption>
</figure>

Place first image: after the opening intro paragraph, before the first ## section.
Place second image: roughly halfway through the article, before a major ## section.

Pick photo IDs from this curated library based on topic relevance:
- Remote work / working from home: 1522202176988-66273c2fd55f
- Freelancer at laptop: 1611532736597-de2d4265fba3
- Analytics / data charts: 1460925895917-afdab827c52f
- Reviewing contracts / proposals: 1553877522-43269d4ea984
- Team working on computers: 1521737711867-e3b97375f902
- AI / data annotation on screen: 1555949963-ff9fe0c870eb
- Professional at laptop (neutral): 1551434678-e076c223a692
- Focused person working: 1507003211169-0a1dd7228f2d
- Home office desk setup: 1484807352052-23338990c6c6
- Remote worker with headphones: 1565728744382-61accd4aa148
- Developer reviewing code: 1555255707-c07966088b7b
- Professional writing / evaluating: 1542744173-8e7e53415bb0

INTERNAL LINKS — REQUIRED (include 2-3):
Link naturally to related NexGuild blog posts. ALWAYS use /earn/blog/[slug] format — NEVER /blog/[slug].
Link within sentences, not as bare URLs. Example: "our [Fiverr beginner guide](/earn/blog/how-to-start-freelancing-on-fiverr-2026) covers this in detail."

Available internal link targets (use where relevant):
- /earn/blog/how-to-start-freelancing-on-fiverr-2026 — Fiverr beginner guide
- /earn/blog/upwork-vs-freelancer-which-platform-2026 — Upwork vs Freelancer comparison
- /earn/blog/best-crowdsourcing-platforms-earn-money-2026 — best crowdsourcing platforms
- /earn/blog/appen-review-2026-legit-worth-it — Appen review
- /earn/blog/clickworker-review-2026-worth-it — Clickworker review
- /earn/blog/dataannotation-tech-review-2026 — DataAnnotation.tech review
- /earn/blog/micro-tasks-vs-freelancing — micro-tasks vs freelancing
- /earn/blog/offerwalls-explained-how-to-earn — offerwalls explained
- /earn/blog/cpx-research-review-2026 — CPX Research review
- /earn/blog/best-offerwall-sites-earn-rewards-2026 — best offerwall sites

CRITICAL WRITING RULES — MANDATORY:
- NEVER write "The target keyword for this article is..." or any explicit SEO mention. Integrate naturally.
- NEVER repeat the same NexGuild sentence — vary every mention in wording and context
- NexGuild does NOT have a mobile app — web-only. Never mention a "NexGuild mobile app"
- NexGuild does NOT have forums or community boards. Do not mention these.
- NexGuild is a micro-task and survey platform — NOT a traditional freelancing platform
- Do not claim NexGuild has "bonus opportunities" or "promotions" unless confirmed
- NexGuild is a GLOBAL platform for users worldwide. NEVER frame it as India-only. Never say it "only works in India" or target only Indian users in the writing.

PLATFORM MENTIONS:
- DO NOT mention direct NexGuild competitors (micro-task/survey/GPT reward sites): Swagbucks, Survey Junkie, Vindale Research, Toluna, InboxDollars, ySense, Meesho, Roz Dhan, TaskBucks, CashKaro, Earnably, GrindaBuck
- YOU MAY mention platforms when the topic IS that platform: Fiverr, Upwork, Freelancer.com, Appen, Clickworker, DataAnnotation.tech, Telus International, Remotasks, Rev.com, Lionbridge, WorkMarket, and similar freelancing/AI-data/crowdsourcing platforms
- When writing about another platform, position NexGuild as a complementary earner, not a direct replacement

NEXGUILD INTEGRATION — MANDATORY:
- Mention NexGuild naturally in at least 2-3 different sections (not only the conclusion)
- Include specific details: surveys via CPX Research and TheoremReach; NexCoins for Amazon, Flipkart, Google Play, Zomato vouchers; free at nexguild.in; global community
- Keep mentions genuinely helpful — a real recommendation, not an ad

ADSENSE COMPATIBILITY:
- No gambling, adult, or controversial content
- Factual, helpful, fully original content only — no excessive repetition

OUTPUT FORMAT (return valid JSON only, no markdown wrapping, no code fences):
{"title":"SEO title 50-60 chars","slug":"url-slug-here","description":"Meta description 150-160 chars","category":"Remote Work","date":"YYYY-MM-DD","content":"Full markdown content minimum 1500 words. NO # H1. Includes 2 Unsplash <figure> images. Includes 2-3 internal /earn/blog/ links."}`;

// ── POST handler ───────────────────────────────────────────────────────────────
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
    angle?.trim()   ? `Post angle: ${angle.trim()}`        : "",
    audience?.trim() ? `Target audience: ${audience.trim()}` : "",
    `Today's date: ${today}`,
    "",
    "Write the full blog post now. REMEMBER: minimum 1,400 words of content, title 50-60 chars, description 150-155 chars. Return ONLY valid JSON with no code fences.",
  ].filter(Boolean).join("\n");

  // ── Step 1: generate ────────────────────────────────────────────────────────
  let raw: string;
  try {
    raw = await groqChat(groqKey, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: userPrompt },
    ], { max_tokens: 8000, json: true });
  } catch (e) {
    console.error("[blog/generate] initial call failed:", e);
    return NextResponse.json({ error: "Groq API error. Check your GROQ_API_KEY." }, { status: 502 });
  }

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

  let { title, slug, description, content } = parsed;

  // ── Step 2: fix title if too short ─────────────────────────────────────────
  if (title.length < 50) {
    console.log(`[blog/generate] title too short (${title.length} chars) — fixing`);
    try {
      const fixed = await groqChat(groqKey, [{
        role: "user",
        content: `Expand this blog post title to be between 50-60 characters. Keep the same meaning and keywords. Return ONLY the title text, nothing else — no quotes, no explanation.\n\nCurrent title (${title.length} chars): "${title}"\nTarget: 50-60 characters exactly.`,
      }], { max_tokens: 120, temperature: 0.5 });
      const candidate = stripQuotes(fixed);
      if (candidate.length >= 45) title = candidate.slice(0, 65);
    } catch (e) {
      console.warn("[blog/generate] title fix call failed:", e);
    }
  }

  // ── Step 3: fix description if out of range ─────────────────────────────────
  if (description.length < 150 || description.length > 155) {
    console.log(`[blog/generate] description out of range (${description.length} chars) — fixing`);
    try {
      const fixed = await groqChat(groqKey, [{
        role: "user",
        content: `Rewrite this meta description to be EXACTLY between 150-155 characters. Include the main keyword naturally. Return ONLY the meta description text, nothing else — no quotes, no explanation.\n\nCurrent (${description.length} chars): "${description}"\nTarget: 150-155 characters exactly.`,
      }], { max_tokens: 220, temperature: 0.5 });
      const candidate = stripQuotes(fixed);
      // Accept if it's closer to target than the original
      if (Math.abs(candidate.length - 152) < Math.abs(description.length - 152)) {
        description = candidate;
      }
    } catch (e) {
      console.warn("[blog/generate] description fix call failed:", e);
    }
  }

  // ── Step 4: expand content if under word count ──────────────────────────────
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 1300) {
    console.log(`[blog/generate] content too short (${wordCount} words) — expanding`);
    try {
      const expanded = await groqChat(groqKey, [{
        role: "user",
        content: `This blog post is only ${wordCount} words — it needs to be at least 1,400 words. Expand it by adding more detail, practical examples, and depth to existing sections. Do NOT add new H2 headings — deepen what is already there. Keep all existing markdown headings and structure. Return the complete expanded markdown content only, no JSON wrapper, no explanation.\n\n${content}`,
      }], { max_tokens: 4000, temperature: 0.6 });
      const candidate = expanded.trim();
      // Only replace if expansion is actually longer
      if (candidate.split(/\s+/).length > wordCount) {
        content = candidate;
      }
    } catch (e) {
      console.warn("[blog/generate] content expansion call failed:", e);
    }
  }

  // ── Sanitise slug ───────────────────────────────────────────────────────────
  slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

  return NextResponse.json({
    ok: true,
    post: { ...parsed, title, slug, description, content },
    _debug: {
      titleLen:  title.length,
      descLen:   description.length,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
    },
  });
}
