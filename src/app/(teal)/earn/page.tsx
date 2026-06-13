import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight, CheckCircle, Globe, Zap, Shield, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Start Earning — NexGuild",
  description:
    "Join NexGuild and earn by completing surveys, micro-tasks, data labeling, and content work for real organizations.",
};

const STEPS = [
  { number: "01", title: "Sign Up Free",    description: "Create your account in under a minute. No experience or credentials required." },
  { number: "02", title: "Complete Tasks",  description: "Browse surveys, micro-tasks, content work, and managed projects. Pick what fits you." },
  { number: "03", title: "Get Paid",        description: "Approved earnings hit your wallet. Withdraw via PayPal or crypto when ready." },
];

const OPPORTUNITY_TYPES = [
  { label: "Surveys",          icon: "📋", description: "Share your opinions on research studies and market surveys.",                      payout: "From $0.20" },
  { label: "Micro-tasks",      icon: "⚡", description: "Tag images, classify content, and label data for AI teams.",                      payout: "From $0.05" },
  { label: "Content Tasks",    icon: "✍️", description: "Write, translate, summarize, or edit content for real clients.",                   payout: "From $1.00" },
  { label: "Managed Projects", icon: "📁", description: "Join scoped projects requiring multiple contributors over time.",                   payout: "From $5.00" },
];

const VALUE_PROPS = [
  { icon: Globe,        title: "Global Access",          description: "Open to contributors worldwide. No location restrictions on most tasks." },
  { icon: Zap,          title: "Fast Payouts",           description: "Withdraw your earnings via PayPal or cryptocurrency once approved." },
  { icon: CheckCircle,  title: "Real Work",              description: "Every task comes from real organizations with genuine requirements." },
  { icon: Shield,       title: "Transparent Earnings",   description: "See exactly what you earn per task before you start. No hidden deductions." },
  { icon: Star,         title: "Build Reputation",       description: "Your approval rate and completed tasks build a verifiable track record." },
  { icon: ArrowRight,   title: "Grow Over Time",         description: "Access higher-paying tasks as you establish a history of quality work." },
];

export default function EarnPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] pt-24 pb-28 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full accent-pill text-sm font-medium mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
              Now accepting contributors worldwide
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight text-balance mb-6 max-w-3xl">
              Earn by Contributing.{" "}
              <span className="gradient-text">Grow by Participating.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
              NexGuild connects skilled individuals with paid tasks from real organizations. Complete surveys,
              label data, write content, and join managed projects — all from one platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start Earning
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[var(--surface-card)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                Getting started takes minutes. Earning starts immediately.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <FadeIn key={step.number} delay={i * 100}>
                <div className="relative">
                  <div className="text-5xl font-bold text-[var(--brand-100)] mb-4 leading-none">{step.number}</div>
                  <div className="w-8 h-px bg-[var(--brand-500)] mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunity Types */}
      <section className="bg-[var(--surface-page)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Work Types</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Types of Work Available</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                From quick tasks to multi-day projects — there is something for every skill level.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OPPORTUNITY_TYPES.map((type, i) => (
              <FadeIn key={type.label} delay={i * 70}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 h-full card-hover">
                  <div className="text-2xl mb-3">{type.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{type.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{type.description}</p>
                  <p className="text-sm font-semibold text-[var(--success-text)]">{type.payout}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why NexGuild */}
      <section className="bg-[var(--surface-card)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Why Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why NexGuild</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                Built for contributors who value reliability, fairness, and transparency.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUE_PROPS.map((prop, i) => {
              const Icon = prop.icon;
              return (
                <FadeIn key={prop.title} delay={i * 60}>
                  <div className="flex gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-5 h-full card-hover">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[var(--brand-500)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{prop.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{prop.description}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-60" />
        <div className="mx-auto max-w-container text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to start earning?</h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              Join NexGuild today. Free to sign up, no commitment required.
            </p>
            <Button asChild size="lg">
              <Link href="/signup">
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
