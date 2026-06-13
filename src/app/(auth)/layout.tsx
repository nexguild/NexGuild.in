import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-teal min-h-screen bg-[var(--surface-page)] flex flex-col">
      <div className="absolute top-4 left-6">
        <Link href="/" className="font-bold text-xl tracking-tight">
          <span className="text-white">Nex</span>
          <span className="text-[var(--brand-500)]">Guild</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        {children}
      </div>
      <p className="text-center text-xs text-[var(--text-muted)] pb-6">
        © {new Date().getFullYear()} NexGuild
      </p>
    </div>
  );
}
