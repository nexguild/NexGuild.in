"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function AdminLoginPage() {
  const router = useRouter();
  const captchaRef = useRef<HCaptcha>(null);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const [captchaMode, setCaptchaMode]   = useState<"invisible" | "visible">("invisible");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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
    // Step 1: authenticate with captcha token
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: token },
    });

    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);

    if (authError || !data.user || !data.session) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Step 2: verify admin role via server-side API (bypasses RLS)
    let isAdmin = false;
    let reason = "";
    try {
      const res = await fetch("/api/auth/admin-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: data.session.access_token }),
      });
      const json = await res.json();
      isAdmin = json.isAdmin === true;
      reason = json.reason ?? "";
      console.log("[admin-login] admin-check →", JSON.stringify(json));
    } catch (err) {
      console.error("[admin-login] admin-check fetch error:", err);
      await supabase.auth.signOut();
      setError("Unable to verify account permissions. Please try again.");
      setLoading(false);
      return;
    }

    if (!isAdmin) {
      await supabase.auth.signOut();
      if (reason === "profile_error") {
        setError("Server error verifying permissions. Check server logs.");
      } else {
        setError("Access denied. This account does not have admin privileges.");
      }
      setLoading(false);
      return;
    }

    router.replace("/admin");
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
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-1">Admin Access</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-7">Sign in to the NexGuild admin panel</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-[var(--danger-bg,#2d1515)] border border-[var(--danger-border,#7f1d1d)] px-4 py-3 text-sm text-[var(--danger-text)]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexguild.in"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <HCaptcha
              key={captchaMode}
              ref={captchaRef}
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
              size={captchaMode === "invisible" ? "invisible" : "normal"}
              theme="dark"
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
              <p className="text-xs text-[var(--text-muted)] text-center -mt-1">
                Complete the verification above to continue
              </p>
            )}
            {captchaMode === "visible" && captchaToken && (
              <p className="text-xs text-[var(--text-link)] text-center -mt-1">
                ✓ Verification complete
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitDisabled}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
            <Link href="/" className="text-[var(--text-link)] hover:underline">
              ← Back to site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
