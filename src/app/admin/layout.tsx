import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
      <AdminSidebar />
      <AdminHeader />
      <main className="pt-16 pl-sidebar-admin">
        <div className="p-6 max-w-content">{children}</div>
      </main>
    </div>
  );
}
