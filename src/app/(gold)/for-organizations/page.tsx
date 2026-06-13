import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight, CheckCircle, FileText, Users, BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "For Organizations" };

const WORK_TYPES = [
  { icon: "📊", label: "Research & Surveys",     desc: "Targeted participant recruitment and response collection at scale." },
  { icon: "🏷️", label: "Data Annotation",         desc: "Image, audio, and text labeling for AI/ML training datasets." },
  { icon: "✍️", label: "Content Production",      desc: "Articles, descriptions, translations, and summaries from skilled contributors." },
  { icon: "🔍", label: "QA & User Testing",       desc: "Real user testing across devices, browsers, and demographics." },
  { icon: "📁", label: "Data Collection",          desc: "Structured datasets collected by a distributed contributor network." },
  { icon: "🔢", label: "Data Entry & Processing", desc: "High-volume structured data work delivered with quality guarantees." },
];

const PROCESS_STEPS = [
  { num: "1", label: "Contact Us", desc: "Reach out via our contact form. Tell us what you need." },
  { num: "2", label: "Scoping",    desc: "We clarify requirements, timeline, quality standards, and volume." },
  { num: "3", label: "Pricing",    desc: "We quote a fixed total. You pay NexGuild directly. No per-contributor management." },
  { num: "4", label: "Delivery",   desc: "We distribute, review, and deliver structured results on your timeline." },
];

const TRUST_ITEMS = [
  { icon: CheckCircle, title: "Managed Workflow",       desc: "NexGuild handles contributor distribution, monitoring, and quality review. You never manage a distributed workforce." },
  { icon: FileText,    title: "Quality Review",          desc: "Every submission is reviewed against your brief before delivery. Substandard work is rejected and reworked." },
  { icon: BarChart3,   title: "Structured Deliverables", desc: "You receive clean, structured output — datasets, content files, or reports — in your preferred format." },
];

export default function ForOrganizationsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full accent-pill text-sm font-medium mb-6">
              For Organizations
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 max-w-2xl text-balance">
              Human-Powered Work at Scale —{" "}
              <span className="gradient-text">Fully Managed.</span>
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              NexGuild manages the entire workflow. You define the work. We recruit, distribute, review, and deliver.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What we do */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <h2 className="text-2xl font-bold text-white mb-4">What NexGuild Does for Organizations</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Organizations engage NexGuild as a fully managed partner. There are no organization accounts, no hiring,
                and no workforce coordination. You contact us, we scope and price the project, and our contributor
                network delivers the work.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                NexGuild acts as the complete intermediary — handling contributor selection, task distribution, quality
                review, and final delivery. You get structured results without operational overhead.
              </p>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-8">
                <div className="space-y-4">
                  {["You define the work", "We scope and price", "Contributors deliver", "We review quality", "You receive structured results"].map((item, i) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-[var(--brand-500)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[var(--text-inverse)] text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="text-white font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Work types */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-10 text-center">Types of Work We Can Distribute</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORK_TYPES.map((type, i) => (
              <FadeIn key={type.label} delay={i * 60}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 h-full card-hover">
                  <div className="text-2xl mb-3">{type.icon}</div>
                  <h3 className="font-semibold text-white mb-1">{type.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{type.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-12 text-center">How Engagement Works</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 80}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[var(--brand-100)] mb-3">{step.num}</div>
                  <div className="w-8 h-px bg-[var(--brand-500)] mx-auto mb-3" />
                  <h3 className="font-semibold text-white mb-2">{step.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 className="text-2xl font-bold text-white mb-10 text-center">What You Can Trust</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TRUST_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <FadeIn key={item.title} delay={i * 80}>
                  <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 h-full card-hover">
                    <div className="h-10 w-10 rounded-lg bg-[var(--brand-100)] flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-[var(--brand-500)]" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-xl mx-auto text-center">
              <div className="h-12 w-12 rounded-xl bg-[var(--brand-100)] flex items-center justify-center mx-auto mb-5">
                <Users className="h-6 w-6 text-[var(--brand-500)]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Contact us to discuss your project. We typically respond within one business day.
              </p>
              <Button asChild size="lg">
                <Link href="/contact">
                  Contact Us <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
