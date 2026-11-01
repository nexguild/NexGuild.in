import { DashboardHeader } from "./dashboard-header";
import { ContributorActivityHeartbeat } from "./contributor-activity-heartbeat";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ContributorActivityHeartbeat />
      <DashboardHeader />
      <main className="pt-16 lg:pt-[72px]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          {children}
        </div>
      </main>
    </>
  );
}
