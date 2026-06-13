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
  { icon: "💸", title: "Withdraw to UPI / Bank",   desc: "Cash out to UPI, bank transfer, or PayPal." },
];

const WHY_JOIN = [
  { icon: "📱", title: "Work From Phone",         desc: "No laptop needed. Complete most tasks entirely from your smartphone." },
  { icon: "💰", title: "Multiple Income Sources", desc: "Earn from Tasks, Offerwalls, and Referrals — all in one place." },
  { icon: "🏆", title: "Skill Based Levels",      desc: "Grow from Beginner to Expert and unlock higher-paying tasks." },
  { icon: "⚡", title: "Fast Withdrawals",        desc: "UPI and bank transfers processed within 48 hours." },
];

const TRUST_BADGES = [
  { icon: "🔒", label: "Secure Payments" },
  { icon: "📱", label: "Mobile Friendly" },
  { icon: "🇮🇳", label: "India Based" },
  { icon: "⚡", label: "Fast Withdrawals" },
];

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
        transition: "opacity 0.4s ease, transform 0.4s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
      className="gradient-text"
    >
      {TYPING_TEXTS[index]}
    </span>
  );
}

export default function EarnPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative hero-glow overflow-hidden">
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle, rgba(20,184,166,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            mask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-container px-6 pt-28 pb-20 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] mb-8">
              <span className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider">
                Join 100+ Active Contributors
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={80}>
            <h1
              className="font-extrabold tracking-tight leading-[1.1] text-white mb-6 text-center"
              style={{
                fontSize: "clamp(32px, 5vw, 60px)",
                overflow: "hidden",
                maxWidth: "100%",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              <TypingHeadline />
            </h1>
          </FadeIn>

          <FadeIn delay={160}>
            <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10 text-balance">
              NexGuild connects you with real paid tasks from real organizations.
              Work from your phone. Get paid to your UPI.
            </p>
          </FadeIn>

          <FadeIn delay={240}>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <Link
                href="/signup"
                className="h-12 px-8 inline-flex items-center rounded-xl bg-[var(--brand-500)] text-[var(--text-inverse)] text-base font-bold hover:bg-[var(--brand-400)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_32px_rgba(20,184,166,0.4)]"
              >
                Join Free →
              </Link>
              <Link
                href="/opportunities"
                className="h-12 px-8 inline-flex items-center rounded-xl border border-[var(--border-strong)] text-white/70 text-base font-medium hover:text-white hover:border-[var(--brand-500)] transition-colors"
              >
                See Opportunities
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {TRUST_BADGES.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] text-xs text-white/60"
                >
                  <span>{b.icon}</span>{b.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Earning Ways ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                Multiple Ways to Earn
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                11 categories of paid tasks. New projects added regularly.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {EARNING_WAYS.map((way, i) => (
              <FadeIn key={way.name} delay={i * 40}>
                <div className="card-hover group rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 flex flex-col gap-3 cursor-default">
                  <span className="text-3xl leading-none">{way.icon}</span>
                  <h3 className="font-semibold text-white text-base group-hover:text-[var(--brand-500)] transition-colors">
                    {way.name}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">{way.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                How It Works
              </h2>
              <p className="text-white/50 text-lg max-w-lg mx-auto">
                Five simple steps from sign-up to your first withdrawal.
              </p>
            </div>
          </FadeIn>

          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 80}>
                <div className="flex gap-5 p-5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--brand-500)] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] flex items-center justify-center flex-shrink-0 text-xl">
                    {step.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-[var(--brand-500)] uppercase tracking-wider mb-1">
                      Step {i + 1}
                    </span>
                    <h3 className="font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Join ─────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                Why Join NexGuild?
              </h2>
              <p className="text-white/50 text-lg max-w-lg mx-auto">
                Built for contributors in India and beyond.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHY_JOIN.map((w, i) => (
              <FadeIn key={w.title} delay={i * 70}>
                <div className="card-hover rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-7 flex gap-5">
                  <span className="text-3xl flex-shrink-0 mt-0.5">{w.icon}</span>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-2">{w.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div
              className="rounded-2xl p-12 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #000f1f 0%, #0A1628 40%, #0A1628 60%, #001a12 100%)",
                border: "1px solid rgba(20,184,166,0.18)",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
                  background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(20,184,166,0.07) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <div className="text-5xl mb-6">🚀</div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  Join Our Growing Community
                </h2>
                <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">
                  Join our growing community of contributors across India.
                  New tasks added regularly.
                </p>
                <Link
                  href="/signup"
                  className="h-12 px-10 inline-flex items-center rounded-xl bg-[var(--brand-500)] text-[var(--text-inverse)] text-base font-bold hover:bg-[var(--brand-400)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_32px_rgba(20,184,166,0.4)]"
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
