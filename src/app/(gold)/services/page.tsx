import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Services — NexGuild",
  description:
    "Explore NexGuild's full range of managed services: audio recording, transcription, data annotation, app testing, content moderation, and more — delivered at scale.",
  openGraph: {
    title: "Services — NexGuild",
    description: "Human-powered data services, fully managed. Audio, transcription, annotation, testing and more.",
    url: "https://nexguild.in/services",
  },
};

const SERVICE_GROUPS = [
  {
    title: "AI & Data Services",
    desc: "High-quality human data for training, testing, and improving AI systems.",
    services: [
      { icon: "🎙️", label: "Audio Recording",           desc: "Voice samples, conversations, commands, and read-aloud prompts in any language or accent." },
      { icon: "📝", label: "Transcription",              desc: "Accurate text from audio or video — interviews, lectures, calls, and more." },
      { icon: "🏷️", label: "Data Annotation",           desc: "Image bounding boxes, semantic segmentation, text NER, audio labeling for ML training." },
      { icon: "🌿", label: "Data Collection",            desc: "Structured datasets gathered by our contributor network with built-in quality review." },
      { icon: "📸", label: "Image Collection",           desc: "Real-world photos captured to specification — environments, objects, demographics." },
      { icon: "🖐️", label: "Palm / Face / Gesture Data",desc: "Biometric data collection for computer vision and gesture-recognition AI systems." },
    ],
  },
  {
    title: "Digital Tasks",
    desc: "Scale digital workflows with a distributed human workforce.",
    services: [
      { icon: "▶️", label: "Social Media Engagement",  desc: "Likes, follows, shares, and community engagement on specified platforms." },
      { icon: "📲", label: "App Installation",         desc: "Organic installs and first-time-user flows for app store ranking and testing." },
      { icon: "⭐", label: "App Reviews",              desc: "Genuine reviews from real device users based on actual app experience." },
      { icon: "🔍", label: "Web Research",             desc: "Structured web searches, data gathering, and competitive research at scale." },
      { icon: "📣", label: "Community Participation",  desc: "Forum posts, comment engagement, and community seeding based on your brief." },
    ],
  },
  {
    title: "Testing & Quality",
    desc: "Real human testers for apps, games, websites, and content.",
    services: [
      { icon: "📱", label: "App Testing",        desc: "Manual functional, UX, and exploratory testing on real Android and iOS devices." },
      { icon: "🎮", label: "Game Testing",       desc: "Gameplay testing, bug reporting, balance feedback, and progression review." },
      { icon: "🌐", label: "Website Testing",    desc: "Cross-browser, cross-device usability testing with structured feedback reports." },
      { icon: "🛡️", label: "Content Moderation",desc: "Human review of user-generated content for policy violations, spam, or quality issues." },
    ],
  },
];

const PROCESS_STEPS = [
  { num: "1", label: "Contact Us",              desc: "Reach out via WhatsApp or our contact form. Tell us your task type and volume." },
  { num: "2", label: "We Scope Your Project",   desc: "NexGuild defines requirements, quality criteria, and a firm timeline." },
  { num: "3", label: "Fixed Quote",             desc: "You receive a single price. Pay NexGuild directly — no per-contributor management." },
  { num: "4", label: "We Deliver",              desc: "Contributors complete the work. We review quality and deliver structured results." },
];

export default function ServicesPage() {
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
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed mb-8">
              NexGuild manages the entire workflow. You define the work. We recruit, distribute, review, and deliver.
            </p>
            <Button asChild size="lg">
              <Link href="/contact">
                Get a Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Services */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container space-y-14">
          {SERVICE_GROUPS.map((group, gi) => (
            <FadeIn key={group.title} delay={gi * 80}>
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-1">{group.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{group.desc}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.services.map((svc) => (
                    <div
                      key={svc.label}
                      className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-5 h-full card-hover"
                    >
                      <div className="text-2xl mb-3">{svc.icon}</div>
                      <h3 className="font-semibold text-white mb-1 text-sm">{svc.label}</h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{svc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How Engagement Works */}
      <section className="bg-[var(--surface-page)] py-16 px-6">
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
                  <h3 className="font-semibold text-white mb-2 text-sm">{step.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-white mb-3">Ready to get started?</h2>
              <p className="text-[var(--text-secondary)] mb-6 text-sm">
                Contact us to discuss your project. We respond within 24 hours.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg">
                  <a href="https://wa.me/919382008513" target="_blank" rel="noopener noreferrer">
                    Contact on WhatsApp
                  </a>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/contact">
                    Send Email <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
