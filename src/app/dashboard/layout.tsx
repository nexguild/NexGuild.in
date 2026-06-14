import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SupportButton } from "@/components/layout/support-button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="theme-teal min-h-screen bg-[var(--surface-page)]">
        <div className="hidden lg:block">
          <DashboardSidebar />
        </div>
        <DashboardHeader />
        <main className="pt-16 lg:pl-sidebar pb-20 lg:pb-8">
          <div className="p-6 max-w-content">{children}</div>
        </main>
        <DashboardMobileNav />

        <SupportButton />
      </div>
    </AuthGuard>
  );
}
