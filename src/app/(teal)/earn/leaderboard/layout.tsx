import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Earners Leaderboard — NexGuild",
  description:
    "See who's earning the most on NexGuild. Top contributors ranked by approved tasks. Join and climb the leaderboard.",
  keywords: ["NexGuild leaderboard", "top contributors", "earn online ranking", "global contributor community"],
  alternates: { canonical: "https://www.nexguild.in/earn/leaderboard" },
  openGraph: {
    title: "Top Earners Leaderboard — NexGuild",
    description: "See top NexGuild contributors ranked by approved submissions.",
    url: "https://www.nexguild.in/earn/leaderboard",
    type: "website",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
