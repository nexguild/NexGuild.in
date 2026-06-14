import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "About NexGuild — Digital Workforce Community",
  description:
    "Learn about NexGuild — our mission, values, and how we connect skilled contributors with clients who need real work done. No fake testimonials, no inflated stats.",
  openGraph: {
    title: "About NexGuild",
    description: "Our mission, values, and how we connect skilled contributors with clients.",
    url: "https://nexguild.in/about",
  },
};

const DIFFERENTIATORS = [
  {
    title: "No Fake Social Proof",
    desc: "No inflated testimonials, no invented statistics, no stock-photo team members. Our reputation is built on real results, not manufactured trust.",
  },
  {
    title: "Fully Managed Projects",
    desc: "Organizations never manage contributors directly. NexGuild handles everything — distribution, review, and delivery.",
  },
  {
    title: "Transparent Compensation",
    desc: "Contributors see the payout before they start. No bait-and-switch, no deductions after the fact.",
  },
  {
    title: "Quality Over Volume",
    desc: "Submissions are reviewed before payouts are issued. We reward accuracy and effort, not just quantity.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">About</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance max-w-2xl">About NexGuild</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Building a platform where contributors and organizations can work together with clarity and trust.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              NexGuild exists to give anyone — regardless of background, location, or credentials — a structured way
              to earn income and build reputation through real work.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              We bridge the gap between organizations that need scalable human-powered tasks and contributors who
              want reliable, fairly compensated opportunities. NexGuild manages the entire workflow so contributors
              focus only on doing good work.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Work should be accessible. Compensation should be transparent. Quality contributors deserve a platform
              that respects their time.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Differentiators */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-10">What Makes NexGuild Different</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DIFFERENTIATORS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 h-full card-hover">
                  <div className="w-8 h-0.5 bg-[var(--brand-500)] mb-4" />
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
              Have a question, a project idea, or feedback about the platform? We read every message and respond within 24 hours.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="mailto:nexguild.in@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-[var(--brand-500)] text-[var(--brand-500)] text-sm font-medium hover:bg-[var(--brand-100)] transition-colors"
              >
                nexguild.in@gmail.com
              </a>
              <a
                href="https://wa.me/919382008513"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20bb5a] transition-colors"
              >
                WhatsApp
              </a>
              <a
                href="https://t.me/nexguild"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#229ED9] text-white text-sm font-medium hover:opacity-90 transition-colors"
              >
                Telegram
              </a>
              <a
                href="https://www.linkedin.com/in/somen-biswas-410727215"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:text-white hover:border-white/30 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
