"use client";

import { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <DashboardHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <main className="pt-16 lg:pl-sidebar">
        <div className="p-4 sm:p-6 w-full">{children}</div>
      </main>
    </>
  );
}
