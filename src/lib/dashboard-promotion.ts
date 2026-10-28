export interface DashboardPromotion {
  enabled: boolean;
  label: string;
  headline: string;
  message: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
  startsAt: string;
  endsAt: string;
}

export const DEFAULT_DASHBOARD_PROMOTION: DashboardPromotion = {
  enabled: true,
  label: "CPX Research Bonus · Now live",
  headline: "+1,000 NC bonus for every 5,000 NC",
  message:
    "Earn 1,000 bonus NC per 5,000 eligible NC from completed CPX surveys, during 28–31 October (IST). Submit the claim form; all rewards are verified by NexGuild and are subject to approval.",
  primaryLabel: "🎁 Claim your bonus",
  primaryUrl: "https://forms.gle/DTYcZV3BYCQCUBmY7",
  secondaryLabel: "🚀 Open CPX Research",
  secondaryUrl: "/dashboard/offerwalls/cpx_research",
  startsAt: "2026-10-27T18:30:00.000Z",
  endsAt: "2026-10-31T18:29:59.999Z",
};

export const DASHBOARD_PROMOTION_SETTING_KEY = "dashboard_promotion";

export function isValidPromotionUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function parseDashboardPromotion(value: unknown): DashboardPromotion | null {
  if (!value || typeof value !== "object") return null;
  const promo = value as Partial<DashboardPromotion>;
  const textFields = [
    promo.label,
    promo.headline,
    promo.message,
    promo.primaryLabel,
    promo.primaryUrl,
    promo.secondaryLabel,
    promo.secondaryUrl,
    promo.startsAt,
    promo.endsAt,
  ];

  if (
    typeof promo.enabled !== "boolean" ||
    textFields.some((field) => typeof field !== "string") ||
    !promo.label!.trim() ||
    !promo.headline!.trim() ||
    !promo.message!.trim() ||
    !promo.primaryLabel!.trim() ||
    !promo.primaryUrl!.trim() ||
    promo.label!.length > 100 ||
    promo.headline!.length > 180 ||
    promo.message!.length > 1200 ||
    promo.primaryLabel!.length > 60 ||
    promo.primaryUrl!.length > 2048 ||
    promo.secondaryLabel!.length > 60 ||
    promo.secondaryUrl!.length > 2048 ||
    [promo.label, promo.headline, promo.message, promo.primaryLabel, promo.primaryUrl, promo.secondaryLabel, promo.secondaryUrl]
      .some((field) => field !== field!.trim()) ||
    !isValidPromotionUrl(promo.primaryUrl!) ||
    (promo.secondaryUrl !== "" && !isValidPromotionUrl(promo.secondaryUrl!))
  ) {
    return null;
  }

  if (
    (promo.startsAt !== "" && !Number.isFinite(Date.parse(promo.startsAt!))) ||
    (promo.endsAt !== "" && !Number.isFinite(Date.parse(promo.endsAt!))) ||
    (promo.startsAt !== "" && promo.endsAt !== "" && Date.parse(promo.startsAt!) > Date.parse(promo.endsAt!))
  ) {
    return null;
  }

  return promo as DashboardPromotion;
}
