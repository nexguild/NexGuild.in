import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earn Money Online — Tasks, Remote Jobs & Surveys | NexGuild",
  description:
    "Earn real money online from home. Complete micro-tasks, paid surveys, data annotation, and offerwalls — or browse remote & WFH job listings worldwide. Redeem for Amazon, PayPal, and Google Play gift vouchers.",
  keywords: [
    "earn money online",
    "work from home tasks",
    "paid surveys online",
    "online earning platform",
    "earn gift vouchers",
    "micro tasks online",
    "remote jobs",
    "WFH jobs",
    "work from home jobs",
    "NexGuild earn",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn" },
  openGraph: {
    title: "Earn Money Online — NexGuild",
    description:
      "Complete micro-tasks, surveys, and offerwalls — or browse remote & WFH jobs worldwide. Earn NexCoins and redeem for gift vouchers.",
    url: "https://www.nexguild.in/earn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Earn Money Online — NexGuild",
    description:
      "Complete micro-tasks, surveys, and browse remote & WFH jobs. Earn NexCoins and redeem for gift vouchers.",
  },
};

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
