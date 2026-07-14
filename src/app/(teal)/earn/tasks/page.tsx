"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { supabase } from "@/lib/supabase";

type Filter = "all" | "active" | "coming-soon";

interface Category {
  icon: string;
  name: string;
  desc: string;
  detail: string;
  payout: string;
  device: string;
  level: string;
  status: "active" | "coming-soon";
  href?: string;
  isNew?: boolean;
  featured?: boolean;
  featuredBg?: string;
  headerBg: string;
  accentBorder: string;
}

const CATEGORIES: Category[] = [
  {
    icon: "🎙️", name: "Audio Recording",
    desc: "Record sentences, conversations, and voice prompts for AI training datasets.",
    detail: "Speak clearly into your phone mic. Multiple languages available.",
    payout: "₹5–₹50 / task", device: "📱 Mobile", level: "Beginner", status: "active",
    headerBg: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(45,212,191,0.12) 100%)",
    accentBorder: "rgba(13,148,136,0.18)",
  },
  {
    icon: "📝", name: "Transcription",
    desc: "Convert audio files to accurate text across multiple Indian and global languages.",
    detail: "Type what you hear. Speed and accuracy both matter.",
    payout: "₹10–₹80 / task", device: "📱 / 💻", level: "Beginner", status: "active",
    headerBg: "linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(129,140,248,0.1) 100%)",
    accentBorder: "rgba(99,102,241,0.18)",
  },
  {
    icon: "🏷️", name: "Data Annotation",
    desc: "Label images, text, and video clips to train machine learning models.",
    detail: "Follow clear labelling guidelines. Each batch takes 10–30 min.",
    payout: "₹8–₹60 / task", device: "📱 / 💻", level: "Beginner", status: "active",
    headerBg: "linear-gradient(135deg, rgba(234,179,8,0.16) 0%, rgba(251,191,36,0.1) 100%)",
    accentBorder: "rgba(234,179,8,0.22)",
  },
  {
    icon: "📱", name: "App Testing",
    desc: "Test mobile and web apps end-to-end. Report bugs, crashes, and UX issues.",
    detail: "Structured test cases provided. No coding required.",
    payout: "₹15–₹150 / task", device: "📱 Mobile", level: "Any", status: "active",
    headerBg: "linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(99,160,255,0.1) 100%)",
    accentBorder: "rgba(59,130,246,0.2)",
  },
  {
    icon: "🎮", name: "Game Testing",
    desc: "Play and evaluate mobile games. Submit detailed feedback on mechanics and feel.",
    detail: "Fun and paid. Must meet the minimum playtime per session.",
    payout: "₹20–₹200 / task", device: "📱 Mobile", level: "Any", status: "active",
    headerBg: "linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(251,113,133,0.08) 100%)",
    accentBorder: "rgba(239,68,68,0.18)",
  },
  {
    icon: "📊", name: "Survey Tasks",
    desc: "Complete targeted surveys for researchers and consumer brands across India.",
    detail: "Honest answers only. Screeners ensure you match the target profile.",
    payout: "₹5–₹40 / task", device: "📱 Mobile", level: "Beginner", status: "active",
    headerBg: "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(52,211,153,0.1) 100%)",
    accentBorder: "rgba(16,185,129,0.2)",
  },
  {
    icon: "▶️", name: "Social Media Tasks",
    desc: "Organic engagement, reviews, and awareness tasks for verified campaigns.",
    detail: "Use your existing social accounts. No fake engagement allowed.",
    payout: "₹5–₹30 / task", device: "📱 Mobile", level: "Beginner", status: "active",
    headerBg: "linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(196,125,252,0.08) 100%)",
    accentBorder: "rgba(168,85,247,0.18)",
  },
  {
    icon: "🔍", name: "Web Research",
    desc: "Research, fact-check, and compile structured data from across the web.",
    detail: "Tasks include product comparisons, news verification, and data gathering.",
    payout: "₹15–₹100 / task", device: "💻 Laptop", level: "Intermediate", status: "active",
    headerBg: "linear-gradient(135deg, rgba(14,165,233,0.16) 0%, rgba(56,189,248,0.1) 100%)",
    accentBorder: "rgba(14,165,233,0.2)",
  },
  {
    icon: "🌿", name: "Field Data Collection",
    desc: "On-ground data collection tasks across Indian cities. Visit locations, capture data.",
    detail: "Location-based tasks. Requires smartphone with GPS and camera.",
    payout: "₹50–₹500 / task", device: "📱 Mobile + GPS", level: "Any", status: "active",
    headerBg: "linear-gradient(135deg, rgba(34,197,94,0.16) 0%, rgba(74,222,128,0.1) 100%)",
    accentBorder: "rgba(34,197,94,0.2)",
  },
  {
    icon: "💸", name: "Referral Earnings",
    desc: "Share your unique link. Earn NexCoins for every friend who joins and completes a task.",
    detail: "No limit on referrals. Friend must complete at least one approved task.",
    payout: "Per conversion", device: "📱 / 💻", level: "Any", status: "active",
    href: "/earn/refer",
    headerBg: "linear-gradient(135deg, rgba(13,148,136,0.1) 0%, rgba(20,184,166,0.07) 100%)",
    accentBorder: "rgba(13,148,136,0.16)",
  },
  // Featured
  {
    icon: "🎯", name: "Offerwalls",
    desc: "Complete app installs, sign-ups, and sponsored actions from partner brands. High payout per completion.",
    detail: "Payouts vary by offer. Some complete in minutes, others take a day.",
    payout: "₹10–₹500 / offer", device: "📱 Mobile", level: "Any", status: "active",
    featured: true,
    featuredBg: "linear-gradient(135deg, #1A3A34 0%, #0F2A26 100%)",
    headerBg: "linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(251,191,36,0.1) 100%)",
    accentBorder: "rgba(245,158,11,0.22)",
  },
  {
    icon: "💼", name: "Remote & WFH Jobs",
    desc: "Browse curated remote jobs from Telus, Appen, Lionbridge + exclusive HR leads from NexGuild network.",
    detail: "Full-time and contract roles. Some via NexGuild application, others direct.",
    payout: "Full salary", device: "📱 / 💻", level: "Any", status: "active",
    href: "/jobs", isNew: true, featured: true,
    featuredBg: "linear-gradient(135deg, #0F3D36 0%, #134E4A 100%)",
    headerBg: "linear-gradient(135deg, rgba(13,148,136,0.18) 0%, rgba(45,212,191,0.1) 100%)",
    accentBorder: "rgba(13,148,136,0.28)",
  },
];

const FILTER_TABS: { label: string; value: Filter }[] = [
  { label: "All 12 Categories", value: "all" },
  { label: "Active Now", value: "active" },
  { label: "Coming Soon", value: "coming-soon" },
];

const FEATURED_NAMES = ["Offerwalls", "Remote & WFH Jobs"];

function AuthButton({ href, featured }: { href?: string; featured?: boolean }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  if (loggedIn === null) return <div style={{ height: 38 }} />;

  const dest = href ?? (loggedIn ? "/dashboard/tasks" : "/signup");
  const label = href ? "Browse →" : loggedIn ? "Start Task →" : "Sign Up to Apply →";

  if (featured) {
    return (
      <Link
        href={dest}
        className="flex-shrink-0 h-10 px-6 inline-flex items-center justify-center rounded-full font-bold text-sm transition-all duration-200 hover:shadow-lg hover:translate-y-[-1px]"
        style={{ background: "rgba(255,255,255,0.12)", color: "#CCFBF1", border: "1.5px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={dest}
      className="w-full h-10 inline-flex items-center justify-center rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-md"
      style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#fff" }}
    >
      {label}
    </Link>
  );
}

export default function TasksPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = CATEGORIES.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const featuredCats = filtered.filter((c) => FEATURED_NAMES.includes(c.name));
  const regularCats  = filtered.filter((c) => !FEATURED_NAMES.includes(c.name));

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-10 px-6 text-center">
        <div aria-hidden className="absolute pointer-events-none inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,212,191,0.14) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(13,148,136,0.2)", backdropFilter: "blur(12px)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">All Tasks · Live</span>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(34px,5vw,58px)", fontWeight: 900, color: "#0F3D36", lineHeight: 1.08, marginBottom: 14 }}>
              12 Ways to Earn<br className="hidden sm:block" /> on NexGuild
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-base sm:text-lg leading-relaxed text-stone-600">
              Pick a category that matches your skills and schedule.<br className="hidden sm:block" />
              Most tasks work entirely from your phone.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="flex items-center gap-2 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className="h-10 px-5 rounded-full text-sm font-semibold transition-all duration-200"
                  style={
                    filter === tab.value
                      ? { background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#fff", boxShadow: "0 4px 16px rgba(13,148,136,0.35)" }
                      : { background: "rgba(255,255,255,0.6)", color: "#4A7572", border: "1.5px solid rgba(13,148,136,0.15)", backdropFilter: "blur(8px)" }
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Featured Cards */}
      {featuredCats.length > 0 && (
        <section className="px-6 pb-8">
          <div className="mx-auto max-w-container">
            <FadeIn>
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-4">⭐ Featured</p>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {featuredCats.map((cat, i) => (
                <FadeIn key={cat.name} delay={i * 60}>
                  <div
                    className="rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
                    style={{ background: cat.featuredBg, border: "1.5px solid rgba(255,255,255,0.1)" }}
                  >
                    {/* Icon zone */}
                    <div
                      className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.15)" }}
                    >
                      {cat.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {cat.isNew && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full"
                            style={{ background: "#0D9488", color: "#CCFBF1" }}>NEW</span>
                        )}
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.12)", color: "#CCFBF1", border: "1px solid rgba(255,255,255,0.15)" }}>
                          {cat.payout}
                        </span>
                      </div>
                      <h3 className="font-black text-xl mb-1.5" style={{ color: "#ECFDF5", fontFamily: "'Instrument Serif', serif" }}>
                        {cat.name}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(204,251,241,0.75)" }}>{cat.desc}</p>
                    </div>

                    {/* CTA */}
                    {cat.status === "active" && (
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        <AuthButton href={cat.href} featured />
                      </div>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Grid */}
      {regularCats.length > 0 && (
        <section className="pb-16 px-6">
          <div className="mx-auto max-w-container">
            {featuredCats.length > 0 && (
              <FadeIn>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-5">All Task Categories</p>
              </FadeIn>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {regularCats.map((cat, i) => (
                <FadeIn key={cat.name} delay={i * 35} className="h-full">
                  <div
                    className="group h-full rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:translate-y-[-5px] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                    style={{ background: "rgba(255,255,255,0.8)", border: `1.5px solid ${cat.accentBorder}`, backdropFilter: "blur(12px)" }}
                  >
                    {/* Header zone */}
                    <div
                      className="h-[80px] flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{ background: cat.headerBg }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
                        style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                      >
                        {cat.icon}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col gap-3 p-5">
                      {/* Status + new badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: cat.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: cat.status === "active" ? "#16A34A" : "#D97706" }}>
                          {cat.status === "active" ? "● Active" : "Coming Soon"}
                        </span>
                        {cat.isNew && (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full"
                            style={{ background: "#0D9488", color: "#fff" }}>NEW</span>
                        )}
                      </div>

                      {/* Title + desc */}
                      <div>
                        <h3 className="font-bold text-base text-[#0F3D36] mb-1.5 leading-tight">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-stone-500 leading-relaxed">{cat.desc}</p>
                      </div>

                      {/* Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: "rgba(13,148,136,0.09)", color: "#0D9488", border: "1px solid rgba(13,148,136,0.18)" }}>
                          {cat.payout}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(15,61,54,0.05)", color: "#4A7572", border: "1px solid rgba(13,148,136,0.12)" }}>
                          {cat.level}
                        </span>
                      </div>

                      {/* CTA */}
                      {cat.status === "active" && (
                        <div className="mt-1">
                          <AuthButton href={cat.href} />
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <section className="py-24 px-6 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 className="font-bold text-xl text-[#0F3D36] mb-2">No tasks match that filter</h3>
          <p className="text-sm text-stone-500 mb-6">All current categories are active.</p>
          <button onClick={() => setFilter("all")}
            className="h-10 px-6 rounded-full text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#fff" }}>
            Show All Categories
          </button>
        </section>
      )}

      {/* Bottom Banner */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div
              className="rounded-2xl p-8 sm:p-12 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(13,148,136,0.07) 0%, rgba(45,212,191,0.04) 100%)",
                border: "1.5px solid rgba(13,148,136,0.18)",
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 14 }}>🚀</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "#0F3D36", marginBottom: 10 }}>
                New Tasks Added Regularly
              </h2>
              <p className="text-sm text-stone-600 max-w-md mx-auto mb-8">
                Task availability varies by day. Check your dashboard often — high-payout batches fill up fast.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="h-11 px-8 inline-flex items-center justify-center rounded-full font-bold text-sm transition-all duration-300 hover:shadow-[0_8px_28px_rgba(13,148,136,0.28)] hover:translate-y-[-2px]"
                  style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#fff" }}>
                  Start Earning Free →
                </Link>
                <Link
                  href="/earn/how-it-works"
                  className="h-11 px-8 inline-flex items-center justify-center rounded-full font-semibold text-sm transition-all duration-200 hover:bg-white"
                  style={{ background: "rgba(255,255,255,0.6)", color: "#0F3D36", border: "1.5px solid rgba(13,148,136,0.2)", backdropFilter: "blur(8px)" }}>
                  How It Works →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
