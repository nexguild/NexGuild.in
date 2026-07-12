import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Community — NexGuild" };

const CHANNELS = [
  {
    name: "Telegram Group",
    handle: "NexGuild Announcements 📢",
    href: "https://t.me/nexguild_community",
    desc: "Main community chat. Ask questions, get task updates, and connect with other contributors.",
    color: "#229ED9",
    bgColor: "#229ED918",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#229ED9">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
];

export default function CommunityPage() {
  return (
    <div className="space-y-6 animate-fade-slide-up">

      {/* ── Gradient Hero ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm flex-shrink-0">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">Community</h1>
            <p className="text-white/70 text-sm mt-1">
              Connect with contributors, ask questions, and stay updated on new tasks.
            </p>
          </div>
        </div>
      </div>

      {/* ── Channels ──────────────────────────────────────────────────── */}
      <div className="space-y-3 animate-fade-slide-up" style={{ animationDelay: "80ms" }}>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Join Us</h2>
        {CHANNELS.map((ch) => (
          <a
            key={ch.href}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group"
          >
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: ch.bgColor }}
            >
              {ch.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-slate-800">{ch.name}</h3>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Official</span>
              </div>
              <p className="text-xs text-slate-400 mb-1">{ch.handle}</p>
              <p className="text-sm text-slate-500">{ch.desc}</p>
            </div>
            <svg
              className="h-4 w-4 text-slate-300 flex-shrink-0 group-hover:text-indigo-400 transition-colors"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        ))}
      </div>

      {/* ── Community Guidelines ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-fade-slide-up" style={{ animationDelay: "150ms" }}>
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg text-white text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
          >
            ✓
          </span>
          Community Guidelines
        </h2>
        <ul className="space-y-3">
          {[
            "Be respectful and help others when you can.",
            "No spam, self-promotion, or off-topic links.",
            "Do not share task answers or cheat — it affects everyone's coins.",
          ].map((rule) => (
            <li key={rule} className="flex items-start gap-3 text-sm text-slate-600">
              <span className="mt-0.5 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold">→</span>
              {rule}
            </li>
          ))}
          <li className="flex items-start gap-3 text-sm text-slate-600">
            <span className="mt-0.5 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500 text-xs font-bold">→</span>
            For account issues, use{" "}
            <Link href="/dashboard/support" className="text-indigo-500 hover:text-indigo-700 hover:underline font-medium">
              Support Tickets
            </Link>{" "}
            instead of the community chat.
          </li>
        </ul>
      </div>

    </div>
  );
}
