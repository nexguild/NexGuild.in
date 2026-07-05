"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router  = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    console.log("[auth/callback] page mounted, search:", window.location.search);

    async function handleSession(session: {
      access_token: string;
      user: { email?: string; user_metadata?: Record<string, unknown> };
    }) {
      // Guard against both onAuthStateChange and getSession() firing simultaneously
      if (handled.current) return;
      handled.current = true;

      // Track referral signup bonus — await before redirect so it always completes
      const referralCode = session.user.user_metadata?.referral_code_used;
      if (referralCode) {
        console.log("[auth/callback] referral_code_used found, calling track-signup");
        try {
          await fetch("/api/referral/track-signup", {
            method:  "POST",
            headers: { "Authorization": `Bearer ${session.access_token}` },
          });
        } catch (err) {
          console.error("[auth/callback] track-signup fetch failed:", err);
        }
      }

      // Welcome email — fire-and-forget
      fetch("/api/auth/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          name:  session.user.user_metadata?.full_name ?? session.user.email ?? "Contributor",
        }),
      }).catch(() => {});

      router.replace("/dashboard");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
          subscription.unsubscribe();
          await handleSession(session);
        }
      }
    );

    // Fallback: if session already exists when the page loads (token already exchanged
    // by the Supabase client before onAuthStateChange fires). This path ALSO goes through
    // handleSession so track-signup is never skipped.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        await handleSession(session);
      }
    });

    // No-session fallback: email-verification flows where Supabase requires the user to
    // log in manually after clicking the link. If neither path above resolves with a
    // session within 4 s, the verification succeeded but the user is not auto-logged in
    // — send them to login with ?verified=true so the page can show a success notice.
    const fallback = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        router.replace("/login?verified=true");
      }
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Verifying your account…</p>
      </div>
    </div>
  );
}
