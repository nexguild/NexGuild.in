"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { AdSlot } from "@/components/ui/ad-slot";

const TYPING_TEXTS = [
  "Earn by Recording.",
  "Earn by Testing.",
  "Earn by Transcribing.",
  "Earn by Contributing.",
];

const EARNING_WAYS = [
  { icon: "🎙️", name: "Audio Recording",      desc: "Record sentences, conversations, and voice prompts for AI training" },
  { icon: "📝", name: "Transcription",         desc: "Convert audio files to accurate text across multiple languages" },
  { icon: "🏷️", name: "Data Annotation",       desc: "Label images, text, and video for machine learning datasets" },
  { icon: "📱", name: "App Testing",           desc: "Test mobile and web apps, report bugs and UX issues" },
  { icon: "🎮", name: "Game Testing",          desc: "Play and review games, submit detailed feedback reports" },
  { icon: "📊", name: "Survey Tasks",          desc: "Complete targeted surveys and research questionnaires" },
  { icon: "🎯", name: "Offerwalls",            desc: "Complete app downloads, sign-ups, and sponsored actions" },
  { icon: "▶️", name: "Social Media Tasks",    desc: "Organic engagement, reviews, and awareness campaigns" },
  { icon: "🔍", name: "Web Research",          desc: "Research, fact-checking, and structured data gathering" },
  { icon: "🌿", name: "Field Data Collection", desc: "On-ground data collection tasks across Indian cities" },
  { icon: "💸", name: "Referral Earnings",     desc: "Earn for every active contributor you bring to NexGuild" },
];

const STEPS = [
  { icon: "Free", title: "Sign Up Free",            desc: "Create your account in 30 seconds. No credit card needed." },
  { icon: "Profile", title: "Complete Your Profile",    desc: "Set your skills, language, and device capabilities." },
  { icon: "Browse", title: "Browse & Apply for Tasks", desc: "Pick tasks that match your skills and schedule." },
  { icon: "Submit", title: "Submit Your Work",         desc: "Complete the task and submit through the dashboard." },
  { icon: "Redeem", title: "Redeem for Vouchers",       desc: "Exchange NexCoins for Amazon, Flipkart, and more gift vouchers." },
];

const WHY_JOIN = [
  { icon: "📱", title: "Work From Phone",         desc: "No laptop needed. Complete most tasks entirely from your smartphone." },
  { icon: "💰", title: "Multiple Income Sources", desc: "Earn from Tasks, Offerwalls, and Referrals — all in one place." },
  { icon: "🏆", title: "Skill Based Levels",      desc: "Grow from Beginner to Expert and unlock higher-paying tasks." },
  { icon: "⚡", title: "Instant Vouchers",          desc: "Gift vouchers delivered to your email within 48 hours of redemption." },
];

const TRUST_BADGES = [
  { icon: "🔒", label: "Secure Payments" },
  { icon: "📱", label: "Mobile Friendly" },
  { icon: "🇮🇳", label: "India Based" },
  { icon: "⚡", label: "Instant Vouchers" },
];

// Soft Teal Aurora Glow Animation
const auroraStyle = `
  @keyframes float-aurora {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    50% { transform: translateY(-20px) translateX(10px); }
  }
  .aurora-glow {
    animation: float-aurora 8s ease-in-out infinite alternate;
  }
`;

function TypingHeadline() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TYPING_TEXTS.length);
        setVisible(true);
      }, 400);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        display: "block",
        width: "100%",
        maxWidth: "100%",
        transition: "opacity 0.4s ease, transform 0.4s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        whiteSpace: "normal",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        textAlign: "center",
        fontFamily: "'Instrument Serif', serif",
        fontSize: "clamp(36px, 5.5vw, 68px)",
        fontWeight: 900,
        letterSpacing: "-0.01em",
        color: "#0F3D36", // Deep Emerald/Teal Tone
      }}
    >
      {TYPING_TEXTS[index]}
    </span>
  );
}

export default function EarnPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      <style>{auroraStyle}</style>
      
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center py-20">
        {/* Mint Aurora Radial overlay */}
        <div
          aria-hidden
          className="aurora-glow absolute inset-0 pointer-events-none"
          style={{
            position: "absolute",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,0.2) 0%, transparent 70%)",
            filter: "blur(120px)",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 0,
          }}
        />

        <div className="relative z-10 mx-auto max-w-container px-6 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(13,148,136,0.18)",
              }}
            >
              <span className="text-xs font-bold text-[#115E59] uppercase tracking-wider">
                For Contributors
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <h1 className="leading-[1.1] mb-6 text-center w-full max-w-3xl mx-auto">
              <TypingHeadline />
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10 text-stone-600 text-balance">
              Complete simple tasks from your phone — recording, testing, transcribing — and redeem NexCoins for gift vouchers.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              {/* Start Earning - Premium Mint Button */}
              <Link
                href="/signup"
                className="w-full sm:w-auto h-12 px-10 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(13,148,136,0.18)]"
                style={{
                  background: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(13,148,136,0.25)",
                  color: "#0F3D36",
                }}
              >
                ➔ Start Earning
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.1)",
                    color: "#334155",
                  }}
                >
                  <span>{b.icon}</span>{b.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Earning Ways (Premium Pop-up Cards Group) ─────────────────── */}
      <section className="py-24 px-6" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(13,148,136,0.06)", borderBottom: "1px solid rgba(13,148,136,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#0F3D36]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Multiple Ways to Earn
              </h2>
              <p className="text-sm sm:text-base max-w-xl mx-auto text-stone-600">
                11 categories of paid tasks. New projects added regularly.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {EARNING_WAYS.map((way, i) => (
              <FadeIn key={way.name} delay={i * 40} className="h-full">
                <div 
                  className="group rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md border"
                  style={{
                    background: "rgba(255,255,255,0.45)",
                    border: "1.5px solid rgba(13,148,136,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <span className="text-4xl leading-none transition-transform duration-300 group-hover:scale-110">{way.icon}</span>
                  <h3 className="font-bold text-lg text-[#0F3D36] group-hover:text-[#0D9488] transition-colors">
                    {way.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {way.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Slot */}
      <section className="py-8 px-6">
        <div className="mx-auto max-w-container flex justify-center">
          <div className="w-full max-w-[728px]">
            <AdSlot placement="earn-top" />
          </div>
        </div>
      </section>

      {/* ── How It Works (Vertical Grid Cards) ─────────────────────────── */}
      <section className="py-24 px-6" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#0F3D36]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                How It Works
              </h2>
              <p className="text-sm sm:text-base max-w-lg mx-auto text-stone-600">
                Five simple steps from sign-up to your first voucher redemption.
              </p>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-5 max-w-3xl mx-auto">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 80}>
                <div 
                  className="flex gap-5 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-sm"
                  style={{
                    background: "rgba(255,255,255,0.45)",
                    border: "1.5px solid rgba(13,148,136,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black uppercase text-[#0D9488]"
                    style={{
                      background: "rgba(13,148,136,0.06)",
                      border: "1.5px solid rgba(13,148,136,0.15)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-wider mb-0.5 text-[#0D9488] italic">
                      Step 0{i + 1}
                    </span>
                    <h3 className="font-bold mb-1 text-lg text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join Section ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#0F3D36]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Why Join NexGuild?
              </h2>
              <p className="text-sm sm:text-base max-w-lg mx-auto text-stone-600">
                Built for contributors in India and beyond.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHY_JOIN.map((w, i) => (
              <FadeIn key={w.title} delay={i * 70} className="h-full">
                <div 
                  className="p-8 flex gap-5 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md"
                  style={{
                    background: "rgba(255,255,255,0.45)",
                    border: "1.5px solid rgba(13,148,136,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <span className="text-4xl flex-shrink-0 mt-0.5">{w.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {w.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {w.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meet the Founder ────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid rgba(13,148,136,0.06)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-3xl mx-auto rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1.5px solid rgba(13,148,136,0.14)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Photo placeholder — TODO: replace with <Image src="/founder.jpg" alt="Somen Biswas" width={120} height={120} className="rounded-full object-cover" /> once public/founder.jpg is added */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-3xl font-black text-[#0D9488] select-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(13,148,136,0.08) 0%, rgba(45,212,191,0.15) 100%)",
                    border: "3px solid rgba(13,148,136,0.2)",
                  }}
                >
                  SB
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-3 text-center sm:text-left">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">Meet the Founder</span>
                  <h3
                    className="text-2xl font-extrabold text-[#0F3D36] mt-1"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Somen Biswas
                  </h3>
                  <p className="text-sm font-medium text-stone-500 mt-0.5">Founder, NexGuild</p>
                </div>
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                  &ldquo;I built NexGuild because I wanted to create a platform where anyone can earn real rewards in their free time — honestly and transparently, without fake promises. NexGuild is built and run from India, and I personally review every feature before it goes live.&rdquo;
                </p>
                <p className="text-sm font-semibold text-[#0F3D36] italic">
                  — Somen, Founder &amp; Builder
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(13,148,136,0.06)" }}>
        {/* Soft Radial Mint Glow */}
        <div
          aria-hidden
          className="aurora-glow absolute inset-0 pointer-events-none"
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)",
            filter: "blur(120px)",
            bottom: "-200px",
            right: "-150px",
            zIndex: 0,
          }}
        />

        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div
              className="rounded-3xl p-8 sm:p-16 text-center overflow-hidden relative"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(235,251,250,0.8) 100%)",
                border: "1.5px solid rgba(13,148,136,0.15)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 10px 30px rgba(13,148,136,0.04)"
              }}
            >
              <div className="relative z-10">
                <div className="text-5xl mb-6">🚀</div>
                <h2 
                  className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight text-[#0F3D36]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Join Our Growing Community
                </h2>
                <p className="text-sm sm:text-base mb-10 max-w-lg mx-auto text-stone-600">
                  Join our growing community of contributors across India. New tasks added regularly.
                </p>
                <Link
                  href="/signup"
                  className="h-12 px-10 inline-flex items-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(13,148,136,0.15)]"
                  style={{
                    background: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.25)",
                    color: "#0F3D36",
                  }}
                >
                  Join Free Today →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}