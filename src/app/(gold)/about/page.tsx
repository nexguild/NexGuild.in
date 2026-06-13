import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = { title: "About" };

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

      {/* Team */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-6">The Team</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
              NexGuild is a small, focused team building in public. We will introduce our team properly once we
              are ready. Until then, we let the platform speak for itself.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Platform Lead", "Contributor Operations", "Product Design", "Technical Lead"].map((role, i) => (
              <FadeIn key={role} delay={i * 60}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] px-5 py-4 card-hover">
                  <div className="h-1.5 w-6 rounded-full bg-[var(--brand-500)] mb-3" />
                  <p className="font-medium text-white">{role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
