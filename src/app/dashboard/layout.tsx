import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SupportButton } from "@/components/layout/support-button";
import { OfferwallWidgetLoader } from "@/components/layout/offerwall-widget-loader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ background: "#F1F5F9" }}>
        <DashboardShell>{children}</DashboardShell>
        <SupportButton />
        <OfferwallWidgetLoader />
      </div>
    </AuthGuard>
  );
}
