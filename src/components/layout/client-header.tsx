"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";

const NAV_LINKS = [
  { label: "Services",     href: "/services" },
  { label: "How It Works", href: "/client/how-it-works" },
  { label: "About",        href: "/about" },
  { label: "Contact",      href: "/contact" },
];

export function ClientHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300",
          scrolled ? "glass-nav" : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-container px-6 h-full flex items-center justify-between">

          {/* Logo + Home link */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <NexGuildLogo theme="gold" />
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-white/30 hover:text-[#F59E0B] transition-colors"
            >
              ← Home
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm transition-colors duration-150",
                  pathname === link.href
                    ? "text-[#F59E0B] font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/earn"
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Are you a contributor? →
            </Link>
            <Link
              href="/contact"
              className="h-9 px-5 inline-flex items-center rounded-lg bg-[#F59E0B] text-[#0D0D0D] text-sm font-semibold hover:bg-[#FCD34D] transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full lg:hidden",
          "flex flex-col transition-transform duration-300 ease-out",
          "bg-[#111111] border-l border-[#222222]",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#222222]">
          <NexGuildLogo theme="gold" />
          <button
            onClick={() => setMobileOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-md text-white/60 hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {/* Back to Home */}
          <Link
            href="/"
            className="flex items-center h-10 px-3 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors mb-2"
          >
            ← Back to Home
          </Link>

          <div className="h-px bg-[#222222] mb-2" />

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center h-12 px-3 rounded-md text-base transition-colors mb-0.5",
                pathname === link.href
                  ? "text-[#F59E0B] bg-[rgba(245,158,11,0.08)] font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-[#222222] my-4" />

          <Link
            href="/earn"
            className="flex items-center h-11 px-3 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Are you a contributor? →
          </Link>
          <Link
            href="/contact"
            className="flex items-center justify-center h-11 px-3 rounded-md text-base font-semibold mt-2 bg-[#F59E0B] text-[#0D0D0D] hover:bg-[#FCD34D] transition-colors"
          >
            Contact Us
          </Link>
        </nav>
      </div>
    </>
  );
}
