import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Surveys & Offers | NexGuild",
  robots: { index: false, follow: false },
};

export default function SurveyPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
