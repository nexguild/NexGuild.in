import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program — Earn by Inviting Friends | NexGuild",
  description:
    "Invite friends from around the world to NexGuild and earn NexCoins for every active referral. Get your personal referral link and share it globally.",
  keywords: ["NexGuild referral program", "invite friends online", "referral rewards", "referral coins NexGuild"],
  alternates: { canonical: "https://www.nexguild.in/earn/refer" },
  openGraph: {
    title: "Referral Program — NexGuild",
    description: "Earn NexCoins for every friend you bring to NexGuild. Get your unique link and start sharing.",
    url: "https://www.nexguild.in/earn/refer",
    type: "website",
  },
};

export default function ReferLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
