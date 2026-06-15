"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, CheckCircle, Loader2, LifeBuoy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

function LoggedInView() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">

      {/* Support ticket */}
      <Link
        href="/dashboard/support"
        className="flex items-center gap-5 rounded-xl border border-[rgba(20,184,166,0.2)] bg-[rgba(20,184,166,0.05)] p-6 group hover:border-[rgba(20,184,166,0.4)] transition-colors"
      >
        <div className="h-12 w-12 rounded-xl bg-[rgba(20,184,166,0.12)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(20,184,166,0.2)] transition-colors">
          <LifeBuoy className="h-6 w-6 text-[#14b8a6]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-0.5">Submit a Support Ticket</h3>
          <p className="text-sm text-white/50">Track your issue with a ticket. We respond within 24 hours.</p>
          <p className="text-sm text-[#14b8a6] mt-1">Go to Support →</p>
        </div>
      </Link>

      {/* Telegram community */}
      <a
        href="https://t.me/nexguild"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6 group hover:border-[#229ED9]/40 transition-colors"
      >
        <div className="h-12 w-12 rounded-xl bg-[#229ED9]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#229ED9]/20 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#229ED9">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white mb-0.5">Join Our Community</h3>
          <p className="text-sm text-white/50">Get help from other contributors and stay updated on new tasks.</p>
          <p className="text-sm text-[#229ED9] mt-1">t.me/nexguild →</p>
        </div>
      </a>

    </div>
  );
}

function GuestForm() {
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
      <div className="flex flex-col items-center gap-4 py-12 text-center">
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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
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
  );
}

export default function ContributorContactPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // getUser() validates server-side; getSession() returns stale localStorage tokens
    supabase.auth.getUser()
      .then(({ data: { user } }) => setLoggedIn(!!user))
      .catch(() => setLoggedIn(false));
  }, []);

  const isLoggedIn  = loggedIn === true;
  const isGuest     = loggedIn === false;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--surface-page)] py-20 px-6">
        <div className="pointer-events-none absolute inset-0 hero-glow" />
        <div className="mx-auto max-w-container relative z-10">
          <p className="text-[var(--brand-500)] text-sm font-semibold uppercase tracking-widest mb-3">Support</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 text-balance">
            {isLoggedIn ? "How Can We Help?" : "Get in Touch"}
          </h1>
          <p className="text-lg text-white/50 max-w-xl leading-relaxed">
            {isLoggedIn
              ? "Submit a support ticket or join our community for help from other contributors."
              : "Have a question before joining? Send us a message and we'll get back to you within 24 hours."}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-[var(--surface-card)] py-16 px-6">
        <div className="mx-auto max-w-container">
          {loggedIn === null && (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
          )}
          {isLoggedIn && <LoggedInView />}
          {isGuest    && <GuestForm />}
        </div>
      </section>
    </>
  );
}
