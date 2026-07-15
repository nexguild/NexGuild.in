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
const SYSTEM_PROMPT = `You are an expert SEO content writer for NexGuild (nexguild.in), a global digital workforce community where contributors earn NexCoins by completing surveys and tasks, redeemable for Amazon, Flipkart, Google Play, and Zomato gift vouchers.

Write a comprehensive, Google-friendly blog post following ALL these rules:

WORD COUNT — CRITICAL:
Your response MUST be minimum 1,400 words of actual content. Count carefully before finishing. Do not submit under 1,200 words under any circumstances. Aim for 1,400-1,600 words. If you finish early, expand each section with more detail, examples, and explanation until you reach 1,400 words.

SEO RULES:
- Title MUST be 50-60 characters. Count the characters before finalizing. If under 50, expand it with more descriptive words. Never submit a title shorter than 50 characters.
- Meta description MUST be between 150-160 characters. Count carefully. Pad or trim to hit this range.
- First paragraph: mention target keyword naturally in first 100 words — do NOT announce it explicitly
- Use target keyword 3-5 times naturally throughout
- Use LSI/related keywords naturally
- URL slug: lowercase, hyphens, keyword-focused, max 60 chars

CONTENT STRUCTURE — REQUIRED:
- Do NOT include a # H1 heading — the page template already renders the title as H1. Start content directly with an intro paragraph or the first ## section.
- Do NOT name the first section "Introduction" — use a more descriptive, compelling heading or open with an intro paragraph before the first ##
- Each H2 section must have at least 2-3 substantial paragraphs (not bullet points alone)
- Each paragraph must be 3-5 sentences minimum — no one-line paragraphs
- Use H2 headings (##) for main sections — minimum 5 H2s
- Use H3 headings (###) for subsections where appropriate
- Include at least one bulleted list
- Include at least one numbered list
- Add a "Key Takeaways" section at the end
- Start with a compelling hook (question or bold statement) in the opening paragraph
- End with a clear CTA paragraph mentioning NexGuild
- Write in a friendly, helpful, conversational tone
- No fluff — every paragraph adds real value
- No keyword stuffing — natural language only

CRITICAL WRITING RULES — MANDATORY:
- NEVER write phrases like "The target keyword for this article is..." or "Our focus keyword is..." or any explicit mention of SEO targeting. Integrate keywords naturally.
- NEVER repeat the exact same sentence about NexGuild more than once in the entire article. Vary every NexGuild mention in wording, context, and placement.
- NexGuild does NOT have a mobile app — it is web-based only. Never mention a "NexGuild mobile app."
- NexGuild does NOT have forums, community boards, or discussion features. Do not mention these.
- NexGuild is a micro-task and survey platform — it is NOT a traditional freelancing platform. Do not position it as one.
- Do not claim NexGuild has "bonus opportunities" or "promotions" unless these are confirmed features.

COMPETITOR RESTRICTION — MANDATORY:
Do NOT mention any competitor platforms by name. This includes but is not limited to: Swagbucks, Survey Junkie, Vindale Research, Toluna, InboxDollars, ySense, Meesho, Roz Dhan, TaskBucks, or any other specific earning platform. You may reference "other platforms" or "most survey sites" generically, but always position NexGuild as the recommended option.

NEXGUILD INTEGRATION — MANDATORY:
- Mention NexGuild naturally in at least 3 different H2 sections throughout the post, not only in the conclusion
- Include specific NexGuild details naturally within the content:
  * Surveys powered by CPX Research and TheoremReach
  * NexCoins redeemable for Amazon, Flipkart, Google Play, and Zomato gift vouchers
  * Free to join at nexguild.in
  * Global community of contributors earning from tasks and surveys
- Keep brand mentions genuinely helpful, not salesy — integrate them as natural recommendations

ADSENSE COMPATIBILITY:
- No gambling, adult, or controversial content
- Factual, helpful, original content only
- No copied content — fully original
- No excessive repetition

OUTPUT FORMAT (return valid JSON only, no markdown wrapping, no code fences):
{"title":"SEO optimized title here 50-60 chars","slug":"url-slug-here","description":"Meta description 150-160 characters — count carefully","category":"Remote Work","date":"YYYY-MM-DD","content":"Full markdown content here minimum 1400 words. NO # H1 heading. Start with intro paragraph or first ## section."}`;

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
  if (wordCount < 1200) {
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
