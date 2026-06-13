import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight, CheckCircle, FileText, Users, BarChart3, Shield, Clock, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "NexGuild — Real Human Data. Real Results. At Scale.",
  description:
    "NexGuild delivers managed human-powered work for organizations — surveys, data annotation, content production, QA testing, and more.",
};

const SERVICES = [
  { icon: "📊", label: "Research & Surveys",       desc: "Targeted participant recruitment and structured response collection for market research and academic studies." },
  { icon: "🏷️", label: "Data Annotation",           desc: "Image, audio, and text labeling for AI/ML training datasets — bounding boxes, transcription, named entities, and more." },
  { icon: "✍️", label: "Content Production",        desc: "Articles, product descriptions, translations, and summaries written and edited by skilled contributors." },
  { icon: "🔍", label: "QA & User Testing",         desc: "Real user testing across devices, browsers, and demographics — structured bug reports and feedback logs." },
  { icon: "📁", label: "Data Collection",            desc: "Structured datasets collected at scale by a distributed contributor network with quality review built in." },
  { icon: "🔢", label: "Data Entry & Processing",   desc: "High-volume structured data work — digitization, normalization, and processing — delivered with quality guarantees." },
];

const PROCESS_STEPS = [
  { num: "01", label: "Contact Us",    desc: "Reach out via our contact form. Describe your work, volume, and deadline." },
  { num: "02", label: "We Scope It",  desc: "NexGuild defines the task structure, quality criteria, contributor requirements, and timeline." },
  { num: "03", label: "Fixed Pricing",desc: "You receive a single fixed quote. Pay NexGuild directly — no per-contributor management." },
  { num: "04", label: "We Deliver",   desc: "Our contributor network completes the work. We review quality and deliver structured results on schedule." },
];

const TRUST_PROPS = [
  { icon: CheckCircle, title: "Managed Workflow",        desc: "NexGuild handles contributor selection, distribution, and monitoring. You never coordinate a distributed workforce." },
  { icon: FileText,    title: "Quality Review",           desc: "Every submission is reviewed against your brief before delivery. Substandard work is rejected and reworked." },
  { icon: BarChart3,   title: "Structured Deliverables",  desc: "Clean output in your preferred format — datasets, content files, or compiled reports." },
  { icon: Shield,      title: "Built-in Quality Controls",desc: "Duplicate detection, time-on-task minimums, tier gating, and random audits are standard on every project." },
  { icon: Clock,       title: "Defined Timelines",        desc: "Projects are scoped with firm delivery dates. No ambiguous estimates." },
  { icon: Globe,       title: "Global Contributor Pool",  desc: "Access contributors worldwide for diverse perspectives, languages, and regional expertise." },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] pt-24 pb-28 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full accent-pill text-sm font-medium mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
              Managed human-powered work for organizations
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight text-balance mb-6 max-w-3xl">
              Real Human Data.{" "}
              <span className="gradient-text">Real Results.</span>{" "}
              At Scale.
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
              NexGuild delivers surveys answered, data labeled, content produced, and software tested — by a
              managed contributor network. You define the work. We handle everything else.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/contact">
                  Get a Quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/for-organizations">How It Works</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Services ──────────────────────────────────────────── */}
      <section className="bg-[var(--surface-card)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Services</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What We Deliver</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                From quick data tasks to large multi-contributor projects — NexGuild covers the full range of
                human-powered work.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((service, i) => (
              <FadeIn key={service.label} delay={i * 60}>
                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-6 h-full card-hover">
                  <div className="text-2xl mb-4">{service.icon}</div>
                  <h3 className="font-semibold text-white mb-2">{service.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{service.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="bg-[var(--surface-page)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                No organization accounts. No workforce to manage. Contact us and we handle the rest.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 80}>
                <div className="relative">
                  <div className="text-5xl font-bold text-[var(--brand-100)] mb-4 leading-none">{step.num}</div>
                  <div className="w-8 h-px bg-[var(--brand-500)] mb-4" />
                  <h3 className="text-base font-semibold text-white mb-2">{step.label}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why NexGuild ──────────────────────────────────────── */}
      <section className="bg-[var(--surface-card)] py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Why Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why NexGuild</h2>
              <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
                Built for organizations that need reliable human-powered results without the operational overhead.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRUST_PROPS.map((prop, i) => {
              const Icon = prop.icon;
              return (
                <FadeIn key={prop.title} delay={i * 60}>
                  <div className="flex gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-5 h-full card-hover">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[var(--brand-500)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{prop.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{prop.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-60" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div className="max-w-xl mx-auto text-center">
              <div className="h-14 w-14 rounded-2xl bg-[var(--brand-100)] flex items-center justify-center mx-auto mb-6">
                <Users className="h-7 w-7 text-[var(--brand-500)]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Tell us what you need</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
                We respond within one business day. No commitments — just a conversation about your project.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Contact Us
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/earn">Looking to earn? →</Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
