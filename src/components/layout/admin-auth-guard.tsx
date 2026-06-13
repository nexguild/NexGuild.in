"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function checkIsAdmin(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/admin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });
    const json = await res.json();
    return json.isAdmin === true;
  } catch {
    return false;
  }
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    setReady(false);

    if (isLoginPage) {
      // Auto-redirect already-authenticated admins past the login form
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session && await checkIsAdmin(session.access_token)) {
          router.replace("/admin");
        } else {
          setReady(true);
        }
      });
      return;
    }

    async function verifyAdmin() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const isAdmin = await checkIsAdmin(session.access_token);

      if (!isAdmin) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setReady(true);
    }

    verifyAdmin();

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
