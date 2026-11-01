import { redirect } from "next/navigation";

export default function LegacyBinanceRedemptionsPage() {
  redirect("/admin/global-payouts");
}
