interface PayoutBreakdownProps {
  gross: number;
}

const INR_PER_NC = 1 / 12.5; // 12.5 NC = ₹1

export function PayoutBreakdown({ gross }: PayoutBreakdownProps) {
  if (!gross || gross <= 0) return null;

  const contributor = Math.floor(gross * 0.66);
  const nexleader   = Math.floor(gross * 0.10);
  const platform    = gross - contributor - nexleader;
  const inrValue    = Math.floor(contributor * INR_PER_NC);

  return (
    <div className="rounded-lg p-3.5 space-y-2.5 text-xs" style={{
      background: "var(--surface-subtle)",
      border: "1px solid var(--border-default)",
    }}>
      <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
        💰 Payout Breakdown
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: "#02b491" }}>Contributor receives</span>
          <span className="font-bold" style={{ color: "#02b491" }}>{contributor} NC <span className="font-normal opacity-70">(66%)</span></span>
        </div>
        <div className="flex items-center justify-between text-[var(--text-secondary)]">
          <span>NexLeader commission</span>
          <span className="font-semibold text-[var(--text-primary)]">{nexleader} NC <span className="font-normal text-[var(--text-muted)]">(10%)</span></span>
        </div>
        <div className="flex items-center justify-between text-[var(--text-secondary)]">
          <span>Platform</span>
          <span className="font-semibold text-[var(--text-primary)]">{platform} NC <span className="font-normal text-[var(--text-muted)]">(24%)</span></span>
        </div>
        <div className="border-t pt-2" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center justify-between text-[var(--text-secondary)]">
            <span>≈ ₹ value for contributor</span>
            <span className="font-semibold text-[var(--text-primary)]">₹{inrValue}</span>
          </div>
        </div>
      </div>

      <p className="text-[var(--text-muted)] leading-relaxed pt-0.5" style={{ borderTop: "1px dashed var(--border-default)", paddingTop: "0.5rem" }}>
        <span className="font-semibold text-[var(--text-secondary)]">Tip:</span> Want contributor to receive a specific amount?
        Enter <span className="font-mono font-semibold text-[var(--text-primary)]">[target ÷ 0.66]</span> as the gross amount.
        E.g. for 100 NC to contributor, enter <span className="font-mono font-semibold text-[var(--text-primary)]">152</span>.
      </p>
    </div>
  );
}
