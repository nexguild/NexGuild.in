import type { Metadata, Viewport } from "next";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminAuthGuard } from "@/components/layout/admin-auth-guard";

export const metadata: Metadata = {
  title: "Admin Control Center",
  manifest: "/admin.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#d6b66e",
  width: "device-width",
  initialScale: 1,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
        <AdminShell>{children}</AdminShell>
      </div>
    </AdminAuthGuard>
  );
}
