import { NexGuildLogo } from "@/components/ui/nexguild-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-teal min-h-screen bg-[var(--surface-page)] flex flex-col">
      {/* বাইরের Link কেটে শুধু লোগোটা রাখলাম */}
      <div className="absolute top-4 left-4 z-50">
        <NexGuildLogo theme="teal" />
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