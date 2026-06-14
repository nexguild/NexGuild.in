import Link from "next/link";

type LogoVariant = "navbar" | "landing" | "footer";

interface NexGuildLogoProps {
  theme?: "gold" | "teal";
  variant?: LogoVariant;
  className?: string;
  href?: string;
}

export function NexGuildLogo({
  theme = "gold",
  variant = "navbar",
  className,
  href = "/",
}: NexGuildLogoProps) {
  const accent = theme === "teal" ? "#14b8a6" : "#F59E0B";

  const sizes = {
    navbar:  { width: 170, height: 40 },
    landing: { width: 240, height: 70 },
    footer:  { width: 190, height: 55 },
  };

  const { width, height } = sizes[variant];

  // Simple clean icon for navbar
  const NavbarIcon = () => (
    <g transform="translate(20, 20)">
      {/* Center person */}
      <circle cx="0" cy="-6" r="6" fill={accent}/>
      <rect x="-6" y="2" width="12" height="10" rx="6" fill={accent}/>
      {/* Left person */}
      <circle cx="-14" cy="-2" r="4.5" fill={accent} opacity="0.7"/>
      <rect x="-18" y="4" width="9" height="8" rx="4.5" fill={accent} opacity="0.7"/>
      {/* Right person */}
      <circle cx="14" cy="-2" r="4.5" fill={accent} opacity="0.7"/>
      <rect x="9" y="4" width="9" height="8" rx="4.5" fill={accent} opacity="0.7"/>
    </g>
  );

  // Detailed icon for landing/footer
  const DetailedIcon = () => (
    <g transform="translate(50, 30)">
      {/* Center person */}
      <circle cx="0" cy="0" r="13" fill="none" stroke={accent} strokeWidth="1.5"/>
      <circle cx="0" cy="-5" r="5.5" fill={accent}/>
      <rect x="-5.5" y="1" width="11" height="11" rx="5.5" fill={accent}/>
      {/* Left person */}
      <circle cx="-22" cy="6" r="10" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85"/>
      <circle cx="-22" cy="2" r="4" fill={accent} opacity="0.85"/>
      <rect x="-26" y="7" width="8" height="8" rx="4" fill={accent} opacity="0.85"/>
      {/* Right person */}
      <circle cx="22" cy="6" r="10" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85"/>
      <circle cx="22" cy="2" r="4" fill={accent} opacity="0.85"/>
      <rect x="18" y="7" width="8" height="8" rx="4" fill={accent} opacity="0.85"/>
      {/* Far left */}
      <circle cx="-38" cy="14" r="7" fill="none" stroke={accent} strokeWidth="1" opacity="0.5"/>
      <circle cx="-38" cy="11" r="3" fill={accent} opacity="0.5"/>
      {/* Far right */}
      <circle cx="38" cy="14" r="7" fill="none" stroke={accent} strokeWidth="1" opacity="0.5"/>
      <circle cx="38" cy="11" r="3" fill={accent} opacity="0.5"/>
      {/* Lines */}
      <line x1="-10" y1="4" x2="-13" y2="5" stroke={accent} strokeWidth="1" opacity="0.4"/>
      <line x1="10" y1="4" x2="13" y2="5" stroke={accent} strokeWidth="1" opacity="0.4"/>
    </g>
  );

  if (variant === "landing") {
    return (
      <Link
        href={href}
        aria-label="NexGuild — Home"
        className={className}
        style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}
      >
        <svg
          width={180}
          height={95}
          viewBox="0 0 180 95"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* icon centered horizontally at (90, 38) */}
          <g transform="translate(90, 38)">
            <circle cx="0" cy="0" r="13" fill="none" stroke={accent} strokeWidth="1.5"/>
            <circle cx="0" cy="-5" r="5.5" fill={accent}/>
            <rect x="-5.5" y="1" width="11" height="11" rx="5.5" fill={accent}/>
            <circle cx="-22" cy="6" r="10" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85"/>
            <circle cx="-22" cy="2" r="4" fill={accent} opacity="0.85"/>
            <rect x="-26" y="7" width="8" height="8" rx="4" fill={accent} opacity="0.85"/>
            <circle cx="22" cy="6" r="10" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.85"/>
            <circle cx="22" cy="2" r="4" fill={accent} opacity="0.85"/>
            <rect x="18" y="7" width="8" height="8" rx="4" fill={accent} opacity="0.85"/>
            <circle cx="-38" cy="14" r="7" fill="none" stroke={accent} strokeWidth="1" opacity="0.5"/>
            <circle cx="-38" cy="11" r="3" fill={accent} opacity="0.5"/>
            <circle cx="38" cy="14" r="7" fill="none" stroke={accent} strokeWidth="1" opacity="0.5"/>
            <circle cx="38" cy="11" r="3" fill={accent} opacity="0.5"/>
            <line x1="-10" y1="4" x2="-13" y2="5" stroke={accent} strokeWidth="1" opacity="0.4"/>
            <line x1="10" y1="4" x2="13" y2="5" stroke={accent} strokeWidth="1" opacity="0.4"/>
          </g>
          {/* text centered below icon */}
          <text
            x="90"
            y="78"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="900"
            fontSize="26"
            fill="#ffffff"
          >
            Nex<tspan fill={accent}>Guild</tspan>
          </text>
        </svg>
      </Link>
    );
  }

  if (variant === "navbar") {
    return (
      <Link
        href={href}
        aria-label="NexGuild — Home"
        className={className}
        style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, textDecoration: "none", gap: "8px" }}
      >
        <svg width="42" height="40" viewBox="0 0 42 40" xmlns="http://www.w3.org/2000/svg">
          <NavbarIcon />
        </svg>
        <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: "20px", color: "#ffffff", letterSpacing: "0.5px" }}>
          Nex<span style={{ color: accent }}>Guild</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label="NexGuild — Home"
      className={className}
      style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 240 70"
        xmlns="http://www.w3.org/2000/svg"
      >
        <DetailedIcon />
        <text
          x="102"
          y="32"
          fontFamily="Arial, sans-serif"
          fontWeight="900"
          fontSize="26"
          fill="#ffffff"
        >
          Nex<tspan fill={accent}>Guild</tspan>
        </text>
        {variant === "footer" && (
          <>
            <line x1="102" y1="42" x2="237" y2="42" stroke={accent} strokeWidth="0.6" opacity="0.35"/>
            <text
              x="102"
              y="56"
              fontFamily="Arial, sans-serif"
              fontWeight="300"
              fontSize="7"
              fill={accent}
              letterSpacing="3"
              opacity="0.75"
            >
              DIGITAL WORKFORCE
            </text>
          </>
        )}
      </svg>
    </Link>
  );
}