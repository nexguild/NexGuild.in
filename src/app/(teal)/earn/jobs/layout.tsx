import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Remote Jobs & Work Opportunities | NexGuild",
  description:
    "Explore remote and work-from-home roles from employers worldwide. Review each listing for its location, eligibility, and application details.",
  keywords: [
    "remote jobs worldwide",
    "work from home jobs",
    "WFH jobs",
    "international remote jobs",
    "Appen jobs",
    "Lionbridge jobs",
    "online jobs",
    "NexGuild jobs",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn/jobs" },
  openGraph: {
    title: "Remote Jobs & Work Opportunities | NexGuild",
    description: "Explore remote roles from employers worldwide. Location and eligibility vary by listing.",
    url: "https://www.nexguild.in/earn/jobs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remote Jobs & Work Opportunities | NexGuild",
    description: "Explore remote roles from employers worldwide. Location and eligibility vary by listing.",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
