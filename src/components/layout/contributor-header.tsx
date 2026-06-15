"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";
const NAV_LINKS = [
  { label: "Home",          href: "/earn" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "How It Works",  href: "/how-it-works" },
  { label: "FAQ",           href: "/faq" },
];

export function ContributorHeader() {
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

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <NexGuildLogo theme="teal" href="/earn" />
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
                    ? "text-[#14b8a6] font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/client"
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              For organizations →
            </Link>
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="h-9 px-5 inline-flex items-center rounded-lg bg-[#14b8a6] text-[#0A1628] text-sm font-semibold hover:bg-[#5eead4] transition-colors"
            >
              Sign Up Free →
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
          "bg-[#0d1f38] border-l border-[#1e3a5f]",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#1e3a5f]">
          <NexGuildLogo theme="teal" href="/earn" />
          <button
            onClick={() => setMobileOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-md text-white/60 hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center h-12 px-3 rounded-md text-base transition-colors mb-0.5",
                pathname === link.href
                  ? "text-[#14b8a6] bg-[rgba(20,184,166,0.08)] font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-[#1e3a5f] my-4" />

          <Link
            href="/client"
            className="flex items-center h-11 px-3 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            For organizations →
          </Link>
          <Link
            href="/login"
            className="flex items-center h-12 px-3 rounded-md text-base text-white/60 hover:text-white hover:bg-white/5 transition-colors mt-1"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center h-11 px-3 rounded-md text-base font-semibold mt-2 bg-[#14b8a6] text-[#0A1628] hover:bg-[#5eead4] transition-colors"
          >
            Sign Up Free →
          </Link>
        </nav>
      </div>
    </>
  );
}
