import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cookie Policy" };
export default function CookiesPage() {
  return (
    <div className="bg-[var(--surface-card)] py-16 px-6">
      <div className="mx-auto max-w-prose">
        <p className="text-sm text-[var(--text-muted)] mb-2">Last updated: June 2025</p>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Cookie Policy</h1>
        <div className="space-y-6 text-[var(--text-secondary)]">
          <p>NexGuild uses cookies and similar technologies to keep you logged in and improve your experience.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Essential Cookies</h2>
          <p>These are required for the platform to function. They handle authentication sessions and security tokens. You cannot opt out of these while using the platform.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Analytics Cookies</h2>
          <p>We may use privacy-friendly analytics to understand how visitors use the platform. No personal data is included in analytics.</p>
          <p className="text-[var(--text-muted)] text-xs mt-8">For questions about our cookie usage, contact us at nexguild.in@gmail.com.</p>
        </div>
      </div>
    </div>
  );
}
