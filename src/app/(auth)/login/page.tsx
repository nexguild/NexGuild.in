"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function LoginPage() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // invisible = Pro trial (no visible challenge); visible = free tier fallback
  const [captchaMode, setCaptchaMode]   = useState<"invisible" | "visible">("invisible");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [verified, setVerified]         = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") setVerified(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (captchaMode === "invisible") {
      captchaRef.current?.execute();
    } else {
      if (!captchaToken) {
        setError("Please complete the captcha verification above.");
        setLoading(false);
        return;
      }
      doLogin(captchaToken);
    }
  }

  async function doLogin(token: string) {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: token },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Block deactivated accounts — sign them out and send to the deactivated page
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", data.user.id)
        .single();
      if (profile?.is_active === false) {
        await supabase.auth.signOut();
        router.replace("/deactivated");
        return;
      }
    }

    router.push("/dashboard");
  }

  function onCaptchaVerify(token: string) {
    if (captchaMode === "invisible") {
      doLogin(token);
    } else {
      setCaptchaToken(token);
    }
  }

  function onCaptchaError() {
    captchaRef.current?.resetCaptcha();
    setCaptchaMode("visible");
    setCaptchaToken(null);
    setLoading(false);
  }

  const submitDisabled =
    loading ||
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
        <h1 className="text-2xl font-bold text-[#0F3D36] mb-1 tracking-tight">Welcome back</h1>
        <p className="text-sm text-stone-600 mb-7">Sign in to your contributor account</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {verified && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
              <span className="mt-0.5">&#10003;</span>
              <span>Email verified! Please log in to continue.</span>
            </div>
          )}
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

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-[#0F3D36]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#0D9488] font-medium hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(13,148,136,0.25)" }}
                className="w-full h-10 px-3 pr-10 rounded-lg border text-stone-800 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent transition-all autofill:shadow-[0_0_0_30px_#ffffff_inset] autofill:text-[#0F3D36]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/*
            hCaptcha — dual-mode (same pattern as signup):
            invisible (Pro trial): fires on execute(), no UI unless risk detected.
            visible (free tier fallback): inline challenge, switched via onError.
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

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={submitDisabled}
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFFFFF" }}
            className="w-full mt-2 rounded-xl font-bold shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_6px_15px_rgba(16,185,129,0.25)] disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {loading ? "Signing in…" : "Log In"}
          </Button>
        </form>

        <p className="text-sm text-center text-stone-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#0D9488] font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
