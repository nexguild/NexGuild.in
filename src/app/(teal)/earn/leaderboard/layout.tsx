import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Earners Leaderboard — NexGuild",
  description:
    "See who's earning the most on NexGuild. Top contributors ranked by approved tasks. Join and climb the leaderboard.",
  keywords: ["NexGuild leaderboard", "top earners India", "earn online ranking", "NexGuild contributors"],
  alternates: { canonical: "https://www.nexguild.in/earn/leaderboard" },
  openGraph: {
    title: "Top Earners Leaderboard — NexGuild",
    description: "India's top online task contributors ranked by approved submissions.",
    url: "https://www.nexguild.in/earn/leaderboard",
    type: "website",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
