# NexGuild Daily Blog Guide

**No coding needed. Works with Gemini + Claude.ai chat.**

---

## Your new weekly rhythm (not 3/day)

Publishing 3 articles/day spreads your topics too thin and signals AI spam to Google. Switch to this:

```
Monday    → GSC check: find 2 high-impression/low-click posts to fix
Tuesday   → Optimize post 1 (new title, description, CTA box)
Wednesday → Optimize post 2
Thursday  → Write 1 new article
Friday    → Re-index all changed URLs in GSC
```

**Why this works:** Google rewards depth over volume. Fixing an article that already has 500 impressions gets you clicks faster than writing a brand new one from scratch.

---

## STEP 1 — Weekly GSC check (Monday, ~15 min)

**OPEN:** search.google.com/search-console → Performance → Search results

**What to look for:**

| Signal | What it means | Action |
|---|---|---|
| High impressions, 0–2 clicks | Google shows you but nobody clicks | Fix the title + description |
| Position 8–20, any clicks | You're close to page 1 | Improve the article depth |
| Position 1–5, low clicks | Title/description not compelling enough | Rewrite the snippet |

**Pick 2 posts each week** with the most impressions but lowest CTR. Write down their URLs. Those are your Tuesday and Wednesday jobs.

---

## STEP 2 — Optimize an existing post (Tuesday + Wednesday, ~20 min each)

### Find the post file

Go to: `nexguild.in/admin/blog/generate` → **Quick Publish** tab

The post you want to fix is already live. You need to pull the current content, edit it in Claude.ai, then republish.

**To get the current content:** Go to GitHub → your repo → `src/content/blog/` → find the file → copy everything.

### Ask Claude.ai to optimize it

**OPEN:** claude.ai → new chat → paste this prompt:

```
You are a senior SEO and conversion specialist for NexGuild (nexguild.in), a global online earning platform I own.

I am giving you an existing blog post. Rewrite ONLY these 4 things — do not change the rest:

1. META TITLE — rewrite to target the user's pain point directly. Max 60 characters.
   Example pain points: slow payouts, getting screened out of surveys, long approval wait times, not knowing if a platform is legit.

2. META DESCRIPTION — rewrite to be compelling and specific. Must be 150–160 characters.
   Include: the direct answer to their question + one specific benefit + a hint about NexGuild.

3. OPENING PARAGRAPH — rewrite the first paragraph only.
   Rule: sentence 1 must directly answer the search query. No warm-up, no "In this guide we will cover..."
   Then mention the #1 pain point for this topic and hint at the fix.

4. CTA BOX — insert this right after the opening paragraph (before any image):
   Format exactly like this:
   > 🚀 **[HOOK MATCHING THE ARTICLE TOPIC]**
   > [One sentence about the pain point this platform causes]
   > Inside our **NexGuild dashboard**, [specific benefit relevant to this topic].
   > 👉 **[Create a Free NexGuild Account](https://www.nexguild.in/auth/register)**

ALSO: Anywhere in the article where it says "platforms like NexGuild" or "On NexGuild" — change to "our NexGuild dashboard" or "Inside NexGuild, we..."

Return the FULL article markdown with all 4 changes applied. Do not summarise. Do not explain what you changed.

Here is the article:

[PASTE THE ARTICLE CONTENT HERE]
```

**COPY** Claude's full output → go to Quick Publish → paste → publish.

**Then:** Re-index the URL in GSC (URL Inspection → Request Indexing).

---

## STEP 3 — Write 1 new article (Thursday, ~30 min)

### Get a topic from Gemini

**OPEN:** gemini.google.com → new chat → paste this (change the date):

```
You are the editor for NexGuild, a global online earning platform blog at www.nexguild.in.

FIRST — fetch https://www.nexguild.in/earn/blog and read every post title listed.
Write them all down internally. You will not suggest any topic already covered there.

SECOND — today is [TODAY'S DATE e.g. 2026-08-06]. Pick exactly 1 topic. Rules:
- Prefer SPECIFIC ANSWERABLE QUESTIONS over broad topics.
  Bad: "how to make money online"
  Good: "PeoplePerHour Review 2026: Is It Worth It for Freelancers?"
- Priority: platform reviews > platform comparisons > how-to guides > AI/remote job guides
- LOW competition only — NexGuild is a new domain and cannot rank for head terms yet
- Must be GLOBAL — never India-only
- Must be a topic you can link to 2–3 existing posts you found above

THIRD — give exactly this:

TITLE: [exact article title, 50–60 characters]
Slug: [kebab-case-slug]
Angle: [the specific question this article answers in one sentence]
Competition: [LOW or MEDIUM]
Sources: 2–3 real URLs that back the key facts
Internal links: 2–3 slugs from the posts you fetched above
```

### Find 2 images

**OPEN:** `nexguild.in/admin/blog/generate` → **Advanced Paste** tab → scroll to **Find Images**

- Search the topic (e.g. "freelance platform laptop")
- Pick 2 landscape photos
- Click **Copy figure** on each → save both blocks in Notepad

### Write in Claude.ai

**OPEN:** claude.ai → new chat → send this as **Message 1** (never change it):

```
You are writing blog posts for NexGuild (nexguild.in), a global online earning platform I own.
I will give you one topic. Return ONLY the markdown — no commentary, no code fences, nothing before or after.

=== FRONTMATTER FORMAT ===
---
title: "Title Here"
slug: "slug-here"
description: "One sentence, max 150 characters."
category: "Remote Work"
date: "YYYY-MM-DD"
tags: ["tag1", "tag2", "tag3", "tag4"]
faqs:
  - q: "Question one?"
    a: "Answer one."
  - q: "Question two?"
    a: "Answer two."
  - q: "Question three?"
    a: "Answer three."
  - q: "Question four?"
    a: "Answer four."
---

=== OPENING RULE ===
Sentence 1 of the article must directly answer the search query — no intro, no warm-up.
Then immediately add this CTA box right after the opening paragraph:

> 🚀 **[HOOK MATCHING THE ARTICLE TOPIC]**
> [One sentence about the specific pain point]
> Inside our **NexGuild dashboard**, [specific relevant benefit — e.g. instant payouts, no waitlist, surveys available now].
> 👉 **[Create a Free NexGuild Account](https://www.nexguild.in/auth/register)**

=== NexGuild VOICE ===
You own NexGuild. Never write "platforms like NexGuild" or "On NexGuild, surveys are shown..."
Write: "Inside our NexGuild dashboard, we show..." or "We built NexGuild to solve exactly this..."

When mentioning the NexCoin rate, always frame it as a benefit, never as a raw exchange:
  WRONG: "660 NexCoins = $1 USD"
  RIGHT: "every 660 NexCoins you earn = $1 in gift vouchers, no hidden conversion"

=== IMAGE FORMAT ===
I will give you 2 pre-fetched image blocks. Use ONLY those exact <figure> blocks — do not change the src URL.
Place Image 1 after the CTA box. Place Image 2 roughly halfway through.

=== INTERNAL LINKS ===
Format: [link text](/earn/blog/slug-here)
Use ONLY slugs I give you. Never invent slugs.

=== CONTENT RULES ===
- 1,200–1,600 words. No padding.
- At least 5 H2 sections with real content.
- 2–3 internal links using only the slugs I give you.
- Mention NexGuild naturally in 2+ sections — as the owner, not a third party.
- End with a "Key Takeaways" bullet list (6–8 points).
- 4 FAQs in the frontmatter.

=== VOICE ===
- Sentences under 20 words average. Max 3 sentences per paragraph.
- Active voice. Explain WHY something matters, not just what it is.
- Include at least one honest criticism of the platform or topic.
- Peer-to-peer tone — not a press release.

=== NEVER ===
- Never invent quotes, stats, numbers, names, or dates.
- Never use a URL or image ID I did not give you.
- Never use: In conclusion, Furthermore, Delve, Tapestry, Fascinating,
  It's worth noting, Needless to say, Let's dive in, At the end of the day,
  What is [X]?, It is important to remember, This comprehensive guide.

Ready. Give me the topic.
```

**Message 2** — paste the topic from Gemini + 2 images:

```
TITLE: [from Gemini]
Slug: [from Gemini]
Angle: [from Gemini]
Sources:
[from Gemini]
Internal links: [from Gemini]

PRE-FETCHED IMAGES:
[paste Image 1 <figure> block]
[paste Image 2 <figure> block]
```

**COPY** Claude's full reply → Quick Publish → publish.

---

## STEP 4 — Re-index in GSC (Friday, ~5 min)

For every URL you published or updated this week:

**OPEN:** search.google.com/search-console → URL Inspection → paste URL → Request Indexing

Do this for every changed post. Google usually updates the snippet within hours.

---

## Acting like an SEO specialist: weekly checklist

Print this or bookmark it. Do it every week in order.

```
MONDAY
□ Open GSC → Performance → last 28 days
□ Sort by Impressions (descending)
□ Find 2 posts: high impressions, CTR below 3%
□ Write down their URLs

TUESDAY
□ Get post 1 content from GitHub
□ Claude.ai optimize: new title, description, CTA box, active voice
□ Quick Publish the updated version
□ Request Indexing in GSC

WEDNESDAY
□ Same as Tuesday for post 2

THURSDAY
□ Gemini: get 1 new topic
□ Admin panel: find 2 images
□ Claude.ai: write the article
□ Quick Publish
□ Request Indexing in GSC

FRIDAY
□ Check if Monday's posts updated in Google (URL Inspection → check index)
□ Note the new impression/click numbers for next week's comparison
□ Plan next week's 2 optimization targets
```

---

## What makes a good meta title (for higher CTR)

| Bad (generic) | Good (pain point) |
|---|---|
| Appen Review 2026: Is It Legit? | Appen Review 2026: Legit — But Is the Wait Worth It? |
| CPX Research Review 2026 | CPX Research Review 2026: Avoid Quick Survey Disqualifications |
| Telus International Review | Telus International 2026: Is the Hiring Process Worth It? |
| Clickworker Review 2026 | Clickworker 2026: Good Pay or Wasted Time? |

**Formula:** [Platform] [Year]: [Pain point as a question or statement]

---

## What makes a good meta description

**Formula:** [Direct answer] + [Specific fact] + [NexGuild hook]

**Example:**
> Is CPX Research safe and legit? Yes. Learn the exact trick to avoid profile screenouts and claim your rewards instantly on NexGuild. Read our honest review.

Max 160 characters. Always end with something that creates urgency or curiosity.

---

## CTA box template (use in every post)

```
> 🚀 **[HOOK — 5–8 words matching the article's pain point]**
> [One sentence: the specific frustration this platform causes]
> Inside our **NexGuild dashboard**, [specific benefit — e.g. surveys available now, instant voucher withdrawal, no waitlist].
> 👉 **[Create a Free NexGuild Account](https://www.nexguild.in/auth/register)**
```

Place it: right after the opening paragraph, before the first image.

---

## Topic ideas when you need them

Low competition topics to write next:

- PeoplePerHour Review 2026: Is It Worth It for Freelancers?
- 99designs Review 2026: Legit Platform or Not?
- How to Get More Tasks on Clickworker in 2026
- How to Qualify for Telus International AI Jobs
- YouTube Monetization Requirements 2026
- Best Faceless YouTube Channel Ideas 2026
- Instagram Reels Monetization 2026
- AI Content Moderation Jobs 2026
- Virtual Assistant Jobs With No Experience 2026
- Online Proofreading Jobs for Beginners 2026
- Is Appen Legit in 2026? Honest Review
- Prompt Engineering Jobs for Beginners 2026
- How to Earn Amazon Vouchers Online (No Investment)
- Best WFH Side Hustles for Students 2026
- Can You Actually Make Money on Offerwalls? (Honest Answer)

---

## Emergency: if Claude.ai resets mid-session

Start a new chat. Paste Message 1 again. Then paste the topic. Do not try to remind it inline.
