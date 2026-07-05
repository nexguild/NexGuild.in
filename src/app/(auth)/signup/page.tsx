"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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

  // Pre-fill referral code from ?ref= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, []);
  const [termsChecked, setTermsChecked]       = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);

  // invisible = Pro trial (no visible challenge); visible = free tier fallback (inline widget)
  // onError switches to visible so signup is never blocked regardless of plan tier.
  const [captchaMode, setCaptchaMode]   = useState<"invisible" | "visible">("invisible");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  function validate(): boolean {
    if (password !== confirmPassword) { setError("Passwords do not match."); return false; }
    if (password.length < 8)          { setError("Password must be at least 8 characters."); return false; }
    const domain = email.toLowerCase().split("@")[1];
    if (!["gmail.com", "outlook.com"].includes(domain)) {
      setError("Please sign up with a Gmail or Outlook email address.");
      return false;
    }
    if (!termsChecked) { setError("Please accept the Terms of Service and Privacy Policy."); return false; }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);

    if (captchaMode === "invisible") {
      // Token arrives asynchronously in onCaptchaVerify → signup fires there
      captchaRef.current?.execute();
    } else {
      // Visible widget already gave us a token; submit directly
      if (!captchaToken) {
        setError("Please complete the captcha verification above.");
        setLoading(false);
        return;
      }
      doSignup(captchaToken);
    }
  }

  async function doSignup(token: string) {
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: token,
        data: {
          full_name:          fullName,
          country,
          referral_code_used: referralCode || null,
          terms_accepted_at:  new Date().toISOString(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);

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

  function onCaptchaVerify(token: string) {
    if (captchaMode === "invisible") {
      // Invisible path: token arrives here, signup immediately
      doSignup(token);
    } else {
      // Visible path: store token; user clicks Submit to continue
      setCaptchaToken(token);
    }
  }

  function onCaptchaError() {
    // Switch to inline visible widget — works on any plan tier
    captchaRef.current?.resetCaptcha();
    setCaptchaMode("visible");
    setCaptchaToken(null);
    setLoading(false);
  }

  const submitDisabled =
    loading ||
    !termsChecked ||
    (captchaMode === "visible" && !captchaToken);

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
              type="checkbox" id="terms"
              checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)}
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

          {/*
            hCaptcha — dual-mode:
            key={captchaMode} forces a remount when switching invisible→visible.

            Invisible (default, Pro trial): fires on captcha.execute(), no UI shown
            to user unless risk detected. onVerify receives token → doSignup immediately.

            Visible (free tier fallback): inline challenge widget rendered below.
            onVerify stores token; Submit button stays disabled until token is set.
            Switch is triggered automatically by onError (e.g. after Pro trial ends).
          */}
          <HCaptcha
            key={captchaMode}
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            size={captchaMode === "invisible" ? "invisible" : "normal"}
            theme="light"
            onVerify={onCaptchaVerify}
            onExpire={() => {
              setCaptchaToken(null);
              if (captchaMode === "invisible") {
                captchaRef.current?.resetCaptcha();
                setLoading(false);
              }
            }}
            onError={onCaptchaError}
            onClose={() => {
              // User dismissed the invisible-mode popup without completing
              if (captchaMode === "invisible") {
                captchaRef.current?.resetCaptcha();
                setLoading(false);
              }
            }}
          />

          {captchaMode === "visible" && !captchaToken && (
            <p className="text-xs text-stone-400 text-center -mt-1">
              Complete the verification above to continue
            </p>
          )}

          {captchaMode === "visible" && captchaToken && (
            <p className="text-xs text-[#0D9488] text-center -mt-1">
              ✓ Verification complete
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={submitDisabled}
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
