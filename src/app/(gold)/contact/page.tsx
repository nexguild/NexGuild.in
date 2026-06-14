import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { Mail, Clock, MessageCircle, Linkedin, Send } from "lucide-react";
import { ContactForm } from "@/components/ui/contact-form";

export const metadata: Metadata = {
  title: "Contact NexGuild — Get in Touch",
  description:
    "Contact NexGuild for project inquiries, partnership opportunities, or contributor support. Reach us via email, Telegram, or LinkedIn.",
  openGraph: {
    title: "Contact NexGuild",
    description: "Reach us for project inquiries, partnerships, or contributor support.",
    url: "https://nexguild.in/contact",
  },
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <FadeIn>
            <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">Contact Us</h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
              Whether you are an organization with a project or have a general question — we are happy to help.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Form + Info */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Form */}
            <div className="lg:col-span-2">
              <FadeIn>
                <h2 className="text-xl font-semibold text-white mb-6">Send a Message</h2>
                <ContactForm />
              </FadeIn>
            </div>

            {/* Info Panel */}
            <FadeIn delay={100} className="space-y-4">

              {/* WhatsApp */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-[var(--brand-500)]" />
                  </div>
                  <h3 className="font-semibold text-white">WhatsApp</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Fastest response. Reach us directly on WhatsApp.</p>
                <a
                  href="https://wa.me/919382008513"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--brand-500)] hover:text-[var(--brand-400)] transition-colors"
                >
                  Message on WhatsApp →
                </a>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[var(--brand-500)]" />
                  </div>
                  <h3 className="font-semibold text-white">Email</h3>
                </div>
                <a
                  href="mailto:nexguild.in@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--brand-500)] hover:text-[var(--brand-400)] transition-colors"
                >
                  nexguild.in@gmail.com
                </a>
                <p className="text-xs text-[var(--text-muted)] mt-1">For all inquiries</p>
              </div>

              {/* LinkedIn */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                    <Linkedin className="h-4 w-4 text-[var(--brand-500)]" />
                  </div>
                  <h3 className="font-semibold text-white">LinkedIn</h3>
                </div>
                <a
                  href="https://www.linkedin.com/in/somen-biswas-410727215"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--brand-500)] hover:text-[var(--brand-400)] transition-colors"
                >
                  linkedin.com/in/somen-biswas →
                </a>
              </div>

              {/* Telegram */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                    <Send className="h-4 w-4 text-[var(--brand-500)]" />
                  </div>
                  <h3 className="font-semibold text-white">Telegram</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Chat with us on Telegram.</p>
                <a
                  href="https://t.me/nexguild"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--brand-500)] hover:text-[var(--brand-400)] transition-colors"
                >
                  t.me/nexguild →
                </a>
              </div>

              {/* Response Time */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-6 card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-[var(--brand-100)] flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[var(--brand-500)]" />
                  </div>
                  <h3 className="font-semibold text-white">Response Time</h3>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  We respond within 24 hours. Organization project inquiries may take up to 2 business days
                  as we review requirements carefully.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
