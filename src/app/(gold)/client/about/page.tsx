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
    title: "Fully Managed Delivery",
    desc: "You brief us once. We handle recruitment, task distribution, quality review, and delivery. Your team never manages contributors directly.",
  },
  {
    title: "Built-in Quality Control",
    desc: "Every submission goes through structured review before delivery. We reject low-quality work so your datasets stay clean.",
  },
  {
    title: "Transparent Pricing",
    desc: "No hidden fees, no surprise invoices. You know the cost before we start. We scope the project and stick to it.",
  },
  {
    title: "No Inflated Claims",
    desc: "No fake testimonials, no invented statistics. Our reputation is built on real client results, delivered without shortcuts.",
  },
];

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
      `}</style>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-14 px-6">
        <div className="mx-auto max-w-container relative z-10">
          <div className="ah-a1">
            <p className="text-[#D97706] text-xs font-bold uppercase tracking-widest mb-3">About Us</p>
          </div>
          <div className="ah-a2">
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight max-w-2xl text-balance"
              style={{ fontFamily: "Instrument Serif, serif", lineHeight: "1.15", letterSpacing: "-0.02em" }}
            >
              We Do the Heavy Lifting.<br />
              You Get the Data.
            </h1>
          </div>
          <div className="ah-a3">
            <p className="text-base sm:text-lg text-[#44403C] max-w-2xl leading-relaxed">
              NexGuild is a managed contributor platform. Organisations brief us with data requirements, and we handle everything else — end to end.
            </p>
          </div>
        </div>
      </section>

      {/* ── What we do ─────────────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(217,119,6,0.06)", borderBottom: "1px solid rgba(217,119,6,0.06)" }}>
        <div className="mx-auto max-w-container">
          <div className="max-w-3xl">
            <FadeIn>
              <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl font-bold text-[#1C1917] mb-6">What We Do</h2>
              <div className="space-y-5 text-sm sm:text-base text-[#44403C] leading-relaxed">
                <p>
                  We run a structured contributor network that completes audio recording, transcription, data annotation, image collection, and other human-powered tasks on behalf of organisations.
                </p>
                <p>
                  Unlike freelance platforms, you don't post jobs or manage people. You describe what you need, we scope the project, assemble the right contributors, run quality control, and deliver clean output.
                </p>
                <p>
                  We work with AI companies, research teams, and digital agencies worldwide that need reliable human data without the overhead of managing a distributed workforce themselves.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Pillars ──────────────────────────────────────────────────── */}
      <section className="py-14 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl font-bold text-[#1C1917] mb-12">How We Work</h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PILLARS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 80} className="h-full">
                <div
                  className="rounded-2xl p-6 h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md cursor-pointer"
                  style={{
                    background: "rgba(255, 255, 255, 0.55)",
                    border: "1.5px solid rgba(217, 119, 6, 0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="w-8 h-[2px] bg-[#F59E0B] mb-4" />
                  <h3 className="font-bold text-[#1C1917] text-base mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-[#44403C] leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-12 px-6" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(217,119,6,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-2xl">
              <h2 style={{ fontFamily: "Instrument Serif, serif" }} className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">Have a Project in Mind?</h2>
              <p className="text-sm sm:text-base text-[#44403C] leading-relaxed mb-8">
                Tell us what you need. We will review your requirements and get back within 2 business days with a scope and timeline.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Contact Us Button */}
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
                {/* View Services Button */}
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
    </div>
  );
}
