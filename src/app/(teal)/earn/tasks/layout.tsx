import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Online Tasks Worldwide | NexGuild",
  description:
    "Browse all 12 task categories on NexGuild — audio recording, transcription, data annotation, app testing, surveys, offerwalls, remote jobs and more. Work from phone, earn NexCoins.",
  keywords: [
    "online tasks worldwide",
    "earn from your phone",
    "audio recording tasks",
    "transcription tasks",
    "data annotation tasks",
    "app testing tasks",
    "online survey tasks",
    "NexGuild tasks",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn/tasks" },
  openGraph: {
    title: "Browse All Earning Tasks — NexGuild",
    description: "Explore task categories, earn NexCoins, and check opportunities available in your region.",
    url: "https://www.nexguild.in/earn/tasks",
    type: "website",
  },
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
