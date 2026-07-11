"use client";

import { useState } from "react";

interface Props {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const links = [
    {
      label: "Twitter / X",
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      bg: "bg-black/5 text-black hover:bg-black/10",
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${enc(url)}&title=${enc(title)}`,
      bg: "bg-[#0A66C2]/8 text-[#0A66C2] hover:bg-[#0A66C2]/15",
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(title + " " + url)}`,
      bg: "bg-[#25D366]/8 text-[#25D366] hover:bg-[#25D366]/15",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        Share This Article
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${s.bg}`}
          >
            {s.label}
          </a>
        ))}
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
        >
          {copied ? "✓ Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
