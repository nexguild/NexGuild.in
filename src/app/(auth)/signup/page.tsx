import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const metadata: Metadata = { title: "Create Account" };

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Brazil", "Nigeria", "Philippines",
  "Bangladesh", "Pakistan", "Indonesia", "Mexico", "South Africa",
  "Other",
];

export default function SignupPage() {
  return (
    <div className="w-full max-w-form">
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-7">Free to join. Start earning immediately.</p>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Full Name <span className="text-[var(--danger-text)]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Your full name"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email <span className="text-[var(--danger-text)]">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Password <span className="text-[var(--danger-text)]">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Confirm Password <span className="text-[var(--danger-text)]">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Repeat your password"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Country <span className="text-[var(--danger-text)]">*</span>
            </label>
            <select
              required
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="terms"
              required
              className="mt-0.5 h-4 w-4 rounded border-[var(--border-default)] accent-[var(--brand-500)]"
            />
            <label htmlFor="terms" className="text-sm text-[var(--text-secondary)]">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="text-[var(--text-link)] hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" target="_blank" className="text-[var(--text-link)] hover:underline">Privacy Policy</Link>
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full mt-1">
            Create Account
          </Button>
        </form>

        <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--text-link)] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
