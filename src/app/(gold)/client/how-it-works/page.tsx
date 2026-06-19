import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "How It Works — NexGuild for Organizations",
  description:
    "Four simple steps from project idea to clean deliverables. NexGuild scopes, executes, and delivers your data project — end to end.",
  openGraph: {
    title: "How It Works — NexGuild",
    description: "Four steps from project idea to clean deliverables. We manage everything.",
    url: "https://nexguild.in/client/how-it-works",
  },
};

const STEPS = [
  {
    n: "01",
    icon: "💬",
    title: "Contact Us",
    body: "Reach out via our contact form, WhatsApp, or email. Tell us about the type of work, approximate volume, timeline, and any quality requirements you have.",
  },
  {
    n: "02",
    icon: "🗂️",
    title: "We Scope It",
    body: "NexGuild scopes the task structure, quality criteria, contributor requirements, and project timeline. We handle all operational planning and prepare a clear proposal.",
  },
  {
    n: "03",
    icon: "⚙️",
    title: "We Execute",
    body: "Our managed contributor network does the work. We monitor quality, reject substandard submissions, and maintain consistency throughout the project.",
  },
  {
    n: "04",
    icon: "📦",
    title: "You Receive",
    body: "We review every submission and deliver clean, structured results in your preferred format — datasets, transcripts, reports, or content files — on time.",
  },
];

const SERVICES_SUMMARY = [
  "🎙️ Audio Recording",
  "📝 Transcription",
  "🏷️ Data Annotation",
  "📱 App Testing",
  "🎮 Game Testing",
  "📸 Image Collection",
  "🔍 Web Research",
  "🛡️ Content Moderation",
  "▶️ Social Media Tasks",
];

export default function ClientHowItWorksPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>
      
      {/* ── Hero Segment with Floating Orbs & Grid ────────────────────── */}
      <section 
        className="relative overflow-hidden py-20 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)" }}
      >
        {/* Background Enhancements */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          
          {/* Animated Gold Orb */}
          <div
            style={{
              position: "absolute",
              width: "min(60vw, 500px)",
              height: "min(60vw, 500px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.22)",
              filter: "blur(120px)",
              top: "-15%",
              left: "-5%",
              animation: "hiwGlowDrift 24s ease-in-out infinite alternate",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-container px-6 pt-12 text-center">
          <FadeIn>
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(217,119,6,0.2)", color: "#92400E" }}
            >
              For Organizations
            </div>
            <h1 
              className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-balance"
              style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }}
            >
              Simple Process.<br />
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Powerful Results.</span>
            </h1>
            <p className="text-lg text-[#44403C] max-w-xl mx-auto leading-relaxed">
              Four steps from project idea to clean, structured deliverables in your inbox.
              We manage everything end to end.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Steps Section ────────────────────────────────────────────── */}
      <section style={{ background: "#FAF6EF", padding: "4rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <div className="relative">
            {/* Desktop connecting line */}
            
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
  <FadeIn key={step.n} delay={i * 90} className="h-full">
    <div className="flex flex-col items-center text-center p-6 rounded-2xl h-full border border-stone-200/60 bg-white/60 transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:border-amber-200 hover:shadow-md group">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border transition-transform duration-300 group-hover:scale-110"
        style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}
      >
        <span className="text-2xl">{step.icon}</span>
      </div>
      <span className="text-xs font-bold text-[#92400E] uppercase tracking-wider mb-2">
        Step {step.n}
      </span>
      <h3 className="font-bold text-[#1C1917] text-lg mb-2">{step.title}</h3>
      <p className="text-xs text-[#44403C] leading-relaxed">{step.body}</p>
    </div>
  </FadeIn>
))}
              
            </div>
          </div>
        </div>
      </section>

      {/* ── What We Work On (Pill Badges) ────────────────────────────── */}
      <section style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", padding: "4rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.06)", borderBottom: "1px solid rgba(217,119,6,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-3xl font-bold mb-3">What We Work On</h2>
              <p className="text-[#44403C] max-w-lg mx-auto text-sm">
                From small samples to large-scale datasets — we support a wide range of project types.
              </p>
            </div>
          </FadeIn>
          
          <FadeIn delay={100}>
            <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
              {SERVICES_SUMMARY.map((s) => (
                <span
                  key={s}
                  className="px-4 py-2 rounded-full border border-stone-200 bg-white/70 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:border-amber-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="text-center mt-8">
              <Link
                href="/services"
                className="text-sm font-semibold text-[#92400E] hover:text-[#F59E0B] hover:underline transition-colors"
              >
                View all services →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA Segment ────────────────────────────────────────────────── */}
      <section style={{ background: "#FAF6EF", padding: "4rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div
              className="rounded-3xl p-6 sm:p-12 text-center relative overflow-hidden border border-stone-200/60 bg-white/70 backdrop-blur-md shadow-sm max-w-3xl mx-auto"
            >
              <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 50%, rgba(245,158,11,0.05) 0%, transparent 75%)" }} />
              <div className="relative z-10">
                <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-3xl sm:text-4xl font-bold mb-3">
                  Ready to Start Your Project?
                </h2>
                <p className="text-[#44403C] text-sm mb-8 max-w-lg mx-auto">
                  Contact us today. We respond within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
                      maxWidth: "220px",
                      borderRadius: "999px",
                      background: "#25D366",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(37,211,102,0.15)"
                    }}
                    className="text-base hover:opacity-95 transition-all hover:translate-y-[-2px]"
                  >
                    WhatsApp Us
                  </a>
                  <Link
                    href="/contact"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "3rem",
                      width: "100%",
                      maxWidth: "220px",
                      borderRadius: "999px",
                      border: "1.5px solid rgba(217,119,6,0.3)",
                      background: "rgba(255,255,255,0.9)",
                      color: "#92400E",
                      fontWeight: 600,
                      textDecoration: "none"
                    }}
                    className="text-base hover:bg-white hover:border-amber-400 transition-all hover:translate-y-[-2px] shadow-sm"
                  >
                    Contact Form
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <style>{`
        @keyframes hiwGlowDrift {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(6%, -8%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}