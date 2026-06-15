import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SupportButton } from "@/components/layout/support-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="theme-teal min-h-screen bg-[var(--surface-page)]">
        <DashboardShell>{children}</DashboardShell>
        <SupportButton />
      </div>
    </AuthGuard>
  );
}
