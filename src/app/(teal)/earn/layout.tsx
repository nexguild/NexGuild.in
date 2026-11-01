import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Tasks, Surveys & Rewards Worldwide | NexGuild",
  description:
    "Explore online tasks, surveys, offerwalls, and remote job listings with NexGuild. Opportunities and reward options depend on your country and provider.",
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
    title: "Online Tasks, Surveys & Rewards — NexGuild",
    description: "Explore online tasks, surveys, offerwalls, and remote jobs. Availability and rewards vary by country and provider.",
    url: "https://www.nexguild.in/earn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Tasks, Surveys & Rewards — NexGuild",
    description: "Explore online tasks, surveys, and remote jobs. Availability and rewards vary by country and provider.",
  },
};

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
