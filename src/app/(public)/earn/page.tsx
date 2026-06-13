import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Globe, Zap, Shield, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Start Earning — NexGuild",
  description:
    "Join NexGuild and earn by completing surveys, micro-tasks, data labeling, and content work for real organizations.",
};

const STEPS = [
  {
    number: "01",
    title: "Sign Up Free",
    description: "Create your account in under a minute. No experience or credentials required.",
  },
  {
    number: "02",
    title: "Complete Tasks",
    description: "Browse surveys, micro-tasks, content work, and managed projects. Pick what fits you.",
  },
  {
    number: "03",
    title: "Get Paid",
    description: "Approved earnings hit your wallet. Withdraw via PayPal or crypto when ready.",
  },
];

const OPPORTUNITY_TYPES = [
  {
    label: "Surveys",
    icon: "📋",
    description: "Share your opinions on research studies and market surveys.",
    payout: "From $0.20",
  },
  {
    label: "Micro-tasks",
    icon: "⚡",
    description: "Tag images, classify content, and label data for AI teams.",
    payout: "From $0.05",
  },
  {
    label: "Content Tasks",
    icon: "✍️",
    description: "Write, translate, summarize, or edit content for real clients.",
    payout: "From $1.00",
  },
  {
    label: "Managed Projects",
    icon: "📁",
    description: "Join scoped projects requiring multiple contributors over time.",
    payout: "From $5.00",
  },
];

const VALUE_PROPS = [
  {
    icon: Globe,
    title: "Global Access",
    description: "Open to contributors worldwide. No location restrictions on most tasks.",
  },
  {
    icon: Zap,
    title: "Fast Payouts",
    description: "Withdraw your earnings via PayPal or cryptocurrency once approved.",
  },
  {
    icon: CheckCircle,
    title: "Real Work",
    description: "Every task comes from real organizations with genuine requirements.",
  },
  {
    icon: Shield,
    title: "Transparent Earnings",
    description: "See exactly what you earn per task before you start. No hidden deductions.",
  },
  {
    icon: Star,
    title: "Build Reputation",
    description: "Your approval rate and completed tasks build a verifiable track record.",
  },
  {
    icon: ArrowRight,
    title: "Grow Over Time",
    description: "Access higher-paying tasks as you establish a history of quality work.",
  },
];

export default function EarnPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[var(--surface-card)] pt-20 pb-24 px-6">
        <div className="mx-auto max-w-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] text-sm font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
              Now accepting contributors worldwide
            </div>
            <h1 className="text-5xl font-bold text-[var(--text-primary)] leading-tight text-balance mb-6">
              Earn by Contributing.{" "}
              <span className="text-[var(--brand-500)]">Grow by Participating.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl leading-relaxed">
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
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-[var(--surface-subtle)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">How It Works</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Getting started takes minutes. Earning starts immediately.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-[var(--border-default)] -translate-x-4 z-0" />
                )}
                <div className="relative z-10">
                  <div className="text-4xl font-bold text-[var(--brand-100)] dark:text-[rgba(99,102,241,0.2)] mb-3">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{step.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunity Types */}
      <section className="bg-[var(--surface-card)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Types of Work Available</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              From quick tasks to multi-day projects — there is something for every skill level.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {OPPORTUNITY_TYPES.map((type) => (
              <div
                key={type.label}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="text-2xl mb-3">{type.icon}</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{type.label}</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{type.description}</p>
                <p className="text-sm font-semibold text-success-700 dark:text-[#4ADE80]">{type.payout}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why NexGuild */}
      <section className="bg-[var(--surface-subtle)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Why NexGuild</h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Built for contributors who value reliability, fairness, and transparency.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUE_PROPS.map((prop) => {
              const Icon = prop.icon;
              return (
                <div key={prop.title} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[var(--brand-50)] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--brand-500)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{prop.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{prop.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[var(--brand-50)] py-16 px-6">
        <div className="mx-auto max-w-container text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Ready to start earning?</h2>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            Join NexGuild today. Free to sign up, no commitment required.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">
              Create Your Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
