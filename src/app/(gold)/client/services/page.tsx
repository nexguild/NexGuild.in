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
    num: "01",
    accent: "#0D9488",
    accentBg: "rgba(13,148,136,0.09)",
    title: "AI & Data Services",
    desc: "High-quality human data for training, testing, and improving AI systems.",
    services: [
      { icon: "🎙️", label: "Audio Recording",           desc: "Voice samples, conversations, commands, and read-aloud prompts in any language or accent." },
      { icon: "📝", label: "Transcription",              desc: "Accurate text from audio or video — interviews, lectures, calls, and more." },
      { icon: "🏷️", label: "Data Annotation",            desc: "Image bounding boxes, semantic segmentation, text NER, audio labeling for ML training." },
      { icon: "🌿", label: "Data Collection",             desc: "Structured datasets gathered by our contributor network with built-in quality review." },
      { icon: "📸", label: "Image Collection",            desc: "Real-world photos captured to specification — environments, objects, demographics." },
      { icon: "🖐️", label: "Palm / Face / Gesture Data", desc: "Biometric data collection for computer vision and gesture-recognition AI systems." },
    ],
  },
  {
    num: "02",
    accent: "#F59E0B",
    accentBg: "rgba(245,158,11,0.09)",
    title: "Digital Tasks",
    desc: "Scale digital workflows with a distributed human workforce.",
    services: [
      { icon: "▶️", label: "Social Media Engagement", desc: "Likes, follows, shares, and community engagement on specified platforms." },
      { icon: "📲", label: "App Installation",         desc: "Organic installs and first-time-user flows for app store ranking and testing." },
      { icon: "⭐", label: "App Reviews",              desc: "Genuine reviews from real device users based on actual app experience." },
      { icon: "🔍", label: "Web Research",             desc: "Structured web searches, data gathering, and competitive research at scale." },
      { icon: "📣", label: "Community Participation",  desc: "Forum posts, comment engagement, and community seeding based on your brief." },
    ],
  },
  {
    num: "03",
    accent: "#8B5CF6",
    accentBg: "rgba(139,92,246,0.09)",
    title: "Testing & Quality",
    desc: "Real human testers for apps, games, websites, and content.",
    services: [
      { icon: "📱", label: "App Testing",        desc: "Manual functional, UX, and exploratory testing on real Android and iOS devices." },
      { icon: "🎮", label: "Game Testing",       desc: "Gameplay testing, bug reporting, balance feedback, and progression review." },
      { icon: "🌐", label: "Website Testing",    desc: "Cross-browser, cross-device usability testing with structured feedback reports." },
      { icon: "🛡️", label: "Content Moderation", desc: "Human review of user-generated content for policy violations, spam, or quality issues." },
    ],
  },
];

const PROCESS_STEPS = [
  { num: "01", label: "Contact Us",             desc: "Reach out via WhatsApp or our contact form. Tell us your task type and volume." },
  { num: "02", label: "We Scope Your Project",  desc: "NexGuild defines requirements, quality criteria, and a firm timeline." },
  { num: "03", label: "Fixed Quote",            desc: "You receive a single price. Pay NexGuild directly — no per-contributor management." },
  { num: "04", label: "We Deliver",             desc: "Contributors complete the work. We review quality and deliver structured results." },
];

const STATS = [
  { value: "15+", label: "Service Types"    },
  { value: "100%", label: "Quality Reviewed" },
  { value: "24hr", label: "Response Time"   },
  { value: "Global", label: "Reach"         },
];

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

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
        @keyframes servicesGlowDrift {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-8%, 5%) scale(1.1); }
        }
      `}</style>

      {/* ══ HERO ══ */}
      <section
        className="relative overflow-hidden py-14 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)" }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", width: "min(60vw, 550px)", height: "min(60vw, 550px)",
            borderRadius: "50%", background: "rgba(245,158,11,0.22)", filter: "blur(120px)",
            top: "-15%", right: "-10%", animation: "servicesGlowDrift 20s ease-in-out infinite alternate",
          }} />
        </div>

        <div className="mx-auto max-w-container relative z-10">
          <div className="sv-a1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(217,119,6,0.2)", color: "#92400E" }}>
              For Organizations
            </div>
          </div>
          <div className="sv-a2">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 max-w-2xl text-balance"
              style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917", lineHeight: 1.1 }}>
              Human-Powered Work at Scale —{" "}
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Fully Managed.</span>
            </h1>
          </div>
          <div className="sv-a3">
            <p className="text-base text-[#44403C] max-w-xl leading-relaxed mb-8">
              Every project includes briefing, execution, quality review, and structured delivery.
              You define the work — we handle the rest.
            </p>
          </div>
          <div className="sv-a4">
            <Link href="/client/contact"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: "0.5rem", height: "3rem", padding: "0 2rem", borderRadius: "999px",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#1C1917", fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 14px rgba(217,119,6,0.25)",
              }}
              className="text-sm hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(217,119,6,0.35)] transition-all active:scale-[0.98]">
              Get a Quote <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ DARK STATS BAND ══ */}
      <section style={{ background: "#1C1917", borderTop: "1px solid rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
        <div className="mx-auto max-w-container py-8 px-6">
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
              {STATS.map((s, i) => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: "#F59E0B", fontFamily: "Instrument Serif, serif" }}>{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                  {i < STATS.length - 1 && <div className="hidden sm:block" />}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ SERVICES — 3 GROUPS ══ */}
      <section style={{ background: "#FAF6EF", padding: "3rem 1.5rem" }}>
        <div className="mx-auto max-w-container space-y-16">
          {SERVICE_GROUPS.map((group, gi) => (
            <FadeIn key={group.title} delay={gi * 80}>
              <div>
                {/* Group header with large watermark number */}
                <div className="flex items-center gap-4 mb-7">
                  <span aria-hidden style={{
                    fontFamily: "Instrument Serif, serif", fontSize: "clamp(52px,6vw,80px)",
                    fontWeight: 900, color: group.accent, opacity: 0.18, lineHeight: 1, userSelect: "none", flexShrink: 0,
                  }}>{group.num}</span>
                  <div>
                    <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-2xl sm:text-3xl font-bold mb-0.5">{group.title}</h2>
                    <p className="text-sm text-[#57534E]">{group.desc}</p>
                  </div>
                </div>
                {/* Service cards with left-border accent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.services.map((svc) => (
                    <div key={svc.label}
                      className="flex gap-4 p-4 rounded-xl h-full transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-md"
                      style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.1)", borderLeft: `3px solid ${group.accent}` }}>
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ background: group.accentBg }}>
                        {svc.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1" style={{ color: "#1C1917" }}>{svc.label}</h3>
                        <p className="text-xs leading-relaxed" style={{ color: "#78716C" }}>{svc.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══ PROCESS — WATERMARK NUMBERS ══ */}
      <section style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)", padding: "3rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.07)", borderBottom: "1px solid rgba(217,119,6,0.07)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D97706" }}>Simple Process</p>
              <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-2xl sm:text-3xl font-bold">How Engagement Works</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 70} className="h-full">
                <div className="relative rounded-xl p-5 h-full transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(217,119,6,0.12)", backdropFilter: "blur(8px)", overflow: "hidden" }}>
                  <div aria-hidden style={{
                    position: "absolute", right: -6, bottom: -10, fontSize: 72, fontWeight: 900,
                    color: "rgba(217,119,6,0.055)", lineHeight: 1, userSelect: "none", fontFamily: "Instrument Serif, serif",
                  }}>{step.num}</div>
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white mb-3"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 3px 10px rgba(217,119,6,0.3)" }}>
                      {i + 1}
                    </div>
                    <h3 className="font-bold text-sm mb-1.5" style={{ color: "#1C1917" }}>{step.label}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#78716C" }}>{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA — CARD SHAPE ══ */}
      <section style={{ background: "#FAF6EF", padding: "3rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center"
              style={{ background: "#1C1917" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0,
                background: "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(245,158,11,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 80% 50%, rgba(217,119,6,0.07) 0%, transparent 60%)",
              }} />
              <div aria-hidden style={{ position: "absolute", inset: 0,
                backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.06) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>We Respond Within 24 Hours</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight"
                  style={{ fontFamily: "Instrument Serif, serif" }}>
                  Ready to Start<br />Your Project?
                </h2>
                <p className="text-sm mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Contact us via WhatsApp or our form — we scope and quote within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="https://wa.me/919382008513" target="_blank" rel="noopener noreferrer"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(37,211,102,0.3)]"
                    style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                    WhatsApp
                  </a>
                  <Link href="/client/contact"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#1C1917" }}>
                    Contact Form <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="mailto:admin@nexguild.in"
                    className="h-12 px-8 inline-flex items-center rounded-full font-semibold text-sm transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
