import { GoogleAnalytics } from '@next/third-parties/google';
import type { Metadata } from "next";
import "./globals.css";
import { ScrollReset } from "@/components/ui/scroll-reset";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexguild.in"),
  title: {
    template: "%s | NexGuild",
    default: "NexGuild — Earn by Contributing. Grow by Participating.",
  },
  description:
    "NexGuild is a community-driven contributor platform connecting skilled individuals with paid micro-tasks, surveys, content work, and managed projects.",
  keywords: [
    "earn money online India",
    "micro tasks",
    "paid surveys India",
    "work from home India",
    "online earning platform",
    "NexGuild",
    "contributor platform",
    "digital workforce",
  ],
  authors: [{ name: "NexGuild", url: "https://nexguild.in" }],
  creator: "NexGuild",
  publisher: "NexGuild",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://nexguild.in",
    siteName: "NexGuild",
    title: "NexGuild — Earn by Contributing. Grow by Participating.",
    description:
      "Join NexGuild to earn NexCoins by completing micro-tasks, surveys, and content work. Redeem for Amazon, Flipkart, Paytm vouchers and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NexGuild — Digital Workforce Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexGuild — Earn by Contributing. Grow by Participating.",
    description:
      "Join NexGuild to earn NexCoins by completing micro-tasks, surveys, and content work.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/site.webmanifest",
  
  // এখানে তোমার গুগল সার্চ কনসোলের ভেরিফিকেশন কোড যুক্ত করা হলো ভাই
  verification: {
    google: "BcVWlhBG4yrlq_qFBwW7a4omi4HRxjRZ-n28-MeHZLo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) 
{
  return (
    <html lang="en">
      <body>
        <ScrollReset />
        {children}
        <ScrollToTop />
        
        {/* Google Analytics Global Setup */}
        <GoogleAnalytics gaId="G-3WNZK6P6ZZ" />
      </body>
    </html>
  );
}