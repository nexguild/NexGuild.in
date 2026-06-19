import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works — NexGuild",
  description:
    "Learn how NexGuild works: sign up free, pick tasks, complete them from home, earn NexCoins, and redeem for Amazon, Flipkart, Paytm vouchers.",
  openGraph: {
    title: "How NexGuild Works",
    description: "Sign up, complete tasks, earn NexCoins, redeem for vouchers.",
    url: "https://nexguild.in/how-it-works",
  },
};

const STEPS = [
  {
    icon: "🆓",
    title: "Sign Up Free",
    body: "Create your account with your name, email, and country in 30 seconds. No experience or identity verification required to start.",
  },
  {
    icon: "✅",
    title: "Complete Your Profile",
    body: "Set your skills, language, and device capabilities so we can match you with the right tasks from day one.",
  },
  {
    icon: "🔎",
    title: "Browse & Apply for Tasks",
    body: "Explore available tasks across recordings, transcription, annotation, app testing, offerwalls, surveys, and more.",
  },
  {
    icon: "📤",
    title: "Submit Your Work",
    body: "Follow the task instructions, complete the work, and submit. Your submission enters our review queue immediately.",
  },
  {
    icon: "🎁",
    title: "Redeem for Vouchers",
    body: "Once you have enough NexCoins, visit the Store and redeem them for gift vouchers from Amazon, Flipkart, Paytm, and more.",
  },
];

const FAQS = [
  { q: "Is there a fee to join NexGuild?",           a: "No. Signing up is completely free. NexGuild earns through service fees from organizations — contributors keep what they earn from tasks." },
  { q: "How long does it take to get approved?",     a: "Approval times vary by task type. Micro-tasks may be reviewed within 24 hours. Audio, content, and survey tasks typically take 1–3 business days." },
  { q: "What happens if my submission is rejected?", a: "You will receive a notification with feedback explaining the reason. Depending on the task, you may be able to revise and resubmit." },
  { q: "How quickly are vouchers delivered?",        a: "Vouchers are delivered to your registered email within 48 hours of your redemption request being processed." },
  { q: "Which countries can join?",                  a: "NexGuild is open globally. Most tasks are open to contributors in India. Some tasks may restrict participation by country based on organization requirements." },
  { q: "How do I redeem NexCoins?",                  a: "Visit the Store in your dashboard and choose from Amazon, Flipkart, Paytm, PhonePe, and other gift vouchers. Select a voucher and confirm your redemption." },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-12 px-6">
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle, rgba(13,148,136,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            mask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-container text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
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
            <h1 
              className="text-4xl sm:text-6xl font-black text-[#0F3D36] tracking-tight mb-4"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              How It Works
            </h1>
            <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed text-balance">
              Five simple steps from sign-up to your first voucher redemption.
              Work from your phone. Redeem NexCoins for gift vouchers.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Steps List ───────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-5">
            {STEPS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 80}>
                <div 
                  className="flex gap-5 p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:translate-y-[-3px] hover:bg-white hover:shadow-sm border"
                  style={{
                    background: "rgba(255,255,255,0.45)",
                    border: "1.5px solid rgba(13,148,136,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{
                      background: "rgba(13,148,136,0.06)",
                      border: "1.5px solid rgba(13,148,136,0.15)",
                    }}
                  >
                    {step.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-0.5 italic">
                      Step 0{i + 1}
                    </span>
                    <h3 className="font-bold text-[#0F3D36] text-lg mb-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Action Buttons */}
          <FadeIn delay={400}>
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(13,148,136,0.15)]"
                style={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                }}
              >
                Create Your Account →
              </Link>
              <Link
                href="/opportunities"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-medium text-base transition-all duration-300 hover:translate-y-[-3px] hover:bg-stone-100"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(13,148,136,0.25)",
                  color: "#0F3D36",
                }}
              >
                Browse Opportunities
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Wallet Info Section ───────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(13,148,136,0.06)", borderBottom: "1px solid rgba(13,148,136,0.06)" }}>
        <div className="mx-auto max-w-3xl">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3D36] mb-12 text-center" style={{ fontFamily: "'Instrument Serif', serif" }}>
              NexCoins & Rewards
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FadeIn>
              <div 
                className="rounded-2xl p-6 h-full border"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  border: "1.5px solid rgba(13,148,136,0.12)",
                }}
              >
                <h3 className="font-bold text-[#0F3D36] text-lg mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>NexCoins Balance</h3>
                <ul className="space-y-4">
                  {[
                    { bg: "#EAB308", label: "Pending NexCoins", desc: "Coins from submitted work still under review." },
                    { bg: "#10B981", label: "Available NexCoins", desc: "Confirmed coins ready to redeem in the Store." },
                  ].map((item) => (
                    <li key={item.label} className="flex gap-3 items-start">
                      <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: item.bg }} />
                      <div>
                        <span className="font-semibold text-stone-800 text-sm">{item.label} — </span>
                        <span className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
            <FadeIn delay={100}>
              <div 
                className="rounded-2xl p-6 h-full border"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  border: "1.5px solid rgba(13,148,136,0.12)",
                }}
              >
                <h3 className="font-bold text-[#0F3D36] text-lg mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>Voucher Options</h3>
                <ul className="space-y-4">
                  {[
                    { method: "Amazon Gift Card",  detail: "Delivered by email. Valid on Amazon India." },
                    { method: "Flipkart Gift Card", detail: "Delivered by email. Valid on Flipkart." },
                    { method: "Paytm / PhonePe",   detail: "Wallet vouchers delivered by email." },
                  ].map((m) => (
                    <li key={m.method} className="flex gap-3 items-start">
                      <div className="h-2 w-2 rounded-full bg-[#0D9488] mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-stone-800 text-sm">{m.method} — </span>
                        <span className="text-xs sm:text-sm text-stone-600 leading-relaxed">{m.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Ad Banner Segment */}
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

      {/* ── FAQ Section ──────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3D36] mb-12 text-center" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Frequently Asked Questions
            </h2>
          </FadeIn>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 40}>
                <details 
                  className="group rounded-2xl border transition-all duration-300"
                  style={{
                    background: "rgba(255,255,255,0.45)",
                    border: "1.5px solid rgba(13,148,136,0.12)",
                  }}
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 select-none">
                    <span className="font-bold text-[#0F3D36] text-sm sm:text-base">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-[#0D9488] flex-shrink-0 group-open:rotate-180 transition-transform duration-300" />
                  </summary>
                  <div className="px-5 pb-5 pt-1 border-t border-dashed border-stone-200/60 mt-1">
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={100} className="mt-10 text-center">
            <Link href="/faq" className="text-sm text-[#0D9488] font-semibold hover:underline flex items-center justify-center gap-1">
              View full FAQ →
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}