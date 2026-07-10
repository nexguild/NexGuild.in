"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router  = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    console.log("[auth/callback] page mounted, search:", window.location.search, "hash:", window.location.hash);

    async function handleSession(session: {
      access_token: string;
      user: { email?: string; user_metadata?: Record<string, unknown> };
    }) {
      if (handled.current) return;
      handled.current = true;
      console.log("[auth/callback] session found, user:", session.user.email);

      // Assign NexLeader (handles referral chain resolution; idempotent)
      try {
        await fetch("/api/auth/set-nexleader", {
          method:  "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch (err) {
        console.error("[auth/callback] set-nexleader failed:", err);
      }

      fetch("/api/auth/welcome", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email: session.user.email,
          name:  session.user.user_metadata?.full_name ?? session.user.email ?? "Contributor",
        }),
      }).catch(() => {});

      router.replace("/dashboard");
    }

    function redirectToLogin() {
      if (handled.current) return;
      handled.current = true;
      console.log("[auth/callback] no session — redirecting to /login?verified=true");
      router.replace("/login?verified=true");
    }

    const params = new URLSearchParams(window.location.search);

    // Supabase sends ?error= when the link has expired or already been used
    const errorParam = params.get("error");
    if (errorParam) {
      console.error("[auth/callback] error param:", errorParam, params.get("error_description"));
      redirectToLogin();
      return;
    }

    // ── PKCE flow ──────────────────────────────────────────────────────────
    // Supabase (new projects / explicit PKCE) sends ?code= in the query string.
    // We must call exchangeCodeForSession() to turn the code into a session.
    const code = params.get("code");
    if (code) {
      console.log("[auth/callback] PKCE code detected — exchanging for session…");
      supabase.auth.exchangeCodeForSession(code)
        .then(({ data: { session }, error }) => {
          if (session) {
            handleSession(session);
          } else {
            console.error("[auth/callback] code exchange failed:", error?.message);
            redirectToLogin();
          }
        });
      // No subscription / timeout needed for this path — exchange resolves on its own
      return;
    }

    // ── Implicit flow ──────────────────────────────────────────────────────
    // Older / implicit-mode Supabase projects send #access_token= in the hash.
    // The Supabase client auto-processes the hash and fires onAuthStateChange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[auth/callback] onAuthStateChange:", event, !!session);
        if (session && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
          subscription.unsubscribe();
          await handleSession(session);
        }
      }
    );

    // Fallback: session already set before the listener registered
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        await handleSession(session);
      }
    });

    // If neither path fires within 4 s, email was verified but login is required manually
    const fallback = setTimeout(() => {
      console.log("[auth/callback] 4 s timeout — no session found");
      redirectToLogin();
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
