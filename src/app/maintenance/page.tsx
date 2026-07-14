import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Under Maintenance — NexGuild",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#06111f] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
          <circle cx="24" cy="24" r="24" fill="rgba(20,184,166,0.1)" />
          <path d="M24 14v12M24 34h.01" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
      <p className="text-white/60 max-w-sm leading-relaxed mb-8">
        NexGuild is currently undergoing scheduled maintenance. We&apos;ll be back online shortly.
      </p>
      <p className="text-sm text-white/30">
        Are you an admin?{" "}
        <Link href="/admin" className="text-[#14b8a6] hover:underline">
          Go to admin panel →
        </Link>
      </p>
    </div>
  );
}
