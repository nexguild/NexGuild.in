import Link from "next/link";
import Image from "next/image";

const COMMUNITY_LINKS = [
  { label: "Start Earning",  href: "/earn" },
  { label: "Opportunities",  href: "/opportunities" },
  { label: "How It Works",   href: "/how-it-works" },
  { label: "Blog",           href: "/earn/blog" },
  { label: "FAQ",            href: "/earn/faq" },
  { label: "About Us",       href: "/earn/about" },
  { label: "Contact",        href: "/earn/contact" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/earn/terms" },
  { label: "Privacy Policy",   href: "/earn/privacy" },
  { label: "Cookie Policy",    href: "/earn/cookies" },
];

export function TealFooter() {
  return (
    <footer className="border-t border-[rgba(20,184,166,0.12)] bg-[#06111f]">
      <div className="mx-auto max-w-container px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <Image
                src="/nexguild_logo_final.png"
                alt="NexGuild"
                width={160}
                height={52}
                style={{ objectFit: "contain" }}
              />
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5">
              India&apos;s contributor community. Complete real tasks from your phone, earn NexCoins, and redeem for Amazon, Flipkart, and more.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/nexguild"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-white/30 hover:text-[#14b8a6] hover:border-[rgba(20,184,166,0.4)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/nexguildin/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-white/30 hover:text-[#14b8a6] hover:border-[rgba(20,184,166,0.4)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://x.com/NexGuild"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-white/30 hover:text-[#14b8a6] hover:border-[rgba(20,184,166,0.4)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.64 7.584H.474l8.6-9.83L0 1.153h7.594l5.243 6.932L18.901 1.153zm-1.291 19.494h2.04L6.486 3.24H4.298L17.61 20.647z"/>
</svg>
              </a>
            </div>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-xs font-semibold text-white/25 mb-4 uppercase tracking-wider">
              Community
            </h4>
            <ul className="space-y-3">
              {COMMUNITY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/45 hover:text-[#14b8a6] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white/25 mb-4 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/45 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-white/25 mb-4 uppercase tracking-wider">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/earn/contact" className="text-sm text-white/45 hover:text-[#14b8a6] transition-colors">
                  Get Help
                </Link>
              </li>
              <li>
                <a
                  href="mailto:admin@nexguild.in"
                  className="text-sm text-white/45 hover:text-[#14b8a6] transition-colors"
                >
                  admin@nexguild.in
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/nexguild"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/45 hover:text-[#229ED9] transition-colors"
                >
                  Telegram Community
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[rgba(20,184,166,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-white/25">
            &copy; {new Date().getFullYear()} NexGuild. All rights reserved.
          </p>
          <Link
            href="/client"
            className="text-xs text-white/20 hover:text-[#F59E0B] transition-colors"
          >
            For organizations &rarr; Explore our services
          </Link>
        </div>
      </div>
    </footer>
  );
}
