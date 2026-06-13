import Image from "next/image";
import Link from "next/link";

type LogoVariant = "navbar" | "landing" | "footer";

interface NexGuildLogoProps {
  theme?:   "gold" | "teal"; // kept for API compat; image colors are fixed
  variant?: LogoVariant;
  className?: string;
  href?: string;
}

export function NexGuildLogo({
  variant  = "navbar",
  className,
  href     = "/",
}: NexGuildLogoProps) {
  /* navbar uses the compact icon+text crop; others use the full logo */
  const src = variant === "navbar" ? "/logo-nav.png" : "/logo.png";

  /* rendered height per context; width is auto (aspect-ratio preserved) */
  const height = variant === "navbar" ? 36 : variant === "landing" ? 52 : 40;

  return (
    <Link
      href={href}
      aria-label="NexGuild — Home"
      className={className}
      style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}
    >
      <Image
        src={src}
        alt="NexGuild"
        width={400}
        height={160}
        priority
        style={{ height: `${height}px`, width: "auto", display: "block" }}
      />
    </Link>
  );
}
