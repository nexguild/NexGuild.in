// Adsterra disabled 2026-06-21 — poor content quality (gambling/dating ads,
// no category blocking available on standard publisher account).
// Placement positions are kept intact for Monetag re-wire once approved.
//
// To re-enable an ad network: inject the network's script in useEffect below,
// render its container div, and add "use client" at the top of this file.

interface AdSlotProps {
  placement: string;
  className?: string;
}

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  // Returning null keeps the slot invisible without breaking page layout.
  // Swap this return for actual ad markup when Monetag (or another network) is ready.
  void placement;
  void className;
  return null;
}
