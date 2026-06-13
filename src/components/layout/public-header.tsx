"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Services",         href: "/for-organizations" },
  { label: "How It Works",     href: "/how-it-works" },
  { label: "Opportunities",    href: "/opportunities" },
  { label: "Start Earning",    href: "/earn" },
  { label: "About",            href: "/about" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16",
          "bg-[var(--surface-card)] transition-all duration-200",
          scrolled && "border-b border-[var(--border-default)]"
        )}
      >
        <div className="mx-auto max-w-container px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand-500)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-lg text-[var(--text-primary)] tracking-tight">
              NexGuild
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
                    ? "font-semibold text-[var(--brand-600)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
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

          {/* Mobile Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-md",
                "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                "hover:bg-[var(--surface-subtle)] transition-colors"
              )}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--surface-overlay)] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-80 max-w-full",
          "bg-[var(--surface-card)] shadow-lg",
          "flex flex-col transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--border-default)]">
          <span className="font-bold text-[var(--text-primary)]">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
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
                "flex items-center h-12 px-3 rounded-md text-base transition-colors",
                pathname === link.href
                  ? "font-semibold text-[var(--brand-600)] bg-[var(--brand-50)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-[var(--border-default)] my-4" />

          <Link
            href="/login"
            className="flex items-center h-12 px-3 rounded-md text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center h-12 px-3 rounded-md text-base font-medium mt-2 bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)] transition-colors"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </>
  );
}
