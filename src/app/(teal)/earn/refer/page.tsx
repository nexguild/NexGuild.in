"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { supabase } from "@/lib/supabase";
import { Crown, Users, TrendingUp, ArrowRight, Zap } from "lucide-react";

const HOW_STEPS = [
  { num: "01", icon: "👑", accent: "#0D9488", title: "Apply to Become a NexLeader", desc: "Submit your application once you've earned 500 NexCoins and your account is 7+ days old." },
  { num: "02", icon: "📲", accent: "#0284C7", title: "Build Your Guild",             desc: "Share your referral link. Every person who joins through you becomes part of your guild." },
  { num: "03", icon: "💼", accent: "#7C3AED", title: "Your Guild Earns",             desc: "Guild members complete tasks and offerwall offers — earning NexCoins on every activity." },
  { num: "04", icon: "🪙", accent: "#F59E0B", title: "You Earn 10% Forever",         desc: "You automatically receive 10% of every NexCoin your guild members earn — with no cap, no expiry." },
];

const BENEFITS = [
  { icon: <TrendingUp className="h-5 w-5" />, accent: "#0D9488", title: "Passive Income",     desc: "Earn while your guild works. You don't need to complete extra tasks — your guild earns for you." },
  { icon: <Zap className="h-5 w-5" />,        accent: "#F59E0B", title: "No Cap, No Expiry",  desc: "There's no limit on guild size or commission earnings. The bigger your guild, the more you earn." },
  { icon: <Users className="h-5 w-5" />,      accent: "#7C3AED", title: "Guild Dashboard",    desc: "Track your guild members, their activity, and your commission history in real time." },
  { icon: <Crown className="h-5 w-5" />,      accent: "#0284C7", title: "NexLeader Status",   desc: "Approved NexLeaders get a badge, priority support, and early access to new earning features." },
];

const REQUIREMENTS = [
  { icon: "📅", label: "Account Age",       value: "7+ days" },
  { icon: "🪙", label: "NexCoins Earned",   value: "500 minimum" },
  { icon: "👥", label: "Community",         value: "Any network you can recruit from" },
  { icon: "✅", label: "Account Status",    value: "Active & in good standing" },
];

export default function NexLeaderPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isNexLeader, setIsNexLeader] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      setLoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_nexleader")
        .eq("id", data.session.user.id)
        .single();
      setIsNexLeader(!!(profile as { is_nexleader?: boolean } | null)?.is_nexleader);
    });
  }, []);

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-14 px-6 text-center">
        <div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(13,148,136,0.13) 0%, rgba(245,158,11,0.06) 50%, transparent 80%)" }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(245,158,11,0.25)", backdropFilter: "blur(12px)" }}>
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">NexLeader Program</span>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 900, color: "#0F3D36", lineHeight: 1.08, marginBottom: 16 }}>
              Lead a Guild.<br />
              <span style={{ color: "#0D9488" }}>Earn While They Do.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-base sm:text-lg leading-relaxed text-stone-500 max-w-xl mx-auto mb-8">
              NexLeaders build and lead a guild of contributors. Every time a guild member earns NexCoins, you automatically receive <strong className="text-[#0F3D36]">10% commission</strong> — permanently, with no cap.
            </p>
          </FadeIn>
          <FadeIn delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {isNexLeader ? (
                <Link href="/dashboard/nexleader"
                  className="h-12 px-10 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(13,148,136,0.35)]"
                  style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#ECFDF5" }}>
                  <Crown className="h-4 w-4" /> Go to My Guild
                </Link>
              ) : loggedIn ? (
                <Link href="/dashboard/nexleader"
                  className="h-12 px-10 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(13,148,136,0.35)]"
                  style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#ECFDF5" }}>
                  Apply for NexLeader <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link href="/signup"
                    className="h-12 px-10 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(13,148,136,0.35)]"
                    style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#ECFDF5" }}>
                    Start Earning Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/login"
                    className="h-12 px-8 inline-flex items-center rounded-full font-semibold text-sm transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.2)", color: "#0F3D36" }}>
                    Already a member? Log in
                  </Link>
                </>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Commission highlight band ── */}
      <section style={{ background: "#0F3D36", borderTop: "1px solid rgba(45,212,191,0.12)", borderBottom: "1px solid rgba(45,212,191,0.12)" }}>
        <div className="mx-auto max-w-container py-8 px-6">
          <FadeIn>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
              {[
                { value: "10%",       label: "Commission on every earn" },
                { value: "No Cap",    label: "On guild size or earnings" },
                { value: "Forever",   label: "Ongoing — not just first task" },
                { value: "Auto",      label: "Credited instantly, no claims" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl sm:text-4xl font-black" style={{ color: "#2DD4BF", fontFamily: "'Instrument Serif', serif" }}>{s.value}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Step by Step</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F3D36] tracking-tight"
                style={{ fontFamily: "'Instrument Serif', serif" }}>
                How NexLeader Works
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_STEPS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 70}>
                <div className="relative rounded-2xl p-6 h-full flex flex-col gap-4 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(13,148,136,0.1)]"
                  style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(13,148,136,0.13)", backdropFilter: "blur(12px)", borderTop: `3px solid ${step.accent}` }}>
                  <div aria-hidden className="absolute right-4 top-4 font-black text-5xl leading-none select-none"
                    style={{ color: `${step.accent}14`, fontFamily: "'Instrument Serif', serif" }}>
                    {step.num}
                  </div>
                  <div className="text-3xl">{step.icon}</div>
                  <div>
                    <h3 className="font-bold text-[#0F3D36] text-sm mb-1.5">{step.title}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real example ── */}
      <section className="py-12 px-6" style={{ background: "rgba(255,255,255,0.28)", borderTop: "1px solid rgba(13,148,136,0.08)", borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="rounded-3xl p-8 sm:p-10 text-center"
              style={{ background: "linear-gradient(145deg, #0F3D36, #0D5C52)", border: "1px solid rgba(45,212,191,0.15)" }}>
              <div aria-hidden style={{ fontSize: 40, marginBottom: 12 }}>🧮</div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#2DD4BF" }}>Example Earnings</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-6" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Guild of 50 Active Members
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Guild earns per day",   value: "5,000", unit: "NexCoins" },
                  { label: "Your 10% commission",   value: "500",   unit: "NexCoins/day" },
                  { label: "Your monthly passive",  value: "15,000",unit: "NexCoins" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-xl sm:text-2xl font-black text-[#2DD4BF]" style={{ fontFamily: "'Instrument Serif', serif" }}>{s.value}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wide mt-1">{s.unit}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40">Earnings vary based on guild activity. No guaranteed amounts.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Why NexLeader</p>
              <h2 className="text-3xl font-black text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                More Than Referrals
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <FadeIn key={b.title} delay={i * 60} className="h-full">
                <div className="group flex gap-5 p-5 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:shadow-lg"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(13,148,136,0.1)", backdropFilter: "blur(12px)", borderLeft: `3px solid ${b.accent}` }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${b.accent}14`, border: `1.5px solid ${b.accent}30`, color: b.accent }}>
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F3D36] mb-1.5">{b.title}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Requirements ── */}
      <section className="py-12 px-6" style={{ background: "rgba(255,255,255,0.22)", borderTop: "1px solid rgba(13,148,136,0.08)", borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Eligibility</p>
              <h2 className="text-2xl font-black text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Requirements to Apply
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {REQUIREMENTS.map((r) => (
                <div key={r.label} className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1.5px solid rgba(13,148,136,0.12)" }}>
                  <span className="text-2xl flex-shrink-0">{r.icon}</span>
                  <div>
                    <div className="text-xs text-stone-400 font-medium">{r.label}</div>
                    <div className="text-sm font-bold text-[#0F3D36]">{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "#EBFBFA", padding: "3rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center"
              style={{ background: "#0F3D36" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(45,212,191,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 80% 50%, rgba(13,148,136,0.1) 0%, transparent 60%)" }} />
              <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(45,212,191,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <Crown className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Limited Spots Available</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight"
                  style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}>
                  Ready to Lead a Guild?
                </h2>
                <p className="text-white/55 text-sm sm:text-base mb-8 max-w-lg mx-auto">
                  Meet the requirements, apply from your dashboard, and start building your passive income stream.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {loggedIn ? (
                    <Link href="/dashboard/nexleader"
                      className="h-12 px-10 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(13,148,136,0.4)]"
                      style={{ background: "linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)", color: "#0A2520" }}>
                      <Crown className="h-4 w-4" />
                      {isNexLeader ? "Go to My Guild" : "Apply Now"}
                    </Link>
                  ) : (
                    <Link href="/signup"
                      className="h-12 px-10 inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(13,148,136,0.4)]"
                      style={{ background: "linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)", color: "#0A2520" }}>
                      Join NexGuild Free <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
