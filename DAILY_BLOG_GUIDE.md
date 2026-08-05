# NexGuild Daily Blog Guide
**Use this after Claude Code expires. Works with Gemini + Claude.ai chat.**

---

## Daily routine — 3 articles per day

| Step | Tool | Time |
|---|---|---|
| 1. Research + pick 3 topics | Gemini (gemini.google.com) | ~10 min |
| 2. Write each article | Claude.ai chat (claude.ai) | ~10 min each |
| 3. Create file + push to GitHub | VS Code or GitHub web | ~5 min each |
| 4. Submit URLs in GSC | Google Search Console | ~2 min |

Total: ~60–75 min/day

---

## Step 1 — Gemini Research Prompt

Paste this into Gemini once per day. Replace `[DATE]` with today's date.

```
You are the editor for NexGuild (nexguild.in), a global online earning platform blog.

FIRST — fetch https://www.nexguild.in/earn/blog and list every post title you find.
Do not suggest any topic already covered.

SECOND — today is [DATE]. Pick 3 topics. Priority order:
1. Platform review: "[platform] review 2026" — LOW competition, ranks fastest
2. Platform comparison: "[A] vs [B] 2026"
3. How-to guide: "how to [specific task] on [platform]"
4. AI/remote work: specific platform or job type (not generic)

Avoid generic topics like "how to make money online" — NexGuild cannot rank for these.
Target specific answerable questions where competition is low.

THIRD — for each of the 3 topics, give exactly this:

TITLE: [exact article title]
Slug: [kebab-case-slug-2026]
Angle: [the specific question this article answers]
Competition: [LOW / MEDIUM — be honest]
Sources: [2–3 real URLs with key facts for this topic]
Internal links: [2–3 slugs from the existing posts you fetched, e.g. appen-review-2026-legit-worth-it]

FOURTH — before finalising, check: is every fact you cited something you actually know?
Flag anything uncertain.
```

---

## Step 1b — Find Images First (admin panel)

**Do this before writing in Claude.ai.** The rule: never let the writer invent image URLs.
Give Claude the exact URLs — it will use them. If you skip this, Claude guesses photo IDs and you get wrong/portrait images.

1. Go to `/admin/blog/generate` → **Paste Article** tab
2. Scroll to **Find Images** section
3. Search for each article topic (e.g. "freelance platform laptop work")
4. All results are landscape — pick 2 photos per article
5. Click **Copy figure** on each → it copies the ready-to-use `<figure>` HTML
6. Paste both figure blocks into your Claude.ai message as assets (see Step 2 prompt)

---

## Step 2 — Claude.ai Write Prompt

**Do this once at the start of each Claude.ai session** (paste as your first message):

```
You are writing blog posts for NexGuild (nexguild.in), a global online earning platform.
I will give you one topic at a time. For each, return ONLY the markdown — no commentary,
no code fences, nothing else before or after.

=== FRONTMATTER FORMAT (copy exactly) ===
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

=== IMAGE FORMAT ===
I will give you 2 pre-fetched image blocks below (after TODAY'S PIECE).
Use ONLY those exact <figure> blocks — do not change the src URL, do not invent new ones.
Write a relevant alt text and caption for each based on the article topic.
Place Image 1 after the opening paragraph. Place Image 2 roughly halfway through.

=== INTERNAL LINKS ===
Format: [link text](/earn/blog/slug-here)
Use ONLY slugs I give you. Never invent slugs.

=== CONTENT RULES ===
- 1,200–1,600 words of real substance. No padding.
- Answer the headline question in the FIRST paragraph — never build up to it.
- At least 5 H2 sections with real content under each.
- 2–3 internal links using ONLY the slugs I give you.
- Mention NexGuild naturally in 2+ sections as an alternative earning option.
- End with a "Key Takeaways" bullet list (6–8 points).
- Include 4 FAQs in the frontmatter.

=== VOICE ===
- Sentences average under 20 words. Max 3 sentences per paragraph.
- Active voice. Explain WHY something matters, not just what it is.
- Include at least one honest criticism of the platform or topic.
- This is not a press release.

=== NEVER ===
- Never invent quotes, stats, numbers, names, or dates.
  If uncertain, write "not publicly confirmed" instead of guessing.
- Never use a URL or image ID I did not give you.
- Never use: In conclusion, Furthermore, Delve, Tapestry, Fascinating,
  It's worth noting, Needless to say, Let's dive in, At the end of the day.

Ready. Give me the first topic.
```

Then for each article, paste Gemini's topic output + the 2 image blocks you copied from the admin panel:

```
TITLE: PeoplePerHour Review 2026: Is It Worth It for Freelancers?
Slug: peopleperhour-review-2026
Angle: Is PeoplePerHour worth joining in 2026 for new freelancers vs established ones?
Sources:
- https://www.peopleperhour.com/...
- https://...
Internal links: guru-com-review-2026, upwork-vs-freelancer-which-platform-2026, how-to-start-freelancing-on-fiverr-2026

PRE-FETCHED IMAGES — use these exact blocks, only write the alt and caption:
[paste Image 1 <figure> block here]
[paste Image 2 <figure> block here]
```

---

## Step 3 — Create the file

### File naming rule
Files go in: `src/content/blog/`
Name format: `[number]-[slug].md`

Current count is **49**. So your next files are:
- `50-[slug].md`
- `51-[slug].md`
- `52-[slug].md`

The number only affects sort order on the blog — it does not appear in the URL.
The URL comes from the `slug:` field in the frontmatter.

### Option A — GitHub web editor (no software needed)
1. Go to github.com → your NexGuild repo → `src/content/blog/`
2. Click **Add file → Create new file**
3. Type the filename: `50-peopleperhour-review-2026.md`
4. Paste the Claude output
5. Click **Commit changes** → Vercel deploys in ~1 min

### Option B — VS Code (faster for 3 files)
1. Open the repo in VS Code
2. Create file in `src/content/blog/` with the correct name
3. Paste Claude output, save
4. In terminal: `git add src/content/blog/ && git commit -m "content: add [title]" && git push`

---

## Step 4 — Submit URLs in GSC

After Vercel deploys (~1 min after push), submit each URL in Google Search Console:

URL format: `https://www.nexguild.in/earn/blog/[slug]`

Go to: GSC → URL Inspection → paste URL → Request Indexing

---

## Compatibility checklist — run before committing

Check these before every push:

| Check | What to look for |
|---|---|
| Frontmatter starts with `---` on line 1 | No blank line before the first `---` |
| All required fields present | title, slug, description, category, date |
| Date format is `"YYYY-MM-DD"` | e.g. `"2026-08-12"` — must be in quotes |
| Slug matches filename | `slug: foo-bar` → file is `50-foo-bar.md` |
| No duplicate slug | Search existing files — each slug must be unique |
| Tags is an array | `["tag1", "tag2"]` not a plain string |
| FAQs use `q:` and `a:` | Correct indentation with 2 spaces |
| Images use `width="800" height="450"` | Both attributes on every `<img>` tag |
| No portrait images | Width must be greater than height |
| Internal links use `/earn/blog/[slug]` | Not `nexguild.in/...` or `www.nexguild.in/...` |
| NexGuild URL in body uses `https://www.nexguild.in` | The www. prefix is required |
| File is saved as UTF-8 | VS Code shows encoding bottom-right — must be UTF-8 |

---

## Required frontmatter fields

| Field | Type | Required | Example |
|---|---|---|---|
| `title` | string | YES | `"Appen Review 2026: Is It Legit?"` |
| `slug` | string | YES | `"appen-review-2026-legit-worth-it"` |
| `description` | string | YES | `"Honest look at Appen pay..."` (max 150 chars) |
| `category` | string | YES | `"Remote Work"` |
| `date` | string | YES | `"2026-08-12"` |
| `tags` | string array | recommended | `["appen", "AI jobs", "remote work"]` |
| `faqs` | array of q/a | recommended | See format above |

`readingTime` is auto-calculated — do not add it.

---

## Article structure that works

Every post should follow this structure:

```
[Frontmatter]

[Opening paragraph — answers the headline question immediately]

[Figure / Image 1]

## What [Platform] Actually Is
[2–3 paragraphs]

## How [Platform] Works / Pay Rates
[Table if applicable + 2–3 paragraphs]

## [Key feature / comparison / how-to steps]
[Content]

[Figure / Image 2]

## Who [Platform] Is Actually For
[Be specific and honest — include one real criticism]

## Is [Platform] Worth It in 2026?
[Honest verdict]

[Internal link paragraph]

## Frequently Asked Questions
[Repeat the 4 FAQs from frontmatter as bold Q + answer paragraphs]

## Key Takeaways
- [Bullet 1]
- [Bullet 2]
- [6–8 total]
```

---

## What Groq is bad at (why not to use it)

- Ignores voice rules — adds padding phrases like "It's worth noting" and "In conclusion"
- Invents specific numbers (pay rates, percentages) without sources
- Does not follow the frontmatter format reliably
- Cannot be prompted to maintain consistent structure across multiple articles

Claude.ai chat follows the system prompt reliably for a full session. Use it.

---

## Quick keyword reference — what to target next

Low competition remaining (prioritise these):
- `peopleperhour-review-2026` — PeoplePerHour Review 2026
- `99designs-review-2026` — 99designs Review 2026
- `how-to-get-tasks-clickworker` — How to Get More Tasks on Clickworker
- `how-to-qualify-telus-international-ai` — How to Qualify for Telus International AI
- `youtube-monetization-requirements-2026` — YouTube Monetization Requirements 2026
- `faceless-youtube-channel-ideas-2026` — Best Faceless YouTube Channel Ideas
- `instagram-reels-monetization-2026` — Instagram Reels Monetization 2026
- `ai-content-moderation-jobs-2026` — AI Content Moderation Jobs 2026
- `virtual-assistant-jobs-no-experience-2026` — Virtual Assistant Jobs With No Experience
- `online-proofreading-jobs-beginners-2026` — Online Proofreading Jobs for Beginners
- `is-appen-legit` — Is Appen Legit? (FAQ variant)
- `prompt-engineering-jobs-beginners-2026` — Prompt Engineering Jobs for Beginners

Full list: see `memory/blog_keyword_plan.md`

---

## Emergency: if Claude.ai resets mid-session

Claude.ai chat has a context limit. If it forgets the rules mid-session:

1. Start a new chat
2. Paste the full system prompt from Step 2 again
3. Paste the topic — Claude will follow the rules fresh

Do not try to remind it inline — it will half-follow the rules. Always restart with the full prompt.
