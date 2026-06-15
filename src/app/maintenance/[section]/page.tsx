import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Under Maintenance — NexGuild" };

const SECTION_META: Record<string, { label: string; backHref: string; backLabel: string }> = {
  org:         { label: "Organization Services", backHref: "/",          backLabel: "Back to Home" },
  contributor: { label: "Contributor Platform",  backHref: "/",          backLabel: "Back to Home" },
  dashboard:   { label: "Contributor Dashboard", backHref: "/earn",      backLabel: "Back to Earn" },
  store:       { label: "NexGuild Store",         backHref: "/dashboard", backLabel: "Back to Dashboard" },
  offerwalls:  { label: "Offerwalls",             backHref: "/dashboard", backLabel: "Back to Dashboard" },
  signup:      { label: "New Registrations",      backHref: "/",          backLabel: "Back to Home" },
};

export default async function SectionMaintenancePage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const meta  = SECTION_META[section] ?? { label: "This Section", backHref: "/", backLabel: "Back to Home" };

  return (
    <div className="min-h-screen bg-[#06111f] flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(20,184,166,0.1)] flex items-center justify-center mb-2">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 6L30 12V24L18 30L6 24V12L18 6Z" stroke="#14b8a6" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M18 6V18M18 18L30 12M18 18L6 12M18 18V30" stroke="#14b8a6" strokeWidth="2" strokeOpacity="0.5" />
          </svg>
        </div>
        <p className="text-[#14b8a6] text-sm font-semibold tracking-widest uppercase">NexGuild</p>
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
      <p className="text-white/70 text-lg mb-2">{meta.label}</p>
      <p className="text-white/50 max-w-sm leading-relaxed mb-8">
        We&apos;re making improvements to bring you a better experience. We&apos;ll be back soon!
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link
          href={meta.backHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[rgba(20,184,166,0.1)] border border-[rgba(20,184,166,0.25)] text-[#14b8a6] text-sm font-medium hover:bg-[rgba(20,184,166,0.2)] transition-colors"
        >
          ← {meta.backLabel}
        </Link>
      </div>

      <p className="text-white/25 text-xs mt-12">
        Are you an admin?{" "}
        <Link href="/admin" className="text-[#14b8a6]/60 hover:text-[#14b8a6] transition-colors">
          Go to admin panel →
        </Link>
      </p>
    </div>
  );
}
