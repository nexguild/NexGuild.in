import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { Lock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Earning Opportunities — NexGuild",
  description:
    "Browse available micro-task categories on NexGuild: audio recording, transcription, image labeling, surveys, and more. Earn NexCoins from home.",
  openGraph: {
    title: "Earning Opportunities on NexGuild",
    description: "Browse micro-task categories and start earning NexCoins from home.",
    url: "https://nexguild.in/opportunities",
  },
};

const CATEGORIES = [
  { icon: "🎙️", label: "Audio Recording",     desc: "Record voice samples and audio prompts for AI training." },
  { icon: "📝", label: "Transcription",        desc: "Convert audio recordings into accurate text." },
  { icon: "🏷️", label: "Data Annotation",     desc: "Label images, audio, and text for machine learning." },
  { icon: "📱", label: "App Testing",          desc: "Test mobile applications and report bugs or UX issues." },
  { icon: "🎮", label: "Game Testing",         desc: "Play and test games, report your experience." },
  { icon: "📊", label: "Surveys",              desc: "Answer research questions on products and services." },
  { icon: "🎯", label: "Offerwalls",           desc: "Complete partner tasks — surveys, installs, and more." },
  { icon: "▶️", label: "Social Media Tasks",  desc: "Engage with content or complete social activities." },
  { icon: "🔍", label: "Web Research",          desc: "Search, compile, and verify online information." },
  { icon: "🌿", label: "Data Collection",      desc: "Gather structured real-world data and observations." },
];

export default function OpportunitiesPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Soft Radial Mint Glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)",
            filter: "blur(100px)",
            top: "-150px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        
        <div className="mx-auto max-w-container relative z-10 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(13,148,136,0.18)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
              <span className="text-xs font-bold text-[#115E59] uppercase tracking-wider">
                New tasks added regularly
              </span>
            </div>
            
            <h1 
              className="text-4xl sm:text-6xl font-black text-[#0F3D36] mb-4 text-balance"
              style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.01em" }}
            >
              Real Tasks. <span className="italic" style={{ color: "#0D9488" }}>Real Earnings.</span>
            </h1>
            
            <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed mb-8 text-balance">
              Sign up to access live opportunities and start earning right away.
            </p>
            
            <Link
              href="/signup"
              className="h-12 px-8 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(13,148,136,0.15)]"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(13,148,136,0.25)",
                color: "#0F3D36",
              }}
            >
              Sign Up Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Category Cards Grid ──────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(13,148,136,0.06)", borderBottom: "1px solid rgba(13,148,136,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-[#0D9488] text-xs font-bold uppercase tracking-widest mb-3">Categories</p>
              <h2 className="text-3xl sm:text-5xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
                10 Ways to Earn
              </h2>
              <p className="text-sm sm:text-base text-stone-600 max-w-xl mx-auto">
                These are the task categories available on NexGuild. Sign up to see live tasks with current pay rates.
              </p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {CATEGORIES.map((cat, i) => (
              <FadeIn key={cat.label} delay={i * 40} className="h-full">
                <div 
                  className="group rounded-2xl p-5 h-full text-center cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md border"
                  style={{
                    background: "rgba(255,255,255,0.45)",
                    border: "1.5px solid rgba(13,148,136,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="text-4xl mb-3 transition-transform duration-300 group-hover:scale-110">{cat.icon}</div>
                  <h3 className="font-bold text-[#0F3D36] mb-2 text-sm group-hover:text-[#0D9488] transition-colors">{cat.label}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{cat.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ad Banner ────────────────────────────────────────────── */}
      <section className="py-8 px-6">
        <div className="mx-auto max-w-container flex justify-center">
          <div 
            className="w-full max-w-[728px] h-[90px] rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.4)",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(13,148,136,0.1)",
            }}
          >
            <span className="text-xs uppercase tracking-widest text-stone-400">Advertisement</span>
          </div>
        </div>
      </section>

      {/* ── Login Gate (CTA Block) ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div 
              className="rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto transition-all duration-300 hover:shadow-lg"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(235,251,250,0.8) 100%)",
                border: "1.5px solid rgba(13,148,136,0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div 
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: "rgba(13,148,136,0.08)",
                  border: "1.5px solid rgba(13,148,136,0.18)",
                }}
              >
                <Lock className="h-5 w-5 text-[#0D9488]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3 tracking-tight">
                Ready to see live opportunities?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-8 leading-relaxed max-w-md mx-auto">
                Create a free account to browse all currently available tasks, see pay rates, and start earning right away.
              </p>
              
              <Link
                href="/signup"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(13,148,136,0.15)]"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                }}
              >
                Join Free — It Takes 1 Minute <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              
              <p className="mt-5 text-xs text-stone-500">
                Already have an account?{" "}
                <Link href="/login" className="text-[#0D9488] font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}