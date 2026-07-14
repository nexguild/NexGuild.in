import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — NexGuild for Organizations",
  description:
    "Four simple steps from project idea to clean deliverables. NexGuild scopes, executes, and delivers your data project — end to end.",
  alternates: { canonical: "https://www.nexguild.in/client/how-it-works" },
  openGraph: {
    title: "How It Works — NexGuild",
    description: "Four steps from project idea to clean deliverables. We manage everything.",
    url: "https://www.nexguild.in/client/how-it-works",
  },
};

const STEPS = [
  {
    n: "01", accent: "#3B82F6", accentBg: "rgba(59,130,246,0.09)",
    icon: "💬", title: "Contact Us",
    body: "Reach out via our contact form, WhatsApp, or email. Tell us about the type of work, approximate volume, timeline, and any quality requirements you have.",
  },
  {
    n: "02", accent: "#0D9488", accentBg: "rgba(13,148,136,0.09)",
    icon: "🗂️", title: "We Scope It",
    body: "NexGuild scopes the task structure, quality criteria, contributor requirements, and project timeline. We handle all operational planning and prepare a clear proposal.",
  },
  {
    n: "03", accent: "#F59E0B", accentBg: "rgba(245,158,11,0.09)",
    icon: "⚙️", title: "We Execute",
    body: "Our managed contributor network does the work. We monitor quality, reject substandard submissions, and maintain consistency throughout the project.",
  },
  {
    n: "04", accent: "#22C55E", accentBg: "rgba(34,197,94,0.09)",
    icon: "📦", title: "You Receive",
    body: "We review every submission and deliver clean, structured results in your preferred format — datasets, transcripts, reports, or content files — on time.",
  },
];

const SERVICES_SUMMARY = [
  "🎙️ Audio Recording", "📝 Transcription", "🏷️ Data Annotation",
  "📱 App Testing", "🎮 Game Testing", "📸 Image Collection",
  "🔍 Web Research", "🛡️ Content Moderation", "▶️ Social Media Tasks",
];

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export default function ClientHowItWorksPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>

      <style>{`
        @keyframes hiwHeroEntry {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hiw-a1 { animation: hiwHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .hiw-a2 { animation: hiwHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .hiw-a3 { animation: hiwHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.36s both; }
        @keyframes hiwGlowDrift {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(6%, -8%) scale(1.15); }
        }
      `}</style>

      {/* ══ HERO ══ */}
      <section
        className="relative overflow-hidden py-14 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)" }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", width: "min(60vw, 500px)", height: "min(60vw, 500px)",
            borderRadius: "50%", background: "rgba(245,158,11,0.22)", filter: "blur(120px)",
            top: "-15%", left: "-5%", animation: "hiwGlowDrift 24s ease-in-out infinite alternate",
          }} />
        </div>
        <div className="relative z-10 mx-auto max-w-container text-center">
          <div className="hiw-a1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(217,119,6,0.2)", color: "#92400E" }}>
              For Organizations
            </div>
          </div>
          <div className="hiw-a2">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-balance"
              style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917", lineHeight: 1.1 }}>
              Simple Process.{" "}
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Powerful Results.</span>
            </h1>
          </div>
          <div className="hiw-a3">
            <p className="text-base text-[#44403C] max-w-xl mx-auto leading-relaxed">
              Four steps from project idea to clean, structured deliverables in your inbox.
              We manage everything end to end.
            </p>
          </div>
        </div>
      </section>

      {/* ══ STEPS — WATERMARK NUMBERS ══ */}
      <section style={{ background: "#FAF6EF", padding: "3rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <FadeIn key={step.n} delay={i * 90} className="h-full">
                <div className="relative rounded-xl p-5 h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(217,119,6,0.1)", borderTop: `3px solid ${step.accent}`, overflow: "hidden", backdropFilter: "blur(8px)" }}>
                  <div aria-hidden style={{
                    position: "absolute", right: -8, bottom: -12, fontSize: 80, fontWeight: 900,
                    color: `${step.accent}0D`, lineHeight: 1, userSelect: "none", fontFamily: "Instrument Serif, serif",
                  }}>{step.n}</div>
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                      style={{ background: step.accentBg }}>
                      {step.icon}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: step.accent }}>
                      Step {step.n}
                    </div>
                    <h3 className="font-bold text-[#1C1917] mb-2">{step.title}</h3>
                    <p className="text-xs text-[#78716C] leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHAT WE WORK ON ══ */}
      <section style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", padding: "3rem 1.5rem", borderTop: "1px solid rgba(217,119,6,0.07)", borderBottom: "1px solid rgba(217,119,6,0.07)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-2xl sm:text-3xl font-bold mb-3">What We Work On</h2>
              <p className="text-[#44403C] max-w-lg mx-auto text-sm">
                From small samples to large-scale datasets — we support a wide range of project types.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
              {SERVICES_SUMMARY.map((s) => (
                <span key={s}
                  className="px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-white"
                  style={{ border: "1.5px solid rgba(217,119,6,0.15)", background: "rgba(255,255,255,0.75)", color: "#44403C" }}>
                  {s}
                </span>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={150}>
            <div className="text-center mt-8">
              <Link href="/client/services" className="text-sm font-semibold hover:underline transition-colors"
                style={{ color: "#92400E" }}>
                View all services →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ CTA — CARD SHAPE (not flat against footer) ══ */}
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
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>24-Hour Response</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4"
                  style={{ fontFamily: "Instrument Serif, serif" }}>
                  Ready to Start<br />Your Project?
                </h2>
                <p className="text-sm mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Contact us via WhatsApp or our form. We scope and quote within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="https://wa.me/919382008513" target="_blank" rel="noopener noreferrer"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(37,211,102,0.3)]"
                    style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={WA_PATH} /></svg>
                    WhatsApp Us
                  </a>
                  <Link href="/client/contact"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#1C1917" }}>
                    Contact Form <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
