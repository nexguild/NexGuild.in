"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Always reset while we re-check — prevents stale "ready" bleeding through
    setReady(false);

    if (isLoginPage) {
      // If already authenticated as admin, skip login form
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) {
          setReady(true);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "admin") {
          router.replace("/admin");
        } else {
          setReady(true);
        }
      });
      return;
    }

    // Protected admin pages
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        // Table not set up or RLS error — send to login without signing out
        console.error("[AdminAuthGuard] profile query error:", profileError.message);
        router.replace("/admin/login");
        return;
      }

      if (profile?.role !== "admin") {
        // Valid session but not an admin — sign out and redirect
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setReady(true);
    }

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setReady(false);
        router.replace("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, isLoginPage]);

  if (!ready) return null;

  return <>{children}</>;
}
