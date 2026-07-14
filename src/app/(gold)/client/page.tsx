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
  { value: "100+",  label: "Contributors"    },
  { value: "12",    label: "Service Types"   },
  { value: "100%",  label: "Quality Checked" },
  { value: "Global", label: "Reach"          },
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
  { accent: "#F59E0B", icon: "✅", title: "Fully Managed",    desc: "We recruit, brief, and monitor contributors — you just define the work." },
  { accent: "#10B981", icon: "🔍", title: "Quality Reviewed", desc: "Every submission reviewed before delivery. No raw unverified data." },
  { accent: "#8B5CF6", icon: "⚡", title: "Fast Turnaround",  desc: "Quick project delivery with real-time progress updates." },
  { accent: "#F59E0B", icon: "💰", title: "Affordable",       desc: "Competitive pricing with no hidden fees or surprises." },
  { accent: "#0D9488", icon: "📈", title: "Scalable",         desc: "From 10 samples to 10,000+ — we scale with your needs." },
  { accent: "#EC4899", icon: "📊", title: "Transparent",      desc: "Regular progress reports and always-open communication." },
];

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

        {/* Hero content — CSS animations for above-fold (reliable on SSR pages) */}
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
          WHY NEXGUILD
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
              <FadeIn key={w.title} delay={i * 60} className="h-full">
                <div className="group flex gap-5 p-5 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(217,119,6,0.1)", backdropFilter: "blur(12px)", borderLeft: `3px solid ${w.accent}` }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${w.accent}14`, border: `1.5px solid ${w.accent}30` }}>
                    {w.icon}
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
          CTA (dark)
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "#1C1917" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(245,158,11,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 80% 50%, rgba(217,119,6,0.08) 0%, transparent 60%)" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 mx-auto max-w-container px-6 py-14 text-center">
          <FadeIn>
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
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
