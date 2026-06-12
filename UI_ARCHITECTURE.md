# NexGuild — UI Architecture Document

**Version:** 1.0
**Status:** Pre-implementation specification
**Scope:** Public Website + Contributor Dashboard + Admin Dashboard

---

## Table of Contents

1. [Public Website Page Layouts](#1-public-website-page-layouts)
2. [Contributor Dashboard Layouts](#2-contributor-dashboard-layouts)
3. [Admin Dashboard Layouts](#3-admin-dashboard-layouts)
4. [Navigation Structure](#4-navigation-structure)
5. [User Journeys](#5-user-journeys)
6. [Mobile Navigation Behavior](#6-mobile-navigation-behavior)
7. [Component Inventory](#7-component-inventory)
8. [Design System Rules](#8-design-system-rules)
9. [Light Theme Specifications](#9-light-theme-specifications)
10. [Dark Mode Specifications](#10-dark-mode-specifications)

---

## 1. Public Website Page Layouts

All public pages share a consistent shell:

```
┌─────────────────────────────────────┐
│            GLOBAL HEADER            │
├─────────────────────────────────────┤
│                                     │
│            PAGE CONTENT             │
│                                     │
├─────────────────────────────────────┤
│            GLOBAL FOOTER            │
└─────────────────────────────────────┘
```

### Global Header

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo / NexGuild]    Nav Links             [Log In] [Sign Up]│
└─────────────────────────────────────────────────────────────┘
```

- Fixed to top on scroll.
- Logo on the left. Nav links centered or left-aligned. Auth CTAs on the right.
- Nav links: How It Works · Opportunities · For Organizations · About · Blog (if active).
- On scroll past 60px: header gains a subtle background blur and a 1px bottom border (no shadow).
- "Sign Up" button is styled as the primary CTA. "Log In" is a ghost/text link.
- Max content width: 1200px, centered, with horizontal padding of 24px.

### Global Footer

```
┌─────────────────────────────────────────────────────────────┐
│  Logo + tagline     |  Navigation  |  Legal  |  Contact     │
│                                                             │
│  © 2025 NexGuild. All rights reserved.                     │
└─────────────────────────────────────────────────────────────┘
```

- Four-column layout on desktop. Stacks to single column on mobile.
- Column 1: Logo, tagline, brief one-line description.
- Column 2: Platform links (How It Works, Opportunities, For Organizations, About).
- Column 3: Legal links (Terms, Privacy, Cookies).
- Column 4: Contact email, support note.
- Bottom row: copyright line, left-aligned.
- No social media icons in V1 unless accounts are active.

---

### 1.1 Home Page (`/`)

**Layout pattern:** Full-width sections stacked vertically. Each section has a max-width container of 1200px centered.

```
┌─────────────────────────────────────┐
│           GLOBAL HEADER             │
├─────────────────────────────────────┤
│                                     │
│  ░░░░░░░░░░ HERO SECTION ░░░░░░░░░  │
│  Headline (large)                   │
│  Subheadline (medium)               │
│  [Start Earning]   [Work With Us]   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│       HOW IT WORKS (3 steps)        │
│   [Step 1]   [Step 2]   [Step 3]    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│     OPPORTUNITY HIGHLIGHTS          │
│  [Card] [Card] [Card] [Card]        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│       WHY NEXGUILD (4-6 items)      │
│  [Item] [Item] [Item] [Item]        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│       STATS SECTION (reserved)      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│       CLOSING CTA BANNER            │
│       [Start Earning]               │
│                                     │
├─────────────────────────────────────┤
│           GLOBAL FOOTER             │
└─────────────────────────────────────┘
```

**Hero Section:**
- Full-width. Light background — white or near-white with a very subtle warm tint.
- Vertical centering. Text block left-aligned on desktop, centered on mobile.
- Headline: Large (48–56px), bold, one or two short lines.
- Subheadline: Medium (18–20px), regular weight, muted color, max 2 lines.
- Two CTAs side by side: primary button ("Start Earning"), secondary outlined button ("Work With Us").
- Optional: A subtle abstract background pattern or geometric illustration occupying the right half of the hero on desktop — no stock photography of people.
- Section height: minimum 520px on desktop.

**How It Works (3 Steps):**
- Three equal-width columns on desktop. Stacks to vertical list on mobile.
- Each step: numbered icon or large numeral, step title, one-line description.
- Steps connected by a visual line or arrow on desktop. Removed on mobile.
- Section background: very light grey (#F8F9FA or equivalent) to create visual separation.

**Opportunity Highlights:**
- 3 or 4 cards in a horizontal row on desktop. 2 columns on tablet. 1 column on mobile.
- Each card: icon, category name, one-sentence description, "Payout from $X" label.
- Cards have a white background, 1px border, 8px border radius.
- No hover animation — just a subtle border color shift.

**Why NexGuild:**
- 4–6 items in a 2×2 or 3×2 grid on desktop. Single column on mobile.
- Each item: icon (outlined, not filled), short title, two-line description.
- White background section.

**Stats Section:**
- Placeholder only in V1. Three stat blocks reserved for real numbers.
- Displayed as three centered number + label pairs.
- If no real data exists, the section is hidden entirely (not shown with zeroes or "coming soon" text).

**Closing CTA Banner:**
- Full-width colored band — uses the primary brand color as a light tint background.
- Single centered headline + one primary CTA button.
- Not more than 120px tall on desktop.

---

### 1.2 How It Works (`/how-it-works`)

**Layout pattern:** Narrow content column (max 800px) centered, with an introductory hero.

```
┌─────────────────────────────────────┐
│           GLOBAL HEADER             │
├─────────────────────────────────────┤
│    Page Hero (title + subtitle)     │
├─────────────────────────────────────┤
│    Contributor Step Flow            │
│    Step 1 ──── Step 2 ──── Step 3   │
├─────────────────────────────────────┤
│    Opportunity Types Overview       │
│    [Type] [Type] [Type] [Type]      │
├─────────────────────────────────────┤
│    Wallet & Withdrawal Explainer    │
├─────────────────────────────────────┤
│    FAQ Accordion                    │
├─────────────────────────────────────┤
│    CTA: Sign Up to Start            │
├─────────────────────────────────────┤
│           GLOBAL FOOTER             │
└─────────────────────────────────────┘
```

**Page Hero:** Not full-height. Just a top section with the page title and a one-line description. Light grey background band, 160px tall.

**Step Flow:** Numbered sections stacked vertically with a left-side timeline indicator line on desktop. Each step has a title, body text, and an optional illustrative icon or visual.

**Opportunity Types Overview:** Small descriptive cards, 3 per row on desktop.

**Wallet & Withdrawal Explainer:** Two-column layout. Left: what the wallet is, how balances work. Right: how to withdraw, supported methods.

**FAQ Accordion:** Standard expand/collapse. Question is the trigger. Answer expands below. One open at a time. Dividers between items.

---

### 1.3 Opportunities Page (`/opportunities`)

**Layout pattern:** Page hero + filter bar + card grid.

```
┌─────────────────────────────────────┐
│           GLOBAL HEADER             │
├─────────────────────────────────────┤
│    Page Hero (title + subtitle)     │
├─────────────────────────────────────┤
│    Category Filter Bar              │
│  [All] [Surveys] [Tasks] [Content]  │
├─────────────────────────────────────┤
│    3-column card grid               │
│    [Card] [Card] [Card]             │
│    [Card] [Card] [Card]             │
├─────────────────────────────────────┤
│    "Join to see live opportunities" │
│    [Sign Up]                        │
├─────────────────────────────────────┤
│           GLOBAL FOOTER             │
└─────────────────────────────────────┘
```

**Category Filter Bar:** Horizontal pill-button filter row. Clicking a filter highlights that pill and scrolls/filters the cards. Filters are client-side on this static page.

**Opportunity Cards:**
- White background, 1px border, 8px border-radius.
- Icon or type badge at top.
- Type name (bold).
- Payout range ("$0.20 – $5.00").
- Estimated time ("5–20 min").
- Skill level ("No experience required" / "Intermediate").
- Cards are informational only. No "Start" button — replaced with a muted note: "Login required to access."
- 3 columns on desktop, 2 on tablet, 1 on mobile.

**Login Gate Banner:** A soft banner at the bottom of the grid, above the footer. Light tinted background, centered text, a Sign Up CTA button.

---

### 1.4 For Organizations (`/for-organizations`)

**Layout pattern:** Alternating two-column sections + process flow + contact CTA.

```
┌─────────────────────────────────────┐
│           GLOBAL HEADER             │
├─────────────────────────────────────┤
│    Page Hero (title + subtitle)     │
├─────────────────────────────────────┤
│    What We Do (text + visual)       │
├─────────────────────────────────────┤
│    Types of Work We Distribute      │
│    [Type] [Type] [Type] [Type]      │
├─────────────────────────────────────┤
│    How Engagement Works (4 steps)   │
├─────────────────────────────────────┤
│    Trust Indicators (3 items)       │
├─────────────────────────────────────┤
│    Contact CTA                      │
├─────────────────────────────────────┤
│           GLOBAL FOOTER             │
└─────────────────────────────────────┘
```

**What We Do:** Two-column. Left: body text. Right: a simple abstract illustration or structured diagram (no photos of people).

**Engagement Process (4 Steps):** Horizontal numbered steps on desktop. Vertical on mobile. Each: Contact → Scoping → Pricing → Delivery.

**Trust Indicators:** Three items with icons. "Managed workflow," "Quality review," "Structured deliverables." No logos, no testimonials.

**Contact CTA:** Full-width tinted banner. "Ready to get started?" Headline + short body + "Contact Us" button linking to `/contact`.

---

### 1.5 About (`/about`)

**Layout pattern:** Centered content column, 800px max-width.

```
┌─────────────────────────────────────┐
│           GLOBAL HEADER             │
├─────────────────────────────────────┤
│    Page Hero (title)                │
├─────────────────────────────────────┤
│    Mission Statement                │
├─────────────────────────────────────┤
│    What Makes NexGuild Different    │
│    (3–4 items, icon + text)         │
├─────────────────────────────────────┤
│    Team Section (role titles only)  │
├─────────────────────────────────────┤
│           GLOBAL FOOTER             │
└─────────────────────────────────────┘
```

**Team Section:** If team members are named, show a simple list: Role Title + name (no photos unless available). If anonymous, show role tiles only (e.g., "Platform Lead," "Contributor Operations"). No placeholder avatars.

---

### 1.6 Contact (`/contact`)

**Layout pattern:** Two-column on desktop. Form left, info right.

```
┌────────────────────────┬────────────────────┐
│   CONTACT FORM         │   CONTACT INFO     │
│   Name                 │   Email address    │
│   Email                │   Response time    │
│   Organization (opt.)  │   note             │
│   Subject dropdown     │                    │
│   Message textarea     │                    │
│   [Send Message]       │                    │
└────────────────────────┴────────────────────┘
```

- On tablet/mobile: form stacks above contact info.
- Form validation: all required fields inline-validated. Error states shown below each field.
- Success state: form replaced by a simple confirmation message — no redirect.
- Subject options: "Organization Inquiry," "General Question," "Support," "Partnership."

---

### 1.7 Sign Up (`/signup`)

**Layout pattern:** Single centered card. Minimal. No distractions.

```
┌─────────────────────────────────────┐
│  [NexGuild Logo]                    │
│                                     │
│  Create your account                │
│                                     │
│  Full Name        [____________]    │
│  Email            [____________]    │
│  Password         [____________]    │
│  Confirm Password [____________]    │
│  Country          [__dropdown__]    │
│                                     │
│  ☐ I agree to the Terms of Service  │
│                                     │
│         [Create Account]            │
│                                     │
│  Already have an account? Log in    │
└─────────────────────────────────────┘
```

- Centered vertically and horizontally on the page. No global nav. No footer — only a minimal "© NexGuild" text.
- Card width: 440px. White background. 24px padding. 12px border-radius.
- Password field includes a show/hide toggle.
- Country is a searchable select dropdown.
- The Terms checkbox links to `/terms` opening in a new tab.
- Submit button is full-width.
- Below button: "Already have an account? Log in" link to `/login`.

---

### 1.8 Log In (`/login`)

**Layout pattern:** Same centered card pattern as Sign Up.

```
┌─────────────────────────────────────┐
│  [NexGuild Logo]                    │
│                                     │
│  Welcome back                       │
│                                     │
│  Email            [____________]    │
│  Password         [____________]    │
│                                     │
│  Forgot password?                   │
│                                     │
│         [Log In]                    │
│                                     │
│  Don't have an account? Sign up     │
└─────────────────────────────────────┘
```

- "Forgot password?" is a right-aligned link above the submit button.
- Submit button full-width.
- Error state (wrong credentials): inline banner inside the card — red-tinted, icon, message. Does not clear password field.

---

### 1.9 Legal Pages (`/terms`, `/privacy`, `/cookies`)

**Layout pattern:** Narrow prose column, 720px max-width, with a sticky side-nav for long documents.

```
┌────────────────────────┬────────────────────┐
│   STICKY SECTION NAV   │   LEGAL PROSE      │
│   (desktop only)       │   Heading          │
│   [Section 1]          │   Body text...     │
│   [Section 2]          │                    │
│   [Section 3]          │                    │
└────────────────────────┴────────────────────┘
```

- On mobile: no side nav. A "jump to section" dropdown at the top of the page.
- Last updated date shown at the top of the prose.
- No special styling — clean typographic document.

---

## 2. Contributor Dashboard Layouts

The contributor dashboard uses a persistent sidebar layout on desktop. The sidebar never collapses on desktop. Content area is scrollable. Header is fixed.

### Dashboard Shell

```
┌───────┬────────────────────────────────────┐
│       │        DASHBOARD HEADER            │
│  S    ├────────────────────────────────────┤
│  I    │                                    │
│  D    │                                    │
│  E    │        PAGE CONTENT AREA           │
│  B    │                                    │
│  A    │                                    │
│  R    │                                    │
│       │                                    │
└───────┴────────────────────────────────────┘
```

**Sidebar width:** 240px on desktop. Fixed position, full height. Non-scrollable independently — always visible.

**Dashboard Header:** Fixed top bar, right of sidebar. Contains: Page title (left), notification bell icon (right), user avatar + name (right, clickable to open a small dropdown for Profile and Log Out).

**Content area:** Scrollable. Padding 32px on desktop, 16px on mobile. Max content width within the area: 1100px.

---

### Sidebar Structure

```
┌─────────────────────┐
│  [Logo]             │
├─────────────────────┤
│  ◉ Dashboard        │
│  ○ Opportunities    │
│  ○ My Tasks         │
│  ○ Offerwall Hub    │
│  ○ Earnings         │
│  ○ Wallet           │
├─────────────────────┤
│  ○ Profile          │
│  ○ Settings         │
├─────────────────────┤
│  [Log Out]          │
└─────────────────────┘
```

- Active item: background highlight using a light tint of the primary color. Bold label. No left border accent.
- Icon + label for each item. Icons are outlined style.
- Two groups separated by a horizontal rule: Main (Dashboard through Wallet) and Account (Profile, Settings).
- Log Out at the very bottom, separated. Text link style — not a button.

---

### 2.1 Dashboard Home (`/dashboard`)

```
┌──────────────────────────────────────────────────┐
│  EARNINGS SUMMARY BAR                            │
│  [Today: $X]  [This Week: $X]  [Month: $X]  [All]│
├──────────────────────┬───────────────────────────┤
│  ACTIVE TASKS        │  WALLET SNAPSHOT          │
│  (list, max 5)       │  Available: $X            │
│  [View all →]        │  Pending: $X              │
│                      │  [Withdraw]               │
├──────────────────────┴───────────────────────────┤
│  FEATURED OPPORTUNITIES                          │
│  [Card]  [Card]  [Card]                          │
├──────────────────────────────────────────────────┤
│  RECENT ACTIVITY FEED                            │
│  [Item]  [Item]  [Item]  [Item]                  │
└──────────────────────────────────────────────────┘
```

**Earnings Summary Bar:** Four stat cards in a horizontal row. Each: label, value in large text. Cards have white background and 1px border.

**Active Tasks + Wallet Snapshot:** Two-column row. Left: a compact list of in-progress tasks (task name, type, payout). Right: wallet card with available and pending balances, and a "Withdraw" button (disabled if below minimum).

**Featured Opportunities:** Three opportunity cards. Horizontal row on desktop. Vertical on mobile. Labeled "Available Now" or "New."

**Recent Activity Feed:** A vertical list of timestamped activity items. Each: icon (type), description, amount (if applicable), time ago. Max 8 items shown with a "View all earnings" link.

---

### 2.2 Opportunities (`/dashboard/opportunities`)

```
┌──────────────────────────────────────────────────┐
│  PAGE TITLE + SUBTITLE                           │
├──────────────────────────────────────────────────┤
│  FILTER BAR                                      │
│  [Type ▾]  [Payout ▾]  [Time ▾]  [Status ▾]     │
├──────────────────────────────────────────────────┤
│                                                  │
│  OPPORTUNITY CARDS GRID (3 col → 2 → 1)         │
│  [Card] [Card] [Card]                            │
│  [Card] [Card] [Card]                            │
│                                                  │
├──────────────────────────────────────────────────┤
│  PAGINATION  ← 1  2  3  →                       │
└──────────────────────────────────────────────────┘
```

**Filter Bar:** Horizontal row of dropdown selectors. On mobile, replaced by a "Filter" button that opens a bottom sheet.

**Opportunity Card:**
```
┌─────────────────────────────┐
│  [TYPE BADGE]  [PAYOUT]     │
│  Task Title                 │
│  Short description text     │
│  ─────────────────────────  │
│  ⏱ Est. 10 min   👤 Any level│
│  [Start Task]               │
└─────────────────────────────┘
```
- Type badge: small pill with label (Survey / Micro-task / Content / etc.) and a corresponding color.
- Payout: right-aligned, green-tinted, bold.
- Description: 2-line truncated.
- Footer row: estimated time, skill level.
- CTA: "Start Task" primary button or "View Details" if multi-step task.

---

### 2.3 My Tasks (`/dashboard/tasks`)

```
┌──────────────────────────────────────────────────┐
│  PAGE TITLE                                      │
├──────────────────────────────────────────────────┤
│  STATUS TABS                                     │
│  [In Progress]  [Submitted]  [Approved] [Rejected]│
├──────────────────────────────────────────────────┤
│  TASKS TABLE                                     │
│  Task | Type | Date | Status | Payout | Action  │
│  ─────────────────────────────────────────────── │
│  Row  │ tag  │ date │  badge │  $X.XX │ [button] │
│  Row  │ tag  │ date │  badge │  $X.XX │ [button] │
└──────────────────────────────────────────────────┘
```

**Status Tabs:** Underline tab style. Active tab shows an underline in the primary color. Each tab shows a count badge if non-zero.

**Table:**
- Full-width. No horizontal scroll on desktop.
- Status column: color-coded badge (yellow = submitted, blue = in progress, green = approved, red = rejected).
- Payout: shown as "$X.XX" when approved, "Pending" when submitted.
- Action column: context-sensitive. "Continue" for in-progress. "View" for submitted/approved. "Retry" for rejected (if task allows it).
- On mobile: table collapses to card-per-row layout.

---

### 2.4 Offerwall Hub (`/dashboard/offerwalls`)

```
┌──────────────────────────────────────────────────┐
│  PAGE TITLE + EXPLANATION                        │
├──────────────────────────────────────────────────┤
│  PROVIDER TABS                                   │
│  [CPX Research] [Lootably] [AdGem] [+more]       │
├──────────────────────────────────────────────────┤
│                                                  │
│  OFFERWALL IFRAME EMBED                          │
│  (full height, provider-controlled UI)           │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Provider Tabs:** Each active provider is a tab. Clicking loads that provider's iframe.

**Iframe Embed:** Full-width, minimum 600px tall on desktop. Grows with content. If provider is unavailable or loading, a neutral loading state is shown.

**Earnings Note:** Small inline note above the iframe: "Earnings from this provider are credited to your wallet automatically."

---

### 2.5 Earnings (`/dashboard/earnings`)

```
┌──────────────────────────────────────────────────┐
│  LIFETIME EARNINGS SUMMARY                       │
│  Total Earned: $XXX.XX   Withdrawals: $XX.XX     │
├──────────────────────────────────────────────────┤
│  FILTER BAR + EXPORT CSV BUTTON                  │
│  [Date Range ▾]  [Type ▾]  [Status ▾]  [Export] │
├──────────────────────────────────────────────────┤
│  TRANSACTION TABLE                               │
│  Date | Source | Type | Amount | Status         │
│  ───────────────────────────────────────────────│
│  Row  │ name   │ tag  │ $X.XX  │ badge          │
└──────────────────────────────────────────────────┘
```

**Lifetime Summary:** Two stat values side by side. Bold numbers, small labels.

**Transaction Table:** Same pattern as My Tasks table. Date column shows relative ("2 days ago") with full date on hover. Source column: task title or offerwall name. Type: badge (Task / Offerwall / Adjustment). Status: Pending / Confirmed / Rejected.

---

### 2.6 Wallet (`/dashboard/wallet`)

```
┌──────────────────────────────────────────────────┐
│  ┌──────────────────────┐  ┌───────────────────┐│
│  │  AVAILABLE BALANCE   │  │  PENDING BALANCE  ││
│  │   $XX.XX             │  │   $X.XX           ││
│  │   [Withdraw]         │  │   Clears in ~X day││
│  └──────────────────────┘  └───────────────────┘│
├──────────────────────────────────────────────────┤
│  WITHDRAWAL HISTORY                              │
│  Date | Amount | Method | Status                │
│  ─────────────────────────────────────────────── │
│  Row  │ $X.XX  │ PayPal │ Completed             │
└──────────────────────────────────────────────────┘
```

**Balance Cards:** Two equal-width cards side by side. Available balance card is visually dominant (larger number, primary color). Pending balance card is muted/secondary. "Withdraw" button inside available card — disabled with tooltip if below minimum threshold.

**Withdrawal History Table:** Compact. Date, amount, method (icon + label), status badge. Paginated if more than 10 rows.

**Withdrawal Modal (triggered by "Withdraw" button):**
```
┌─────────────────────────────────┐
│  Request Withdrawal             │  ← Modal title
│  ────────────────────────────── │
│  Withdrawal Method              │
│  ○ PayPal    ○ Cryptocurrency   │
│                                 │
│  PayPal Email  [_____________]  │
│                                 │
│  Amount        [_____________]  │
│  Available: $XX.XX              │
│                                 │
│  [Cancel]         [Submit]      │
└─────────────────────────────────┘
```
- Method selection switches the payout details field (PayPal email vs. crypto address).
- Amount validated: must be ≥ minimum, ≤ available balance.
- Submit button disabled until form is valid.

---

### 2.7 Profile (`/dashboard/profile`)

```
┌──────────────────────────────────────────────────┐
│  ┌────────┐  Display Name                        │
│  │ AVATAR │  Email · Country                     │
│  │ upload │  Joined: Jan 2025                    │
│  └────────┘  Total Earned: $XX.XX                │
├──────────────────────────────────────────────────┤
│  SKILLS (tag inputs)                             │
│  [Python ×] [Writing ×] [+ Add skill]            │
├──────────────────────────────────────────────────┤
│  REPUTATION (V1: placeholder)                    │
│  Tier: —   Approval Rate: —   Tasks done: —      │
└──────────────────────────────────────────────────┘
```

**Avatar:** Circular, 80px. Click to upload. Defaults to initials on colored background if none uploaded.

**Skills:** Tag-style inputs. User can add or remove skill tags. Informational in V1 (used for future project matching).

**Reputation:** Shows stats when available. In V1, shows dashes or "Reputation system coming soon" note.

---

### 2.8 Settings (`/dashboard/settings`)

```
┌──────────────────────────────────────────────────┐
│  SECTION: ACCOUNT                                │
│  Email         [current@email.com]  [Change]     │
│  Password      ••••••••            [Change]     │
├──────────────────────────────────────────────────┤
│  SECTION: PAYOUT METHODS                         │
│  PayPal Email  [email]             [Edit]        │
│  Crypto        [address]          [Edit]         │
│  [+ Add method]                                  │
├──────────────────────────────────────────────────┤
│  SECTION: NOTIFICATIONS                          │
│  Task approved    [toggle]                       │
│  Withdrawal status [toggle]                      │
│  New opportunities [toggle]                      │
├──────────────────────────────────────────────────┤
│  SECTION: DANGER ZONE                            │
│  [Deactivate Account]  ← destructive action      │
└──────────────────────────────────────────────────┘
```

- Sections separated by headings and horizontal rules.
- Inline edits trigger a confirmation step or open a small form below.
- Danger Zone section has a red-tinted background strip and a warning label.
- Deactivating requires a confirmation modal with typed confirmation ("type DEACTIVATE to confirm").

---

## 3. Admin Dashboard Layouts

The admin dashboard uses a wider sidebar (260px) and a denser data-forward layout. It is desktop-first but remains usable on tablet. Mobile access is considered secondary and optional for V1.

### Admin Shell

```
┌──────────┬──────────────────────────────────────┐
│          │         ADMIN HEADER                 │
│  ADMIN   ├──────────────────────────────────────┤
│  SIDEBAR │                                      │
│          │        ADMIN CONTENT AREA            │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

**Admin Header:** Contains breadcrumb (Admin > Section > Page), admin user name + avatar, and a global search bar for quick lookup of contributors or submissions.

**Admin Sidebar:**
```
┌─────────────────────────┐
│  [NexGuild Admin]       │
├─────────────────────────┤
│  ◉ Overview             │
│  ○ Contributors         │
│  ○ Opportunities        │
│  ○ Projects             │
│  ○ Submissions    [12]  │  ← badge for pending
│  ○ Offerwalls           │
│  ○ Withdrawals    [5]   │  ← badge for pending
│  ○ Finances             │
│  ○ Settings             │
└─────────────────────────┘
```

- Pending count badges on Submissions and Withdrawals.
- No account-level section — admin profile is accessed via header avatar.

---

### 3.1 Admin Overview (`/admin`)

```
┌──────────────────────────────────────────────────────┐
│  PLATFORM STATS ROW                                  │
│  [Contributors] [Paid Out] [Active Opps] [Pending] [Withdrawals]│
├────────────────────────┬─────────────────────────────┤
│  FLAGGED ITEMS          │  RECENT ACTIVITY           │
│  List of items          │  Feed of admin events      │
│  requiring attention    │                            │
└────────────────────────┴─────────────────────────────┘
```

**Stats Row:** Five stat cards in a row. Each: large number, label, and a small trend indicator (delta from prior period, where available — no fabricated trends in V1).

**Flagged Items:** Left panel. Compact list: contributor name or submission ID, reason for flag, timestamp, action links (Review / Dismiss).

**Recent Activity:** Right panel. Platform-level event feed. Each entry: event type, subject, timestamp. Events: submission received, withdrawal requested, opportunity published, contributor banned.

---

### 3.2 Contributors (`/admin/contributors`)

**List View:**
```
┌──────────────────────────────────────────────────────┐
│  SEARCH BAR + FILTERS                                │
│  [Search by name/email]  [Status ▾]  [Country ▾]    │
├──────────────────────────────────────────────────────┤
│  CONTRIBUTORS TABLE                                  │
│  Name | Email | Country | Joined | Earned | Status  │
│  ──────────────────────────────────────────────────  │
│  Row  │ ...   │ ...     │ ...    │ $X     │ Active  │
└──────────────────────────────────────────────────────┘
```

**Individual Contributor View (`/admin/contributors/:id`):**
```
┌──────────────────────────────────────────────────────┐
│  CONTRIBUTOR HEADER                                  │
│  [Avatar] Name · Email · Country · Status badge     │
│  [Warn]  [Suspend]  [Ban]  [Adjust Balance]         │
├───────────────────┬──────────────────────────────────┤
│  PROFILE INFO     │  WALLET SUMMARY                  │
│  Joined, tier,    │  Available / Pending / Total     │
│  approval rate    │  [View Full Ledger →]            │
├───────────────────┴──────────────────────────────────┤
│  SUBMISSION HISTORY (table)                         │
├─────────────────────────────────────────────────────┤
│  ACTIVITY LOG (admin actions on this account)       │
└─────────────────────────────────────────────────────┘
```

**Action Modals:** Each admin action (Warn, Suspend, Ban, Adjust Balance) opens a modal requiring a mandatory reason field before confirming.

---

### 3.3 Opportunities (`/admin/opportunities`)

**List View:**
```
┌──────────────────────────────────────────────────────┐
│  [+ Create Opportunity]                              │
├──────────────────────────────────────────────────────┤
│  FILTERS: [Type ▾] [Status ▾]                        │
├──────────────────────────────────────────────────────┤
│  TABLE                                               │
│  Title | Type | Status | Submissions | Payout | Actions│
└──────────────────────────────────────────────────────┘
```

**Opportunity Form (Create / Edit):**
```
┌──────────────────────────────────────────────────────┐
│  TITLE              [____________________________]   │
│  TYPE               [dropdown]                       │
│  DESCRIPTION        [textarea]                       │
│  INSTRUCTIONS       [rich text area]                 │
│  PAYOUT             [$ amount]                       │
│  ESTIMATED TIME     [X minutes]                      │
│  MAX SUBMISSIONS    [number or unlimited]            │
│  ELIGIBILITY                                         │
│    Countries        [multiselect]                    │
│    Tier required    [dropdown]                       │
│    Verification     [toggle]                         │
│  DEADLINE           [date picker or none]            │
│  STATUS             [Draft / Published / Paused]     │
│  [Cancel]  [Save Draft]  [Publish]                  │
└──────────────────────────────────────────────────────┘
```

---

### 3.4 Projects (`/admin/projects`)

**List View:** Same table pattern as Opportunities. Columns: Project Name, Type, Status, Budget, Payout Used, Contributors Assigned, Actions.

**Project Detail View:**
```
┌──────────────────────────────────────────────────────┐
│  PROJECT HEADER: Name · Type · Status                │
│  Budget: $X total  /  $X paid  /  $X remaining       │
├──────────────────────────────────────────────────────┤
│  PROJECT TASKS (sub-task list)                       │
│  Task | Assigned to | Status | Payout | Actions      │
├──────────────────────────────────────────────────────┤
│  [+ Add Task]  [Assign Contributors]                 │
└──────────────────────────────────────────────────────┘
```

**Assign Contributors:** A modal with a search field to find contributors by name/email. Selecting adds them to the task. Multiple contributors can be assigned.

---

### 3.5 Submissions (`/admin/submissions`)

```
┌──────────────────────────────────────────────────────┐
│  FILTERS + BULK ACTIONS                              │
│  [Type ▾] [Date ▾] [Opportunity ▾] [Bulk Approve]   │
├──────────────────────────────────────────────────────┤
│  SUBMISSIONS QUEUE TABLE                             │
│  ☐  Contributor | Opportunity | Type | Date | Action │
│  ☐  Row...                                           │
└──────────────────────────────────────────────────────┘
```

**Review Panel (opens on row click or "Review" button):**
```
┌──────────────────────────────────────────────────────┐
│  Submission from: [Name]   Task: [Title]             │
│  Submitted: [Date]   Payout: $X.XX                   │
├──────────────────────────────────────────────────────┤
│  SUBMISSION CONTENT                                  │
│  (rendered based on type: text, image, audio, etc.) │
├──────────────────────────────────────────────────────┤
│  INSTRUCTIONS REFERENCE (collapsible)               │
├──────────────────────────────────────────────────────┤
│  FEEDBACK (optional)        [___________________]   │
│  [Reject]                             [Approve]      │
└──────────────────────────────────────────────────────┘
```

- Review panel can be a right-side drawer or a full-page view.
- Keyboard shortcut support: "A" to approve, "R" to reject (noted in UI).
- Approve button is primary green. Reject is outlined destructive red.

---

### 3.6 Offerwalls (`/admin/offerwalls`)

```
┌──────────────────────────────────────────────────────┐
│  PROVIDER LIST                                       │
│  Provider | Status | Revenue Share | Earnings | Edit │
│  ──────────────────────────────────────────────────  │
│  CPX Research | Enabled | 70% to contributor | $X   │
│  Lootably     | Disabled| —               | —       │
└──────────────────────────────────────────────────────┘
```

**Edit Provider Panel:**
```
┌─────────────────────────────────┐
│  CPX Research Settings          │
│  API Key     [________________] │
│  Postback Secret [____________] │
│  Contributor Share  [70]%       │
│  Status      [Enabled ▾]        │
│  [Cancel]         [Save]        │
└─────────────────────────────────┘
```

---

### 3.7 Withdrawals (`/admin/withdrawals`)

```
┌──────────────────────────────────────────────────────┐
│  TABS: [Pending]  [Processing]  [Completed] [Rejected]│
├──────────────────────────────────────────────────────┤
│  TABLE                                               │
│  Contributor | Amount | Method | Requested | Actions │
│  ──────────────────────────────────────────────────  │
│  Row...      │ $X.XX  │ PayPal │ date      │ [buttons]│
└──────────────────────────────────────────────────────┘
```

**Pending tab actions per row:** "Mark Processing" | "Reject."
**Processing tab actions per row:** "Mark Completed" | "Reject."
**Reject action:** Opens a modal with a mandatory reason field.

---

### 3.8 Finances (`/admin/finances`)

```
┌──────────────────────────────────────────────────────┐
│  SUMMARY ROW                                         │
│  [Total Revenue] [Total Paid Out] [Net] [Pending]   │
├───────────────────────┬──────────────────────────────┤
│  REVENUE BY SOURCE     │  MONTHLY CHART              │
│  Offerwall: $X        │  (bar chart, simple)        │
│  Managed Projects: $X  │                             │
│  Org Fees: $X          │                             │
├───────────────────────┴──────────────────────────────┤
│  TRANSACTION EXPORT                                  │
│  [Export all transactions CSV]                       │
└──────────────────────────────────────────────────────┘
```

---

### 3.9 Admin Settings (`/admin/settings`)

Three-section layout with section headings and grouped inputs:

- **Platform Config:** Minimum withdrawal amount, settlement period (days), maintenance mode toggle.
- **Withdrawal Methods:** Toggle PayPal on/off, toggle Crypto on/off.
- **Admin Users:** Table of admin accounts. Columns: Name, Email, Role, Added date, [Remove]. Button to invite new admin by email.
- **Email Templates:** List of template names (e.g., "Submission Approved," "Withdrawal Rejected"). Edit button opens a simple textarea editor for the email body.

---

## 4. Navigation Structure

### 4.1 Public Website Navigation

```
Top-level links (desktop header):
  How It Works
  Opportunities
  For Organizations
  About
  Blog  [visible only if blog is active]

Auth CTAs (header, right side):
  Log In
  Sign Up  [primary button]

Footer navigation:
  Platform: How It Works · Opportunities · For Organizations · About
  Legal: Terms · Privacy · Cookies
  Support: Contact · [email address]
```

**Active state:** Current page link is visually distinct (bold, or a subtle underline color change). No bold-on-hover — bold is reserved for active.

**External links:** None on public nav in V1.

---

### 4.2 Contributor Dashboard Navigation

```
Sidebar (primary navigation):
  Dashboard        /dashboard
  Opportunities    /dashboard/opportunities
  My Tasks         /dashboard/tasks
  Offerwall Hub    /dashboard/offerwalls
  Earnings         /dashboard/earnings
  Wallet           /dashboard/wallet

  Profile          /dashboard/profile
  Settings         /dashboard/settings

Header controls:
  Notification bell   → Dropdown of recent notifications
  User avatar + name  → Dropdown: "My Profile" / "Settings" / "Log Out"
```

**Notification Dropdown:**
- Bell icon. Badge count when unread notifications exist.
- Dropdown: up to 5 recent notifications. Each: icon, message, timestamp. "Mark all read" link.
- Clicking a notification navigates to relevant page.

---

### 4.3 Admin Dashboard Navigation

```
Sidebar (primary navigation):
  Overview         /admin
  Contributors     /admin/contributors
  Opportunities    /admin/opportunities
  Projects         /admin/projects
  Submissions      /admin/submissions      [pending badge]
  Offerwalls       /admin/offerwalls
  Withdrawals      /admin/withdrawals      [pending badge]
  Finances         /admin/finances
  Settings         /admin/settings

Header:
  Breadcrumb navigation
  Global search bar
  Admin user avatar → Profile / Log Out
```

---

## 5. User Journeys

### 5.1 New Contributor — First Earn

```
1. Lands on Home page (organic or referral)
2. Reads hero → clicks "Start Earning"
3. Arrives at /signup
4. Completes form → account created → redirected to /dashboard
5. Sees dashboard with zero earnings and "Get started" prompts
6. Clicks "Opportunities" in sidebar
7. Browses opportunity list
8. Clicks "Start Task" on a survey
9. Reads instructions → completes task → submits form
10. Returns to My Tasks → sees task as "Submitted"
11. Receives notification: "Task Approved" → earnings credited
12. Checks Wallet → sees available balance
13. When balance ≥ minimum → clicks "Withdraw"
14. Completes withdrawal form → status: Pending
15. Admin processes withdrawal → status: Completed
16. Contributor receives payment externally
```

---

### 5.2 Returning Contributor — Offerwall Earnings

```
1. Logs in → redirected to /dashboard
2. Notes available balance on dashboard snapshot
3. Navigates to Offerwall Hub
4. Selects a provider tab (e.g., CPX Research)
5. Browses and completes offerwall tasks within iframe
6. Returns to dashboard → balance updated via postback
7. Checks Earnings history → sees offerwall entries
```

---

### 5.3 Organization — Inquiry Flow

```
1. Lands on /for-organizations
2. Reads service description → clicks "Contact Us"
3. Arrives at /contact
4. Completes form (Organization Inquiry) → submits
5. NexGuild staff receives inquiry via email
6. Staff responds externally → scoping begins
7. Staff creates project and opportunities in admin
8. Contribution happens through contributor dashboard
```

---

### 5.4 Admin — Reviewing a Submission

```
1. Admin logs in → sees admin dashboard
2. "Pending Submissions" stat shows count > 0
3. Admin clicks "Submissions" in sidebar
4. Views queue → filters by opportunity type
5. Clicks "Review" on a submission
6. Reads submission content alongside instructions
7. Clicks "Approve" → contributor wallet credited
   OR clicks "Reject" → optional feedback → contributor notified
8. Returns to queue → next item
```

---

### 5.5 Admin — Processing a Withdrawal

```
1. Admin sees "Withdrawals" badge (e.g., 5 pending)
2. Opens Withdrawals → Pending tab
3. Reviews each request: contributor name, amount, method, account standing
4. Clicks "Mark Processing" → externally executes the transfer (PayPal, crypto)
5. Once transfer confirmed externally → clicks "Mark Completed"
6. Contributor balance decremented, status updated, notification sent
```

---

### 5.6 Contributor — Handling a Rejected Submission

```
1. Contributor receives "Submission Rejected" notification
2. Clicks notification → lands on My Tasks, Rejected tab
3. Sees rejection reason (if admin provided feedback)
4. If retry allowed: clicks "Retry" → task reopens → resubmits
5. If retry not allowed: task remains Rejected, payout not issued
```

---

## 6. Mobile Navigation Behavior

### 6.1 Public Website — Mobile

**Header:**
- Logo remains left-aligned.
- Nav links hidden behind a hamburger icon (three horizontal lines) on the right.
- Auth CTAs ("Log In" / "Sign Up") remain visible beside the hamburger or are included inside the mobile menu.

**Mobile Menu (Drawer):**
- Opens as a full-height overlay from the right side.
- Semi-opaque dark scrim behind the menu.
- Menu items stacked vertically, large touch targets (minimum 48px height each).
- Closes on: tap outside, tap a link, or tap the X icon.
- Menu item order: How It Works · Opportunities · For Organizations · About · Blog · — · Log In · Sign Up.

---

### 6.2 Contributor Dashboard — Mobile

**Sidebar hidden on mobile.** Replaced by a bottom tab bar.

**Bottom Tab Bar:**
```
┌──────┬──────────┬──────────┬────────┬──────────┐
│  🏠  │   🔍     │   📋     │   💰   │   ☰      │
│ Home │ Opps     │ Tasks    │ Wallet │ More     │
└──────┴──────────┴──────────┴────────┴──────────┘
```

- Five tabs: Home, Opportunities, Tasks, Wallet, More.
- "More" opens a full-screen menu overlay with remaining items: Offerwall Hub, Earnings, Profile, Settings, Log Out.
- Active tab icon is filled; inactive icons are outlined.
- Badge count on "Tasks" if tasks pending, on "Wallet" if withdrawal pending.

**Dashboard Header on Mobile:**
- Page title only on the left.
- Notification bell on the right.
- No sidebar toggle.

**Content on Mobile:**
- Single column. Cards stack vertically.
- Tables collapse to card-per-row or condensed views.
- Filter bars collapse to a single "Filter" button that opens a bottom sheet.
- Modals are full-screen bottom sheets on mobile.

---

### 6.3 Admin Dashboard — Mobile

- Admin dashboard is desktop-first.
- On mobile, sidebar collapses to a hamburger menu in the header.
- Tapping the hamburger opens a full-height drawer from the left with all sidebar links.
- Table rows on mobile: horizontal scroll is permitted for data-dense tables. Each column has a minimum width.
- The submission review panel becomes a full-screen page on mobile, not a drawer.

---

## 7. Component Inventory

This is the complete list of UI components required for V1. Components are atomic (base) or composite (composed of base components).

### 7.1 Base Components

| Component | Description |
|---|---|
| Button | Variants: Primary, Secondary (outlined), Ghost (text-only), Destructive. Sizes: sm, md, lg. States: default, hover, active, disabled, loading. |
| Input | Single-line text input. States: default, focused, filled, error, disabled. |
| Textarea | Multi-line text input. Resizable vertically. Same states as Input. |
| Select | Dropdown selector. Searchable variant for country/skill fields. |
| Checkbox | Single checkbox with label. Checked, unchecked, indeterminate states. |
| Radio Button | Radio group. One selection at a time. |
| Toggle / Switch | On/off toggle for settings. |
| Badge | Small inline label. Variants: neutral, success, warning, danger, info. Used for status labels and type tags. |
| Avatar | Circular image. Fallback: initials on colored background. Sizes: sm (32px), md (40px), lg (80px). |
| Icon | Outlined icon set. Used inline with text or standalone. |
| Spinner | Loading indicator. Inline (small) and full-area (centered). |
| Divider | Horizontal rule. Used between sections. |
| Tooltip | Small hover label on icon-only buttons and truncated text. |
| Progress Bar | Horizontal bar. Used for project budget tracking. |

---

### 7.2 Composite Components

| Component | Composed of | Use |
|---|---|---|
| Stat Card | Container + Label + Large Number + optional delta | Dashboard summary rows |
| Opportunity Card | Badge + Heading + Body text + Footer row + Button | Opportunity listings |
| Task Row | Text + Badge + Date + Button | My Tasks table |
| Activity Feed Item | Icon + Text + Timestamp | Dashboard and admin feeds |
| Notification Item | Icon + Text + Timestamp + Unread dot | Notification dropdown |
| Filter Bar | Multiple Select components + optional Reset link | Filtering tables and card grids |
| Tab Bar | Horizontal tab buttons with active underline | Status filtering, provider switching |
| Accordion | Expandable section with trigger and content | FAQ, collapsible sections |
| Modal | Overlay + card + header + content + footer actions | Withdrawal, confirmations, admin actions |
| Bottom Sheet | Mobile-only modal that slides up from screen bottom | Mobile modals and filter panels |
| Drawer | Slide-in panel from left or right | Mobile nav, admin submission review |
| Table | Thead + Tbody + Pagination. Responsive collapse rules per table. | All list views |
| Pagination | Previous / page numbers / Next | Table and grid pagination |
| Empty State | Icon + Heading + Body text + optional CTA | Zero-data states |
| Alert Banner | Icon + message + optional dismiss. Variants: info, success, warning, error. | Form feedback, system messages |
| Breadcrumb | Linked path segments separated by "/" or ">" | Admin header navigation |
| Search Input | Input + icon. Debounced. Clear button when filled. | Admin contributor and global search |
| Step Indicator | Numbered steps with connecting line. Active state. | How It Works page, onboarding |
| Provider Tab | Tab with provider logo/name. Active border highlight. | Offerwall Hub |

---

### 7.3 Layout Components

| Component | Description |
|---|---|
| Page Shell (Public) | Global header + content slot + global footer |
| Dashboard Shell | Sidebar + header + scrollable content area |
| Admin Shell | Wide sidebar + header + content area |
| Section Container | Max-width wrapper with horizontal padding. Used inside public pages. |
| Two-Column Layout | Splits content area into two columns. Stacks on mobile. |
| Card | White background, 1px border, configurable border-radius. General container. |
| Grid | Responsive column grid. Configures columns: 1/2/3/4. Configures gap. |

---

## 8. Design System Rules

### 8.1 Spacing Scale

All spacing uses a base unit of 4px. The spacing scale is multiplicative:

| Token | Value | Usage |
|---|---|---|
| space-1 | 4px | Icon gaps, tight inline spacing |
| space-2 | 8px | Component internal padding (sm) |
| space-3 | 12px | Component internal padding (md) |
| space-4 | 16px | Standard internal padding |
| space-5 | 20px | — |
| space-6 | 24px | Section padding (sm), card padding |
| space-8 | 32px | Section padding (md) |
| space-10 | 40px | Section vertical rhythm |
| space-12 | 48px | Section separators |
| space-16 | 64px | Large section vertical spacing |
| space-20 | 80px | Hero vertical padding |
| space-24 | 96px | Large section top/bottom |

No arbitrary pixel values outside this scale.

---

### 8.2 Typography Scale

**Font family:** System font stack with a preference for Inter (or similar geometric sans-serif). Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| text-xs | 12px | 16px | 400 | Labels, timestamps, fine print |
| text-sm | 14px | 20px | 400 | Secondary text, table data, captions |
| text-base | 16px | 24px | 400 | Body text, default UI text |
| text-lg | 18px | 28px | 400 | Subheadings, intro text |
| text-xl | 20px | 28px | 600 | Card titles, section labels |
| text-2xl | 24px | 32px | 600 | Page titles (dashboard) |
| text-3xl | 30px | 36px | 700 | Section headings (public site) |
| text-4xl | 36px | 44px | 700 | Public page titles |
| text-5xl | 48px | 56px | 700 | Hero headline |

**Rules:**
- Maximum two font weights in use per page: regular (400) and bold (600 or 700). No intermediate weights (500) to maintain visual clarity.
- Line length for prose: 60–72 characters maximum. Achieved by max-width constraints on content containers.
- Letter spacing: Default (0) for body. Slightly tracked (+0.02em) for uppercase labels only.
- Uppercase: Only for labels and badges. Never for body or heading text.

---

### 8.3 Border Radius

| Token | Value | Usage |
|---|---|---|
| radius-sm | 4px | Badges, small elements |
| radius-md | 8px | Cards, buttons, inputs |
| radius-lg | 12px | Modals, large cards |
| radius-xl | 16px | Featured cards, hero elements |
| radius-full | 9999px | Pills, avatars, toggle |

---

### 8.4 Elevation / Shadow

NexGuild uses a minimal shadow system. Shadows are for depth, not decoration.

| Level | Value | Usage |
|---|---|---|
| shadow-none | none | Flat elements, bordered cards |
| shadow-sm | 0 1px 3px rgba(0,0,0,0.06) | Subtle card lift |
| shadow-md | 0 4px 12px rgba(0,0,0,0.08) | Modals, dropdowns, drawers |
| shadow-lg | 0 8px 24px rgba(0,0,0,0.12) | Elevated overlays |

Default card style: bordered (1px border), no shadow. Shadow-sm is used sparingly for interactive lift on hover if needed. Modals use shadow-md.

---

### 8.5 Interaction Rules

**Hover:** All interactive elements respond to hover. No hover on touch devices (media query). Hover state: subtle background tint, border color shift, or color darkening. No pop, scale, or transform effects.

**Focus:** Visible focus ring on all interactive elements. Using a 2px outline in the primary color, offset 2px. Never removed — only styled. Required for accessibility.

**Active:** Button active state: slight scale-down (transform: scale(0.98)) is permitted for buttons only. 

**Disabled:** Opacity 0.5, cursor: not-allowed. No hover effects.

**Loading:** Buttons in loading state show a spinner and are non-clickable. Text replaced by spinner or spinner appended.

**Transitions:** All transitions use a duration of 150ms. Easing: ease-out. No bouncing or spring animations. Transitions only on: color, background-color, border-color, opacity, transform, box-shadow.

---

### 8.6 Iconography

- Icon set: Lucide Icons (outline style). Consistent across the entire interface.
- Sizes: 16px (inline/small), 20px (standard UI), 24px (feature icons, nav).
- Icons are never used alone in interactive elements without an accessible label (aria-label or visible text).
- No filled icons except for active state in bottom tab bar.

---

### 8.7 Grid and Layout

- Base grid: 12 columns on desktop. 8 columns on tablet. 4 columns on mobile.
- Breakpoints:
  - Mobile: 0–639px
  - Tablet: 640–1023px
  - Desktop: 1024px+
  - Wide: 1280px+ (max content container: 1200px)
- Content containers never exceed 1200px. Horizontally centered with auto margins.
- Dashboard content area: max 1100px within the available area (excluding sidebar).

---

### 8.8 Component Rules

- **Buttons:** Primary buttons use the primary brand color. One primary button per section/card. Secondary and ghost buttons for supporting actions.
- **Forms:** Every input has a visible label above it. Placeholder text is supplementary, not a replacement for labels. Error messages appear below the field in red. All form errors are resolved inline — no page reload on validation failure.
- **Tables:** Header row has a light grey background. Alternating row background is not used — divider lines between rows only. Hover state on rows: very light grey background tint.
- **Empty States:** Every list, table, and grid has an empty state: icon, heading, body text explaining why it's empty, and a CTA if applicable.
- **Loading States:** Every async data view has a loading state using skeleton loaders (not spinners) for list and table content. Spinners are for button actions only.

---

## 9. Light Theme Specifications

The light theme is the default and primary theme for V1.

### 9.1 Color Palette

**Brand Colors:**

| Token | Hex | Usage |
|---|---|---|
| brand-50 | #EEF2FF | Lightest tint — section backgrounds, tag fills |
| brand-100 | #E0E7FF | Light tint — hover backgrounds, CTA banner |
| brand-200 | #C7D2FE | Borders on brand elements |
| brand-400 | #818CF8 | Secondary interactive elements |
| brand-500 | #6366F1 | Primary brand color — buttons, active states, links |
| brand-600 | #4F46E5 | Hover state of primary button |
| brand-700 | #4338CA | Active/pressed state |
| brand-900 | #1E1B4B | Dark text on brand backgrounds |

*Note: The exact brand color hue is subject to final identity decision. The above uses Indigo as a working placeholder. The structure of the scale applies regardless of chosen hue.*

**Neutral Colors:**

| Token | Hex | Usage |
|---|---|---|
| neutral-0 | #FFFFFF | Page background, card background |
| neutral-50 | #F9FAFB | Alternate section background, table header |
| neutral-100 | #F3F4F6 | Input background (subtle), hover rows |
| neutral-200 | #E5E7EB | Borders, dividers |
| neutral-300 | #D1D5DB | Disabled input borders |
| neutral-400 | #9CA3AF | Placeholder text, icons (inactive) |
| neutral-500 | #6B7280 | Secondary/muted text |
| neutral-700 | #374151 | Secondary headings, labels |
| neutral-900 | #111827 | Primary text, headings |

**Semantic Colors:**

| Token | Hex | Usage |
|---|---|---|
| success-50 | #F0FDF4 | Success background tint |
| success-500 | #22C55E | Success text, approved badges, positive amounts |
| success-700 | #15803D | Success text on light backgrounds |
| warning-50 | #FFFBEB | Warning background tint |
| warning-500 | #F59E0B | Warning badges, pending states |
| warning-700 | #B45309 | Warning text |
| danger-50 | #FEF2F2 | Error background tint |
| danger-500 | #EF4444 | Error text, rejection badges, destructive buttons |
| danger-700 | #B91C1C | Error text on light backgrounds |
| info-50 | #EFF6FF | Info background tint |
| info-500 | #3B82F6 | Info badges, notification indicators |

---

### 9.2 Surface and Background Rules

| Surface | Color | Notes |
|---|---|---|
| Page background | neutral-50 | All pages except auth pages |
| Auth page background | neutral-100 | Sign up and log in |
| Card background | neutral-0 (white) | All card surfaces |
| Dashboard sidebar | neutral-0 | White sidebar |
| Admin sidebar | neutral-900 | Dark sidebar for visual distinction |
| Section alternates | neutral-50 | Every other public page section |
| Table header row | neutral-50 | Light distinction from body rows |
| Modal overlay | rgba(0,0,0,0.40) | Backdrop behind modals |

---

### 9.3 Text Color Rules

| Context | Color |
|---|---|
| Primary text (headings, body) | neutral-900 |
| Secondary text (descriptions, labels) | neutral-500 |
| Muted text (timestamps, helper text) | neutral-400 |
| Link text | brand-500 |
| Link hover | brand-600 |
| Inverted text (on dark backgrounds) | neutral-0 |
| Success text | success-700 |
| Warning text | warning-700 |
| Error text | danger-700 |

---

### 9.4 Border Rules

| Context | Color |
|---|---|
| Default card border | neutral-200 |
| Input border (default) | neutral-300 |
| Input border (focused) | brand-500 |
| Input border (error) | danger-500 |
| Divider / horizontal rule | neutral-200 |
| Active nav item background | brand-50 |
| Active nav item text | brand-600 |

---

### 9.5 Button Styles (Light Theme)

**Primary Button:**
- Background: brand-500 · Text: white · Border: none
- Hover: background brand-600
- Active: background brand-700
- Disabled: opacity 0.5

**Secondary Button (outlined):**
- Background: transparent · Text: brand-600 · Border: 1px brand-200
- Hover: background brand-50
- Disabled: opacity 0.5

**Ghost Button:**
- Background: transparent · Text: neutral-700 · Border: none
- Hover: background neutral-100

**Destructive Button:**
- Background: danger-500 · Text: white · Border: none
- Hover: background danger-700

---

### 9.6 Badge Styles (Light Theme)

| Variant | Background | Text Color |
|---|---|---|
| Neutral | neutral-100 | neutral-700 |
| Success | success-50 | success-700 |
| Warning | warning-50 | warning-700 |
| Danger | danger-50 | danger-700 |
| Info | info-50 | info-500 |
| Brand | brand-50 | brand-700 |

All badges: text-xs, font-weight 500, border-radius-full, padding 2px 8px, uppercase text with letter-spacing.

---

## 10. Dark Mode Specifications

Dark mode is a V1 design specification only. It will be built in a future release. The tokens and rules below define the dark theme so implementation can be added without reworking the design system.

**Activation:** Dark mode respects the OS/system preference (`prefers-color-scheme: dark`) when implemented. A manual toggle in contributor Settings will be added in V2.

---

### 10.1 Surface and Background (Dark)

| Surface | Light Value | Dark Value |
|---|---|---|
| Page background | neutral-50 | #0F1117 |
| Card background | neutral-0 | #1A1D27 |
| Dashboard sidebar | neutral-0 | #111318 |
| Admin sidebar | neutral-900 | #0A0C10 |
| Section alternates | neutral-50 | #13161F |
| Table header | neutral-50 | #1E2130 |
| Input background | neutral-0 | #1E2130 |
| Modal overlay | rgba(0,0,0,0.40) | rgba(0,0,0,0.65) |

---

### 10.2 Text Colors (Dark)

| Context | Light Value | Dark Value |
|---|---|---|
| Primary text | neutral-900 (#111827) | #F1F3F9 |
| Secondary text | neutral-500 (#6B7280) | #8B92A5 |
| Muted text | neutral-400 (#9CA3AF) | #5C6370 |
| Link text | brand-500 | #818CF8 (brand-400) |
| Inverted text | neutral-0 | neutral-900 |

---

### 10.3 Border Colors (Dark)

| Context | Light Value | Dark Value |
|---|---|---|
| Card border | neutral-200 | #2A2E3E |
| Input border (default) | neutral-300 | #3A3F54 |
| Input border (focused) | brand-500 | brand-400 (#818CF8) |
| Divider | neutral-200 | #252938 |

---

### 10.4 Button Styles (Dark)

**Primary Button:** Background brand-500 (unchanged) · Text: white. No change from light.

**Secondary Button:** Background transparent · Text: brand-400 · Border: 1px #3A3F54.
Hover: background rgba(129, 140, 248, 0.10).

**Ghost Button:** Background transparent · Text: #C1C8D9.
Hover: background rgba(255,255,255,0.06).

---

### 10.5 Badge Styles (Dark)

| Variant | Dark Background | Dark Text |
|---|---|---|
| Neutral | rgba(255,255,255,0.08) | #C1C8D9 |
| Success | rgba(34,197,94,0.12) | #4ADE80 |
| Warning | rgba(245,158,11,0.12) | #FCD34D |
| Danger | rgba(239,68,68,0.12) | #F87171 |
| Info | rgba(59,130,246,0.12) | #93C5FD |
| Brand | rgba(99,102,241,0.15) | #A5B4FC |

---

### 10.6 Sidebar and Navigation (Dark)

**Contributor Sidebar (Dark):**
- Background: #111318.
- Active item background: rgba(99,102,241,0.12).
- Active item text: brand-400.
- Default item text: #8B92A5.
- Logo on dark background: white wordmark.

**Admin Sidebar (Dark):**
- Admin sidebar is already dark in light mode. In dark mode, deepen to #0A0C10. Active item: brand-400.

---

### 10.7 Dark Mode Implementation Notes

- All color values must be defined using CSS custom properties (design tokens), not hardcoded hex values in components. A `[data-theme="dark"]` attribute on the `<html>` element or a `.dark` class switches the token values.
- Images that are purely decorative (illustrations, icons) should have dark-mode variants or use SVG fills that respect the token system.
- Offerwall iframes cannot be themed — they render provider-controlled UI. A note should appear above the iframe in dark mode: "Offerwall content uses the provider's default theme."
- Chart colors in the Admin Finances view need dark-specific variants to ensure contrast on dark backgrounds.
- No dark mode-specific layout changes — only color and surface swaps.

---

*Document version: 1.0 | NexGuild Internal | Pre-implementation reference | Not for public distribution*
