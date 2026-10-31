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
      <main className="pt-[72px] lg:pl-sidebar">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          {children}
        </div>
      </main>
    </>
  );
}
