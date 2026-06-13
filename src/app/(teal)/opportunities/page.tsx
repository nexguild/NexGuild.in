import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Lock, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Opportunities" };

const SAMPLE_OPPORTUNITIES = [
  { title: "Consumer Product Survey",       type: "survey" as const,       description: "Share your opinions on household product usage habits for a major consumer research study.", payout: "$1.20", estimatedMinutes: 8,  skillLevel: "any" as const },
  { title: "Image Sentiment Classification",type: "micro_task" as const,   description: "Label images as positive, neutral, or negative for a machine learning training dataset.",   payout: "$0.08", estimatedMinutes: 2,  skillLevel: "any" as const },
  { title: "Product Description Writing",   type: "content_task" as const, description: "Write compelling product descriptions for e-commerce listings following a provided style guide.", payout: "$4.50", estimatedMinutes: 25, skillLevel: "intermediate" as const },
  { title: "Audio Transcription Batch",     type: "data_labeling" as const,description: "Transcribe short audio clips of conversational speech for a voice recognition training project.", payout: "$2.80", estimatedMinutes: 20, skillLevel: "any" as const },
  { title: "Brand Awareness Survey",        type: "survey" as const,       description: "Answer questions about your familiarity with and perceptions of various technology brands.",  payout: "$0.75", estimatedMinutes: 6,  skillLevel: "any" as const },
  { title: "Website UX Feedback",           type: "content_task" as const, description: "Review a website and provide structured written feedback on usability and design.",           payout: "$6.00", estimatedMinutes: 35, skillLevel: "intermediate" as const },
];

const FILTERS = ["All", "Surveys", "Micro-tasks", "Data Labeling", "Content Tasks", "Projects"];

export default function OpportunitiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Browse</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">Opportunities</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              See the types of work available on NexGuild. Log in to access live opportunities and start earning.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border-default)] px-6 py-3 sticky top-16 z-30">
        <div className="mx-auto max-w-container flex items-center gap-2 overflow-x-auto scrollbar-thin pb-0.5">
          {FILTERS.map((label) => (
            <button
              key={label}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                label === "All"
                  ? "bg-[var(--brand-500)] text-[var(--text-inverse)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-500)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <section className="bg-[var(--surface-page)] py-10 px-6">
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_OPPORTUNITIES.map((opp, i) => (
              <FadeIn key={opp.title} delay={i * 60}>
                <OpportunityCard {...opp} showStartButton={false} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Login Gate */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-8 text-center max-w-lg mx-auto card-hover">
              <div className="h-12 w-12 rounded-full bg-[var(--brand-100)] flex items-center justify-center mx-auto mb-4">
                <Lock className="h-5 w-5 text-[var(--brand-500)]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to see live opportunities?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Create a free account to browse all available tasks and start earning right away.
              </p>
              <Button asChild size="md">
                <Link href="/signup">
                  Join for Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
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
