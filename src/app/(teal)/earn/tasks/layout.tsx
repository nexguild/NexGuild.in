import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Tasks — Earn Online India | NexGuild",
  description:
    "Browse all 12 task categories on NexGuild — audio recording, transcription, data annotation, app testing, surveys, offerwalls, remote jobs and more. Work from phone, earn NexCoins.",
  keywords: [
    "online tasks India",
    "earn from phone India",
    "audio recording tasks",
    "transcription jobs India",
    "data annotation tasks",
    "app testing jobs India",
    "survey tasks India",
    "NexGuild tasks",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn/tasks" },
  openGraph: {
    title: "Browse All Earning Tasks — NexGuild",
    description: "12 categories of paid tasks. Work from your phone. Earn NexCoins and redeem for gift vouchers.",
    url: "https://www.nexguild.in/earn/tasks",
    type: "website",
  },
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
