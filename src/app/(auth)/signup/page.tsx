"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import HCaptcha from "@hcaptcha/react-hcaptcha";

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Brazil", "Nigeria", "Philippines",
  "Bangladesh", "Pakistan", "Indonesia", "Mexico", "South Africa", "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);

  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry]                 = useState("India");
  const [referralCode, setReferralCode]       = useState("");
  const [termsChecked, setTermsChecked]       = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);

  // Called by the form submit button — validates then triggers hCaptcha.
  // Actual signup happens in onCaptchaVerify once the token arrives.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8)          { setError("Password must be at least 8 characters."); return; }

    const emailDomain = email.toLowerCase().split("@")[1];
    if (!["gmail.com", "outlook.com"].includes(emailDomain)) {
      setError("Please sign up with a Gmail or Outlook email address.");
      return;
    }

    if (!termsChecked) { setError("Please accept the Terms of Service and Privacy Policy."); return; }

    setLoading(true);
    captchaRef.current?.execute();
  }

  async function onCaptchaVerify(captchaToken: string) {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          full_name:            fullName,
          country,
          referral_code_used:   referralCode || null,
          terms_accepted_at:    new Date().toISOString(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    captchaRef.current?.resetCaptcha();

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "An account with this email already exists."
          : authError.message.includes("SIGNUP_DOMAIN_NOT_ALLOWED") || authError.message.includes("Database error")
          ? "Please sign up with a Gmail or Outlook email address."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div style={{ background: "#EBFBFA", minHeight: "100vh" }} className="w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="w-full max-w-md rounded-2xl p-8 transition-all duration-300 hover:shadow-lg"
        style={{
          background: "rgba(255, 255, 255, 0.65)",
          border: "1.5px solid rgba(13,148,136,0.18)",
          backdropFilter: "blur(12px)",
        }}
      >
        <h1 className="text-2xl font-bold text-[#0F3D36] mb-1 tracking-tight">Create your account</h1>
        <p className="text-sm text-stone-600 mb-7">Free to join. Start earning immediately.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-600" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
              className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
              className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"
                style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
                className="w-full h-10 px-3 pr-10 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
              className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
              Country <span className="text-red-500">*</span>
            </label>
            <select required value={country} onChange={(e) => setCountry(e.target.value)}
              style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
              className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all cursor-pointer">
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-white text-stone-800">{c}</option>
              ))}
            </select>
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-sm font-semibold text-[#0F3D36] mb-1.5">
              Referral Code <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code if you have one"
              style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
              className="w-full h-10 px-3 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all"
            />
          </div>

          {/* Terms & Privacy — active consent checkbox */}
          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              required
              style={{ transition: "all 0.2s ease" }}
              className="mt-1 h-4 w-4 appearance-none rounded border border-stone-300 bg-white checked:bg-[#0D9488] checked:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 focus:outline-none relative cursor-pointer flex-shrink-0
                before:content-[''] before:absolute before:inset-0 before:flex before:items-center before:justify-center before:text-white before:text-[10px] before:font-black checked:before:content-['✓']"
            />
            <label htmlFor="terms" className="text-sm text-stone-600 leading-tight select-none cursor-pointer">
              I agree to the{" "}
              <Link href="/earn/terms" target="_blank" className="text-[#0D9488] font-medium hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/earn/privacy" target="_blank" className="text-[#0D9488] font-medium hover:underline">Privacy Policy</Link>
            </label>
          </div>

          {/* Invisible hCaptcha — fires on execute(), calls onCaptchaVerify with token */}
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            size="invisible"
            onVerify={onCaptchaVerify}
            onExpire={() => { captchaRef.current?.resetCaptcha(); setLoading(false); setError("Captcha expired. Please try again."); }}
            onError={() => { captchaRef.current?.resetCaptcha(); setLoading(false); setError("Captcha failed. Please try again."); }}
          />

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={loading || !termsChecked}
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFFFFF" }}
            className="w-full mt-2 rounded-xl font-bold shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_6px_15px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-center text-stone-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#0D9488] font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
