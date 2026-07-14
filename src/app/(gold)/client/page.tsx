import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "NexGuild for Organizations — Human-Powered Work at Scale",
  description:
    "NexGuild manages everything — from recruiting contributors to delivering your final dataset. Audio, transcription, annotation, testing and more.",
  alternates: { canonical: "https://www.nexguild.in/client" },
};

/* ─────────────────────── Data ─────────────────────────────────── */

const FLOATING_PILLS = [
  { icon: "🎙️", label: "Audio Recording",    style: { top: "22%", left: "3%"  } },
  { icon: "📝", label: "Transcription",      style: { top: "52%", left: "2%"  } },
  { icon: "🏷️", label: "Data Annotation",    style: { top: "73%", left: "6%"  } },
  { icon: "📱", label: "App Testing",        style: { top: "20%", right: "3%" } },
  { icon: "🛡️", label: "Content Moderation", style: { top: "48%", right: "2%" } },
  { icon: "🔍", label: "Web Research",       style: { top: "71%", right: "5%" } },
];

const STATS = [
  { value: "100+",   label: "Contributors"    },
  { value: "12",     label: "Service Types"   },
  { value: "100%",   label: "Quality Checked" },
  { value: "Global", label: "Reach"           },
];

const SERVICES_FEATURED = [
  {
    icon: "🎙️",
    name: "Audio & Voice Data",
    desc: "Voice samples, sentences, commands, and read-aloud prompts in any language or accent. Ideal for TTS, ASR, and conversational AI training.",
    badge: "Most Popular",
    href: "/client/services",
  },
  {
    icon: "🏷️",
    name: "Data Annotation",
    desc: "Image bounding boxes, semantic segmentation, text NER, audio labeling — high-accuracy annotations delivered at scale for ML training pipelines.",
    badge: "AI Focused",
    href: "/client/services",
  },
];

const SERVICES_GRID = [
  { icon: "📝", name: "Transcription",         desc: "Audio to accurate text with timestamps, multilingual support." },
  { icon: "📸", name: "Image Collection",       desc: "Real-world photos captured to specification." },
  { icon: "✋", name: "Palm & Face Data",       desc: "Biometric datasets for computer vision AI." },
  { icon: "🌿", name: "Field Data Collection",  desc: "On-ground data gathering with quality review." },
  { icon: "📱", name: "App Testing",            desc: "Functional, usability, and regression testing." },
  { icon: "🎮", name: "Game Testing",           desc: "QA, bug reports, and gameplay feedback." },
  { icon: "🌐", name: "Website Testing",        desc: "UX review, feedback, and accessibility audits." },
  { icon: "🛡️", name: "Content Moderation",    desc: "Review and classify content for safety." },
  { icon: "🔍", name: "Web Research",           desc: "Data gathering, fact-checking, competitive research." },
  { icon: "▶️", name: "Social Media Tasks",     desc: "Organic engagement and awareness campaigns." },
];

const STEPS = [
  { num: "01", icon: "💬", title: "Contact Us",  desc: "Tell us about your project — scope, volume, and deadline." },
  { num: "02", icon: "🗂️", title: "We Scope It", desc: "We plan, price, and prepare the contributor pipeline." },
  { num: "03", icon: "⚙️", title: "We Execute",  desc: "A managed team of contributors does the work under QA." },
  { num: "04", icon: "📦", title: "You Receive",  desc: "Clean, formatted deliverables delivered on time." },
];

const WHY = [
  { key: "managed",     accent: "#F59E0B", title: "Fully Managed",    desc: "We recruit, brief, and monitor contributors — you just define the work." },
  { key: "quality",     accent: "#10B981", title: "Quality Reviewed",  desc: "Every submission reviewed before delivery. No raw unverified data." },
  { key: "speed",       accent: "#8B5CF6", title: "Fast Turnaround",   desc: "Quick project delivery with real-time progress updates." },
  { key: "affordable",  accent: "#F59E0B", title: "Affordable",        desc: "Competitive pricing with no hidden fees or surprises." },
  { key: "scalable",    accent: "#0D9488", title: "Scalable",          desc: "From 10 samples to 10,000+ — we scale with your needs." },
  { key: "transparent", accent: "#EC4899", title: "Transparent",       desc: "Regular progress reports and always-open communication." },
];

const WHY_ICONS: Record<string, React.ReactNode> = {
  managed: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L3 5v4.5C3 13.6 6.1 17.3 10 18.5c3.9-1.2 7-4.9 7-9V5L10 2z"/>
      <path d="M7 10l2 2 4-4"/>
    </svg>
  ),
  quality: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8.5" r="5.5"/>
      <path d="M17 17l-3.8-3.8"/>
    </svg>
  ),
  speed: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M11.3 2.5L3.5 11h6.5l-2 6.5 9-9.5H11l.3-5.5z"/>
    </svg>
  ),
  affordable: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h6.5L17 10.5l-6.5 6.5L3 9.5V3z"/>
      <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  scalable: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14.5l5-5 4 4 7-7"/>
      <path d="M14 6.5h3.5V10"/>
    </svg>
  ),
  transparent: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10s3.3-6 8-6 8 6 8 6-3.3 6-8 6-8-6-8-6z"/>
      <circle cx="10" cy="10" r="2.5"/>
    </svg>
  ),
};

const INDUSTRIES = [
  "🤖 AI & Machine Learning",
  "🎮 Game Development",
  "📊 Market Research",
  "📱 Mobile Apps",
  "🎓 Academic Research",
  "🏢 Enterprise & Fintech",
  "🏥 Healthcare AI",
  "🌐 E-commerce",
];

const FAQ_ITEMS = [
  {
    q: "How long does a typical project take?",
    a: "Depends on volume. Small projects (100–500 samples) usually deliver in 3–7 business days. Larger datasets take longer — we give a firm timeline during scoping, before you commit.",
  },
  {
    q: "What if the quality isn't what I expected?",
    a: "Every submission is reviewed against your brief before delivery. If something doesn't pass, it gets reworked at no extra cost. We don't ship unverified output.",
  },
  {
    q: "What's the minimum project size?",
    a: "There's no minimum. We work on projects of all sizes, from a few hundred samples to tens of thousands. Tell us what you need and we'll scope accordingly.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes — we're happy to sign an NDA before you share any project details or data. Confidentiality is taken seriously on every project.",
  },
  {
    q: "How does pricing work?",
    a: "We quote a single fixed price per project after understanding your requirements. You pay NexGuild directly — no per-contributor billing, no platform fees, no surprises.",
  },
  {
    q: "What formats do you deliver in?",
    a: "We match whatever format you need — CSV, JSON, JSONL, Excel, PDF, MP3, WAV, and more. Specify it at the start and we'll deliver accordingly.",
  },
];

const pageStyle = `
  @keyframes float-pill {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  .pill-float { animation: float-pill 5s ease-in-out infinite; }

  @keyframes heroEntry {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  .h-a1 { animation: heroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
  .h-a2 { animation: heroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
  .h-a3 { animation: heroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.32s both; }
  .h-a4 { animation: heroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.46s both; }
  .h-a5 { animation: heroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.60s both; }

  /* FAQ accordion */
  details > summary { list-style: none; cursor: pointer; }
  details > summary::-webkit-details-marker { display: none; }
  details > summary::marker { display: none; }
  .faq-chevron { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); }
  details[open] .faq-chevron { transform: rotate(180deg); }
  details[open] { background: rgba(255,255,255,0.95) !important; }
`;

/* ─────────────────────── Page ─────────────────────────────────── */

export default function ClientPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>
      <style>{pageStyle}</style>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Background */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(217,119,6,0.1) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          mask: "radial-gradient(ellipse 85% 80% at 50% 40%, black 30%, transparent 100%)",
          WebkitMask: "radial-gradient(ellipse 85% 80% at 50% 40%, black 30%, transparent 100%)",
        }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 70% 55% at 50% 30%, rgba(245,158,11,0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", zIndex: 0,
          background: "linear-gradient(to top, #FAF6EF, transparent)",
        }} />

        {/* Floating pills */}
        {FLOATING_PILLS.map((pill, i) => (
          <div key={pill.label} aria-hidden
            className="pill-float hidden xl:flex absolute items-center gap-2 px-3 py-1.5 rounded-full select-none pointer-events-none"
            style={{
              ...pill.style,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4.5 + i * 0.4}s`,
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(14px)",
              border: "1.5px solid rgba(217,119,6,0.18)",
              boxShadow: "0 3px 14px rgba(217,119,6,0.08)",
              zIndex: 2,
            }}>
            <span style={{ fontSize: 14 }}>{pill.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E" }}>{pill.label}</span>
          </div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center pt-24 pb-14">
          <div className="h-a1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(217,119,6,0.22)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
              <span className="text-xs font-bold text-[#92400E] uppercase tracking-wider">Trusted Data Workforce Partner</span>
            </div>
          </div>

          <div className="h-a2">
            <h1 className="mb-4 tracking-tight"
              style={{ fontFamily: "Instrument Serif, serif", fontWeight: 700, fontSize: "clamp(1.8rem, 3.5vw, 3.25rem)", lineHeight: 1.06, color: "#1C1917", letterSpacing: "-0.03em" }}>
              Human-Powered Work.<br />
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Delivered at Scale.</span>
            </h1>
          </div>

          <div className="h-a3">
            <p className="mx-auto mb-7 text-sm sm:text-base leading-relaxed text-balance"
              style={{ maxWidth: "40rem", color: "#57534E" }}>
              We manage everything — from recruiting contributors to delivering your final dataset.
              You define the work. We handle the rest.
            </p>
          </div>

          <div className="h-a4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/client/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_28px_rgba(217,119,6,0.35)]"
                style={{ height: 44, padding: "0 2rem", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", color: "#1C1917", boxShadow: "0 5px 16px rgba(217,119,6,0.28)" }}>
                Get a Quote →
              </Link>
              <a href="#services"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full font-semibold text-sm transition-all duration-200 hover:bg-white hover:shadow-sm"
                style={{ height: 44, padding: "0 1.5rem", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(217,119,6,0.22)", color: "#92400E" }}>
                See Our Services ↓
              </a>
            </div>
          </div>

          <div className="h-a5">
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
              {[
                { icon: "✅", label: "100% Quality Checked" },
                { icon: "⚡", label: "Fast Turnaround" },
                { icon: "📈", label: "Scalable" },
                { icon: "🔒", label: "NDA Available" },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(217,119,6,0.14)", color: "#57534E" }}>
                  <span>{b.icon}</span>{b.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAND (dark)
      ══════════════════════════════════ */}
      <section style={{ background: "#1C1917", borderTop: "1px solid rgba(245,158,11,0.15)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
        <div className="mx-auto max-w-container py-8 px-6">
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: "#F59E0B", fontFamily: "Instrument Serif, serif" }}>{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          SERVICES (Featured + Grid)
      ══════════════════════════════════ */}
      <section id="services" className="py-14 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="mb-8 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D97706" }}>12 Categories</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight"
                style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917", lineHeight: 1.05 }}>
                What We Deliver
              </h2>
              <p className="text-sm" style={{ color: "#57534E" }}>Human-powered data work, fully managed end to end. Every project includes briefing, execution, QA, and delivery.</p>
            </div>
          </FadeIn>

          {/* Featured 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {SERVICES_FEATURED.map((f, i) => (
              <FadeIn key={f.name} delay={i * 80}>
                <Link href={f.href} className="group block h-full">
                  <div className="relative h-full rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_16px_48px_rgba(217,119,6,0.15)]"
                    style={{ background: "linear-gradient(145deg, #1C1917 0%, #292524 60%, #3C2A14 100%)", minHeight: 140 }}>
                    <div aria-hidden style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(245,158,11,0.08)", filter: "blur(32px)" }} />
                    <div aria-hidden style={{ position: "absolute", right: 20, bottom: 16, fontSize: 64, opacity: 0.06, lineHeight: 1, userSelect: "none" }}>{f.icon}</div>
                    <div className="relative z-10">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
                        {f.badge}
                      </span>
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-1.5" style={{ fontFamily: "Instrument Serif, serif" }}>{f.name}</h3>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>{f.desc}</p>
                      <span className="inline-flex items-center gap-2 text-sm font-bold group-hover:gap-3 transition-all duration-200" style={{ color: "#F59E0B" }}>
                        Learn More <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* Regular grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {SERVICES_GRID.map((s, i) => (
              <FadeIn key={s.name} delay={40 + i * 30} className="h-full">
                <div className="group rounded-xl p-4 flex flex-col gap-2 h-full transition-all duration-200 hover:translate-y-[-2px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(217,119,6,0.12)", backdropFilter: "blur(8px)" }}>
                  <span className="text-xl leading-none transition-transform duration-200 group-hover:scale-110 inline-block">{s.icon}</span>
                  <h3 className="font-bold text-xs leading-tight group-hover:text-[#D97706] transition-colors" style={{ color: "#1C1917" }}>{s.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#78716C" }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={160}>
            <div className="text-center">
              <Link href="/client/services"
                className="inline-flex items-center gap-2 h-11 px-8 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(217,119,6,0.25)]"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#1C1917" }}>
                View All Services →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          INDUSTRIES SERVED
      ══════════════════════════════════ */}
      <section className="py-10 px-6" style={{ background: "rgba(217,119,6,0.04)", borderTop: "1px solid rgba(217,119,6,0.08)", borderBottom: "1px solid rgba(217,119,6,0.08)" }}>
        <div className="mx-auto max-w-container text-center">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#78716C" }}>Who We Work With</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {INDUSTRIES.map((ind) => (
                <div key={ind}
                  className="flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(217,119,6,0.15)", color: "#1C1917", backdropFilter: "blur(8px)" }}>
                  {ind}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════ */}
      <section className="py-14 px-6" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(217,119,6,0.07)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D97706" }}>Simple Process</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }}>
                Four Steps to Delivery
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 70}>
                <div className="relative rounded-xl p-5 h-full transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.12)", backdropFilter: "blur(8px)", overflow: "hidden" }}>
                  <div aria-hidden style={{ position: "absolute", right: -4, bottom: -8, fontSize: 60, fontWeight: 900, color: "rgba(217,119,6,0.055)", lineHeight: 1, userSelect: "none", fontFamily: "Instrument Serif, serif" }}>
                    {step.num}
                  </div>
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white mb-3"
                      style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", boxShadow: "0 3px 10px rgba(217,119,6,0.3)" }}>
                      {step.num}
                    </div>
                    <div className="text-xl mb-2">{step.icon}</div>
                    <h3 className="font-bold text-xs mb-1" style={{ color: "#1C1917" }}>{step.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#78716C" }}>{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={180}>
            <div className="mt-8 text-center">
              <Link href="/client/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors group"
                style={{ color: "#D97706" }}>
                Read the Full Process Guide
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          WHY NEXGUILD — SVG icons
      ══════════════════════════════════ */}
      <section className="py-14 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D97706" }}>Why NexGuild</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }}>
                Built for Clients
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY.map((w, i) => (
              <FadeIn key={w.key} delay={i * 60} className="h-full">
                <div className="group flex gap-4 p-5 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(217,119,6,0.1)", backdropFilter: "blur(12px)", borderLeft: `3px solid ${w.accent}` }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${w.accent}14`, border: `1.5px solid ${w.accent}28`, color: w.accent }}>
                    {WHY_ICONS[w.key]}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-1.5" style={{ color: "#1C1917", fontFamily: "Instrument Serif, serif" }}>{w.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "#78716C" }}>{w.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOUNDER
      ══════════════════════════════════ */}
      <section className="py-12 px-6" style={{ borderTop: "1px solid rgba(217,119,6,0.08)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-3xl mx-auto rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-6"
              style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.18)", backdropFilter: "blur(12px)" }}>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="rounded-full overflow-hidden" style={{ width: 80, height: 80, border: "3px solid rgba(217,119,6,0.28)" }}>
                  <Image src="/founder.jpg" alt="Somen Biswas" width={80} height={80}
                    style={{ borderRadius: "50%", objectFit: "cover", objectPosition: "top" }} priority />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#D97706" }}>Founder</p>
              </div>
              <div className="flex flex-col gap-2.5 text-center sm:text-left">
                <div>
                  <h3 className="text-xl font-black" style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }}>Somen Biswas</h3>
                  <p className="text-xs mt-0.5" style={{ color: "#78716C" }}>Founder, NexGuild</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#44403C" }}>
                  &ldquo;I started NexGuild to bridge the gap between organizations that need reliable human-powered work and a global community ready to deliver it. Every feature is built with both sides in mind — quality output for clients, fair rewards for contributors.&rdquo;
                </p>
                <p className="text-sm font-semibold italic" style={{ color: "#92400E" }}>— Somen, Founder</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          FAQ
      ══════════════════════════════════ */}
      <section className="py-14 px-6" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(217,119,6,0.07)", borderBottom: "1px solid rgba(217,119,6,0.07)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D97706" }}>Common Questions</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }}>
                Before You Reach Out
              </h2>
            </div>
          </FadeIn>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FadeIn key={item.q} delay={i * 50}>
                <details
                  className="group rounded-xl overflow-hidden transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(217,119,6,0.12)" }}>
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 select-none">
                    <span className="font-semibold text-sm" style={{ color: "#1C1917" }}>{item.q}</span>
                    <span className="faq-chevron flex-shrink-0" style={{ color: "#D97706" }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 6.75L9 11.25l4.5-4.5"/>
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 pt-1">
                    <p className="text-sm leading-relaxed" style={{ color: "#57534E" }}>{item.a}</p>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={320}>
            <p className="text-center mt-8 text-xs" style={{ color: "#78716C" }}>
              Have a different question?{" "}
              <Link href="/client/contact" className="font-semibold underline underline-offset-2 hover:text-[#D97706] transition-colors" style={{ color: "#92400E" }}>
                Ask us directly →
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA (dark card)
      ══════════════════════════════════ */}
      <section style={{ background: "#FAF6EF", padding: "3rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center"
              style={{ background: "#1C1917" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(245,158,11,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 80% 50%, rgba(217,119,6,0.08) 0%, transparent 60%)" }} />
              <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.22)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F59E0B" }}>We Respond Within 24 Hours</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight"
                  style={{ fontFamily: "Instrument Serif, serif" }}>
                  Ready to Start<br />Your Project?
                </h2>
                <p className="text-sm sm:text-base mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Contact us via WhatsApp, Telegram, or email — we scope and quote within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="https://wa.me/919382008513" target="_blank" rel="noopener noreferrer"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(37,211,102,0.3)]"
                    style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                  <Link href="/client/contact"
                    className="h-12 px-8 inline-flex items-center rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#1C1917" }}>
                    Contact Form →
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
