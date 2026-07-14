import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program — Earn by Inviting Friends | NexGuild",
  description:
    "Invite friends to NexGuild and earn NexCoins for every active referral. Get your personal referral link and start earning passive income in India.",
  keywords: ["referral earn India", "NexGuild refer friend", "invite earn online India", "referral coins NexGuild"],
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
