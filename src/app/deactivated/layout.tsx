import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Deactivated | NexGuild",
  robots: { index: false, follow: false },
};

export default function DeactivatedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
