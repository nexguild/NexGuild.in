import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata: Metadata = {
  title: "NexGuild for Organizations — Human-Powered Work at Scale",
  description:
    "NexGuild manages everything — from recruiting contributors to delivering your final dataset. Audio, transcription, annotation, testing and more.",
};

const SERVICES = [
  { icon: "🎙️", name: "Audio Recording",    desc: "Voice samples, sentences, conversations in any language" },
  { icon: "📝", name: "Transcription",       desc: "Audio to text with timestamps, multilingual support" },
  { icon: "🏷️", name: "Data Annotation",     desc: "Image, text, and video labeling for AI model training" },
  { icon: "📸", name: "Image Collection",    desc: "Controlled photo datasets under specified conditions" },
  { icon: "🖐️", name: "Palm & Face Data",    desc: "Biometric training datasets with consent forms" },
  { icon: "🌿", name: "Field Data Collection", desc: "On-ground data gathering across Indian cities" },
  { icon: "📱", name: "App Testing",         desc: "Functional, usability, and regression testing" },
  { icon: "🎮", name: "Game Testing",        desc: "QA, bug reports, and gameplay experience feedback" },
  { icon: "🌐", name: "Website Testing",     desc: "UX review, feedback, and accessibility audits" },
  { icon: "🛡️", name: "Content Moderation", desc: "Review and classify content for safety standards" },
  { icon: "🔍", name: "Web Research",        desc: "Data gathering, fact checking, competitive research" },
  { icon: "▶️", name: "Social Media Tasks",  desc: "Organic engagement and awareness campaigns" },
];

const STEPS = [
  { n: "01", title: "Contact Us",       desc: "Tell us about your project — scope, volume, and deadline." },
  { n: "02", title: "We Scope It",      desc: "We plan, price, and prepare the contributor pipeline." },
  { n: "03", title: "We Execute",       desc: "A managed team of contributors completes the work." },
  { n: "04", title: "You Receive",      desc: "Clean, formatted deliverables delivered on time." },
];

const WHY = [
  { icon: "✅", title: "Fully Managed",       desc: "We recruit, brief, and monitor contributors so you don't have to." },
  { icon: "🔍", title: "Quality Reviewed",    desc: "Every submission is reviewed before delivery." },
  { icon: "⚡", title: "Fast Turnaround",     desc: "Quick project delivery with regular progress updates." },
  { icon: "💰", title: "Affordable",          desc: "Competitive Indian pricing with no hidden fees." },
  { icon: "📈", title: "Scalable",            desc: "From 10 samples to 10,000 — we scale with your needs." },
  { icon: "📊", title: "Transparent",         desc: "Regular progress reports and open communication." },
];

const MARQUEE_ITEMS = [
  "Audio Recording", "Transcription", "Data Annotation", "Game Testing",
  "App Testing", "Palm Collection", "Content Moderation", "Web Research",
  "Image Collection", "Field Data", "Social Media Tasks", "Website Testing",
];

const STATS = [
  { value: "100+", label: "Contributors" },
  { value: "10+",  label: "Project Types" },
  { value: "100%", label: "Quality Checked" },
  { value: "🇮🇳",  label: "India Based" },
];

export default function ClientPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative hero-glow overflow-hidden">
        {/* Dot grid background */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            mask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
            WebkitMask: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-container px-6 pt-28 pb-20 text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] mb-8">
              <span className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider">
                Trusted Data Workforce Partner
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white text-balance mb-6">
              Human-Powered Work.<br />
              <span className="gradient-text">Delivered at Scale.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10 text-balance">
              We manage everything — from recruiting contributors to delivering your final
              dataset. You define the work. We handle the rest.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="h-12 px-8 inline-flex items-center rounded-xl bg-[var(--brand-500)] text-[var(--text-inverse)] text-base font-bold hover:bg-[var(--brand-400)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_32px_rgba(245,158,11,0.4)]"
              >
                Get a Quote →
              </Link>
              <a
                href="#services"
                className="h-12 px-8 inline-flex items-center rounded-xl border border-[var(--border-strong)] text-white/70 text-base font-medium hover:text-white hover:border-[var(--brand-500)] transition-colors"
              >
                See Our Work ↓
              </a>
            </div>
          </FadeIn>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden border-t border-b border-[var(--border-default)] py-3 bg-[var(--surface-subtle)]">
          <div className="animate-marquee">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-4 px-6 text-sm text-white/50 whitespace-nowrap">
                {item}
                <span className="text-[var(--brand-500)]">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <FadeIn>
        <section className="bg-[var(--surface-card)] border-b border-[var(--border-default)]">
          <div className="mx-auto max-w-container px-6 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-[var(--border-default)]">
              {STATS.map((s) => (
                <div key={s.label} className="flex flex-col items-center text-center sm:px-8 py-2">
                  <span className="text-3xl font-extrabold text-[var(--brand-500)] leading-none mb-1">
                    {s.value}
                  </span>
                  <span className="text-sm text-white/50">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── Services ──────────────────────────────────────────────── */}
      <section id="services" className="py-24 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                What We Deliver
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                12 categories of human-powered data work, all managed end to end.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SERVICES.map((s, i) => (
              <FadeIn key={s.name} delay={i * 40}>
                <div className="card-hover group rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 flex flex-col gap-3 cursor-default">
                  <span className="text-3xl leading-none">{s.icon}</span>
                  <h3 className="font-semibold text-white text-base group-hover:text-[var(--brand-500)] transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[var(--surface-subtle)]">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                Simple Process. Powerful Results.
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                Four steps from project idea to clean deliverables in your inbox.
              </p>
            </div>
          </FadeIn>

          <div className="relative">
            {/* Connecting line */}
            <div
              aria-hidden
              className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[var(--brand-500)] to-transparent opacity-30"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
                <FadeIn key={step.n} delay={i * 80}>
                  <div className="flex flex-col items-center text-center p-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] relative group hover:border-[var(--brand-500)] transition-colors">
                    <div className="w-14 h-14 rounded-full bg-[var(--brand-100)] border border-[var(--brand-200)] flex items-center justify-center mb-4">
                      <span className="text-sm font-bold text-[var(--brand-500)]">{step.n}</span>
                    </div>
                    <h3 className="font-bold text-white text-base mb-2">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why NexGuild ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                Why NexGuild?
              </h2>
              <p className="text-white/50 text-lg max-w-lg mx-auto">
                Everything you need. Nothing you don't.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY.map((w, i) => (
              <FadeIn key={w.title} delay={i * 60}>
                <div className="card-hover rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 flex gap-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{w.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{w.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div
              className="rounded-2xl p-12 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #1a0f00 0%, #0D0D0D 40%, #0D0D0D 60%, #1a0800 100%)",
                border: "1px solid rgba(245,158,11,0.18)",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
                  background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(245,158,11,0.07) 0%, transparent 70%)",
                }}
              />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  Ready to Start Your Project?
                </h2>
                <p className="text-white/55 text-lg mb-10 max-w-lg mx-auto">
                  Contact us today. We respond within 24 hours.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="https://wa.me/919382008513"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white text-base font-semibold hover:bg-[#20bb5a] transition-all duration-200 hover:scale-105"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href="https://t.me/nexguild"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-8 inline-flex items-center gap-2 rounded-xl bg-[#229ED9] text-white text-base font-semibold hover:opacity-90 transition-all duration-200 hover:scale-105"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>
                  <a
                    href="mailto:nexguild.in@gmail.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-8 inline-flex items-center rounded-xl border border-[var(--brand-500)] text-[var(--brand-500)] text-base font-semibold hover:bg-[var(--brand-100)] transition-all duration-200"
                  >
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
