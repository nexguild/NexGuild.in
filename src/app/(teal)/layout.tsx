import { ContributorHeader } from "@/components/layout/contributor-header";
import { TealFooter } from "@/components/layout/teal-footer";

export default function TealLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-teal min-h-screen bg-[var(--surface-page)]">
      <ContributorHeader />
      <main className="pt-16">{children}</main>
      <TealFooter />
    </div>
  );
}
