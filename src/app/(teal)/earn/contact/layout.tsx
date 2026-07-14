import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | NexGuild",
  description:
    "Get in touch with the NexGuild team. We're here to help with your questions about earning, tasks, payouts, and account support.",
  alternates: { canonical: "https://nexguild.in/earn/contact" },
  openGraph: {
    title: "Contact NexGuild",
    description: "Reach out to the NexGuild support team for help with your account, tasks, or payouts.",
    url: "https://nexguild.in/earn/contact",
  },
  twitter: { card: "summary" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
