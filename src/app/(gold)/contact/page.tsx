import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { Mail, MessageCircle } from "lucide-react";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact NexGuild â€” Project Enquiries",
  description:
    "Get in touch to discuss your data project requirements. We work with organisations on audio, transcription, annotation, and human-powered digital tasks.",
  openGraph: {
    title: "Contact NexGuild",
    description: "Discuss your project requirements with us.",
    url: "https://nexguild.in/contact",
  },
};

export default function ContactPage() {
  return (
    <div style={{ background: "#FAF6EF", color: "#1C1917", minHeight: "100vh" }}>
      
      {/* â”€â”€ Hero Segment with Client Page Matching Orbs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section 
        className="relative overflow-hidden py-20 px-6"
        style={{ background: "linear-gradient(160deg, #FEF9F0 0%, #FAF3E4 100%)", borderBottom: "1px solid rgba(217,119,6,0.08)" }}
      >
        {/* Moving Premium Orbs */}
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              width: "min(60vw, 500px)",
              height: "min(60vw, 500px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.20)",
              filter: "blur(120px)",
              top: "-20%",
              left: "-10%",
              animation: "contactLightDrift 22s ease-in-out infinite alternate",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "min(50vw, 400px)",
              height: "min(50vw, 400px)",
              borderRadius: "50%",
              background: "rgba(245,158,11,0.15)",
              filter: "blur(120px)",
              bottom: "-10%",
              right: "-5%",
              animation: "contactLightDrift 18s ease-in-out infinite alternate-reverse",
            }}
          />
        </div>

        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[#92400E] text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
            <h1 
              className="text-4xl sm:text-5xl font-bold mb-4 text-balance"
              style={{ fontFamily: "Instrument Serif, serif", color: "#1C1917" }}
            >
              Let&apos;s Talk About Your Project
            </h1>
            <p className="text-lg text-[#44403C] max-w-xl leading-relaxed">
              Tell us what you need. We review every enquiry and respond within 2 business days with a clear scope and timeline.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* â”€â”€ Contact Form + Direct Channels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={{ background: "#FAF6EF", padding: "4rem 1.5rem" }}>
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

            {/* Message Form Box */}
            <div className="lg:col-span-3">
              <FadeIn>
                <h2 className="text-xl font-bold text-[#1C1917] mb-6">Send Us a Message</h2>
                <div 
                  className="p-6 sm:p-8 rounded-2xl bg-white/70 backdrop-blur-md border border-stone-200/60 shadow-sm"
                >
                  <ContactForm />
                </div>
              </FadeIn>
            </div>

            {/* Direct Channel Cards */}
            <div className="lg:col-span-2 space-y-4">
              <FadeIn delay={80}>
                <h2 className="text-xl font-bold text-[#1C1917] mb-6">Or Reach Us Directly</h2>

                {/* WhatsApp Card */}
                <a
                  href="https://wa.me/919382008513"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-stone-200/60 bg-white/60 p-5 transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:border-[#25D366]/40 hover:shadow-md group"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/20 transition-colors">
                    <MessageCircle className="h-5 w-5 text-[#25D366]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1C1917] text-sm mb-0.5">WhatsApp</h3>
                    <p className="text-xs text-[#44403C]">Fastest response â€” direct project discussions.</p>
                    <p className="text-xs text-[#25D366] mt-1 font-medium">Message on WhatsApp â†’</p>
                  </div>
                </a>

                {/* Email Card */}
                <a
                  href="mailto:admin@nexguild.in"
                  className="flex items-center gap-4 rounded-xl border border-stone-200/60 bg-white/60 p-5 transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:border-[#F59E0B]/40 hover:shadow-md group"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F59E0B]/20 transition-colors">
                    <Mail className="h-5 w-5 text-[#92400E]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1C1917] text-sm mb-0.5">Email</h3>
                    <p className="text-xs text-[#44403C]">For project briefs and partnership enquiries.</p>
                    <p className="text-xs text-[#92400E] mt-1 font-medium">admin@nexguild.in â†’</p>
                  </div>
                </a>

                {/* LinkedIn Card */}
                <a
                  href="https://www.linkedin.com/in/somen-biswas-410727215"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl border border-stone-200/60 bg-white/60 p-5 transition-all duration-300 hover:translate-y-[-2px] hover:bg-white hover:border-[#0A66C2]/40 hover:shadow-md group"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0A66C2]/20 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#1C1917] text-sm mb-0.5">LinkedIn</h3>
                    <p className="text-xs text-[#44403C]">Connect professionally or send a message.</p>
                    <p className="text-xs text-[#0A66C2] mt-1 font-medium">linkedin.com/in/somen-biswas â†’</p>
                  </div>
                </a>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes contactLightDrift {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(8%, -10%) scale(1.15); }
          100% { transform: translate(-4px, 5px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}