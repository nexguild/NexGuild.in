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
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-card)]">
      <div className="mx-auto max-w-container px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center mb-3">
              <span className="font-bold text-xl tracking-tight">
                <span className="text-white">Nex</span>
                <span className="text-[var(--brand-500)]">Guild</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Real human data for organizations. Real earnings for contributors.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-4 uppercase tracking-wider">
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

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-4 uppercase tracking-wider">
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

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-muted)] mb-4 uppercase tracking-wider">
              Contact
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
                  href="mailto:hello@nexguild.com"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-500)] transition-colors"
                >
                  hello@nexguild.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-default)]">
          <p className="text-sm text-[var(--text-muted)]">
            © {new Date().getFullYear()} NexGuild. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
