import { AdminShell } from "@/components/layout/admin-shell";
import { AdminAuthGuard } from "@/components/layout/admin-auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
        <AdminShell>{children}</AdminShell>
      </div>
    </AdminAuthGuard>
  );
}
