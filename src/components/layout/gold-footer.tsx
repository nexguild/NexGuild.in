import Link from "next/link";
import Image from "next/image";

const COMPANY_LINKS = [
  { label: "For Organizations", href: "/client" },
  { label: "Services",           href: "/services" },
  { label: "How It Works",      href: "/client/how-it-works" },
  { label: "About Us",          href: "/about" },
  { label: "Contact",           href: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/client/terms" },
  { label: "Privacy Policy",   href: "/client/privacy" },
  { label: "Cookie Policy",    href: "/client/cookie-policy" },
];

export function GoldFooter() {
  return (
    <footer 
      className="border-t border-[rgba(245,158,11,0.15)] shadow-xl relative overflow-hidden"
      style={{ backgroundColor: "#110F0E" }} // à¦¸à¦²à¦¿à¦¡ à¦¡à¦¿à¦ª à¦šà¦¾à¦°à¦•à§‹à¦² à¦¬à§à¦²à§à¦¯à¦¾à¦• à¦«à§à¦°à§‡à¦®
    >
      {/* à¦«à§à¦Ÿà¦¾à¦°à§‡ à¦¹à¦¾à¦²à¦•à¦¾ à¦¸à§à¦¥à¦¿à¦° à¦—à§‹à¦²à§à¦¡à§‡à¦¨ à¦°à§‡à¦¡à¦¿à§Ÿà¦¾à¦² à¦¬à§à¦¯à¦¾à¦•à¦—à§à¦°à¦¾à¦‰à¦¨à§à¦¡ à¦¯à¦¾à¦¤à§‡ à¦à¦•à¦¦à¦® à¦«à§à¦²à§à¦¯à¦¾à¦Ÿ à¦¨à¦¾ à¦²à¦¾à¦—à§‡ */}
      <div 
        aria-hidden 
        className="pointer-events-none absolute inset-0 opacity-40" 
        style={{
          backgroundImage: "radial-gradient(circle at 50% 100%, rgba(245, 158, 11, 0.05), transparent 70%)"
        }}
      />

      <div className="mx-auto max-w-container px-6 py-14 relative z-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-5 brightness-110 contrast-125">
              <Image
                src="/nexguild_logo_final.png"
                alt="NexGuild"
                width={160}
                height={52}
                style={{ objectFit: "contain" }}
              />
            </div>
            <p className="text-sm text-stone-400 leading-relaxed mb-5">
              Trusted by organisations for scalable human data projects. We recruit, brief, and manage every contributor â€” end to end.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/somen-biswas-410727215"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-stone-500 hover:text-[#F59E0B] hover:border-[rgba(245,158,11,0.4)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/919382008513"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-stone-500 hover:text-[#25D366] hover:border-[#25D366]/40 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a
                href="https://t.me/nexguild"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="h-8 w-8 rounded-md flex items-center justify-center border border-white/10 text-stone-500 hover:text-[#229ED9] hover:border-[#229ED9]/40 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-[#F59E0B] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-stone-500 mb-4 uppercase tracking-wider">
              Get in Touch
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-stone-400 hover:text-[#F59E0B] transition-colors">
                  Send a Message
                </Link>
              </li>
              <li>
                <a
                  href="mailto:admin@nexguild.in"
                  className="text-sm text-stone-400 hover:text-[#F59E0B] transition-colors"
                >
                  admin@nexguild.in
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919382008513"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-400 hover:text-[#25D366] transition-colors"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/somen-biswas-410727215"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-stone-400 hover:text-[#F59E0B] transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-stone-500">
            &copy; {new Date().getFullYear()} NexGuild. All rights reserved.
          </p>
          <Link
            href="/earn"
            className="text-xs text-stone-600 hover:text-[#F59E0B] transition-colors"
          >
            Looking to earn? Join as a contributor â†’
          </Link>
        </div>
      </div>
    </footer>
  );
}