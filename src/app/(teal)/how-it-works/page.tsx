import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight, ChevronDown } from "lucide-react";

export const metadata: Metadata = { title: "How It Works" };

const STEPS = [
  { number: "01", title: "Create Your Account",    body: "Sign up with your email and password. Select your country and agree to the Terms of Service. No identity verification required to get started — some higher-paying tasks may ask for it later." },
  { number: "02", title: "Browse Opportunities",   body: "Explore available tasks across surveys, micro-tasks, data labeling, content work, and offerwall tasks. Each opportunity shows the payout, estimated time, and skill level required upfront." },
  { number: "03", title: "Complete the Work",      body: "Click Start Task to begin. Follow the instructions carefully. Some tasks are time-limited. Submit your work when finished — it enters our review queue immediately." },
  { number: "04", title: "Get Reviewed",           body: "Our team reviews submissions for quality. Approved work credits your wallet. Rejected work comes with feedback so you understand what to improve. Some task types allow resubmission." },
  { number: "05", title: "Withdraw Your Earnings", body: "Once your available balance reaches the minimum threshold ($5.00), you can request a withdrawal. We support PayPal and cryptocurrency. Payouts are processed manually by our team, typically within 1–3 business days." },
];

const OPPORTUNITY_TYPES = [
  { label: "Survey",       payout: "$0.20 – $5.00",   time: "5–20 min",   level: "Any" },
  { label: "Micro-task",   payout: "$0.05 – $1.00",   time: "1–10 min",   level: "Any" },
  { label: "Data Labeling",payout: "$0.50 – $10.00",  time: "5–30 min",   level: "Any" },
  { label: "Content Task", payout: "$1.00 – $25.00",  time: "15–60 min",  level: "Intermediate" },
  { label: "Offerwall",    payout: "Varies",           time: "Varies",     level: "Any" },
  { label: "Project Task", payout: "Negotiated",       time: "Multi-day",  level: "Intermediate–Advanced" },
];

const FAQS = [
  { q: "Is there a fee to join NexGuild?",         a: "No. Signing up is completely free. NexGuild earns revenue through service fees charged to organizations and a share of offerwall earnings — contributors keep what they earn." },
  { q: "How long does it take to get approved?",   a: "Approval times vary by task type. High-volume micro-tasks may be reviewed in batches within 24 hours. Content tasks and surveys may take 1–3 business days." },
  { q: "What happens if my submission is rejected?",a: "You will receive a notification with admin feedback explaining the reason. Depending on the task, you may be able to revise and resubmit." },
  { q: "How quickly can I withdraw my earnings?",  a: "Withdrawals are processed within 1–3 business days after request. New accounts may have a short hold period before their first withdrawal." },
  { q: "Can I work from any country?",             a: "Most opportunities are open globally. Some tasks may restrict participation by country due to the organization's requirements." },
  { q: "Is there a minimum payout amount?",        a: "Yes. The minimum withdrawal amount is $5.00. This threshold is configurable and may change over time." },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Guide</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">How It Works</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Everything you need to know about earning on NexGuild — from signup to withdrawal.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Step Flow */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-10">Your Contributor Journey</h2>
          </FadeIn>
          <div className="space-y-10">
            {STEPS.map((step, i) => (
              <FadeIn key={step.number} delay={i * 80}>
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--brand-100)] flex items-center justify-center border border-[var(--brand-200)]">
                    <span className="text-xs font-bold text-[var(--brand-500)]">{step.number}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunity Types Table */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-8">Opportunity Types</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPPORTUNITY_TYPES.map((type, i) => (
              <FadeIn key={type.label} delay={i * 60}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 card-hover">
                  <h3 className="font-semibold text-white mb-4">{type.label}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Payout</span>
                      <span className="font-medium text-[var(--success-text)]">{type.payout}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Est. Time</span>
                      <span className="text-[var(--text-secondary)]">{type.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Skill Level</span>
                      <span className="text-[var(--text-secondary)]">{type.level}</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Wallet & Withdrawal */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-8">Wallet & Withdrawal</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <FadeIn>
              <h3 className="text-lg font-semibold text-white mb-4">Your Wallet Balances</h3>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">Your wallet has two balance types:</p>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--warning-text)] mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">Pending Balance — </span>
                    <span className="text-[var(--text-secondary)]">Earnings from submitted work awaiting confirmation. Not yet withdrawable.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--success-text)] mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">Available Balance — </span>
                    <span className="text-[var(--text-secondary)]">Confirmed earnings ready to withdraw.</span>
                  </div>
                </li>
              </ul>
            </FadeIn>
            <FadeIn delay={100}>
              <h3 className="text-lg font-semibold text-white mb-4">Withdrawal Methods</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--brand-500)] mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">PayPal — </span>
                    <span className="text-[var(--text-secondary)]">Enter your verified PayPal email. Processed within 1–3 business days.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--brand-500)] mt-2 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white">Cryptocurrency — </span>
                    <span className="text-[var(--text-secondary)]">Bitcoin or USDT (TRC20). Provide your wallet address in Settings before requesting.</span>
                  </div>
                </li>
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
          </FadeIn>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 50}>
                <details className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4">
                    <span className="font-medium text-white">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-[var(--brand-500)] flex-shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--surface-card)] py-16 px-6 text-center">
        <FadeIn>
          <div className="mx-auto max-w-container">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">Join for free. Start earning today.</p>
            <Button asChild size="lg">
              <Link href="/signup">Create Your Account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
