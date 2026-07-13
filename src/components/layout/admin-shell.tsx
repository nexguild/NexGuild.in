"use client";

import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AdminHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <main className="pt-16 lg:pl-sidebar-admin">
        <div className="p-6">{children}</div>
      </main>
    </>
  );
}
