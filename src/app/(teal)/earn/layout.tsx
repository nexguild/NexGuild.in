import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earn Money Online in India — Tasks, Surveys & Offerwalls | NexGuild",
  description:
    "Earn real money online from home in India. Complete micro-tasks, paid surveys, data annotation, and offerwalls on NexGuild. Redeem for Amazon, Flipkart, and Google Play gift vouchers.",
  keywords: [
    "earn money online India",
    "work from home tasks",
    "paid surveys India",
    "online earning app India",
    "earn gift vouchers India",
    "micro tasks India",
    "NexGuild earn",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn" },
  openGraph: {
    title: "Earn Money Online in India — NexGuild",
    description:
      "Complete micro-tasks, surveys, and offerwalls. Earn NexCoins and redeem for Amazon, Flipkart & Google Play gift vouchers.",
    url: "https://www.nexguild.in/earn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Earn Money Online in India — NexGuild",
    description:
      "Complete micro-tasks, surveys, and offerwalls. Earn NexCoins and redeem for gift vouchers.",
  },
};

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
