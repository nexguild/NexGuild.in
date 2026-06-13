import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { Mail, Clock, MessageCircle, Linkedin, Send } from "lucide-react";

export const metadata: Metadata = { title: "Contact — NexGuild" };

const PROJECT_TYPES = [
  "Audio Recording",
  "Transcription",
  "Data Annotation",
  "App Testing",
  "Game Testing",
  "Surveys",
  "Social Media Tasks",
  "Web Research",
  "Data Collection",
  "Other",
];

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
                <form className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Full Name <span className="text-[var(--danger-text)]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Your name"
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                        Email <span className="text-[var(--danger-text)]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Organization / Company <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Your organization name"
                      className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Project Type <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <select
                      required
                      className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors"
                    >
                      <option value="">Select a project type</option>
                      {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                      Message <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe your project — task type, approximate volume, deadline, and any special requirements..."
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-colors resize-y"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    Send Message
                  </Button>
                </form>
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
