"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/components/ui/fade-in";
import { AdSlot } from "@/components/ui/ad-slot";
import { supabase } from "@/lib/supabase";

/* ─────────────────────── Data ─────────────────────────────────── */

const TYPING_TEXTS = [
  "Earn by Recording.",
  "Earn by Testing.",
  "Earn by Transcribing.",
  "Earn by Contributing.",
];

const FLOATING_PILLS = [
  { icon: "🎙️", label: "Audio Recording",  style: { top: "22%",  left: "4%"  } },
  { icon: "📝", label: "Transcription",    style: { top: "52%",  left: "2%"  } },
  { icon: "🏷️", label: "Data Annotation",  style: { top: "72%",  left: "7%"  } },
  { icon: "📱", label: "App Testing",      style: { top: "20%",  right: "3%" } },
  { icon: "🎯", label: "Offerwalls",       style: { top: "46%",  right: "2%" } },
  { icon: "💼", label: "Remote Jobs",      style: { top: "70%",  right: "5%" } },
];

const EARNING_FEATURED = [
  { icon: "🎯", name: "Offerwalls",        desc: "Complete surveys, app installs, and partner tasks. Earnings credit instantly after provider confirmation.", href: "/earn/tasks", badge: "Highest Volume" },
  { icon: "💼", name: "Remote & WFH Jobs", desc: "Curated remote and work-from-home listings from Telus, Appen, Lionbridge and our HR network.", href: "/earn/jobs", badge: "New Listings Daily" },
];

const EARNING_GRID = [
  { icon: "🎙️", name: "Audio Recording",      desc: "Record voice prompts for AI training in any language." },
  { icon: "📝", name: "Transcription",         desc: "Convert audio files to accurate text." },
  { icon: "🏷️", name: "Data Annotation",       desc: "Label images, text, and video for ML datasets." },
  { icon: "📱", name: "App Testing",           desc: "Test apps, report bugs and UX issues." },
  { icon: "🎮", name: "Game Testing",          desc: "Play and review games, submit feedback reports." },
  { icon: "📊", name: "Survey Tasks",          desc: "Complete targeted surveys and questionnaires." },
  { icon: "▶️", name: "Social Media Tasks",    desc: "Organic engagement and awareness campaigns." },
  { icon: "🔍", name: "Web Research",          desc: "Research, fact-checking, and data gathering." },
  { icon: "🌿", name: "Field Data Collection", desc: "On-ground data collection across cities worldwide." },
  { icon: "💸", name: "Referral Earnings",     desc: "Earn NexCoins for every active contributor you refer.", href: "/earn/refer" },
];

const VOUCHERS = [
  { icon: "🛒", name: "Amazon"   },
  { icon: "📦", name: "Flipkart" },
  { icon: "💙", name: "Paytm"    },
  { icon: "💜", name: "PhonePe"  },
  { icon: "🛵", name: "Swiggy"   },
  { icon: "🍽️", name: "Zomato"   },
];

const WHY_JOIN = [
  { accent: "#0D9488", icon: "📱", title: "Work From Your Phone",    desc: "No laptop needed. Most tasks complete entirely from your smartphone — anytime, anywhere." },
  { accent: "#F59E0B", icon: "💰", title: "Multiple Income Streams", desc: "Earn from Tasks, Offerwalls, Jobs, and Referrals — all tracked in one dashboard." },
  { accent: "#8B5CF6", icon: "🏆", title: "Skill-Based Levels",      desc: "Grow from Beginner to Expert. Higher levels unlock better-paying task batches." },
  { accent: "#10B981", icon: "⚡", title: "Vouchers in 48 Hours",    desc: "Redeem NexCoins and receive Amazon, Flipkart, or Paytm vouchers by email within 48 hrs." },
];

const STEPS = [
  { num: "01", icon: "🆓", title: "Sign Up Free",    desc: "30-second sign-up. No fees, no verification required." },
  { num: "02", icon: "✅", title: "Complete Profile", desc: "Set skills and device info to unlock matching tasks." },
  { num: "03", icon: "🔎", title: "Pick Tasks",       desc: "Browse 12 categories and apply for what fits you." },
  { num: "04", icon: "📤", title: "Submit Work",      desc: "Complete and submit. Our team reviews within 48 hrs." },
  { num: "05", icon: "🎁", title: "Redeem Vouchers",  desc: "Exchange NexCoins for gift cards at the Store." },
];

/* ─────────────────────── Components ───────────────────────────── */

const heroStyle = `
  @keyframes float-pill {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  .pill-float { animation: float-pill 5s ease-in-out infinite; }
`;

// All 4 phrases must fit on exactly one line.
// The longest is "Earn by Contributing." (~21 chars).
// We use white-space:nowrap and a small enough clamp so it never wraps.
function TypingHeadline() {
  const [index,   setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIndex((i) => (i + 1) % TYPING_TEXTS.length); setVisible(true); }, 380);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{
      display: "block",
      whiteSpace: "nowrap",
      overflow: "hidden",
      transition: "opacity 0.38s ease, transform 0.38s ease",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-10px)",
      color: "#0F3D36",
      fontFamily: "'Instrument Serif', serif",
      // clamp keeps all texts on 1 line at every viewport:
      // at 1280px viewport → 3.4vw = 43.5px → longest phrase ≈ 600px < 720px container ✓
      fontSize: "clamp(24px, 3.4vw, 44px)",
      fontWeight: 900,
      letterSpacing: "-0.02em",
      lineHeight: 1.1,
    }}>
      {TYPING_TEXTS[index]}
    </span>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref           = useRef<HTMLSpanElement>(null);
  const started       = useRef(false);

  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const steps = 50;
      const inc   = target / steps;
      let cur     = 0;
      const timer = setInterval(() => {
        cur += inc;
        if (cur >= target) { setVal(target); clearInterval(timer); }
        else setVal(Math.floor(cur));
      }, 1400 / steps);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString("en-IN")}{suffix}</span>;
}

function HeroCTA() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        href={loggedIn ? "/dashboard" : "/signup"}
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_28px_rgba(13,148,136,0.35)]"
        style={{ height: 44, padding: "0 2rem", background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", color: "#ECFDF5", boxShadow: "0 5px 16px rgba(13,148,136,0.28)" }}
      >
        {loggedIn ? "Go to Dashboard →" : "Start Earning Free →"}
      </Link>
      <Link
        href="/earn/tasks"
        className="w-full sm:w-auto inline-flex items-center justify-center rounded-full font-semibold text-sm transition-all duration-200 hover:bg-white hover:shadow-sm"
        style={{ height: 44, padding: "0 1.5rem", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.2)", color: "#0F3D36" }}
      >
        Browse All Tasks
      </Link>
    </div>
  );
}

interface Stats { members: number; tasks_completed: number; }

/* ─────────────────────── Page ─────────────────────────────────── */

export default function EarnPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/earn/stats").then(r => r.json()).then((d: Stats) => setStats(d)).catch(() => {});
  }, []);

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      <style>{heroStyle}</style>

      {/* ══════════════════════════════════
          HERO
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Background layers */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(13,148,136,0.12) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          mask: "radial-gradient(ellipse 85% 80% at 50% 40%, black 30%, transparent 100%)",
          WebkitMask: "radial-gradient(ellipse 85% 80% at 50% 40%, black 30%, transparent 100%)",
        }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(45,212,191,0.18) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div aria-hidden style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", zIndex: 0,
          background: "linear-gradient(to top, #EBFBFA, transparent)",
        }} />

        {/* Floating task pills — desktop only */}
        {FLOATING_PILLS.map((pill, i) => (
          <div key={pill.label} aria-hidden
            className="pill-float hidden xl:flex absolute items-center gap-2 px-3 py-1.5 rounded-full select-none pointer-events-none"
            style={{
              ...pill.style,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4.5 + i * 0.4}s`,
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(14px)",
              border: "1.5px solid rgba(13,148,136,0.15)",
              boxShadow: "0 3px 14px rgba(13,148,136,0.08)",
              zIndex: 2,
            }}>
            <span style={{ fontSize: 14 }}>{pill.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#0F3D36" }}>{pill.label}</span>
          </div>
        ))}

        {/* Main content — max-w-3xl gives enough room for the nowrap headline */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center pt-24 pb-14">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.2)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0D9488", display: "inline-block" }} />
              <span className="text-xs font-bold text-[#115E59] uppercase tracking-wider">For Contributors · Worldwide</span>
            </div>
          </FadeIn>

          <FadeIn delay={60}>
            {/* minHeight reserves the line so the subtitle never jumps while text is fading */}
            <div style={{ minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center" }} className="mb-1">
              <TypingHeadline />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36]/55 mb-6 tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}>
              Get Paid in Gift Vouchers.
            </h2>
          </FadeIn>

          <FadeIn delay={140}>
            <p className="text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-7 text-stone-500 text-balance">
              Complete simple tasks from your phone — recording, testing, transcribing — and redeem NexCoins for Amazon, Flipkart &amp; more.
            </p>
          </FadeIn>

          <FadeIn delay={220}>
            <HeroCTA />
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-7">
              {[
                { icon: "🔒", label: "Secure Payments" },
                { icon: "📱", label: "Mobile Friendly" },
                { icon: "🌍", label: "Global Platform" },
                { icon: "⚡", label: "Instant Vouchers" },
              ].map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(13,148,136,0.12)", color: "#334155" }}>
                  <span>{b.icon}</span>{b.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAND (dark)
      ══════════════════════════════════ */}
      {stats && (
        <section style={{ background: "#0F3D36", borderTop: "1px solid rgba(45,212,191,0.12)", borderBottom: "1px solid rgba(45,212,191,0.12)" }}>
          <div className="mx-auto max-w-container py-8 px-6">
            <FadeIn>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
                <div>
                  <div className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: "#2DD4BF", fontFamily: "'Instrument Serif', serif" }}>
                    <AnimatedCounter target={stats.members} suffix="+" />
                  </div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5">Active Members</div>
                </div>
                <div className="hidden sm:block w-px h-10" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div>
                  <div className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: "#2DD4BF", fontFamily: "'Instrument Serif', serif" }}>
                    <AnimatedCounter target={stats.tasks_completed} suffix="+" />
                  </div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5">Tasks Completed</div>
                </div>
                <div className="hidden sm:block w-px h-10" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div>
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: "#2DD4BF", fontFamily: "'Instrument Serif', serif" }}>12</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5">Earning Categories</div>
                </div>
                <div className="hidden sm:block w-px h-10" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div>
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: "#2DD4BF", fontFamily: "'Instrument Serif', serif" }}>6+</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5">Voucher Partners</div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════
          HOW TO EARN (Featured + Grid)
      ══════════════════════════════════ */}
      <section className="py-14 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="mb-8 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">12 Categories</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F3D36] mb-3 tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif", lineHeight: 1.05 }}>
                Multiple Ways to Earn
              </h2>
              <p className="text-stone-500 text-sm">New projects added regularly. Pick tasks that match your skills and schedule.</p>
            </div>
          </FadeIn>

          {/* Featured 2 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {EARNING_FEATURED.map((f, i) => (
              <FadeIn key={f.name} delay={i * 80}>
                <Link href={f.href} className="group block h-full">
                  <div className="relative h-full rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_16px_48px_rgba(13,148,136,0.15)]"
                    style={{ background: "linear-gradient(145deg, #0F3D36 0%, #0D5C52 60%, #0F766E 100%)", minHeight: 140 }}>
                    <div aria-hidden style={{ position: "absolute", right: -20, top: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(45,212,191,0.08)", filter: "blur(32px)" }} />
                    <div aria-hidden style={{ position: "absolute", right: 20, bottom: 16, fontSize: 64, opacity: 0.06, lineHeight: 1, userSelect: "none" }}>{f.icon}</div>
                    <div className="relative z-10">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                        style={{ background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.25)", color: "#2DD4BF" }}>
                        {f.badge}
                      </span>
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-1.5" style={{ fontFamily: "'Instrument Serif', serif" }}>{f.name}</h3>
                      <p className="text-xs text-white/60 leading-relaxed mb-4">{f.desc}</p>
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-[#2DD4BF] group-hover:gap-3 transition-all duration-200">
                        Explore Now <span>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          {/* Regular grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {EARNING_GRID.map((way, i) => {
              const card = (
                <div className="group rounded-xl p-4 flex flex-col gap-2 h-full transition-all duration-200 hover:translate-y-[-2px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(13,148,136,0.1)", backdropFilter: "blur(8px)" }}>
                  <span className="text-xl leading-none transition-transform duration-200 group-hover:scale-110 inline-block">{way.icon}</span>
                  <h3 className="font-bold text-xs text-[#0F3D36] group-hover:text-[#0D9488] transition-colors leading-tight">{way.name}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{way.desc}</p>
                  {way.href && <span className="text-xs font-bold text-[#0D9488] mt-auto">Refer →</span>}
                </div>
              );
              return (
                <FadeIn key={way.name} delay={40 + i * 30} className="h-full">
                  {way.href ? <Link href={way.href} className="h-full block">{card}</Link> : card}
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={160}>
            <div className="text-center">
              <Link href="/earn/tasks"
                className="inline-flex items-center gap-2 h-11 px-8 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(13,148,136,0.25)]"
                style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#ECFDF5" }}>
                Browse All 12 Categories →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          AD SLOT
      ══════════════════════════════════ */}
      <div className="py-4 px-6">
        <div className="mx-auto max-w-container flex justify-center">
          <div className="w-full max-w-[728px]">
            <AdSlot placement="earn-top" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          HOW IT WORKS (numbered steps)
      ══════════════════════════════════ */}
      <section className="py-14 px-6" style={{ background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)", borderTop: "1px solid rgba(13,148,136,0.07)", borderBottom: "1px solid rgba(13,148,136,0.07)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Simple Process</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F3D36] tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif" }}>
                Five Steps to Your First Voucher
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 60}>
                <div className="relative rounded-xl p-4 h-full transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(13,148,136,0.1)", backdropFilter: "blur(8px)", overflow: "hidden" }}>
                  <div aria-hidden style={{ position: "absolute", right: -4, bottom: -8, fontSize: 60, fontWeight: 900, color: "rgba(13,148,136,0.055)", lineHeight: 1, userSelect: "none", fontFamily: "'Instrument Serif', serif" }}>
                    {step.num}
                  </div>
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white mb-3"
                      style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", boxShadow: "0 3px 10px rgba(13,148,136,0.3)" }}>
                      {step.num}
                    </div>
                    <div className="text-xl mb-2">{step.icon}</div>
                    <h3 className="font-bold text-[#0F3D36] text-xs mb-1">{step.title}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={180}>
            <div className="mt-8 text-center">
              <Link href="/earn/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0D9488] hover:text-[#0F3D36] transition-colors group">
                Read the Full Guide
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          WHY JOIN
      ══════════════════════════════════ */}
      <section className="py-14 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Why NexGuild</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F3D36] tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif" }}>
                Built for Earners
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHY_JOIN.map((w, i) => (
              <FadeIn key={w.title} delay={i * 60} className="h-full">
                <div className="group flex gap-5 p-5 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(13,148,136,0.1)", backdropFilter: "blur(12px)", borderLeft: `3px solid ${w.accent}` }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${w.accent}14`, border: `1.5px solid ${w.accent}30` }}>
                    {w.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F3D36] mb-1.5" style={{ fontFamily: "'Instrument Serif', serif" }}>{w.title}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          VOUCHER PARTNERS
      ══════════════════════════════════ */}
      <section className="py-10 px-6" style={{ background: "rgba(13,148,136,0.04)", borderTop: "1px solid rgba(13,148,136,0.08)", borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
        <div className="mx-auto max-w-container text-center">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-5">Redeem your NexCoins at</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {VOUCHERS.map((v) => (
                <div key={v.name}
                  className="flex items-center gap-2 h-10 px-5 rounded-full font-bold text-sm transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(13,148,136,0.15)", color: "#0F3D36", backdropFilter: "blur(8px)" }}>
                  <span style={{ fontSize: 18 }}>{v.icon}</span>
                  {v.name}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-4">Gift vouchers delivered to your email within 48 hours of redemption.</p>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          FOUNDER
      ══════════════════════════════════ */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="max-w-3xl mx-auto rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-6"
              style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(13,148,136,0.14)", backdropFilter: "blur(12px)" }}>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="rounded-full overflow-hidden" style={{ width: 80, height: 80, border: "3px solid rgba(13,148,136,0.25)" }}>
                  <Image src="/founder.jpg" alt="Somen Biswas" width={80} height={80} className="rounded-full object-cover object-top" priority />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488]">Founder</p>
              </div>
              <div className="flex flex-col gap-2.5 text-center sm:text-left">
                <div>
                  <h3 className="text-xl font-black text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>Somen Biswas</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Founder, NexGuild</p>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">
                  &ldquo;I built NexGuild because I wanted to create a platform where anyone can earn real rewards in their free time — honestly and transparently, without fake promises. NexGuild is built and run from India, and I personally review every feature before it goes live.&rdquo;
                </p>
                <p className="text-sm font-semibold text-[#0F3D36] italic">— Somen, Founder &amp; Builder</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA (dark)
      ══════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: "#0F3D36" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(45,212,191,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 80% 50%, rgba(13,148,136,0.1) 0%, transparent 60%)" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(45,212,191,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 mx-auto max-w-container px-6 py-14 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2DD4BF", display: "inline-block" }} />
              <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider">Join Today — It&apos;s Free</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}>
              Ready to Start Earning?
            </h2>
            <p className="text-white/55 text-sm sm:text-base mb-8 max-w-lg mx-auto">
              Join contributors across India. New tasks added every week. Redeem for your favourite brands.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup"
                className="h-12 px-10 inline-flex items-center rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(13,148,136,0.4)]"
                style={{ background: "linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)", color: "#0A2520", boxShadow: "0 5px 20px rgba(13,148,136,0.35)" }}>
                Create Free Account →
              </Link>
              <Link href="/earn/tasks"
                className="h-12 px-8 inline-flex items-center rounded-full font-semibold text-sm transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                Browse Tasks First
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
