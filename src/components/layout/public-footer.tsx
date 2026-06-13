import Link from "next/link";

const PLATFORM_LINKS = [
  { label: "For Organizations", href: "/for-organizations" },
  { label: "Start Earning",     href: "/earn" },
  { label: "How It Works",      href: "/how-it-works" },
  { label: "Opportunities",     href: "/opportunities" },
  { label: "About",             href: "/about" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy",   href: "/privacy" },
  { label: "Cookie Policy",    href: "/cookies" },
];

export function PublicFooter() {
  return (
    <footer className="bg-[var(--surface-card)] border-t border-[var(--border-default)]">
      <div className="mx-auto max-w-container px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[var(--brand-500)] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">NexGuild</span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Real human data for organizations. Real earnings for contributors.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
              Platform
            </h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
              Legal
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4 uppercase tracking-wide">
              Support
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@nexguild.com"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  support@nexguild.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border-default)]">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} NexGuild. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
