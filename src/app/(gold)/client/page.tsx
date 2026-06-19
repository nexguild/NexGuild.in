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

const STATS = [
  { value: "100+", label: "Contributors" },
  { value: "10+",  label: "Project Types" },
  { value: "100%", label: "Quality Checked" },
  { value: "🇮🇳",  label: "India Based" },
];

export default function ClientPage() {
  return (
    <div style={{ background: "#faefef", color: "#1C1917", minHeight: "100vh" }}>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)", paddingBottom: "4rem" }}
      >
        {/* ── 🚀 PREMIUM BACKGROUND GRAPHICS & ANIMATION ── */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          
          

          {/* ২. বামদিকের ওরিজিনাল মুভিং গ্লো অর্ব */}
          <div
            style={{
              position: "absolute",
              width: "min(60vw, 600px)",
              height: "min(60vw, 600px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.25)",
              filter: "blur(120px)",
              top: "-18%",
              left: "-10%",
              animation: "warmLightDrift 25s ease-in-out infinite alternate",
            }}
          />

          {/* ৩. ডানদিকের ওরিজিনাল মুভিং গ্লো অর্ব */}
          <div
            style={{
              position: "absolute",
              width: "min(50vw, 500px)",
              height: "min(50vw, 500px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.20)",
              filter: "blur(120px)",
              bottom: "-20%",
              right: "-5%",
              animation: "warmLightDrift 22s ease-in-out infinite alternate-reverse",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-container px-6 pt-28 pb-10 text-center">
          <FadeIn>
            <div
              className="inline-flex items-center gap-2 mb-8"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(217,119,6,0.2)",
                color: "#92400E",
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                Trusted Data Workforce Partner
              </span>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <h1
              className="mb-6"
              style={{
                fontFamily: "Instrument Serif, serif",
                fontWeight: 700,
                fontSize: "clamp(2.75rem, 5vw, 4.75rem)",
                lineHeight: 1.08,
                color: "#1C1917",
                letterSpacing: "-0.03em",
              }}
            >
              Human-Powered Work.<br />
              <span style={{ color: "#92400E", fontStyle: "italic" }}>Delivered at Scale.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={200}>
            <p
              className="mx-auto mb-10"
              style={{
                maxWidth: "44rem",
                color: "#44403C",
                fontSize: "clamp(1rem, 1vw, 1.125rem)",
                lineHeight: 1.75,
              }}
            >
              We manage everything — from recruiting contributors to delivering your final dataset.<br />
              You define the work. We handle the rest.
            </p>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      width: "100%",
                      maxWidth: "240px",
                      height: "3rem",
                      borderRadius: "999px",
                      border: "1.5px solid rgba(217,119,6,0.35)",
                      background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                      color: "#000000",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: "0 4px 15px rgba(217,119,6,0.15)"
                }}
                className="hover:translate-y-[-2px] hover:bg-white"
              >
                Get a Quote →
              </Link>
              <a
                href="#services"
                style={{
                  display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      width: "100%",
                      maxWidth: "240px",
                      height: "3rem",
                      borderRadius: "999px",
                      border: "1.5px solid rgba(217,119,6,0.35)",
                      background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                      color: "#000000",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: "0 4px 15px rgba(217,119,6,0.15)"
                }}
                className="hover:translate-y-[-2px] hover:bg-[rgba(217,119,6,0.05)]"
              >
                See Our Work ↓
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Stats (Premium Grid Cards with Pop-up Animation) ─────────────────── */}
<section style={{ padding: "2rem 1.5rem" }}>
  <div className="mx-auto max-w-container">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {STATS.map((s, i) => (
        <FadeIn key={s.label} delay={i * 60} className="h-full">
          <div 
            className="flex flex-col items-center justify-center text-center p-6 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md cursor-pointer"
            style={{
              background: "rgba(255, 255, 255, 0.55)",
              border: "1.5px solid rgba(217, 119, 6, 0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span 
              className="tracking-tight mb-1.5"
              style={{ color: "#92400E", fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}
            >
              {s.value}
            </span>
            <span 
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#57534E" }}
            >
              {s.label}
            </span>
          </div>
        </FadeIn>
      ))}
    </div>
  </div>
</section>

      {/* ── Services ──────────────────────────────────────────────── */}
      <section id="services" style={{ padding: "6rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 style={{
                fontFamily: "Instrument Serif, serif",
                fontSize: "clamp(2.25rem, 3vw, 3rem)",
                fontWeight: 700,
                color: "#1C1917",
                marginBottom: "1rem",
              }}>
                What We Deliver
              </h2>
              <p style={{ color: "#44403C", fontSize: "1.0625rem", maxWidth: "42rem", margin: "0 auto" }}>
                12 categories of human-powered data work, all managed end to end.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => (
              <FadeIn key={s.name} delay={i * 40}>
                <div
                  className="service-card rounded-2xl p-6 flex flex-col gap-4"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    backdropFilter: "blur(12px)",
                    border: "1.5px solid rgba(217,119,6,0.12)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <span style={{ fontSize: "1.75rem" }}>{s.icon}</span>
                  <h3 style={{ color: "#1C1917", fontWeight: 700, fontSize: "1.05rem" }}>
                    {s.name}
                  </h3>
                  <p style={{ color: "#44403C", fontSize: "0.95rem", lineHeight: 1.7 }}>
                    {s.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section style={{ padding: "6rem 1.5rem", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(217,119,6,0.08)", borderBottom: "1px solid rgba(217,119,6,0.08)" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 style={{
                fontFamily: "Instrument Serif, serif",
                fontSize: "clamp(2.25rem, 3vw, 3rem)",
                fontWeight: 700,
                color: "#1C1917",
                marginBottom: "1rem",
              }}>
                Simple Process. Powerful Results.
              </h2>
              <p style={{ color: "#44403C", fontSize: "1.0625rem", maxWidth: "42rem", margin: "0 auto" }}>
                Four steps from project idea to clean deliverables in your inbox.
              </p>
            </div>
          </FadeIn>

          <div className="relative">
            

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, i) => (
  <FadeIn key={step.n} delay={i * 80} className="h-full">
    <div 
      className="flex flex-col items-center text-center p-6 rounded-2xl h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.5)",
        border: "1.5px solid rgba(217,119,6,0.12)",
      }}
    >
                    <div
                      style={{
                        width: "3.5rem",
                        height: "3.5rem",
                        borderRadius: "999px",
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <span style={{ color: "#92400E", fontWeight: 700 }}>{step.n}</span>
                    </div>
                    <h3 style={{ color: "#1C1917", fontWeight: 700, marginBottom: "0.75rem" }}>{step.title}</h3>
                    <p style={{ color: "#44403C", fontSize: "0.95rem", lineHeight: 1.75 }}>{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why NexGuild ─────────────────────────────────────────── */}
      <section style={{ padding: "6rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 style={{
                fontFamily: "Instrument Serif, serif",
                fontSize: "clamp(2.25rem, 3vw, 3rem)",
                fontWeight: 700,
                color: "#1C1917",
                marginBottom: "1rem",
              }}>
                Why NexGuild?
              </h2>
              <p style={{ color: "#44403C", fontSize: "1.0625rem", maxWidth: "40rem", margin: "0 auto" }}>
                Everything you need. Nothing you don't.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY.map((item, i) => (
  <FadeIn key={item.title} delay={i * 60} className="h-full">
    <div 
      className="rounded-xl p-5 h-full transition-all duration-300 hover:translate-y-[-4px] hover:bg-white hover:shadow-md cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.5)",
        border: "1.5px solid rgba(217,119,6,0.12)",
      }}
    >
      <div className="text-2xl mb-3">{item.icon}</div>
      <h3 className="font-bold text-[#1C1917] mb-1 text-sm">{item.title}</h3>
      <p className="text-xs text-[#44403C] leading-relaxed">{item.desc}</p>
    </div>
  </FadeIn>
))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "2rem 1.5rem 6rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <FadeIn>
            <div
              className="rounded-3xl p-6 sm:p-12 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.6)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(217,119,6,0.15)",
              }}
            >
              <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, background: "rgba(245,158,11,0.05)", filter: "blur(120px)" }} />
              <div className="relative z-10 text-center">
                <h2 style={{
                  fontFamily: "Instrument Serif, serif",
                  fontSize: "clamp(2rem, 3vw, 3rem)",
                  fontWeight: 700,
                  color: "#1C1917",
                  marginBottom: "1rem",
                }}>
                  Ready to Start Your Project?
                </h2>
                <p style={{ color: "#44403C", fontSize: "1.0625rem", marginBottom: "2.5rem", maxWidth: "40rem", marginLeft: "auto", marginRight: "auto" }}>
                  Contact us today. We respond within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 relative z-10">
  {/* ১. WhatsApp Button (Official Brand Green) */}
  <a
    href="https://wa.me/919382008513"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      width: "100%",
      maxWidth: "240px",
      height: "3rem",
      borderRadius: "999px",
      border: "1.5px solid rgba(37, 211, 102, 0.25)",
      background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
      color: "#ffffff",
      fontWeight: 600,
      textDecoration: "none",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 4px 15px rgba(37, 211, 102, 0.25)"
    }}
    className="hover:translate-y-[-2px] hover:opacity-95"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
    WhatsApp
  </a>

  {/* ২. Telegram Button (Official Brand Blue) */}
  <a
    href="https://t.me/nexguild"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      width: "100%",
      maxWidth: "240px",
      height: "3rem",
      borderRadius: "999px",
      border: "1.5px solid rgba(0, 136, 204, 0.25)",
      background: "linear-gradient(135deg, #0088cc 0%, #0077b5 100%)",
      color: "#ffffff",
      fontWeight: 600,
      textDecoration: "none",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 4px 15px rgba(0, 136, 204, 0.2)"
    }}
    className="hover:translate-y-[-2px] hover:opacity-95"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
    Telegram
  </a>

  {/* ৩. Send Email Button (NexGuild Signature Premium Amber/Gold) */}
  <a
    href="mailto:nexguild.in@gmail.com"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      width: "100%",
      maxWidth: "240px",
      height: "3rem",
      borderRadius: "999px",
      border: "1.5px solid rgba(217,119,6,0.25)",
      background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
      color: "#ffffff",
      fontWeight: 600,
      textDecoration: "none",
      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 4px 15px rgba(217,119,6,0.25)"
    }}
    className="hover:translate-y-[-2px] hover:opacity-95"
  >
    Send Email
  </a>
</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <style>{`
        @keyframes warmLightDrift {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(10%, -15%) scale(1.2); }
          100% { transform: translate(-5%, 8%) scale(0.9); }
        }
        .service-card:hover {
          border-color: rgba(217, 119, 6, 0.3) !important;
          background: rgba(255, 255, 255, 0.8) !important;
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(217, 119, 6, 0.05);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}