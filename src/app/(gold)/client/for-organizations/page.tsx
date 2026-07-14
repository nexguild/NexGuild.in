import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "For Organizations — NexGuild",
  description:
    "NexGuild is a fully managed contributor platform for organisations. We handle recruiting, task distribution, quality review, and delivery — so you don't have to.",
  alternates: { canonical: "https://www.nexguild.in/client/for-organizations" },
  openGraph: {
    title: "For Organizations — NexGuild",
    description: "Fully managed human data work at scale. You define the requirements, we deliver.",
    url: "https://www.nexguild.in/client/for-organizations",
  },
};

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
  { icon: "✅", title: "Managed Workflow",       desc: "NexGuild handles contributor distribution, monitoring, and quality review. You never manage a distributed workforce." },
  { icon: "📋", title: "Quality Review",          desc: "Every submission is reviewed against your brief before delivery. Substandard work is rejected and reworked." },
  { icon: "📦", title: "Structured Deliverables", desc: "You receive clean, structured output — datasets, content files, or reports — in your preferred format." },
];

export default function ForOrganizationsPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>

      {/* Hero */}
      <section
        className="relative overflow-hidden py-14 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)" }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              width: "min(60vw, 500px)",
              height: "min(60vw, 500px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.22)",
              filter: "blur(120px)",
              top: "-15%",
              right: "-5%",
              animation: "forOrgGlowDrift 22s ease-in-out infinite alternate",
            }}
          />
        </div>
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(217,119,6,0.2)", color: "#92400E" }}
            >
              For Organizations
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold mb-4 max-w-2xl text-balance"
              style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917", lineHeight: 1.1 }}
            >
              Human-Powered Work at Scale —{" "}
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Fully Managed.</span>
            </h1>
            <p className="text-lg text-[#44403C] max-w-xl leading-relaxed">
              NexGuild manages the entire workflow. You define the work. We recruit, distribute, review, and deliver.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What we do */}
      <section style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)", padding: "2.5rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.06)", borderBottom: "1px solid rgba(217,119,6,0.06)" }}>
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeIn>
              <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl font-bold text-[#1C1917] mb-4">What NexGuild Does for Organizations</h2>
              <div className="space-y-4 text-sm sm:text-base text-[#44403C] leading-relaxed">
                <p>
                  Organizations engage NexGuild as a fully managed partner. There are no organization accounts, no hiring,
                  and no workforce coordination. You contact us, we scope and price the project, and our contributor
                  network delivers the work.
                </p>
                <p>
                  NexGuild acts as the complete intermediary — handling contributor selection, task distribution, quality
                  review, and final delivery. You get structured results without operational overhead.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div
                className="rounded-2xl p-8"
                style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.12)", backdropFilter: "blur(12px)" }}
              >
                <div className="space-y-4">
                  {["You define the work", "We scope and price", "Contributors deliver", "We review quality", "You receive structured results"].map((item, i) => (
                    <div key={item} className="flex items-center gap-3">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}
                      >
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="text-[#1C1917] font-medium text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Work types */}
      <section style={{ background: "#FAF6EF", padding: "2.5rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl font-bold text-[#1C1917] mb-10 text-center">Types of Work We Can Distribute</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORK_TYPES.map((type, i) => (
              <FadeIn key={type.label} delay={i * 60}>
                <div
                  className="rounded-xl p-5 h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:border-amber-200 hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.12)" }}
                >
                  <div className="text-2xl mb-3">{type.icon}</div>
                  <h3 className="font-bold text-[#1C1917] mb-1 text-sm">{type.label}</h3>
                  <p className="text-xs text-[#44403C] leading-relaxed">{type.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", padding: "2.5rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.06)", borderBottom: "1px solid rgba(217,119,6,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl font-bold text-[#1C1917] mb-12 text-center">How Engagement Works</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 80}>
                <div
                  className="text-center p-6 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(217,119,6,0.12)", backdropFilter: "blur(12px)" }}
                >
                  <div className="text-4xl font-extrabold text-[#92400E] mb-2 opacity-90">{step.num}</div>
                  <div className="w-8 h-px bg-[#F59E0B] mx-auto mb-4" />
                  <h3 className="font-bold text-[#1C1917] mb-2 text-sm">{step.label}</h3>
                  <p className="text-xs text-[#44403C] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section style={{ background: "#FAF6EF", padding: "2.5rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl font-bold text-[#1C1917] mb-10 text-center">What You Can Trust</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TRUST_ITEMS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div
                  className="rounded-2xl p-6 h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.12)" }}
                >
                  <div className="text-2xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-[#1C1917] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#44403C] leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", padding: "2.5rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-2xl">
              <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">Ready to Get Started?</h2>
              <p className="text-sm text-[#44403C] leading-relaxed mb-8">
                Contact us to discuss your project. We typically respond within one business day.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/client/contact"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    height: "3rem",
                    padding: "0 2rem",
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 4px 14px rgba(217,119,6,0.2)"
                  }}
                  className="text-sm hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(217,119,6,0.3)] transition-all active:scale-[0.98]"
                >
                  Contact Us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/client/services"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "3rem",
                    padding: "0 2rem",
                    borderRadius: "999px",
                    border: "1.5px solid rgba(217, 119, 6, 0.35)",
                    background: "transparent",
                    color: "#1C1917",
                    fontWeight: 600,
                    textDecoration: "none",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                  className="text-sm hover:translate-y-[-3px] hover:bg-white/50 transition-all active:scale-[0.98]"
                >
                  View Services
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <style>{`
        @keyframes forOrgGlowDrift {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-6%, 8%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
