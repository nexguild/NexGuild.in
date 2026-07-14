import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Services — NexGuild",
  description:
    "Explore NexGuild's full range of managed services: audio recording, transcription, data annotation, app testing, content moderation, and more — delivered at scale.",
  alternates: { canonical: "https://www.nexguild.in/client/services" },
  openGraph: {
    title: "Services — NexGuild",
    description: "Human-powered data services, fully managed. Audio, transcription, annotation, testing and more.",
    url: "https://www.nexguild.in/client/services",
  },
};

const SERVICE_GROUPS = [
  {
    title: "AI & Data Services",
    desc: "High-quality human data for training, testing, and improving AI systems.",
    services: [
      { icon: "🎙️", label: "Audio Recording",          desc: "Voice samples, conversations, commands, and read-aloud prompts in any language or accent." },
      { icon: "📝", label: "Transcription",             desc: "Accurate text from audio or video — interviews, lectures, calls, and more." },
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
  { num: "1", label: "Contact Us",               desc: "Reach out via WhatsApp or our contact form. Tell us your task type and volume." },
  { num: "2", label: "We Scope Your Project",   desc: "NexGuild defines requirements, quality criteria, and a firm timeline." },
  { num: "3", label: "Fixed Quote",              desc: "You receive a single price. Pay NexGuild directly — no per-contributor management." },
  { num: "4", label: "We Deliver",               desc: "Contributors complete the work. We review quality and deliver structured results." },
];

export default function ServicesPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>

      <style>{`
        @keyframes svcHeroEntry {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sv-a1 { animation: svcHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .sv-a2 { animation: svcHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .sv-a3 { animation: svcHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.36s both; }
        .sv-a4 { animation: svcHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.50s both; }
      `}</style>

      {/* ── Hero Segment with Floating Orbs & Grid ────────────────────── */}
      <section
        className="relative overflow-hidden py-14 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)" }}
      >
        {/* Background Visual Enhancements */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>

          {/* Animated Glow Orbs */}
          <div
            style={{
              position: "absolute",
              width: "min(60vw, 550px)",
              height: "min(60vw, 550px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.22)",
              filter: "blur(120px)",
              top: "-15%",
              right: "-10%",
              animation: "servicesGlowDrift 20s ease-in-out infinite alternate",
            }}
          />
        </div>

        <div className="mx-auto max-w-container relative z-10">
          <div className="sv-a1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(217,119,6,0.2)", color: "#92400E" }}
            >
              For Organizations
            </div>
          </div>
          <div className="sv-a2">
            <h1
              className="text-3xl sm:text-4xl font-bold mb-4 max-w-2xl text-balance"
              style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917", lineHeight: 1.1 }}
            >
              Human-Powered Work at Scale —{" "}
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Fully Managed.</span>
            </h1>
          </div>
          <div className="sv-a3">
            <p className="text-lg text-[#44403C] max-w-xl leading-relaxed mb-8">
              NexGuild manages the entire workflow. You define the work. We recruit, distribute, review, and deliver.
            </p>
          </div>
          <div className="sv-a4">
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
  className="hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(217,119,6,0.3)] transition-all active:scale-[0.98]"
>
  Get a Quote <ArrowRight className="h-4 w-4" />
</Link>
          </div>
        </div>
      </section>

      {/* ── Services Cards Segment ─────────────────────────────────────── */}
      <section style={{ background: "#FAF6EF", padding: "2.5rem 1.5rem" }}>
        <div className="mx-auto max-w-container space-y-14">
          {SERVICE_GROUPS.map((group, gi) => (
            <FadeIn key={group.title} delay={gi * 80}>
              <div>
                <div className="mb-6">
                  <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-3xl font-bold mb-1">{group.title}</h2>
                  <p className="text-sm text-[#44403C]">{group.desc}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.services.map((svc) => (
                    <div
                      key={svc.label}
                      className="rounded-xl border border-stone-200/60 bg-white/60 p-5 h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:border-amber-200 hover:shadow-md"
                    >
                      <div className="text-2xl mb-3">{svc.icon}</div>
                      <h3 className="font-bold text-[#1C1917] mb-1 text-sm">{svc.label}</h3>
                      <p className="text-xs text-[#44403C] leading-relaxed">{svc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── How Engagement Works Segment ─────────────────────────────── */}
<section style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", padding: "2.5rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.06)", borderBottom: "1px solid rgba(217,119,6,0.06)" }}>
  <div className="mx-auto max-w-container">
    <FadeIn>
      <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-3xl font-bold mb-12 text-center">How Engagement Works</h2>
    </FadeIn>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {PROCESS_STEPS.map((step, i) => (
        <FadeIn key={step.num} delay={i * 80} className="h-full">
          <div
            className="text-center p-6 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md cursor-pointer"
            style={{
              background: "rgba(255, 255, 255, 0.55)",
              border: "1.5px solid rgba(217, 119, 6, 0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="text-4xl font-extrabold text-[#92400E] mb-2 opacity-90">
              {step.num}
            </div>
            <div className="w-8 h-px bg-[#F59E0B] mx-auto mb-4" />
            <h3 className="font-bold text-[#1C1917] mb-2 text-sm">{step.label}</h3>
            <p className="text-xs text-[#44403C] leading-relaxed">{step.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  </div>
</section>

    {/* ── CTA Segment ─────────────────────────────────────────────── */}
<section style={{ background: "#FAF6EF", padding: "2.5rem 1.5rem" }}>
  <div className="mx-auto max-w-container">
    <FadeIn>
      <div
        className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-sm"
      >
        <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-3xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-[#44403C] mb-6 text-sm">
          Contact us to discuss your project. We respond within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* WhatsApp Button */}
          <a
            href="https://wa.me/919382008513"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              height: "3rem",
              width: "100%",
              maxWidth: "240px",
              borderRadius: "999px",
              border: "1.5px solid rgba(37, 211, 102, 0.25)",
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              color: "#ffffff",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 4px 15px rgba(37, 211, 102, 0.25)"
            }}
            className="text-sm hover:translate-y-[-2px] hover:opacity-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Contact on WhatsApp
          </a>

          {/* Send Email */}
          <Link
            href="/client/contact"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.25rem",
              height: "3rem",
              width: "100%",
              maxWidth: "240px",
              borderRadius: "999px",
              border: "1.5px solid rgba(217,119,6,0.25)",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#ffffff",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 4px 15px rgba(217, 119, 6, 0.25)"
            }}
            className="text-sm hover:translate-y-[-2px] hover:opacity-95"
          >
            Send Email <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </FadeIn>
  </div>
</section>
      <style>{`
        @keyframes servicesGlowDrift {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-8%, 5%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
