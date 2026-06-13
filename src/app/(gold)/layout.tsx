import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function GoldLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-gold min-h-screen bg-[var(--surface-page)]">
      <PublicHeader />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
