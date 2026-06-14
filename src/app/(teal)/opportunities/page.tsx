import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { Lock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Earning Opportunities — NexGuild",
  description:
    "Browse available micro-task categories on NexGuild: audio recording, transcription, image labeling, surveys, and more. Earn NexCoins from home.",
  openGraph: {
    title: "Earning Opportunities on NexGuild",
    description: "Browse micro-task categories and start earning NexCoins from home.",
    url: "https://nexguild.in/opportunities",
  },
};

const CATEGORIES = [
  { icon: "🎙️", label: "Audio Recording",    desc: "Record voice samples and audio prompts for AI training." },
  { icon: "📝", label: "Transcription",       desc: "Convert audio recordings into accurate text." },
  { icon: "🏷️", label: "Data Annotation",    desc: "Label images, audio, and text for machine learning." },
  { icon: "📱", label: "App Testing",         desc: "Test mobile applications and report bugs or UX issues." },
  { icon: "🎮", label: "Game Testing",        desc: "Play and test games, report your experience." },
  { icon: "📊", label: "Surveys",             desc: "Answer research questions on products and services." },
  { icon: "🎯", label: "Offerwalls",          desc: "Complete partner tasks — surveys, installs, and more." },
  { icon: "▶️", label: "Social Media Tasks", desc: "Engage with content or complete social activities." },
  { icon: "🔍", label: "Web Research",        desc: "Search, compile, and verify online information." },
  { icon: "🌿", label: "Data Collection",     desc: "Gather structured real-world data and observations." },
];

export default function OpportunitiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full accent-pill text-sm font-medium mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
              New tasks added regularly
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">
              Real Tasks. Real Earnings.
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed mb-8">
              Sign up to access live opportunities and start earning right away.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">
                Sign Up Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Category Cards */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Categories</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">10 Ways to Earn</h2>
              <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
                These are the task categories available on NexGuild. Sign up to see live tasks with current pay rates.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {CATEGORIES.map((cat, i) => (
              <FadeIn key={cat.label} delay={i * 50}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-5 h-full card-hover text-center">
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="font-semibold text-white mb-2 text-sm">{cat.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{cat.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Banner — replace div with AdBanner component once Adsterra key is ready */}
      <section className="bg-[var(--surface-page)] py-6 px-6">
        <div className="mx-auto max-w-container flex justify-center">
          {/* <AdBanner atKey="YOUR_KEY_HERE" width={728} height={90} /> */}
          <div className="w-full max-w-[728px] h-[90px] rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-center">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Advertisement</span>
          </div>
        </div>
      </section>

      {/* Login Gate */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-10 text-center max-w-lg mx-auto card-hover">
              <div className="h-14 w-14 rounded-full bg-[var(--brand-100)] flex items-center justify-center mx-auto mb-5">
                <Lock className="h-6 w-6 text-[var(--brand-500)]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Ready to see live opportunities?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                Create a free account to browse all currently available tasks, see pay rates, and start earning right away.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/signup">
                  Join Free — It Takes 1 Minute <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Already have an account?{" "}
                <Link href="/login" className="text-[var(--text-link)] hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
