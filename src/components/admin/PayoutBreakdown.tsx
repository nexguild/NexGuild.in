import { NexCoinIcon } from "@/components/ui/nexcoin-icon";

interface PayoutBreakdownProps {
  inrAmount: number;
  nexcoinPerInr: number;
}

export function PayoutBreakdown({ inrAmount, nexcoinPerInr }: PayoutBreakdownProps) {
  if (!inrAmount || inrAmount <= 0 || !nexcoinPerInr) return null;

  const gross       = Math.round(inrAmount * nexcoinPerInr);
  const contributor = Math.floor(gross * 0.66);
  const nexleader   = Math.floor(gross * 0.10);
  const platform    = gross - contributor - nexleader;

  return (
    <div className="rounded-lg p-4 space-y-3 text-sm" style={{
      background: "var(--surface-subtle)",
      border: "1px solid var(--border-default)",
    }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-2.5" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <span className="text-base">💰</span>
        <span className="font-bold text-[var(--text-primary)]">
          ₹{inrAmount.toLocaleString("en-IN")} = <span className="text-amber-400">{gross.toLocaleString()} NC</span>
        </span>
        <span className="text-xs text-[var(--text-muted)]">(gross)</span>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span>👤</span> Contributor receives
          </span>
          <span className="flex items-center gap-1 font-bold" style={{ color: "#02b491" }}>
            <NexCoinIcon size={12} /> {contributor.toLocaleString()} NC
            <span className="font-normal text-[var(--text-muted)] text-xs">(66%)</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span>👑</span> NexLeader commission
          </span>
          <span className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
            <NexCoinIcon size={12} /> {nexleader.toLocaleString()} NC
            <span className="font-normal text-[var(--text-muted)] text-xs">(10%)</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <span>🏛️</span> Platform cut
          </span>
          <span className="flex items-center gap-1 font-semibold text-[var(--text-primary)]">
            <NexCoinIcon size={12} /> {platform.toLocaleString()} NC
            <span className="font-normal text-[var(--text-muted)] text-xs">(24%)</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-[var(--text-muted)] pt-1" style={{ borderTop: "1px dashed var(--border-default)" }}>
        <span className="font-semibold text-[var(--text-secondary)]">Stored in DB:</span>{" "}
        <span className="font-mono">{gross.toLocaleString()} NC</span> as{" "}
        <code className="text-xs bg-[var(--surface-card)] px-1 py-0.5 rounded">pay_per_task</code>.
        Rate: 1 ₹ = {nexcoinPerInr} NC.
      </p>
    </div>
  );
}
