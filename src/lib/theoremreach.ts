export const DEFAULT_THEOREMREACH_EXCHANGE_RATE = 660;

export function getTheoremReachExchangeRate(config: Record<string, unknown> | null): number {
  const configuredRate = config?.exchange_rate ?? DEFAULT_THEOREMREACH_EXCHANGE_RATE;
  const exchangeRate = typeof configuredRate === "number" ? configuredRate : Number(configuredRate);
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new Error("TheoremReach exchange_rate must be a positive number in Admin → Offerwalls");
  }
  return exchangeRate;
}
