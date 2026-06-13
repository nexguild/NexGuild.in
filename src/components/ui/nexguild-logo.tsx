import Link from "next/link";

type LogoVariant = "navbar" | "landing" | "footer";

interface NexGuildLogoProps {
  theme?: "gold" | "teal";
  variant?: LogoVariant;
  className?: string;
  href?: string;
}

export function NexGuildLogo({
  theme   = "gold",
  variant = "navbar",
  className,
  href = "/",
}: NexGuildLogoProps) {
  const accent = theme === "teal" ? "#14b8a6" : "#F59E0B";

  /* Shared icon group — all sizes use the same paths, just scaled differently */
  const Icon = () => (
    <>
      {/* Main / front person */}
      <circle cx="0"  cy="0"  r="10" fill="#1a1a1a" stroke={accent} strokeWidth="1.5" />
      <circle cx="0"  cy="-6" r="4"  fill={accent} />
      <rect   x="-4" y="-1"  width="8" height="9" rx="4" fill={accent} />
      {/* Left secondary */}
      <circle cx="-16" cy="6" r="7" fill="#1a1a1a" stroke={accent} strokeWidth="1" opacity="0.85" />
      <circle cx="-16" cy="2" r="3" fill={accent} opacity="0.85" />
      <rect   x="-19" y="6"  width="6" height="7" rx="3" fill={accent} opacity="0.85" />
      {/* Right secondary */}
      <circle cx="16" cy="6" r="7" fill="#1a1a1a" stroke={accent} strokeWidth="1" opacity="0.85" />
      <circle cx="16" cy="2" r="3" fill={accent} opacity="0.85" />
      <rect   x="13" y="6"  width="6" height="7" rx="3" fill={accent} opacity="0.85" />
      {/* Outer left */}
      <circle cx="-26" cy="14" r="5" fill="#1a1a1a" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <circle cx="-26" cy="11" r="2.5" fill={accent} opacity="0.5" />
      {/* Outer right */}
      <circle cx="26" cy="14" r="5" fill="#1a1a1a" stroke={accent} strokeWidth="0.8" opacity="0.5" />
      <circle cx="26" cy="11" r="2.5" fill={accent} opacity="0.5" />
    </>
  );

  /* ── NAVBAR ─ compact, no tagline ──────────────────────────── */
  if (variant === "navbar") {
    return (
      <Link href={href} aria-label="NexGuild — Home" className={className}
        style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}>
        <svg width="152" height="32" viewBox="0 0 152 32"
          xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          {/*
            Icon: translate(17, 11) scale(0.96)
            Natural span: 10px above + 19px below center
            At 0.96: top = 11-9.6=1.4, bottom = 11+18.24=29.24 → 28px icon ✓
          */}
          <g transform="translate(17, 11) scale(0.96)">
            <Icon />
          </g>
          <text
            x="49" y="16"
            fontFamily="Arial, sans-serif"
            fontWeight="900"
            fontSize="17"
            fill="#ffffff"
            dominantBaseline="middle"
          >
            Nex<tspan fill={accent}>Guild</tspan>
          </text>
        </svg>
      </Link>
    );
  }

  /* ── LANDING ─ prominent, no tagline ──────────────────────── */
  if (variant === "landing") {
    return (
      <Link href={href} aria-label="NexGuild — Home" className={className}
        style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}>
        <svg width="220" height="42" viewBox="0 0 220 42"
          xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          {/*
            Icon: translate(22, 13) scale(1.30)
            At 1.30: top = 13-13=0, bottom = 13+24.7=37.7 → ~38px icon ✓
          */}
          <g transform="translate(22, 13) scale(1.30)">
            <Icon />
          </g>
          <text
            x="68" y="21"
            fontFamily="Arial, sans-serif"
            fontWeight="900"
            fontSize="24"
            fill="#ffffff"
            dominantBaseline="middle"
          >
            Nex<tspan fill={accent}>Guild</tspan>
          </text>
        </svg>
      </Link>
    );
  }

  /* ── FOOTER ─ with tagline ─────────────────────────────────── */
  return (
    <Link href={href} aria-label="NexGuild — Home" className={className}
      style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}>
      <svg width="165" height="48" viewBox="0 0 165 48"
        xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        {/*
          Icon: translate(22, 18) scale(0.88)
          At 0.88: top = 18-8.8=9.2, bottom = 18+16.72=34.72 → 25.5px icon ✓
          Leaves room for text at y≈16 and tagline at y≈33
        */}
        <g transform="translate(22, 18) scale(0.88)">
          <Icon />
        </g>
        <text
          x="50" y="16"
          fontFamily="Arial, sans-serif"
          fontWeight="900"
          fontSize="15"
          fill="#ffffff"
        >
          Nex<tspan fill={accent}>Guild</tspan>
        </text>
        <text
          x="50" y="33"
          fontFamily="Arial, sans-serif"
          fontWeight="300"
          fontSize="5.5"
          fill={accent}
          letterSpacing="2"
          opacity="0.75"
        >
          DIGITAL WORKFORCE
        </text>
      </svg>
    </Link>
  );
}
