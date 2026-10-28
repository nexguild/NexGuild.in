import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Earn with NexGuild | NexGuild",
  description:
    "Learn how NexGuild works: join from anywhere, complete eligible tasks, earn NexCoins, and explore rewards available in your region.",
  keywords: [
    "how to earn online",
    "NexGuild how it works",
    "NexCoins explained",
    "earn rewards online",
    "online tasks guide",
    "work from home earning guide",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn/how-it-works" },
  openGraph: {
    title: "How It Works — Earn with NexGuild",
    description: "Step-by-step guide to earning NexCoins and redeeming for real gift vouchers.",
    url: "https://www.nexguild.in/earn/how-it-works",
    type: "website",
  },
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
