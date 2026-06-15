"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContributorContactPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res  = await fetch("/api/contributor-contact", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, message }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-14 w-14 rounded-full bg-[rgba(20,184,166,0.1)] flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-[#14b8a6]" />
        </div>
        <h3 className="text-xl font-semibold text-white">Message sent!</h3>
        <p className="text-sm text-white/50 max-w-xs">
          We will get back to you within 24 hours.
        </p>
        <button
          onClick={() => { setSuccess(false); setName(""); setEmail(""); setMessage(""); }}
          className="mt-2 text-sm text-[#14b8a6] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">Get in Touch</h1>
          <p className="text-lg text-white/50 max-w-xl leading-relaxed">
            Have a question? Send us a message and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Name <span className="text-[#14b8a6]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full h-10 px-3 rounded-md border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Email <span className="text-[#14b8a6]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                className="w-full h-10 px-3 rounded-md border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Message <span className="text-[#14b8a6]">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="What would you like to know?"
                className="w-full px-3 py-2.5 rounded-md border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/40 focus:border-transparent resize-y min-h-[120px]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 rounded-md bg-red-500/10 px-4 py-3">{error}</p>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4" /> Send Message</>
              )}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}
