"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Role context ────────────────────────────────────────────────────────────
const AdminRoleContext = createContext<string | null>(null);

export function useAdminRole(): string | null {
  return useContext(AdminRoleContext);
}

/**
 * Call at the top of any admin page to restrict it to specific roles.
 * Returns `true` when the user is allowed; `false` while redirecting.
 * Render `null` when `false` to avoid a content flash.
 */
export function usePageGuard(allowedRoles: readonly string[]): boolean {
  const role = useAdminRole();
  const router = useRouter();

  useEffect(() => {
    if (role && !allowedRoles.includes(role)) {
      router.replace("/admin");
    }
    // allowedRoles is a stable literal array at call site — eslint-disable is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, router]);

  if (!role) return false;
  return allowedRoles.includes(role);
}

// ── Admin-check API call ────────────────────────────────────────────────────
async function fetchAdminCheck(accessToken: string): Promise<{ isAdmin: boolean; role: string } | null> {
  try {
    const res = await fetch("/api/auth/admin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });
    const json = await res.json() as { isAdmin?: boolean; role?: string };
    console.log("[AdminAuthGuard] admin-check response:", JSON.stringify(json), "status:", res.status);
    if (res.status === 500) return null;
    return { isAdmin: json.isAdmin === true, role: json.role ?? "contributor" };
  } catch (err) {
    console.error("[AdminAuthGuard] admin-check fetch error:", err);
    return null;
  }
}

// ── Guard component ─────────────────────────────────────────────────────────
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady]           = useState(false);
  const [serverError, setServerError] = useState(false);
  const [role, setRole]             = useState<string | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    setReady(false);
    setServerError(false);

    if (isLoginPage) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) { setReady(true); return; }
        const result = await fetchAdminCheck(session.access_token);
        if (result?.isAdmin) {
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

      const result = await fetchAdminCheck(session.access_token);

      if (result === null) {
        setServerError(true);
        setReady(true);
        return;
      }

      if (!result.isAdmin) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setRole(result.role);
      setReady(true);
    }

    verifyAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setReady(false);
        setRole(null);
        router.replace("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, isLoginPage]);

  if (!ready) return null;

  if (serverError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--text-secondary)]">
            Failed to verify admin permissions. Check the server logs for details.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[var(--brand-500)] text-white text-sm hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminRoleContext.Provider value={role}>
      {children}
    </AdminRoleContext.Provider>
  );
}
