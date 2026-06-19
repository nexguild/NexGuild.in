"use client";

import { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";

export default function ContributorContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/contributor-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
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

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }} className="w-full">
      
      {/* ── Case 1: Success State ──────────────────────────────── */}
      {success ? (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <FadeIn>
            <div 
              className="w-full max-w-md rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1.5px solid rgba(13,148,136,0.18)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div 
                className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: "rgba(13,148,136,0.08)",
                  border: "1.5px solid rgba(13,148,136,0.18)",
                }}
              >
                <CheckCircle className="h-7 w-7 text-[#0D9488]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0F3D36] mb-2 tracking-tight">Message sent!</h3>
              <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                We will get back to you within 24 hours.
              </p>
              <button
                onClick={() => { setSuccess(false); setName(""); setEmail(""); setMessage(""); }}
                className="text-[#0D9488] hover:underline font-semibold text-sm transition-colors"
              >
                Send another message
              </button>
            </div>
          </FadeIn>
        </div>
      ) : (
        
        /* ── Case 2: Contact Form State ─────────────────────────── */
        <>
          {/* Hero Header */}
          <section className="relative overflow-hidden pt-24 pb-12 px-6 text-center">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)",
                filter: "blur(100px)",
                top: "-150px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
            <div className="mx-auto max-w-container relative z-10">
              <FadeIn>
                <p className="text-[#0D9488] text-xs font-bold uppercase tracking-widest mb-3">Contact</p>
                <h1 
                  className="text-4xl sm:text-6xl font-black text-[#0F3D36] mb-4 tracking-tight"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Get in Touch
                </h1>
                <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed text-balance">
                  Have a question? Send us a message and we&apos;ll get back to you within 24 hours.
                </p>
              </FadeIn>
            </div>
          </section>

          {/* Form UI */}
          <section className="pb-24 px-6">
            <div className="mx-auto max-w-md">
              <FadeIn delay={100}>
                <div 
                  className="rounded-2xl p-8 transition-all duration-300 hover:shadow-lg"
                  style={{
                    background: "rgba(255, 255, 255, 0.65)",
                    border: "1.5px solid rgba(13,148,136,0.18)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
                        Name <span className="text-[#0D9488]">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Your name"
                        style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
                        className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all autofill:shadow-[0_0_0_30px_#ffffff_inset] autofill:text-[#0F3D36]"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
                        Email <span className="text-[#0D9488]">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@email.com"
                        style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
                        className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all autofill:shadow-[0_0_0_30px_#ffffff_inset] autofill:text-[#0F3D36]"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
                        Message <span className="text-[#0D9488]">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                        placeholder="What would you like to know?"
                        style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
                        className="w-full px-3 py-2.5 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-y min-h-[120px] transition-all autofill:shadow-[0_0_0_30px_#ffffff_inset] autofill:text-[#0F3D36]"
                      />
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        color: "#FFFFFF",
                      }}
                      className="w-full mt-2 rounded-xl font-bold h-11 flex items-center justify-center gap-2 shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_6px_15px_rgba(16,185,129,0.25)]"
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                      ) : (
                        <><Send className="h-4 w-4" /> Send Message</>
                      )}
                    </Button>
                  </form>
                </div>
              </FadeIn>
            </div>
          </section>
        </>
      )}
    </div>
  );
}