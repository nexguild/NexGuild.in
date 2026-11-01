export const GLOBAL_PAYOUT_METHODS = [
  { value: "binance_pay", label: "Binance Pay", destinationLabel: "Binance Pay UID" },
  { value: "usdt_trc20", label: "USDT · TRC20", destinationLabel: "TRC20 wallet address" },
  { value: "usdt_bep20", label: "USDT · BEP20", destinationLabel: "BEP20 wallet address" },
  { value: "usdt_erc20", label: "USDT · ERC20", destinationLabel: "ERC20 wallet address" },
] as const;

export type GlobalPayoutMethod = (typeof GLOBAL_PAYOUT_METHODS)[number]["value"];

export const GLOBAL_PAYOUT_PACKAGES = [
  { coins: 10_000, usdt: 10 },
  { coins: 20_000, usdt: 20 },
  { coins: 50_000, usdt: 50 },
] as const;

export function isGlobalPayoutMethod(value: string): value is GlobalPayoutMethod {
  return GLOBAL_PAYOUT_METHODS.some((method) => method.value === value);
}

export function validatePayoutDestination(method: GlobalPayoutMethod, value: string): string | null {
  const destination = value.trim();
  if (destination.length < 4 || destination.length > 200) return "Enter a valid payout destination.";

  if (method === "binance_pay" && !/^[a-zA-Z0-9_-]{4,32}$/.test(destination)) {
    return "Enter a valid Binance Pay UID.";
  }
  if (method === "usdt_trc20" && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(destination)) {
    return "Enter a valid TRC20 wallet address.";
  }
  if ((method === "usdt_bep20" || method === "usdt_erc20") && !/^0x[a-fA-F0-9]{40}$/.test(destination)) {
    return `Enter a valid ${method === "usdt_bep20" ? "BEP20" : "ERC20"} wallet address.`;
  }

  return null;
}
