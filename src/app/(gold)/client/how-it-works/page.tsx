import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "How It Works — NexGuild for Organizations",
  description:
    "Four simple steps from project idea to clean deliverables. NexGuild scopes, executes, and delivers your data project — end to end.",
  openGraph: {
    title: "How It Works — NexGuild",
    description: "Four steps from project idea to clean deliverables. We manage everything.",
    url: "https://nexguild.in/client/how-it-works",
  },
};

const STEPS = [
  {
    n: "01",
    icon: "💬",
    title: "Contact Us",
    body: "Reach out via our contact form, WhatsApp, or email. Tell us about the type of work, approximate volume, timeline, and any quality requirements you have.",
  },
  {
    n: "02",
    icon: "🗂️",
    title: "We Scope It",
    body: "NexGuild scopes the task structure, quality criteria, contributor requirements, and project timeline. We handle all operational planning and prepare a clear proposal.",
  },
  {
    n: "03",
    icon: "⚙️",
    title: "We Execute",
    body: "Our managed contributor network does the work. We monitor quality, reject substandard submissions, and maintain consistency throughout the project.",
  },
  {
    n: "04",
    icon: "📦",
    title: "You Receive",
    body: "We review every submission and deliver clean, structured results in your preferred format — datasets, transcripts, reports, or content files — on time.",
  },
];

const SERVICES_SUMMARY = [
  "🎙️ Audio Recording",
  "📝 Transcription",
  "🏷️ Data Annotation",
  "📱 App Testing",
  "🎮 Game Testing",
  "📸 Image Collection",
  "🔍 Web Research",
  "🛡️ Content Moderation",
  "▶️ Social Media Tasks",
];

export default function ClientHowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative hero-glow overflow-hidden">
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.10) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            mask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-container px-6 pt-28 pb-16 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] mb-6">
              <span className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider">
                For Organizations
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 text-balance">
              Simple Process.<br />Powerful Results.
            </h1>
            <p className="text-lg text-white/55 max-w-xl mx-auto leading-relaxed">
              Four steps from project idea to clean, structured deliverables in your inbox.
              We manage everything end to end.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-container">
          <div className="relative">
            {/* Desktop connecting line */}
            <div
              aria-hidden
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[var(--brand-500)] to-transparent opacity-25"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <FadeIn key={step.n} delay={i * 90}>
                  <div className="flex flex-col items-center text-center p-7 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--brand-500)] transition-colors group card-hover">
                    <div className="w-16 h-16 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--brand-500)] uppercase tracking-wider mb-2">
                      Step {step.n}
                    </span>
                    <h3 className="font-bold text-white text-lg mb-3">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Work On */}
      <section className="py-16 px-6 bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-white mb-3">What We Work On</h2>
              <p className="text-white/50 max-w-lg mx-auto">
                From small samples to large-scale datasets — we support a wide range of project types.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-wrap justify-center gap-3">
              {SERVICES_SUMMARY.map((s) => (
                <span
                  key={s}
                  className="px-4 py-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-white/70"
                >
                  {s}
                </span>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={150}>
            <div className="text-center mt-8">
              <Link
                href="/services"
                className="text-sm text-[var(--brand-500)] hover:underline"
              >
                View all services →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div
              className="rounded-2xl p-6 sm:p-12 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1a0f00 0%, #0D0D0D 40%, #0D0D0D 60%, #1a0800 100%)",
                border: "1px solid rgba(245,158,11,0.18)",
              }}
            >
              <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)" }} />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  Ready to Start Your Project?
                </h2>
                <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">
                  Contact us today. We respond within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://wa.me/919382008513"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] text-white text-base font-semibold hover:bg-[#20bb5a] transition-all duration-200 hover:scale-105"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp Us
                  </a>
                  <Link
                    href="/contact"
                    className="w-full sm:w-auto h-12 px-8 inline-flex items-center justify-center rounded-xl border border-[var(--brand-500)] text-[var(--brand-500)] text-base font-semibold hover:bg-[var(--brand-100)] transition-colors"
                  >
                    Contact Form
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
