import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { AdSlot } from "@/components/ui/ad-slot";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — Earn Online India | NexGuild",
  description:
    "Learn how NexGuild works: sign up free, pick tasks, complete them from home, earn NexCoins, and redeem for Amazon, Flipkart, Google Play vouchers.",
  keywords: [
    "how to earn online India",
    "NexGuild how it works",
    "earn NexCoins guide",
    "online tasks guide India",
    "earn gift vouchers India",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn/how-it-works" },
  openGraph: {
    title: "How NexGuild Works",
    description: "Sign up, complete tasks, earn NexCoins, redeem for gift vouchers.",
    url: "https://www.nexguild.in/earn/how-it-works",
    type: "website",
  },
};

const STEPS = [
  {
    num: "01",
    icon: "🆓",
    title: "Sign Up Free",
    body: "Create your account with your name, email, and country in 30 seconds. No experience or identity verification needed to get started.",
    tip: "Use your primary email — vouchers and approval notifications are delivered there.",
  },
  {
    num: "02",
    icon: "✅",
    title: "Complete Your Profile",
    body: "Set your skills, languages, and device capabilities so we can match you with the right tasks from day one.",
    tip: "Mark all languages you speak fluently — bilingual contributors unlock more task types.",
  },
  {
    num: "03",
    icon: "🔎",
    title: "Browse & Apply for Tasks",
    body: "Explore available tasks across recordings, transcription, annotation, app testing, offerwalls, surveys, and more.",
    tip: "Check the dashboard every morning — the best batches fill up fast.",
  },
  {
    num: "04",
    icon: "📤",
    title: "Submit Your Work",
    body: "Follow the task instructions carefully, complete the work, and submit. Your submission enters our review queue immediately.",
    tip: "Your first few submissions set your quality score. Take the extra time.",
  },
  {
    num: "05",
    icon: "🎁",
    title: "Redeem for Vouchers",
    body: "Once you have enough NexCoins, visit the Store in your dashboard and redeem for gift vouchers from Amazon, Flipkart, Paytm, and more.",
    tip: "Amazon and Flipkart vouchers have the broadest acceptance across India.",
  },
];

const FAQS = [
  { q: "Is there a fee to join NexGuild?",           a: "No. Signing up is completely free. NexGuild earns through service fees from organizations — contributors keep what they earn from tasks." },
  { q: "How long does it take to get approved?",     a: "Approval times vary by task type. Micro-tasks may be reviewed within 24 hours. Audio, content, and survey tasks typically take 1–3 business days." },
  { q: "What happens if my submission is rejected?", a: "You will receive a notification with feedback explaining the reason. Depending on the task, you may be able to revise and resubmit." },
  { q: "How quickly are vouchers delivered?",        a: "Vouchers are delivered to your registered email within 48 hours of your redemption request being processed." },
  { q: "Which countries can join?",                  a: "NexGuild is open globally. Most tasks are available to contributors in India. Some tasks may restrict participation by country based on organization requirements." },
  { q: "How do I redeem NexCoins?",                  a: "Visit the Store in your dashboard and choose from Amazon, Flipkart, Paytm, PhonePe, and other gift vouchers. Select a voucher and confirm your redemption." },
];

const VOUCHERS = [
  { name: "Amazon",   icon: "🛒" },
  { name: "Flipkart", icon: "📦" },
  { name: "Paytm",    icon: "💙" },
  { name: "PhonePe",  icon: "💜" },
  { name: "Swiggy",   icon: "🛵" },
  { name: "Zomato",   icon: "🍽️" },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      <AdSlot placement="how-it-works-top" />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-16 px-6">
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "radial-gradient(circle, rgba(13,148,136,0.14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          mask: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%)",
          WebkitMask: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%)",
        }} />

        <div className="relative z-10 mx-auto max-w-container text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.2)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0D9488", display: "inline-block" }} />
              <span className="text-xs font-bold text-[#115E59] uppercase tracking-wider">For Contributors</span>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 className="text-4xl sm:text-6xl font-black text-[#0F3D36] tracking-tight mb-5"
              style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}>
              Five Steps to Your<br className="hidden sm:block" /> First Voucher
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed">
              From sign-up to redeeming your first Amazon or Flipkart gift card — everything you need to know.
            </p>
          </FadeIn>
          <FadeIn delay={240}>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {[
                { value: "30 sec", label: "to sign up" },
                { value: "5 steps", label: "to your first voucher" },
                { value: "48 hrs", label: "voucher delivery" },
              ].map((s) => (
                <div key={s.label}
                  className="px-5 py-2.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.15)" }}>
                  <span className="font-black text-[#0D9488] text-sm">{s.value}</span>
                  <span className="text-xs text-stone-500 ml-2">{s.label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────────── */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-2xl">
          <div style={{ position: "relative" }}>
            <div aria-hidden style={{
              position: "absolute", left: "19px", top: "20px", bottom: "20px", width: "2px",
              background: "linear-gradient(to bottom, #0D9488 0%, rgba(13,148,136,0.06) 90%)",
              pointerEvents: "none",
            }} />
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 90}>
                <div style={{ display: "flex", gap: "24px", marginBottom: i < STEPS.length - 1 ? "24px" : 0 }}>
                  <div style={{
                    flexShrink: 0, width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)",
                    color: "#fff", fontWeight: 900, fontSize: "13px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(13,148,136,0.35)",
                    zIndex: 1, position: "relative", border: "2.5px solid #EBFBFA", letterSpacing: "-0.02em",
                  }}>
                    {step.num}
                  </div>
                  <div
                    className="flex-1 rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_12px_40px_rgba(13,148,136,0.12)]"
                    style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(13,148,136,0.14)", backdropFilter: "blur(12px)", position: "relative" }}
                  >
                    <div aria-hidden style={{
                      position: "absolute", right: -8, bottom: -24, fontSize: 110, fontWeight: 900,
                      color: "rgba(13,148,136,0.045)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
                      fontFamily: "'Instrument Serif', serif",
                    }}>
                      {step.num}
                    </div>
                    <div style={{ position: "relative", zIndex: 1, padding: "20px 24px 20px" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{step.icon}</div>
                      <h3 className="font-bold text-[#0F3D36] text-lg mb-2" style={{ fontFamily: "'Instrument Serif', serif" }}>{step.title}</h3>
                      <p className="text-sm text-stone-600 leading-relaxed mb-4">{step.body}</p>
                      <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(13,148,136,0.06)", borderLeft: "3px solid #0D9488" }}>
                        <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wide">Tip — </span>
                        <span className="text-xs text-stone-500">{step.tip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={480}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup"
                className="w-full sm:w-auto h-12 px-10 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_10px_28px_rgba(13,148,136,0.25)]"
                style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", color: "#ECFDF5" }}>
                Create Your Account →
              </Link>
              <Link href="/earn/tasks"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-medium text-base transition-all duration-300 hover:bg-white hover:shadow-md"
                style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.22)", color: "#0F3D36" }}>
                Browse All Tasks →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── NexCoins & Vouchers ───────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "rgba(13,148,136,0.04)", borderTop: "1px solid rgba(13,148,136,0.1)", borderBottom: "1px solid rgba(13,148,136,0.1)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">The Reward System</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>
                NexCoins → Real Vouchers
              </h2>
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              {[
                { label: "Complete Task", sub: "Submit quality work", icon: "📤", bg: "rgba(13,148,136,0.08)", border: "rgba(13,148,136,0.2)" },
                { label: "Earn NexCoins", sub: "After approval",      icon: "🪙", bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.2)"  },
                { label: "Visit Store",   sub: "Pick a voucher",      icon: "🛍️", bg: "rgba(59,130,246,0.07)", border: "rgba(59,130,246,0.18)" },
                { label: "Get Voucher",   sub: "Emailed in 48 hrs",   icon: "🎁", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)"  },
              ].map((node, i) => (
                <div key={node.label} className="flex items-center gap-3">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 transition-transform duration-300 hover:scale-105"
                      style={{ background: node.bg, border: `1.5px solid ${node.border}` }}
                    >
                      <span style={{ fontSize: 28 }}>{node.icon}</span>
                    </div>
                    <div className="font-bold text-[#0F3D36] text-sm">{node.label}</div>
                    <div className="text-xs text-stone-400 mt-0.5">{node.sub}</div>
                  </div>
                  {i < 3 && <div className="hidden sm:flex items-center text-stone-300 text-xl font-thin mb-5" aria-hidden>→</div>}
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={160}>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-5">Redeem at</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {VOUCHERS.map((v) => (
                  <div key={v.name}
                    className="flex items-center gap-2.5 h-10 px-5 rounded-full font-semibold text-sm transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md"
                    style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(13,148,136,0.12)", color: "#0F3D36", backdropFilter: "blur(8px)" }}>
                    <span style={{ fontSize: 18 }}>{v.icon}</span>
                    {v.name}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0D9488] mb-2">Questions</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0F3D36]" style={{ fontFamily: "'Instrument Serif', serif" }}>Frequently Asked</h2>
            </div>
          </FadeIn>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 40}>
                <details className="group rounded-2xl transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(13,148,136,0.12)", backdropFilter: "blur(12px)" }}>
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 select-none">
                    <span className="font-bold text-[#0F3D36] text-sm sm:text-base">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-[#0D9488] flex-shrink-0 group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <div className="px-5 pb-5 pt-2" style={{ borderTop: "1px solid rgba(13,148,136,0.08)" }}>
                    <p className="text-sm text-stone-600 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={120} className="mt-8 text-center">
            <Link href="/earn/faq" className="text-sm font-semibold text-[#0D9488] hover:underline">See full FAQ →</Link>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, background: "radial-gradient(circle at 30% 50%, rgba(13,148,136,0.12) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(45,212,191,0.08) 0%, transparent 60%)" }} />
        <div className="relative z-10 mx-auto max-w-container">
          <FadeIn>
            <div className="rounded-3xl px-8 sm:px-16 py-14 text-center"
              style={{ background: "linear-gradient(160deg, rgba(13,148,136,0.1) 0%, rgba(45,212,191,0.06) 100%)", border: "1.5px solid rgba(13,148,136,0.2)", backdropFilter: "blur(16px)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
              <h2 className="text-3xl sm:text-5xl font-black text-[#0F3D36] mb-4" style={{ fontFamily: "'Instrument Serif', serif", textWrap: "balance" }}>
                Ready to Start Earning?
              </h2>
              <p className="text-sm sm:text-base text-stone-600 mb-10 max-w-md mx-auto">
                Join contributors across India. Sign up free, complete your first task today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/signup"
                  className="w-full sm:w-auto h-12 px-10 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_10px_28px_rgba(13,148,136,0.25)]"
                  style={{ background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)", color: "#ECFDF5" }}>
                  Start Earning Free →
                </Link>
                <Link href="/earn/tasks"
                  className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-medium text-sm transition-all duration-200 hover:bg-white"
                  style={{ background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(13,148,136,0.22)", color: "#0F3D36", backdropFilter: "blur(8px)" }}>
                  Browse All 12 Tasks →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
