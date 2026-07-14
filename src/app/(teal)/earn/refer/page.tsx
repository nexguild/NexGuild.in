"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { supabase } from "@/lib/supabase";
import { Copy, Check, MessageCircle } from "lucide-react";

const CHAIN_NODES = [
  { icon: "👤", label: "You",            sub: "Share your link",       bg: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", shadow: "rgba(13,148,136,0.35)" },
  { icon: "📲", label: "Friend Sees It", sub: "WhatsApp, Instagram…",  bg: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", shadow: "rgba(2,132,199,0.3)"   },
  { icon: "✅", label: "Friend Joins",   sub: "Signs up & completes",  bg: "linear-gradient(135deg, #10B981 0%, #059669 100%)", shadow: "rgba(16,185,129,0.3)"  },
  { icon: "🪙", label: "Both Earn",      sub: "Coins credited auto",   bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", shadow: "rgba(245,158,11,0.35)"  },
];

const TERMS = [
  "Referred friend must sign up using your link and complete at least one approved task within 30 days.",
  "NexCoins are credited automatically once the qualifying task is approved.",
  "Self-referrals, duplicate accounts, or fraudulent referrals are not eligible.",
  "NexGuild reserves the right to modify referral rewards with prior notice.",
];

function ReferralWidget() {
  const [loading,  setLoading]  = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [link,     setLink]     = useState("");
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setLoading(false); return; }
      setLoggedIn(true);
      const uid = data.session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", uid)
        .single();
      const code = (profile as { referral_code?: string } | null)?.referral_code;
      if (code) setLink(`https://www.nexguild.in/signup?ref=${code}`);
      setLoading(false);
    });
  }, []);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = () => {
    const text = encodeURIComponent(
      `Hey! I'm using NexGuild to earn real gift vouchers by completing tasks from my phone. Join me here: ${link}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="rounded-3xl p-10 text-center animate-pulse"
        style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(13,148,136,0.14)" }}>
        <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto" />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(13,148,136,0.2)", backdropFilter: "blur(16px)" }}
      >
        {/* Header bar */}
        <div className="px-7 py-4 flex items-center gap-3"
          style={{ background: "linear-gradient(90deg, rgba(13,148,136,0.08), rgba(45,212,191,0.04))", borderBottom: "1px solid rgba(13,148,136,0.1)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#94A3B8", display: "inline-block" }} />
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Your Referral Link</span>
          <span className="ml-auto text-xs text-stone-400">Locked</span>
        </div>

        <div className="px-7 py-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "rgba(13,148,136,0.07)", border: "1.5px solid rgba(13,148,136,0.15)" }}
          >
            🔒
          </div>
          <h3 className="font-black text-xl text-[#0F3D36] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Sign up to get your link
          </h3>
          <p className="text-sm text-stone-500 mb-7 max-w-xs mx-auto leading-relaxed">
            Create a free NexGuild account. Your personal referral link is generated instantly on sign-up.
          </p>
          <Link
            href="/signup"
            className="h-12 px-8 inline-flex items-center rounded-full font-bold text-sm transition-all duration-300 hover:shadow-[0_10px_28px_rgba(13,148,136,0.28)] hover:translate-y-[-2px]"
            style={{ background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "#ECFDF5" }}
          >
            Sign Up Free →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.82)", border: "1.5px solid rgba(13,148,136,0.2)", backdropFilter: "blur(16px)" }}
    >
      {/* Header bar */}
      <div className="px-7 py-4 flex items-center gap-3"
        style={{ background: "linear-gradient(90deg, rgba(13,148,136,0.08), rgba(45,212,191,0.04))", borderBottom: "1px solid rgba(13,148,136,0.1)" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
        <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">Your Referral Link</span>
        <span className="ml-auto text-xs text-[#0D9488] font-semibold">Active</span>
      </div>

      <div className="p-7">
        {link ? (
          <>
            {/* Link box */}
            <div className="flex gap-3 mb-5">
              <div
                className="flex-1 px-5 py-3.5 rounded-2xl text-sm font-mono truncate"
                style={{ background: "rgba(13,148,136,0.06)", border: "1.5px solid rgba(13,148,136,0.18)", color: "#0D9488" }}
              >
                {link}
              </div>
              <button
                onClick={copy}
                className="h-[52px] w-[52px] flex-shrink-0 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: copied ? "linear-gradient(135deg,#22C55E,#16A34A)" : "linear-gradient(135deg,#0D9488,#0F766E)", color: "#fff", boxShadow: "0 4px 16px rgba(13,148,136,0.25)" }}
                title="Copy link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Share row */}
            <div className="flex gap-3">
              <button
                onClick={whatsapp}
                className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-1px] active:translate-y-0"
                style={{ background: "rgba(34,197,94,0.1)", color: "#15803D", border: "1.5px solid rgba(34,197,94,0.2)" }}
              >
                <MessageCircle className="w-4 h-4" />
                Share on WhatsApp
              </button>
              <button
                onClick={copy}
                className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-1px] active:translate-y-0"
                style={{ background: "rgba(13,148,136,0.08)", color: "#0D9488", border: "1.5px solid rgba(13,148,136,0.18)" }}
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-stone-500 text-center py-4">
            Referral link not set up yet. Complete your profile in the{" "}
            <Link href="/dashboard/profile" className="text-[#0D9488] underline font-semibold">dashboard</Link>.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReferPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-10 px-6 text-center">
        <div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 70% at 50% 0%, rgba(16,185,129,0.11) 0%, rgba(13,148,136,0.1) 40%, transparent 80%)" }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.55)", border: "1.5px solid rgba(13,148,136,0.2)", backdropFilter: "blur(12px)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider">Referral Program · No Cap</span>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(36px,5.5vw,60px)", fontWeight: 900, color: "#0F3D36", lineHeight: 1.08, marginBottom: 14 }}>
              Invite Friends.<br /> Earn Together.
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-base sm:text-lg leading-relaxed text-stone-600 max-w-lg mx-auto">
              Share your unique link. Earn NexCoins for every friend who joins and completes a task. No limit. No expiry.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Visual Chain ── */}
      <section className="pb-16 px-6">
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            {/* Desktop: horizontal chain */}
            <div className="hidden sm:flex items-end justify-center gap-0">
              {CHAIN_NODES.map((node, i) => (
                <div key={node.label} className="flex items-end">
                  {/* Node */}
                  <div className="flex flex-col items-center" style={{ minWidth: 120 }}>
                    <div
                      className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-3xl transition-transform duration-300 hover:scale-110 cursor-default"
                      style={{ background: node.bg, boxShadow: `0 8px 28px ${node.shadow}` }}
                    >
                      {node.icon}
                    </div>
                    <div className="mt-3 text-center">
                      <div className="font-black text-sm text-[#0F3D36]">{node.label}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{node.sub}</div>
                    </div>
                  </div>

                  {/* Arrow between nodes */}
                  {i < CHAIN_NODES.length - 1 && (
                    <div className="flex-1 flex flex-col items-center" style={{ paddingBottom: 36, minWidth: 32 }}>
                      <div style={{
                        height: 2,
                        width: "100%",
                        background: "repeating-linear-gradient(90deg, rgba(13,148,136,0.45) 0, rgba(13,148,136,0.45) 8px, transparent 8px, transparent 14px)",
                      }} />
                      <span className="text-[#0D9488] text-base" style={{ marginTop: -10, fontSize: 18 }}>›</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: 2x2 grid */}
            <div className="sm:hidden grid grid-cols-2 gap-6">
              {CHAIN_NODES.map((node) => (
                <div key={node.label} className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: node.bg, boxShadow: `0 6px 20px ${node.shadow}` }}
                  >
                    {node.icon}
                  </div>
                  <div className="font-black text-sm text-[#0F3D36] mt-2">{node.label}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{node.sub}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Widget (Hero of the page) ── */}
      <section className="py-10 px-6">
        <div className="mx-auto max-w-lg">
          <FadeIn>
            <div className="text-center mb-5">
              <p className="text-xs font-bold text-[#0D9488] uppercase tracking-widest">Your Personal Link</p>
            </div>
            <ReferralWidget />
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={120}>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {[
                { icon: "♾️", text: "No cap on invites" },
                { icon: "⚡", text: "Auto coin credit" },
                { icon: "📱", text: "Share anywhere" },
              ].map((b) => (
                <span key={b.text} className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span>{b.icon}</span>{b.text}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── How It Works steps ── */}
      <section className="py-16 px-6" style={{ background: "rgba(255,255,255,0.22)", borderTop: "1px solid rgba(13,148,136,0.08)", borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Step by Step</p>
              <h2 className="text-3xl font-black text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                How Referrals Work
              </h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: "01", icon: "🔗", title: "Get Your Link",   desc: "Sign up and find your personal referral link here or in your dashboard." },
              { num: "02", icon: "📲", title: "Share It",         desc: "Send it via WhatsApp, Instagram, or college groups. No limit on who you invite." },
              { num: "03", icon: "✅", title: "They Join & Earn", desc: "Your friend signs up and completes their first approved task within 30 days." },
              { num: "04", icon: "🪙", title: "You Both Earn",    desc: "You receive NexCoins automatically. Your friend earns a welcome bonus too." },
            ].map((step, i) => (
              <FadeIn key={step.num} delay={i * 60}>
                <div
                  className="rounded-2xl p-6 h-full flex flex-col gap-4 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_12px_32px_rgba(13,148,136,0.1)]"
                  style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(13,148,136,0.13)", backdropFilter: "blur(12px)" }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(45,212,191,0.06))", border: "1px solid rgba(13,148,136,0.15)" }}
                    >
                      {step.icon}
                    </div>
                    <span className="font-black text-3xl" style={{ color: "rgba(13,148,136,0.12)", fontFamily: "'Instrument Serif', serif" }}>
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F3D36] mb-1.5">{step.title}</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Refer ── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.07) 0%, rgba(16,185,129,0.05) 100%)", border: "1.5px solid rgba(13,148,136,0.18)" }}>
              <div className="p-8 sm:p-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  {[
                    { icon: "♾️", stat: "No cap",    label: "Invite as many friends as you want — every conversion earns coins." },
                    { icon: "⚡", stat: "Instant",   label: "Coins credited the moment your referral's first task is approved." },
                    { icon: "🎁", stat: "Bonus",     label: "Your friend also gets a welcome bonus — making it easy to share." },
                  ].map((b) => (
                    <div key={b.stat}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>{b.icon}</div>
                      <div className="font-black text-2xl text-[#0D9488] mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{b.stat}</div>
                      <p className="text-sm text-stone-500 leading-relaxed">{b.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Terms ── */}
      <section className="pb-16 px-6">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(13,148,136,0.1)", backdropFilter: "blur(12px)" }}>
              <p className="text-xs font-bold text-[#0D9488] uppercase tracking-widest mb-4">Referral Terms</p>
              <ul className="space-y-2.5">
                {TERMS.map((t) => (
                  <li key={t} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 text-[#0D9488] font-bold text-xs mt-0.5">—</span>
                    <span className="text-xs text-stone-500 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
