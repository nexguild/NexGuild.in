import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SupportButton } from "@/components/layout/support-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: "#F1F5F9" }}>
        <DashboardShell>{children}</DashboardShell>
        <SupportButton />
      </div>
    </AuthGuard>
  );
}
