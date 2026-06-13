import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight, ChevronDown } from "lucide-react";

export const metadata: Metadata = { title: "FAQ — NexGuild" };

const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    faqs: [
      { q: "Is it free to join NexGuild?",         a: "Yes, completely free. There are no joining fees, subscription charges, or hidden costs. You sign up, complete tasks, and get paid." },
      { q: "What countries can join?",              a: "NexGuild is open globally. Most tasks are available worldwide. Some tasks may be restricted by country based on the organization's requirements. India-based contributors have access to the most tasks." },
      { q: "Do I need any experience?",             a: "No. Most tasks on NexGuild require no prior experience. Instructions are provided for each task. Some higher-level tasks (content writing, advanced annotation) may prefer experience, but it is not mandatory to start." },
      { q: "How do I create an account?",           a: "Visit nexguild.in/signup, enter your name, email, password, and country. Agree to the Terms of Service and click Create Account. You can start browsing tasks immediately." },
    ],
  },
  {
    section: "Earning & Tasks",
    faqs: [
      { q: "What types of tasks are available?",    a: "NexGuild offers audio recording, transcription, data annotation, app testing, game testing, surveys, offerwalls, social media tasks, web research, and data collection. New task types are added regularly." },
      { q: "How do I know what a task pays?",        a: "Each task shows its pay rate before you start. You will always know what you will earn before committing to a task." },
      { q: "How long does each task take?",          a: "It varies by task type. Some micro-tasks take 1–5 minutes. Surveys typically take 5–20 minutes. Audio recordings and testing tasks can take longer. Each task shows an estimated time." },
      { q: "What are offerwalls?",                   a: "Offerwalls are partner tasks from third-party providers like Lootably. They include surveys, app installs, and other activities. Earnings from offerwalls are automatically credited to your wallet after the provider confirms completion." },
    ],
  },
  {
    section: "Payments & Withdrawals",
    faqs: [
      { q: "How does my wallet work?",               a: "Your wallet has two balances: Pending (earnings under review, not yet withdrawable) and Available (confirmed earnings ready to withdraw)." },
      { q: "What are the withdrawal methods?",       a: "UPI (India), Bank Transfer (India), and PayPal (global). We plan to add more methods over time." },
      { q: "What is the minimum withdrawal amount?", a: "The minimum withdrawal amount is currently set by the admin. Check your wallet page for the current minimum threshold." },
      { q: "How long do withdrawals take?",          a: "Withdrawals are processed manually within 1–3 business days after you request them. New accounts may have a short hold period before their first withdrawal." },
    ],
  },
  {
    section: "Task Review & Quality",
    faqs: [
      { q: "What happens after I submit a task?",   a: "Your submission enters the review queue. Our team checks it against the task requirements. If approved, earnings move to your wallet. If rejected, you receive feedback explaining why." },
      { q: "Why was my submission rejected?",        a: "Submissions are rejected when they do not meet the task's quality requirements — incomplete answers, poor audio quality, inaccurate labels, etc. You will always receive feedback with the rejection." },
      { q: "Can I resubmit a rejected task?",        a: "Some tasks allow resubmission. The task details will indicate if revision is permitted. Follow the feedback you received to improve your submission." },
      { q: "How is my approval rate calculated?",    a: "Your approval rate is the percentage of your submitted tasks that were approved. A higher approval rate unlocks access to better-paying tasks." },
    ],
  },
  {
    section: "Account & Support",
    faqs: [
      { q: "How do I contact support?",              a: "Use the Contact page on our website, message us on WhatsApp, or email nexguild.in@gmail.com. We respond within 24 hours." },
      { q: "Can I use multiple accounts?",           a: "No. Multiple accounts are against NexGuild's Terms of Service and will result in a permanent ban. One account per person." },
      { q: "What happens if I'm banned?",            a: "Banned accounts lose all pending and available balances. If you believe a ban was made in error, contact us within 7 days with evidence." },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">Frequently Asked Questions</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Everything you need to know about earning, withdrawals, and how NexGuild works.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose space-y-12">
          {FAQ_SECTIONS.map((section, si) => (
            <FadeIn key={section.section} delay={si * 60}>
              <div>
                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[var(--border-default)]" />
                  {section.section}
                  <span className="h-px flex-1 bg-[var(--border-default)]" />
                </h2>
                <div className="space-y-2">
                  {section.faqs.map((faq) => (
                    <details key={faq.q} className="group rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)]">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4">
                        <span className="font-medium text-white text-sm">{faq.q}</span>
                        <ChevronDown className="h-4 w-4 text-[var(--brand-500)] flex-shrink-0 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="px-5 pb-4">
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-16 px-6 text-center">
        <FadeIn>
          <div className="mx-auto max-w-container">
            <h2 className="text-2xl font-bold text-white mb-3">Still have questions?</h2>
            <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
              Our team is available via WhatsApp or email. We respond within 24 hours.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/contact">
                  Contact Us <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/signup">Join NexGuild</Link>
              </Button>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
