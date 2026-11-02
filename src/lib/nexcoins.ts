export const MAX_NEXCOINS_AMOUNT = 2_147_483_647;

const NEXCOIN_DECIMAL_PLACES = 6;

export function normalizeNexcoins(amount: number): number {
  return Number.isFinite(amount) ? Number(amount.toFixed(NEXCOIN_DECIMAL_PLACES)) : Number.NaN;
}

export function isValidNexcoinAmount(amount: number): boolean {
  return Number.isFinite(amount)
    && amount > 0
    && amount <= MAX_NEXCOINS_AMOUNT;
}

export function formatNexcoins(amount: number): string {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
