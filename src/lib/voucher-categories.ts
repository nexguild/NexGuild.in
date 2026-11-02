export const VOUCHER_CATEGORIES = [
  { value: "shopping", label: "Shopping", emoji: "🛍️" },
  { value: "food_groceries", label: "Food & groceries", emoji: "🛒" },
  { value: "movies_ott", label: "Movies & OTT", emoji: "🎬" },
  { value: "travel_hospitality", label: "Travel & hospitality", emoji: "🧳" },
  { value: "electronics", label: "Electronics", emoji: "💻" },
  { value: "jewellery_wearables", label: "Jewellery & wearables", emoji: "💎" },
  { value: "beauty_wellness", label: "Beauty & wellness", emoji: "💄" },
  { value: "others", label: "Others", emoji: "⋯" },
] as const;

export type VoucherCategory = (typeof VOUCHER_CATEGORIES)[number]["value"];

export function isVoucherCategory(value: string): value is VoucherCategory {
  return VOUCHER_CATEGORIES.some((category) => category.value === value);
}

export function getVoucherCategoryEmoji(value: string): string {
  return VOUCHER_CATEGORIES.find((category) => category.value === value)?.emoji ?? "🎁";
}
