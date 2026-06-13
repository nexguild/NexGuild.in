import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const metadata: Metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-form">
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-7">Sign in to your contributor account</p>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <Link href="/forgot-password" className="text-xs text-[var(--text-link)] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full h-10 px-3 pr-10 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                aria-label="Show password"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-1">
            Log In
          </Button>
        </form>

        <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--text-link)] font-medium hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
