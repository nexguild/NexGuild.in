import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Earn Money Online in India — Tasks, Remote Jobs & Surveys | NexGuild",
  description:
    "Earn real money online from home in India. Complete micro-tasks, paid surveys, data annotation, and offerwalls — or browse remote & WFH job listings. Redeem for Amazon, Flipkart, and Google Play gift vouchers.",
  keywords: [
    "earn money online India",
    "work from home tasks",
    "paid surveys India",
    "online earning app India",
    "earn gift vouchers India",
    "micro tasks India",
    "remote jobs India",
    "WFH jobs India",
    "work from home jobs India",
    "NexGuild earn",
  ],
  alternates: { canonical: "https://www.nexguild.in/earn" },
  openGraph: {
    title: "Earn Money Online in India — NexGuild",
    description:
      "Complete micro-tasks, surveys, and offerwalls — or browse remote & WFH jobs. Earn NexCoins and redeem for Amazon, Flipkart & Google Play gift vouchers.",
    url: "https://www.nexguild.in/earn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Earn Money Online in India — NexGuild",
    description:
      "Complete micro-tasks, surveys, and browse remote & WFH jobs. Earn NexCoins and redeem for gift vouchers.",
  },
};

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Monetag Push Notifications — zone 11299073 (earn pages only) */}
      <Script
        src="https://5gvci.com/act/files/tag.min.js?z=11299073"
        data-cfasync="false"
        strategy="afterInteractive"
      />
      {/* Monetag In-Page Push Banner — zone 11299133 (earn pages only) */}
      <Script
        id="monetag-inpage-push"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(s){s.dataset.zone='11299133',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`
        }}
      />
    </>
  );
}
