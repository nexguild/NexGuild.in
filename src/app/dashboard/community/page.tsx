import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Community — NexGuild" };

const CHANNELS = [
  {
    name: "Telegram Group",
    handle: "t.me/nexguild",
    href: "https://t.me/nexguild_community",
    desc: "Main community chat. Ask questions, get task updates, and connect with other contributors.",
    color: "#229ED9",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#229ED9">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
];

export default function CommunityPage() {
  return (
    <div className="p-6 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Community</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Connect with other contributors, ask questions, and stay updated on new tasks.
        </p>
      </div>

      {/* Channels */}
      <div className="space-y-4 mb-10">
        {CHANNELS.map((ch) => (
          <a
            key={ch.href}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 hover:border-[var(--border-strong)] transition-colors group"
          >
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity group-hover:opacity-90"
              style={{ background: `${ch.color}18` }}
            >
              {ch.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-[var(--text-primary)]">{ch.name}</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-1">{ch.handle}</p>
              <p className="text-sm text-[var(--text-secondary)]">{ch.desc}</p>
            </div>
            <svg
              className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0 group-hover:text-[var(--text-secondary)] transition-colors"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ))}
      </div>

      {/* Community guidelines */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Community Guidelines</h2>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--brand-500)] mt-0.5">→</span>
            Be respectful and help others when you can.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--brand-500)] mt-0.5">→</span>
            No spam, self-promotion, or off-topic links.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--brand-500)] mt-0.5">→</span>
            Do not share task answers or cheat — it affects everyone&apos;s coins.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--brand-500)] mt-0.5">→</span>
            For account issues, use <Link href="/dashboard/support" className="text-[var(--brand-500)] hover:underline">Support Tickets</Link> instead of the community chat.
          </li>
        </ul>
      </div>

    </div>
  );
}
