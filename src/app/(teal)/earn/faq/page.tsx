import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { AdSlot } from "@/components/ui/ad-slot";
import { ArrowRight, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — NexGuild",
  description: "Frequently asked questions about earning on NexGuild — tasks, NexCoins, voucher redemption, rejection policy, and more.",
  alternates: { canonical: "https://www.nexguild.in/earn/faq" },
  openGraph: {
    title: "FAQ — NexGuild",
    description: "Answers to common questions about tasks, NexCoins, and vouchers.",
    url: "https://www.nexguild.in/earn/faq",
    type: "website",
  },
};

const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    faqs: [
      { q: "Is it free to join NexGuild?",         a: "Yes, completely free. There are no joining fees, subscription charges, or hidden costs. You sign up, complete tasks, and get paid." },
      { q: "What countries can join?",              a: "NexGuild is open globally. Most tasks are available worldwide. Some tasks may be restricted by country based on the organization's requirements. India-based contributors have access to the most tasks." },
      { q: "Do I need any experience?",             a: "No. Most tasks on NexGuild require no prior experience. Instructions are provided for each task. Some higher-level tasks (content writing, advanced annotation) may prefer experience, but it is not mandatory to start." },
      { q: "How do I create an account?",           a: "Visit nexguild.in/signup, enter your name, email, password, and country. Agree to the Terms of Service and click Create Account. You can start browsing tasks immediately." },
    ],
  },
  {
    section: "Earning & Tasks",
    faqs: [
      { q: "What types of tasks are available?",    a: "NexGuild offers audio recording, transcription, data annotation, app testing, game testing, surveys, offerwalls, social media tasks, web research, and data collection. New task types are added regularly." },
      { q: "How do I know what a task pays?",        a: "Each task shows its pay rate before you start. You will always know what you will earn before committing to a task." },
      { q: "How long does each task take?",          a: "It varies by task type. Some micro-tasks take 1–5 minutes. Surveys typically take 5–20 minutes. Audio recordings and testing tasks can take longer. Each task shows an estimated time." },
      { q: "What are offerwalls?",                   a: "Offerwalls are partner tasks from third-party providers like Lootably. They include surveys, app installs, and other activities. Earnings from offerwalls are automatically credited to your wallet after the provider confirms completion." },
    ],
  },
  {
    section: "NexCoins & Vouchers",
    faqs: [
      { q: "How does my NexCoins balance work?",             a: "Your NexCoins balance shows confirmed coins ready to redeem. Coins from tasks still under review are shown as pending and cannot be redeemed yet." },
      { q: "What can I redeem NexCoins for?",                a: "You can redeem NexCoins for Amazon, Flipkart, Paytm, PhonePe, Swiggy, Zomato, and Google Play gift vouchers. Visit the Store in your dashboard." },
      { q: "Is there a minimum NexCoins requirement?",       a: "Each voucher has a fixed NexCoins cost shown in the Store. There is no separate minimum — just choose a voucher your balance covers." },
      { q: "How long does voucher delivery take?",           a: "Vouchers are delivered to your registered email within 48 hours after your redemption request is processed by our team." },
    ],
  },
  {
    section: "Task Review & Quality",
    faqs: [
      { q: "What happens after I submit a task?",   a: "Your submission enters the review queue. Our team checks it against the task requirements. If approved, earnings move to your wallet. If rejected, you receive feedback explaining why." },
      { q: "Why was my submission rejected?",        a: "Submissions are rejected when they do not meet the task's quality requirements — incomplete answers, poor audio quality, inaccurate labels, etc. You will always receive feedback with the rejection." },
      { q: "Can I resubmit a rejected task?",        a: "Some tasks allow resubmission. The task details will indicate if revision is permitted. Follow the feedback you received to improve your submission." },
      { q: "How is my approval rate calculated?",    a: "Your approval rate is the percentage of your submitted tasks that were approved. A higher approval rate unlocks access to better-paying tasks." },
    ],
  },
  {
    section: "Account & Support",
    faqs: [
      { q: "How do I contact support?",              a: "Use the Contact page on our website or email admin@nexguild.in. We respond within 24 hours." },
      { q: "Can I use multiple accounts?",           a: "No. Multiple accounts are against NexGuild's Terms of Service and will result in a permanent ban. One account per person." },
      { q: "What happens if I'm banned?",            a: "Banned accounts lose all pending and available balances. If you believe a ban was made in error, contact us within 7 days with evidence." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      <AdSlot placement="faq-top" />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        <div aria-hidden className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)", filter: "blur(100px)", top: "-150px", left: "50%", transform: "translateX(-50%)" }} />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[#0D9488] text-xs font-bold uppercase tracking-widest mb-3">FAQ</p>
            <h1 className="text-4xl sm:text-6xl font-black text-[#0F3D36] mb-4 tracking-tight"
              style={{ fontFamily: "'Instrument Serif', serif" }}>
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed text-balance">
              Everything you need to know about earning NexCoins, redeeming vouchers, and how NexGuild works.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 px-6"
        style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(13,148,136,0.06)", borderBottom: "1px solid rgba(13,148,136,0.06)" }}>
        <div className="mx-auto max-w-2xl space-y-14">
          {FAQ_SECTIONS.map((section, si) => (
            <FadeIn key={section.section} delay={si * 60}>
              <div>
                <h2 className="text-2xl font-bold text-[#0F3D36] mb-6 flex items-center gap-4 select-none"
                  style={{ fontFamily: "'Instrument Serif', serif" }}>
                  <span className="h-px flex-1 bg-stone-300/60" />
                  {section.section}
                  <span className="h-px flex-1 bg-stone-300/60" />
                </h2>
                <div className="space-y-3">
                  {section.faqs.map((faq) => (
                    <details key={faq.q} className="group rounded-2xl border transition-all duration-300"
                      style={{ background: "rgba(255,255,255,0.45)", border: "1.5px solid rgba(13,148,136,0.12)" }}>
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 select-none">
                        <span className="font-bold text-[#0F3D36] text-sm sm:text-base">{faq.q}</span>
                        <ChevronDown className="h-4 w-4 text-[#0D9488] flex-shrink-0 group-open:rotate-180 transition-transform duration-300" />
                      </summary>
                      <div className="px-5 pb-5 pt-1 border-t border-dashed border-stone-200/60 mt-1">
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center relative overflow-hidden">
        <FadeIn>
          <div className="mx-auto max-w-container">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F3D36] mb-3"
              style={{ fontFamily: "'Instrument Serif', serif" }}>
              Still have questions?
            </h2>
            <p className="text-sm sm:text-base text-stone-600 mb-8 max-w-md mx-auto">
              Our team is available via WhatsApp or email. We respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/earn/contact"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-bold text-base transition-all duration-300 hover:translate-y-[-3px] hover:shadow-[0_8px_20px_rgba(13,148,136,0.15)]"
                style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFFFFF" }}>
                Contact Us <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/signup"
                className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-full font-medium text-base transition-all duration-300 hover:translate-y-[-3px] hover:bg-stone-100"
                style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(13,148,136,0.25)", color: "#0F3D36" }}>
                Join NexGuild
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
