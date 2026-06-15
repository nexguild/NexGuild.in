import { ClientHeader } from "@/components/layout/client-header";
import { GoldFooter } from "@/components/layout/gold-footer";

export default function GoldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
      <ClientHeader />
      <main className="pt-16">{children}</main>
      <GoldFooter />
    </div>
  );
}
