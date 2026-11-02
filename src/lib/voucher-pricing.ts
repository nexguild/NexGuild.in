export function getVoucherDiscountedCoins(coinsRequired: number, discountPercent: number): number {
  if (!Number.isSafeInteger(coinsRequired) || coinsRequired <= 0) return 0;
  if (!Number.isSafeInteger(discountPercent) || discountPercent < 0 || discountPercent > 99) return coinsRequired;
  return Math.max(1, Math.floor(coinsRequired * (100 - discountPercent) / 100));
}
