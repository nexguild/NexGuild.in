import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of Service" };
export default function TermsPage() {
  return (
    <div className="bg-[var(--surface-card)] py-16 px-6">
      <div className="mx-auto max-w-prose">
        <p className="text-sm text-[var(--text-muted)] mb-2">Last updated: June 2025</p>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Terms of Service</h1>
        <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-secondary)]">
          <p>These Terms of Service govern your use of NexGuild. By creating an account, you agree to these terms.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">1. Contributor Relationship</h2>
          <p>Contributors are independent contractors, not employees of NexGuild. You are responsible for your own taxes and legal obligations related to income earned on the platform.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">2. Account Eligibility</h2>
          <p>You must be at least 18 years old to create an account. You may only hold one account. Creating multiple accounts will result in permanent suspension.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">3. Earnings and Payouts</h2>
          <p>Earnings are credited to your wallet only after successful review and approval. NexGuild reserves the right to withhold payment for submissions that do not meet quality standards.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">4. Prohibited Conduct</h2>
          <p>You may not use automated tools, submit fraudulent responses, create fake submissions, or engage in any activity intended to game the platform.</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">5. Account Termination</h2>
          <p>NexGuild reserves the right to suspend or terminate accounts that violate these terms, with or without notice.</p>
          <p className="text-[var(--text-muted)] text-xs mt-8">For questions about these terms, contact us at nexguild.in@gmail.com.</p>
        </div>
      </div>
    </div>
  );
}
