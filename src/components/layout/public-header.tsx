"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Services",      href: "/for-organizations" },
  { label: "How It Works",  href: "/how-it-works" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Start Earning", href: "/earn" },
  { label: "About",         href: "/about" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
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
          <Link href="/" className="flex items-center gap-0 flex-shrink-0 group">
            <span className="font-bold text-xl tracking-tight leading-none select-none">
              <span className="text-white">Nex</span>
              <span className="text-[var(--brand-500)] transition-colors duration-200 group-hover:text-[var(--brand-400)]">Guild</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm transition-colors duration-150",
                  pathname === link.href
                    ? "text-[var(--brand-500)] font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Button asChild size="md">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "flex lg:hidden h-9 w-9 items-center justify-center rounded-md",
              "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              "hover:bg-white/5 transition-colors"
            )}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--surface-overlay)] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full lg:hidden",
          "flex flex-col transition-transform duration-300 ease-out",
          "bg-[var(--surface-card)] border-l border-[var(--border-default)]",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border-default)]">
          <span className="font-bold text-[var(--text-primary)]">
            <span className="text-white">Nex</span>
            <span className="text-[var(--brand-500)]">Guild</span>
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-white/5"
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
                  ? "text-[var(--brand-500)] bg-[var(--brand-50)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-[var(--border-default)] my-4" />

          <Link
            href="/login"
            className="flex items-center h-12 px-3 rounded-md text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center h-12 px-3 rounded-md text-base font-medium mt-2 bg-[var(--brand-500)] text-[var(--text-inverse)] hover:bg-[var(--brand-600)] transition-colors"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </>
  );
}
