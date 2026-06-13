import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return (
    <div className="bg-[var(--surface-card)] py-16 px-6">
      <div className="mx-auto max-w-prose">
        <p className="text-sm text-[var(--text-muted)] mb-2">Last updated: June 2025</p>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-[var(--text-secondary)]">
          <p>NexGuild is committed to protecting your personal information and being transparent about what we collect and how we use it.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">What We Collect</h2>
          <p>We collect your name, email address, country, and submission content necessary to operate the platform. We also collect usage data to improve the experience.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">How We Use It</h2>
          <p>Your data is used to operate your account, process earnings, review submissions, and send service-related notifications. We do not sell your data to third parties.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Data Retention</h2>
          <p>We retain your data for as long as your account is active. You may request deletion by contacting support.</p>
          <p className="text-[var(--text-muted)] text-xs mt-8">For questions about this policy, contact us at nexguild.in@gmail.com.</p>
        </div>
      </div>
    </div>
  );
}
