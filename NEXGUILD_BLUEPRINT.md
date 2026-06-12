# NexGuild — Complete Project Blueprint

---

## 1. Project Identity

**Name:** NexGuild
**Tagline:** Earn by Contributing. Grow by Participating.
**Domain Focus:** Community-driven contributor platform connecting skilled individuals with paid micro-tasks, surveys, content work, and managed projects.
**Version:** V1
**Design Philosophy:** Light-first, clean, professional. No clutter, no noise. Trust is built through transparency and reliability.

---

## 2. Mission

NexGuild exists to give anyone — regardless of their background, location, or credentials — a structured way to earn income and build reputation by completing real work for real organizations.

We bridge the gap between organizations that need scalable human-powered tasks and contributors who want reliable, fairly compensated opportunities. NexGuild manages the entire workflow so contributors focus only on doing good work, and organizations get results without managing a distributed workforce themselves.

**Core Beliefs:**
- Work should be accessible to everyone.
- Compensation should be transparent and prompt.
- Quality contributors deserve a platform that respects their time.
- Organizations deserve reliable delivery without operational overhead.

---

## 3. User Types

### 3.1 Contributor
A registered member of NexGuild who completes opportunities to earn rewards.

**Characteristics:**
- Can be a student, freelancer, professional, or anyone seeking supplemental income.
- Earns through completing tasks, surveys, watching ads, data labeling, and managed projects.
- Accumulates a wallet balance that can be withdrawn via supported methods.
- Builds a reputation score over time based on submission quality and consistency.
- Has access to a personal dashboard showing earnings, active tasks, submission history, and wallet.

**Onboarding:**
- Registers with email and password.
- Completes a basic profile (name, country, skills if applicable).
- Optionally verifies identity for higher-tier opportunities.
- Immediately gains access to basic opportunity types.

### 3.2 Organization (V1: Indirect Only)
Companies, nonprofits, research institutions, startups, or individuals with work to distribute.

**In V1:**
- Organizations do not have accounts on NexGuild.
- All organization engagement happens through direct outreach to NexGuild via the public Contact page.
- NexGuild acts as a fully managed intermediary — receiving, scoping, pricing, and distributing work internally.
- There is no self-serve organization portal in V1.

### 3.3 Admin
NexGuild staff members who manage the platform.

**Responsibilities:**
- Approve and publish opportunities.
- Review contributor submissions.
- Manage projects and assign contributors.
- Process withdrawal requests.
- Monitor platform health and flag abuse.
- Configure offerwall integrations.
- Communicate with organizations directly.

---

## 4. Revenue Sources

### 4.1 Organization Service Fees
When an organization engages NexGuild to distribute work, NexGuild charges a service fee on top of the contributor payout pool. This margin covers operational costs and platform profit.

- Fee structure is negotiated per engagement.
- Not visible to contributors.
- Handled entirely through NexGuild's sales and onboarding process.

### 4.2 Offerwall Revenue Share
NexGuild integrates third-party offerwalls (e.g., CPX Research, Lootably, AdGem, Theorem Reach, BitLabs). When contributors complete offerwall tasks:

- The offerwall provider pays NexGuild directly.
- NexGuild passes a defined percentage of that revenue to the contributor's wallet.
- The platform retains the remainder as revenue.

The revenue share split per provider is configured by admins and may vary by offerwall.

### 4.3 Managed Project Margin
For larger, scoped projects requiring multiple contributors over a defined timeline:

- NexGuild quotes a total project price to the organization.
- Contributors are paid from an allocated budget.
- NexGuild retains the delta as project management revenue.

### 4.4 Future Revenue Streams (Post-V1)
- Premium contributor tiers (priority access to high-paying tasks).
- API access for data collection results sold to research clients.
- Certification programs for contributor skill verification.

---

## 5. Public Website Structure

The public website is the primary marketing and intake surface. It is informational and lead-generating. No organization accounts. No unnecessary sign-up friction.

### Pages

#### 5.1 Home (`/`)
**Purpose:** Communicate value to both contributors and organizations quickly.

**Sections:**
- Hero: Headline, subheadline, dual CTA ("Start Earning" → contributor signup, "Work With Us" → contact page).
- How It Works (Contributor): Simple 3-step visual flow — Sign Up → Complete Tasks → Get Paid.
- Opportunity Highlights: Showcase 3–4 actual opportunity categories (surveys, tasks, projects, etc.) with brief descriptions.
- Why NexGuild: 4–6 value propositions (global access, fast payouts, quality work, transparent earnings).
- Platform Stats Placeholder: Reserved section for real stats once available (total paid out, active contributors, tasks completed). No fake numbers in V1.
- CTA Banner: Repeat the "Start Earning" CTA.

#### 5.2 How It Works (`/how-it-works`)
**Purpose:** Detailed explanation of the contributor journey.

**Sections:**
- Step-by-step contributor flow with visuals.
- Explanation of opportunity types.
- Wallet and withdrawal explanation.
- FAQ accordion.

#### 5.3 Opportunities (`/opportunities`)
**Purpose:** Show the types of work available without requiring login.

**Sections:**
- Category cards: Surveys, Micro-tasks, Data Labeling, Content Tasks, Managed Projects, Offerwall Tasks.
- Each card: type name, typical payout range, estimated time, skill level required.
- Note that actual live opportunities require login.
- CTA: "Join to see live opportunities."

#### 5.4 For Organizations (`/for-organizations`)
**Purpose:** Explain NexGuild's service offering to potential clients.

**Sections:**
- What NexGuild does for organizations.
- Types of work NexGuild can distribute.
- How the engagement process works (contact → scoping → pricing → delivery).
- Trust indicators: Managed workflow, quality review, structured deliverables.
- No fake client logos or testimonials in V1.
- Contact form or CTA to email.

#### 5.5 Blog / Resources (`/blog`) *(V1: Optional)*
**Purpose:** SEO-driven content about remote work, earning online, gig economy, etc.

- Article list page.
- Individual article page.
- Tags and categories.
- No external author attribution if no real authors exist yet.

#### 5.6 About (`/about`)
**Purpose:** Build trust and communicate NexGuild's story and values.

**Sections:**
- Mission statement.
- What makes NexGuild different.
- Team section: Only real team members. If team is small or anonymous, use role titles without photos or names.
- No fake team members.

#### 5.7 Contact (`/contact`)
**Purpose:** Primary intake point for organizations and general inquiries.

**Sections:**
- Contact form: Name, Email, Organization (optional), Subject dropdown (Organization Inquiry, General, Support, Partnership), Message.
- Response time expectation stated clearly.
- Support email listed.

#### 5.8 Contributor Sign Up (`/signup`)
- Email, password, confirm password.
- Country selection.
- Terms of Service agreement checkbox.
- Redirect to dashboard on success.

#### 5.9 Contributor Log In (`/login`)
- Email and password.
- Forgot password flow.
- Redirect to dashboard on success.

#### 5.10 Legal
- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)
- Cookie Policy (`/cookies`)

---

## 6. Contributor Dashboard Structure

The contributor dashboard is the core product experience. It is clean, focused, and gives contributors full visibility into their activity and earnings.

### 6.1 Navigation
- Sidebar or top navigation with: Dashboard, Opportunities, My Tasks, Earnings, Wallet, Profile, Settings.

### 6.2 Dashboard Home (`/dashboard`)
- Earnings summary: Today, This Week, This Month, All Time.
- Active task count and quick-access list.
- Pending wallet balance.
- Recent activity feed.
- Featured or new opportunities banner.

### 6.3 Opportunities (`/dashboard/opportunities`)
- List of all available opportunities the contributor is eligible for.
- Filters: Type, Payout Range, Estimated Time, Status.
- Each card: Title, Type badge, Payout, Estimated time, Description snippet, "Start" or "View" button.
- Pagination or infinite scroll.

### 6.4 My Tasks (`/dashboard/tasks`)
- All tasks the contributor has started or submitted.
- Status tabs: In Progress, Submitted, Approved, Rejected.
- Each row: Task name, Type, Submitted date, Status badge, Payout (pending or confirmed), Action button.

### 6.5 Offerwall Hub (`/dashboard/offerwalls`)
- Embedded offerwall widgets from integrated providers.
- Each offerwall displayed in a tab or card.
- Earnings from offerwalls reflected in wallet after provider confirmation.

### 6.6 Earnings (`/dashboard/earnings`)
- Detailed transaction history.
- Columns: Date, Source (task name or offerwall), Type, Amount, Status.
- Export to CSV option.
- Lifetime earnings summary.

### 6.7 Wallet (`/dashboard/wallet`)
- Current balance displayed prominently.
- Pending balance (earnings not yet confirmed).
- Withdrawal button: Opens withdrawal modal.
- Recent withdrawal history: Date, Amount, Method, Status.

### 6.8 Profile (`/dashboard/profile`)
- Display name, email, country.
- Contributor reputation score and tier (if applicable).
- Skills (optional tags for project matching).
- Joined date, total earned.
- Avatar upload.

### 6.9 Settings (`/dashboard/settings`)
- Email and password change.
- Notification preferences.
- Connected withdrawal accounts (PayPal email, crypto address, etc.).
- Account deactivation option.

---

## 7. Admin Dashboard Structure

The admin dashboard gives NexGuild staff full control over the platform.

### 7.1 Overview (`/admin`)
- Platform-wide stats: Total contributors, total paid out, active opportunities, pending reviews, pending withdrawals.
- Recent activity feed.
- Flagged items requiring attention.

### 7.2 Contributors (`/admin/contributors`)
- Full contributor list with search and filters.
- View individual contributor: profile, earnings, submission history, wallet balance, flags.
- Actions: Warn, Suspend, Ban, Adjust balance (with mandatory reason log).

### 7.3 Opportunities (`/admin/opportunities`)
- Create, edit, publish, unpause, archive opportunities.
- Set eligibility rules (country, tier, verification required).
- View per-opportunity submission stats.

### 7.4 Projects (`/admin/projects`)
- Create and manage managed projects.
- Assign contributors to project tasks.
- Review and approve deliverables.
- Track project budget vs. payout.

### 7.5 Submissions (`/admin/submissions`)
- Queue of all pending submissions awaiting review.
- Filter by opportunity type, date, contributor.
- Review interface: View submission content, approve or reject with optional feedback.
- Bulk approval for high-volume simple tasks.

### 7.6 Offerwalls (`/admin/offerwalls`)
- Configure active offerwall integrations.
- Set revenue share percentage per provider.
- Enable or disable providers.
- View offerwall revenue and contributor payout totals.

### 7.7 Withdrawals (`/admin/withdrawals`)
- Queue of pending withdrawal requests.
- Each entry: Contributor name, amount, method, request date.
- Actions: Approve (mark as processing), Complete (mark as paid), Reject (with reason).
- Audit log of all processed withdrawals.

### 7.8 Finances (`/admin/finances`)
- Revenue by source: Offerwall, Managed Projects, Organization Fees.
- Total paid out to contributors.
- Pending payout obligations.
- Monthly and lifetime summaries.

### 7.9 Settings (`/admin/settings`)
- Platform-wide configuration: Minimum withdrawal amount, supported withdrawal methods, maintenance mode toggle.
- Email template management.
- Admin user management (add/remove admin accounts).

---

## 8. Opportunity Types

### 8.1 Survey
**Description:** Answer structured questionnaires from research organizations or brands.
**Typical duration:** 5–20 minutes.
**Payout range:** $0.20 – $5.00 per survey.
**Review:** Automatic (completion tracked by survey tool) or manual spot-check.
**Notes:** May require demographic targeting. Disqualification logic should be handled gracefully.

### 8.2 Micro-task
**Description:** Small discrete tasks that require human judgment. Examples: image tagging, content moderation, text classification, sentiment labeling.
**Typical duration:** 1–10 minutes.
**Payout range:** $0.05 – $1.00 per task.
**Review:** Batch reviewed or consensus-based.
**Notes:** High volume. Often repeated. Quality tracking important.

### 8.3 Data Labeling
**Description:** Annotate datasets for machine learning. Examples: bounding boxes on images, transcription, audio tagging, named entity recognition.
**Typical duration:** 5–30 minutes per batch.
**Payout range:** $0.50 – $10.00 per batch.
**Review:** Manual review by admin or lead contributor.
**Notes:** Requires instruction clarity. May require onboarding test before access.

### 8.4 Content Task
**Description:** Writing, translation, summarization, or editing work.
**Typical duration:** 15–60 minutes.
**Payout range:** $1.00 – $25.00 per task.
**Review:** Manual admin or editor review.
**Notes:** Quality bar is higher. Tier or verification may be required.

### 8.5 Offerwall Task
**Description:** Tasks sourced from integrated third-party offerwall providers. Can include app installs, video views, sign-ups, and surveys.
**Payout:** Determined by offerwall provider, passed through at NexGuild's configured share rate.
**Review:** Automatic — handled by the provider's postback system.
**Notes:** Wide variety. No admin review needed. Earnings credited upon provider confirmation.

### 8.6 Managed Project Task
**Description:** A specific task within a larger, scoped managed project. May involve writing, research, QA testing, data entry, or other professional work.
**Payout:** Set per project scope.
**Review:** Admin review against project brief.
**Notes:** Contributor may need to apply or be assigned. Longer timeline than standalone tasks.

---

## 9. Project Types

### 9.1 Data Collection Project
**Use case:** Organization needs a large dataset (images, audio clips, text samples, etc.) collected from human contributors.
**Structure:** Contributors complete standardized collection tasks. Admin reviews samples for quality.
**Deliverable to organization:** Structured dataset.

### 9.2 Research & Survey Project
**Use case:** Academic or market research requiring targeted participant responses.
**Structure:** Targeted survey distributed to qualified contributors. Responses aggregated.
**Deliverable:** Response dataset, summary report.

### 9.3 Content Production Project
**Use case:** Organization needs articles, product descriptions, translations, or other written content at scale.
**Structure:** Contributors complete writing tasks against a provided brief. Admin reviews and curates.
**Deliverable:** Finalized content pieces.

### 9.4 QA / Testing Project
**Use case:** Organization needs software or content tested by real users across different devices or demographics.
**Structure:** Contributors follow test scripts and report results. Admin compiles findings.
**Deliverable:** Test report or structured bug/feedback log.

### 9.5 Data Annotation Project
**Use case:** AI/ML teams need human-labeled training data.
**Structure:** Contributors label datasets using NexGuild's annotation interface or linked tool. Admin validates quality.
**Deliverable:** Annotated dataset.

---

## 10. Submission Flow

### Contributor Perspective

1. **Browse Opportunities** — Contributor views available opportunities on the Opportunities page.
2. **Start Task** — Contributor clicks "Start" on a task. Task is now marked In Progress and locked or time-limited if applicable.
3. **Complete Work** — Contributor follows instructions and completes the task.
4. **Submit** — Contributor submits via the submission form. Submission enters the review queue with status "Submitted."
5. **Review Outcome** — Admin approves or rejects:
   - **Approved:** Earnings credited to wallet as pending, then confirmed after settlement period.
   - **Rejected:** Contributor notified with feedback. Task may be retried depending on settings.
6. **Earnings Confirmed** — After settlement period, pending earnings become available balance.

### Admin Perspective

1. **Notification of new submission** — Admin sees pending count increase in dashboard.
2. **Open submission queue** — Filter by type, date, or opportunity.
3. **Review submission** — View content, check against rubric or instructions.
4. **Approve or Reject** — With optional feedback message sent to contributor.
5. **Payout triggered** — Approved submissions queue the payout to the contributor's wallet.

### Quality Controls
- Duplicate submission detection.
- Time-on-task minimums for surveys and timed tasks.
- Contributor tier gating (advanced tasks require reputation threshold).
- Random sample audits on high-volume batch tasks.

---

## 11. Wallet System

### 11.1 Balance Types
- **Pending Balance:** Earnings from submitted-but-not-yet-confirmed tasks. Not withdrawable.
- **Available Balance:** Confirmed earnings ready for withdrawal.

### 11.2 Credit Events
- Task or submission approved by admin.
- Offerwall postback received and validated.
- Admin manual credit (with mandatory reason log).

### 11.3 Debit Events
- Withdrawal request submitted and approved.
- Admin manual debit/adjustment (with mandatory reason log).

### 11.4 Wallet Ledger
- Every credit and debit is recorded with: timestamp, amount, type, reference (task ID or withdrawal ID), balance after transaction.
- Contributors can view full history.
- Admins can view and audit any contributor's ledger.

### 11.5 Minimum Balance
- A minimum available balance is required to request a withdrawal (configured in Admin Settings).
- Default minimum: $5.00 (configurable).

---

## 12. Withdrawal System

### 12.1 Supported Methods (V1)
- **PayPal** — Via contributor's verified PayPal email.
- **Cryptocurrency** — Bitcoin or USDT wallet address (admin-confirmed).
- Additional methods added post-V1 based on regional demand.

### 12.2 Withdrawal Request Flow
1. Contributor navigates to Wallet page.
2. Clicks "Withdraw."
3. Selects method and enters/confirms payout details.
4. Inputs withdrawal amount (must meet minimum, cannot exceed available balance).
5. Confirms request.
6. Status shown as "Pending" in withdrawal history.

### 12.3 Admin Processing
1. Withdrawal request appears in Admin Withdrawals queue.
2. Admin reviews request: amount, method, contributor account standing.
3. Admin marks as "Processing" while executing the transfer externally.
4. Admin marks as "Completed" once transfer is confirmed.
5. Contributor's available balance is decremented.
6. Contributor receives in-app notification and optional email confirmation.

### 12.4 Rejection
- Admin can reject a withdrawal with a reason.
- Balance is restored to available.
- Contributor notified with reason.

### 12.5 Fraud & Abuse Controls
- Withdrawals from accounts with flags or active reviews may be held.
- New accounts may have a mandatory hold period before first withdrawal.
- Admin can freeze a contributor's wallet pending investigation.

---

## 13. Offerwall Integration Strategy

### 13.1 What Offerwalls Are
Third-party platforms that provide a marketplace of monetized tasks (app installs, surveys, video completions, sign-ups). NexGuild embeds these walls inside the contributor dashboard via iframe or SDK. When a contributor completes an offerwall task, the provider sends a server-to-server postback to NexGuild, crediting the contributor's wallet.

### 13.2 Integration Architecture
- **Embed Method:** Each active offerwall is loaded in an iframe within the Offerwall Hub page of the contributor dashboard.
- **Postback URL:** NexGuild exposes a secure postback endpoint per provider. The provider sends `contributor_id`, `reward_amount`, and `transaction_id` upon task completion.
- **Validation:** Postbacks are validated using provider-specific signatures or tokens.
- **Idempotency:** Transaction IDs are stored to prevent duplicate credits.
- **Credit Flow:** Validated postback → wallet credit as "confirmed" (offerwall earnings are typically instant-confirm).

### 13.3 Target Providers (V1)
The following are priority integrations based on global reach, reliability, and revenue quality:

| Provider | Type | Notes |
|---|---|---|
| CPX Research | Surveys | High-paying surveys, global coverage |
| Lootably | Mixed (surveys, videos, installs) | Easy iframe embed, strong postback system |
| AdGem | Mixed | Good mobile/desktop coverage |
| Theorem Reach | Surveys | High-quality research surveys |
| BitLabs | Surveys | Strong revenue per completion |

*Providers are enabled/disabled per admin configuration. Not all providers will be live at launch.*

### 13.4 Revenue Share Configuration
- Admin sets a per-provider payout percentage (e.g., pass 70% of offerwall revenue to contributor, retain 30%).
- Contributors see the payout displayed in the offerwall itself (provider-controlled UI).
- Actual NexGuild share is an accounting entry — contributors do not see the gross provider payment.

### 13.5 Provider Onboarding Requirements
Each provider requires:
- Publisher account registration with the provider.
- API key and postback secret configuration.
- Compliance with provider's terms (traffic quality, prohibited countries, etc.).

---

## 14. Future Expansion Ideas

### 14.1 Organization Portal (V2)
- Self-serve organization accounts.
- Organizations submit project briefs, set budgets, and track progress directly.
- NexGuild retains admin oversight and approval before publishing.

### 14.2 Contributor Tiers & Reputation System
- Bronze / Silver / Gold / Elite contributor levels based on completed tasks, approval rate, and tenure.
- Higher tiers unlock higher-paying opportunities, priority access, and faster withdrawals.

### 14.3 Skill Verification & Badges
- Contributors complete short skill assessments.
- Verified badges displayed on profile.
- Organizations can request verified contributors for specialized projects.

### 14.4 Team / Group Tasks
- Certain projects allow a team of contributors to collaborate.
- Team leader coordinates submissions.
- Revenue split defined by admin.

### 14.5 Referral Program
- Contributors earn a bonus for referring new active contributors.
- Referral earnings tracked through wallet system.
- Configurable referral bonus rate in Admin Settings.

### 14.6 API for Organization Clients
- Allow organizations to submit tasks and retrieve results programmatically.
- Useful for research labs and tech companies with recurring data needs.

### 14.7 Mobile App
- Native or React Native app for contributors on mobile.
- Push notifications for new opportunities and wallet updates.
- Optimized for quick task completion on the go.

### 14.8 Regional Payment Methods
- Expand withdrawal options: Payoneer, Wise, M-Pesa, bank transfer.
- Prioritize top contributor countries based on signup data.

### 14.9 Contributor Community Forum
- Simple discussion board within the dashboard.
- Task tips, earnings discussions, platform updates.
- Moderated by NexGuild staff.

### 14.10 Analytics Dashboard for Organizations (V2+)
- Organizations view project progress, contributor stats, and deliverable quality in real time.

---

## 15. Design Principles

### 15.1 Light-First
- Default theme is light. White and off-white backgrounds. Clean typography. Subtle borders, no heavy shadows.
- Dark mode is a post-V1 consideration.

### 15.2 Professional, Not Flashy
- No gimmicks, animations for their own sake, or trendy micro-interactions that distract.
- Trust is the primary visual goal. The platform should feel stable and serious.

### 15.3 Clarity Over Density
- Every page has one primary action and a clear visual hierarchy.
- Numbers and stats are prominent. Text is concise.
- Empty states are helpful — they explain what to do, not just say "nothing here."

### 15.4 Honest Presentation
- No fake data, testimonials, statistics, client logos, or team photos.
- Placeholder sections are clearly marked as "Coming Soon" or left minimal until real data exists.
- Real trust comes from real transparency.

### 15.5 Accessible & Inclusive
- Color contrast meets WCAG AA minimum.
- All interactive elements are keyboard accessible.
- Forms have clear labels and error states.
- Language is plain and jargon-free.

### 15.6 Responsive
- All pages and dashboard views function correctly on mobile, tablet, and desktop.
- Dashboard is primarily a desktop experience but remains usable on mobile.

### 15.7 Fast
- Pages load quickly. No heavy third-party scripts on public pages unless essential.
- Images are optimized. Offerwalls load lazily.

---

## 16. Content Rules

### 16.1 No Fabricated Social Proof
- No fake testimonials with invented names and photos.
- No fake client or partner logos.
- No invented statistics (e.g., "10,000+ happy contributors" when you have 0).
- If a section requires social proof that doesn't yet exist, either omit the section or use a clearly forward-looking placeholder ("Our community is growing — be one of the first.").

### 16.2 Accurate Payout Claims
- All payout ranges stated on the public site must reflect real opportunity payouts.
- Do not imply income guarantees or misleading earning potential.
- Use ranges and qualifiers: "Earn $0.50 – $5.00 per survey depending on length and provider."

### 16.3 Plain Language
- Write for a global audience with varying English proficiency.
- Avoid idioms, jargon, and unnecessarily complex vocabulary.
- Instructions must be unambiguous.

### 16.4 Scope Honesty
- Do not claim capabilities the platform does not yet have.
- "Coming soon" sections are acceptable for planned features, but must not be presented as currently functional.

### 16.5 Legal Compliance
- Terms of Service must clearly define contributor relationship (independent contractor, not employee).
- Privacy Policy must accurately reflect data collection and usage.
- Offerwall integrations must comply with each provider's publisher terms.
- GDPR and regional privacy regulation compliance required before accepting users from applicable regions.

### 16.6 Moderation Standards
- Opportunities published on the platform must not involve illegal, deceptive, or harmful work.
- Admin reviews all opportunities before they go live.
- Contributor-submitted content is subject to review before being delivered to organizations.

---

## 17. V1 Scope Summary

| Feature | Included in V1 |
|---|---|
| Public website (all pages) | Yes |
| Contributor registration and login | Yes |
| Contributor dashboard | Yes |
| Opportunity browsing and completion | Yes |
| Admin dashboard | Yes |
| Submission review workflow | Yes |
| Wallet system (pending + available balance) | Yes |
| Withdrawal system (PayPal + Crypto) | Yes |
| Offerwall integration (1–3 providers) | Yes |
| Organization accounts / portal | No — V2 |
| Freelancer marketplace | No — Out of scope |
| Mobile app | No — Post-V1 |
| Contributor tiers / reputation | No — V2 |
| Referral program | No — V2 |
| Team / group tasks | No — V2 |
| Organization API | No — V2 |
| Dark mode | No — Post-V1 |
| Blog / Resources | Optional — V1 if content exists |

---

*Document version: 1.0 | NexGuild Internal Blueprint | Not for public distribution*
