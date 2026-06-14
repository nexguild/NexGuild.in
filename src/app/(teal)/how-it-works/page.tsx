import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — NexGuild",
  description:
    "Learn how NexGuild works: sign up free, pick tasks, complete them from home, earn NexCoins, and redeem for Amazon, Flipkart, Paytm vouchers.",
  openGraph: {
    title: "How NexGuild Works",
    description: "Sign up, complete tasks, earn NexCoins, redeem for vouchers.",
    url: "https://nexguild.in/how-it-works",
  },
};

const STEPS = [
  {
    icon: "🆓",
    title: "Sign Up Free",
    body: "Create your account with your name, email, and country in 30 seconds. No experience or identity verification required to start.",
  },
  {
    icon: "✅",
    title: "Complete Your Profile",
    body: "Set your skills, language, and device capabilities so we can match you with the right tasks from day one.",
  },
  {
    icon: "🔎",
    title: "Browse & Apply for Tasks",
    body: "Explore available tasks across recordings, transcription, annotation, app testing, offerwalls, surveys, and more.",
  },
  {
    icon: "📤",
    title: "Submit Your Work",
    body: "Follow the task instructions, complete the work, and submit. Your submission enters our review queue immediately.",
  },
  {
    icon: "💸",
    title: "Withdraw to UPI / Bank",
    body: "Once your available balance meets the minimum threshold, request a withdrawal via UPI, Bank Transfer, or PayPal.",
  },
];

const FAQS = [
  { q: "Is there a fee to join NexGuild?",           a: "No. Signing up is completely free. NexGuild earns through service fees from organizations — contributors keep what they earn from tasks." },
  { q: "How long does it take to get approved?",     a: "Approval times vary by task type. Micro-tasks may be reviewed within 24 hours. Audio, content, and survey tasks typically take 1–3 business days." },
  { q: "What happens if my submission is rejected?", a: "You will receive a notification with feedback explaining the reason. Depending on the task, you may be able to revise and resubmit." },
  { q: "How quickly can I withdraw my earnings?",    a: "Withdrawals are processed within 1–3 business days after your request. New accounts may have a short hold period before their first withdrawal." },
  { q: "Which countries can join?",                  a: "NexGuild is open globally. Most tasks are open to contributors in India. Some tasks may restrict participation by country based on organization requirements." },
  { q: "What payment methods are available?",        a: "Contributors can withdraw via UPI (India), Bank Transfer (India), and PayPal (global). More methods will be added over time." },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative hero-glow overflow-hidden">
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle, rgba(20,184,166,0.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            mask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-container px-6 pt-28 pb-16 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] mb-6">
              <span className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider">
                For Contributors
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 text-balance">
              How It Works
            </h1>
            <p className="text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
              Five simple steps from sign-up to your first withdrawal.
              Work from your phone. Get paid to your UPI.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 80}>
                <div className="flex gap-5 p-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--brand-500)] transition-colors group">
                  <div className="w-14 h-14 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-[var(--brand-500)] uppercase tracking-wider mb-1">
                      Step {i + 1}
                    </span>
                    <h3 className="font-bold text-white text-base mb-1.5">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={500}>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="h-12 px-8 inline-flex items-center justify-center rounded-xl bg-[var(--brand-500)] text-[var(--text-inverse)] text-base font-bold hover:bg-[var(--brand-400)] transition-colors"
              >
                Create Your Account →
              </Link>
              <Link
                href="/opportunities"
                className="h-12 px-8 inline-flex items-center justify-center rounded-xl border border-[var(--border-strong)] text-white/70 text-base font-medium hover:text-white hover:border-[var(--brand-500)] transition-colors"
              >
                Browse Opportunities
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Wallet info */}
      <section className="py-16 px-6 bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Payments & Withdrawals</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeIn>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
                <h3 className="font-semibold text-white mb-4">Wallet Balances</h3>
                <ul className="space-y-3">
                  {[
                    { dot: "warning", label: "Pending Balance", desc: "Earnings from submitted work awaiting review." },
                    { dot: "success", label: "Available Balance", desc: "Confirmed earnings ready to withdraw." },
                  ].map((item) => (
                    <li key={item.label} className="flex gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${item.dot === "warning" ? "bg-[var(--warning-text)]" : "bg-[var(--success-text)]"}`} />
                      <div>
                        <span className="font-medium text-white text-sm">{item.label} — </span>
                        <span className="text-sm text-white/50">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
                <h3 className="font-semibold text-white mb-4">Withdrawal Methods</h3>
                <ul className="space-y-3">
                  {[
                    { method: "UPI",           detail: "Instant transfers to any UPI ID. India only." },
                    { method: "Bank Transfer", detail: "Direct to your bank account. India only. 1–3 days." },
                    { method: "PayPal",        detail: "Enter your PayPal email. Global. 1–3 business days." },
                  ].map((m) => (
                    <li key={m.method} className="flex gap-3">
                      <div className="h-2 w-2 rounded-full bg-[var(--brand-500)] mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-white text-sm">{m.method} — </span>
                        <span className="text-sm text-white/50">{m.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          </FadeIn>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 40}>
                <details className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4">
                    <span className="font-medium text-white text-sm">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-[var(--brand-500)] flex-shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={100} className="mt-8 text-center">
            <Link href="/faq" className="text-sm text-[var(--brand-500)] hover:underline">
              View full FAQ →
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
