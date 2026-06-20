interface NexCoinIconProps {
  size?: number;
  className?: string;
}

export function NexCoinIcon({ size = 20, className }: NexCoinIconProps) {
  return (
    <img
      src="/icons/nexcoin.svg"
      alt="NexCoin"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", flexShrink: 0 }}
    />
  );
}
