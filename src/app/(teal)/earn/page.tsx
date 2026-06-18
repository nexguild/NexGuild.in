"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

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
  { icon: "🆓", title: "Sign Up Free",            desc: "Create your account in 30 seconds. No credit card needed." },
  { icon: "✅", title: "Complete Your Profile",    desc: "Set your skills, language, and device capabilities." },
  { icon: "🔎", title: "Browse & Apply for Tasks", desc: "Pick tasks that match your skills and schedule." },
  { icon: "📤", title: "Submit Your Work",         desc: "Complete the task and submit through the dashboard." },
  { icon: "🎁", title: "Redeem for Vouchers",       desc: "Exchange NexCoins for Amazon, Flipkart, and more gift vouchers." },
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

// Teal Aurora Glow Animation
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
        fontSize: "clamp(32px, 5vw, 64px)",
        fontWeight: 900,
        letterSpacing: "-0.02em",
        color: "#1C1917",
      }}
    >
      {TYPING_TEXTS[index]}
    </span>
  );
}

export default function EarnPage() {
  return (
    <>
      <style>{auroraStyle}</style>
      
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section 
        className="relative overflow-hidden min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F0FAFA" }}
      >
        {/* Aurora Glow Blob Background */}
        <div
          aria-hidden
          className="aurora-glow absolute inset-0 pointer-events-none"
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)",
            filter: "blur(120px)",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 0,
          }}
        />

        <div className="relative z-10 mx-auto max-w-container px-6 py-28 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(13,148,136,0.2)",
              }}
            >
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                Join 100+ Active Contributors
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <h1
              className="leading-[1.1] mb-6 text-center w-full max-w-3xl mx-auto"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(40px, 5vw, 72px)",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "#1C1917",
              }}
            >
              <TypingHeadline />
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p 
              className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10 text-balance"
              style={{ color: "#44403C" }}
            >
              NexGuild connects you with real paid tasks from real organizations.
              Work from your phone. Redeem NexCoins for gift vouchers.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href="/signup"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(13,148,136,0.35)",
                  color: "#134E4A",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(13,148,136,0.65)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(13,148,136,0.35)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Join Free →
              </Link>
              <Link
                href="/opportunities"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-medium text-base transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(13,148,136,0.2)",
                  color: "#115E59",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(13,148,136,0.65)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(13,148,136,0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                See Opportunities
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.2)",
                    color: "#44403C",
                  }}
                >
                  <span>{b.icon}</span>{b.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Earning Ways ─────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: "#F0FAFA" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  color: "#1C1917",
                }}
              >
                Multiple Ways to Earn
              </h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: "#44403C" }}>
                11 categories of paid tasks. New projects added regularly.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {EARNING_WAYS.map((way, i) => (
              <FadeIn key={way.name} delay={i * 40}>
                <div 
                  className="group rounded-2xl p-6 flex flex-col gap-4 cursor-default transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.2)",
                  }}
                >
                  <span className="text-4xl leading-none">{way.icon}</span>
                  <h3 
                    className="font-bold text-lg group-hover:underline transition-colors"
                    style={{ color: "#1C1917" }}
                  >
                    {way.name}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#44403C" }}>
                    {way.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Banner — replace div with AdBanner component once Adsterra key is ready */}
      <section className="py-6 px-6" style={{ backgroundColor: "#F0FAFA" }}>
        <div className="mx-auto max-w-container flex justify-center">
          {/* <AdBanner atKey="YOUR_KEY_HERE" width={728} height={90} /> */}
          <div 
            className="w-full max-w-[728px] h-[90px] rounded-2xl flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.75)",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(13,148,136,0.2)",
            }}
          >
            <span className="text-xs uppercase tracking-widest" style={{ color: "#94A3B8" }}>
              Advertisement
            </span>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: "#F0FAFA" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  color: "#1C1917",
                }}
              >
                How It Works
              </h2>
              <p className="text-lg max-w-lg mx-auto" style={{ color: "#44403C" }}>
                Five simple steps from sign-up to your first voucher redemption.
              </p>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 80}>
                <div 
                  className="flex gap-5 p-6 rounded-2xl hover:shadow-lg transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.2)",
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 text-xl font-bold"
                    style={{
                      background: "rgba(255,255,255,0.75)",
                      backdropFilter: "blur(12px)",
                      border: "1.5px solid rgba(13,148,136,0.2)",
                    }}
                  >
                    {step.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span 
                      className="text-xs font-bold uppercase tracking-wider mb-1"
                      style={{ color: "#115E59", fontStyle: "italic" }}
                    >
                      Step {i + 1}
                    </span>
                    <h3 
                      className="font-bold mb-1 text-lg"
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        color: "#1C1917",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#44403C" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: "#F0FAFA" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 
                className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  color: "#1C1917",
                }}
              >
                Why Join NexGuild?
              </h2>
              <p className="text-lg max-w-lg mx-auto" style={{ color: "#44403C" }}>
                Built for contributors in India and beyond.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {WHY_JOIN.map((w, i) => (
              <FadeIn key={w.title} delay={i * 70}>
                <div 
                  className="p-8 flex gap-5 rounded-2xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.2)",
                  }}
                >
                  <span className="text-4xl flex-shrink-0 mt-0.5">{w.icon}</span>
                  <div>
                    <h3 
                      className="font-bold text-lg mb-2"
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        color: "#1C1917",
                      }}
                    >
                      {w.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#44403C" }}>
                      {w.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ backgroundColor: "#F0FAFA" }}>
        {/* Aurora Glow Blob */}
        <div
          aria-hidden
          className="aurora-glow absolute inset-0 pointer-events-none"
          style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)",
            filter: "blur(120px)",
            bottom: "-150px",
            right: "-100px",
            zIndex: 0,
          }}
        />

        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <div
              className="rounded-2xl p-8 sm:p-16 text-center overflow-hidden relative"
              style={{
                background: "linear-gradient(160deg, #F6FDFD 0%, #E6FAF9 100%)",
                border: "1.5px solid rgba(13,148,136,0.2)",
              }}
            >
              <div className="relative z-10">
                <div className="text-5xl mb-6">🚀</div>
                <h2 
                  className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight"
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    color: "#1C1917",
                  }}
                >
                  Join Our Growing Community
                </h2>
                <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "#44403C" }}>
                  Join our growing community of contributors across India.
                  New tasks added regularly.
                </p>
                <Link
                  href="/signup"
                  className="h-12 px-10 inline-flex items-center rounded-full font-bold text-base transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(13,148,136,0.35)",
                    color: "#134E4A",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(13,148,136,0.65)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(13,148,136,0.35)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Join Free Today →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
