import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "About NexGuild — Earn by Contributing",
  description:
    "NexGuild is a community where anyone can earn real money by completing simple tasks — audio recording, transcription, app testing, and more. Free to join.",
  openGraph: {
    title: "About NexGuild — For Contributors",
    description: "Join India's contributor community. Complete tasks, earn NexCoins, redeem for real rewards.",
    url: "https://nexguild.in/earn/about",
  },
};

const VALUES = [
  {
    title: "Anyone Can Join",
    desc: "No qualifications required. If you have a smartphone and some free time, you can start earning NexCoins today.",
  },
  {
    title: "Know Before You Start",
    desc: "Every task shows the NexCoin reward upfront. No hidden deductions, no bait-and-switch after you submit.",
  },
  {
    title: "Real Rewards",
    desc: "NexCoins redeem directly for Amazon, Flipkart, Google Play, and Zomato vouchers. No points that expire useless.",
  },
  {
    title: "Fair Quality Review",
    desc: "We review submissions for quality — not to find excuses to reject. Good work gets rewarded consistently.",
  },
];

export default function ContributorAboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">About</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance max-w-2xl">
              Turn Free Time<br />Into Real Earnings.
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              NexGuild gives anyone a straightforward way to earn income by completing real tasks — no experience required, no commute needed.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Our story */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-6">Why We Built This</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Most earning platforms are packed with fake promises, impossible withdrawal thresholds, or tasks that pay almost nothing. We built NexGuild to be different.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
              Every task on NexGuild is real work — audio recordings for AI training, transcription, app reviews, web research. Organisations actually pay for this work, and we pass a fair share directly to contributors as NexCoins.
            </p>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              We are India-based and built for Indian contributors. NexCoins redeem for vouchers you can actually use — Amazon, Flipkart, Zomato, Google Play.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-10">What We Stand For</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUES.map((item, i) => (
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

      {/* CTA */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-prose">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Start?</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-8">
              Sign up for free, browse available tasks, and start earning NexCoins today. No waiting period, no approval process.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#14b8a6] text-[#ffffff] text-sm font-semibold hover:bg-[#5eead4] transition-colors"
              >
                Sign Up Free →
              </Link>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-sm font-medium hover:text-white hover:border-white/30 transition-colors"
              >
                Browse Opportunities
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
