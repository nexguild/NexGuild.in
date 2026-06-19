"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ background: "#EBFBFA", minHeight: "100vh" }} className="w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      {/* ── Case 1: Link Sent Success State ─────────────────────── */}
      {sent ? (
        <div 
          className="w-full max-w-md rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            border: "1.5px solid rgba(13,148,136,0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div 
            className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: "rgba(13,148,136,0.08)",
              border: "1.5px solid rgba(13,148,136,0.18)",
            }}
          >
            <svg className="h-6 w-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-[#0F3D36] mb-2 tracking-tight">Check your inbox</h1>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            We&apos;ve sent a password reset link to <strong className="text-[#0F3D36] font-semibold">{email}</strong>.
            The link expires in 1 hour.
          </p>
          
          <p className="text-sm text-stone-600">
            Didn&apos;t receive it?{" "}
            <button
              onClick={() => setSent(false)}
              className="text-[#0D9488] hover:underline font-semibold"
            >
              Try again
            </button>
          </p>
          
          <p className="text-sm mt-5 pt-4 border-t border-stone-200/60">
            <Link href="/login" className="text-[#0D9488] font-semibold hover:underline flex items-center justify-center gap-1">
              ← Back to Log In
            </Link>
          </p>
        </div>
      ) : (
        
        /* ── Case 2: Input Email Form State ─────────────────────── */
        <div 
          className="w-full max-w-md rounded-2xl p-8 transition-all duration-300 hover:shadow-lg"
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            border: "1.5px solid rgba(13,148,136,0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h1 className="text-2xl font-bold text-[#0F3D36] mb-1 tracking-tight">Reset your password</h1>
          <p className="text-sm text-stone-600 mb-7">
            Enter your account email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
                className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all autofill:shadow-[0_0_0_30px_#ffffff_inset] autofill:text-[#0F3D36]"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              size="lg" 
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#FFFFFF",
              }}
              className="w-full mt-2 rounded-xl font-bold shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_6px_15px_rgba(16,185,129,0.25)]"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </Button>
          </form>

          <p className="text-sm text-center text-stone-600 mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-[#0D9488] font-semibold hover:underline">
              Back to Log In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}