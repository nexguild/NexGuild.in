import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About NexGuild — Managed Data Services for Organisations",
  description:
    "NexGuild partners with organisations to deliver high-quality human data at scale. Audio, transcription, annotation, and more — fully managed, zero overhead for your team.",
  alternates: { canonical: "https://www.nexguild.in/client/about" },
  openGraph: {
    title: "About NexGuild",
    description: "Managed data services for organisations. We handle everything — you get results.",
    url: "https://www.nexguild.in/client/about",
  },
};

const PILLARS = [
  {
    accent: "#0D9488",
    accentBg: "rgba(13,148,136,0.09)",
    icon: "🎯",
    title: "Fully Managed Delivery",
    desc: "You brief us once. We handle recruitment, task distribution, quality review, and delivery. Your team never manages contributors directly.",
  },
  {
    accent: "#F59E0B",
    accentBg: "rgba(245,158,11,0.09)",
    icon: "✅",
    title: "Built-in Quality Control",
    desc: "Every submission goes through structured review before delivery. We reject low-quality work so your datasets stay clean.",
  },
  {
    accent: "#8B5CF6",
    accentBg: "rgba(139,92,246,0.09)",
    icon: "💰",
    title: "Transparent Pricing",
    desc: "No hidden fees, no surprise invoices. You know the cost before we start. We scope the project and stick to it.",
  },
  {
    accent: "#F43F5E",
    accentBg: "rgba(244,63,94,0.09)",
    icon: "🤝",
    title: "No Inflated Claims",
    desc: "No fake testimonials, no invented statistics. Our reputation is built on real client results, delivered without shortcuts.",
  },
];

const STATS = [
  { value: "15+", label: "Service Types"    },
  { value: "100%", label: "Quality Checked" },
  { value: "24hr", label: "Response Time"   },
  { value: "Global", label: "Reach"         },
];

const WHAT_WE_DO = [
  { icon: "🌐", label: "Distributed Network",  desc: "Contributors across the globe, selected and managed by NexGuild." },
  { icon: "🔒", label: "Quality Guaranteed",    desc: "Every output reviewed before it reaches you. Nothing ships unvetted." },
  { icon: "📦", label: "Clean Deliverables",    desc: "Structured output in your preferred format — ready to use." },
  { icon: "⚡", label: "Fast Turnaround",       desc: "We scope and quote within 24 hours of your enquiry." },
];

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export default function AboutPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>
      <style>{`
        @keyframes aboutHeroEntry {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ah-a1 { animation: aboutHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .ah-a2 { animation: aboutHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .ah-a3 { animation: aboutHeroEntry 0.65s cubic-bezier(0.16,1,0.3,1) 0.36s both; }
        @keyframes aboutGlowDrift {
          0%   { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(-8%, 6%) scale(1.12); }
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-14 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)" }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", width: "min(60vw, 500px)", height: "min(60vw, 500px)",
            borderRadius: "50%", background: "rgba(245,158,11,0.22)", filter: "blur(120px)",
            top: "-15%", right: "-5%", animation: "aboutGlowDrift 22s ease-in-out infinite alternate",
          }} />
        </div>
        <div className="mx-auto max-w-container relative z-10">
          <div className="ah-a1">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#D97706" }}>About NexGuild</p>
          </div>
          <div className="ah-a2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight max-w-2xl text-balance mb-4"
              style={{ fontFamily: "Instrument Serif, serif", lineHeight: "1.1" }}>
              We Do the Heavy Lifting.{" "}
              <span style={{ color: "#92400E", fontStyle: "italic" }}>You Get the Data.</span>
            </h1>
          </div>
          <div className="ah-a3">
            <p className="text-base text-[#44403C] max-w-xl leading-relaxed">
              NexGuild is a managed contributor platform. Organisations brief us with data requirements,
              and we handle everything else — end to end.
            </p>
          </div>
        </div>
      </section>

      {/* ── Dark Stats Band ──────────────────────────────────────────── */}
      <section style={{ background: "#1C1917", borderTop: "1px solid rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.12)" }}>
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

      {/* ── What We Do ────────────────────────────────────────────────── */}
      <section style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)", padding: "3rem 1.5rem", borderBottom: "1px solid rgba(217,119,6,0.07)" }}>
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <FadeIn>
              <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-2xl sm:text-3xl font-bold text-[#1C1917] mb-5">What We Do</h2>
              <div className="space-y-4 text-sm sm:text-base text-[#44403C] leading-relaxed">
                <p>
                  We run a structured contributor network that completes audio recording, transcription,
                  data annotation, image collection, and other human-powered tasks on behalf of organisations.
                </p>
                <p>
                  Unlike freelance platforms, you don't post jobs or manage people. You describe what you need,
                  we scope the project, assemble the right contributors, run quality control, and deliver clean output.
                </p>
                <p>
                  We work with AI companies, research teams, and digital agencies worldwide that need reliable
                  human data without the overhead of managing a distributed workforce themselves.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WHAT_WE_DO.map((item) => (
                  <div key={item.label}
                    className="flex gap-3 p-4 rounded-xl transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-md"
                    style={{ background: "rgba(255,255,255,0.65)", border: "1.5px solid rgba(217,119,6,0.1)", borderLeft: "3px solid rgba(217,119,6,0.4)" }}>
                    <div className="flex-shrink-0 text-xl">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1C1917] mb-0.5">{item.label}</h3>
                      <p className="text-xs text-[#78716C] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── How We Work (Pillars with color accents) ────────────────── */}
      <section style={{ background: "#FAF6EF", padding: "3rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#D97706" }}>Our Principles</p>
              <h2 style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }} className="text-2xl sm:text-3xl font-bold">How We Work</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PILLARS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 75} className="h-full">
                <div
                  className="flex gap-4 p-5 rounded-xl h-full transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(217,119,6,0.1)", borderLeft: `3px solid ${item.accent}` }}>
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: item.accentBg }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1C1917] text-sm mb-1.5">{item.title}</h3>
                    <p className="text-xs text-[#78716C] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — CARD SHAPE ─────────────────────────────────────────── */}
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
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4"
                  style={{ fontFamily: "Instrument Serif, serif" }}>
                  Have a Project in Mind?
                </h2>
                <p className="text-sm mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Tell us what you need. We review your requirements and get back within 24 hours with a scope and timeline.
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
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
