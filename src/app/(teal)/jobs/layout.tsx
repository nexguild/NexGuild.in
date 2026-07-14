import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remote & WFH Jobs in India — NexGuild Jobs",
  description:
    "Browse remote, work-from-home, and office jobs from top companies like Telus, Appen, and Lionbridge. Apply via NexGuild or direct — curated for Indian job seekers.",
  keywords: [
    "remote jobs India",
    "work from home jobs India",
    "WFH jobs",
    "Telus jobs India",
    "Appen jobs",
    "Lionbridge jobs",
    "online jobs India",
    "NexGuild jobs",
  ],
  alternates: { canonical: "https://www.nexguild.in/jobs" },
  openGraph: {
    title: "Remote & WFH Jobs in India — NexGuild",
    description:
      "Browse remote and work-from-home jobs from top companies. Curated for Indian job seekers.",
    url: "https://www.nexguild.in/jobs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remote & WFH Jobs in India — NexGuild",
    description: "Browse remote and WFH jobs curated for Indian job seekers.",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
