import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works — Earn with NexGuild | NexGuild",
  description:
    "Learn how NexGuild works: sign up free, complete tasks from your phone, earn NexCoins, and redeem for Amazon, Flipkart & Google Play gift vouchers. Step-by-step guide.",
  keywords: [
    "how to earn online India",
    "NexGuild how it works",
    "NexCoins explained",
    "earn gift vouchers India",
    "online tasks guide India",
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
