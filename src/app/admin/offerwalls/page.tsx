"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Settings2 } from "lucide-react";

interface Provider {
  name: string;
  slug: string;
  active: boolean;
  share: number;
  website: string;
}

const INITIAL_PROVIDERS: Provider[] = [
  { name: "CPX Research",  slug: "cpx",     active: false, share: 70, website: "https://www.cpx-research.com" },
  { name: "Lootably",      slug: "lootably",active: false, share: 68, website: "https://lootably.com" },
  { name: "AdGem",         slug: "adgem",   active: false, share: 65, website: "https://www.adgem.com" },
  { name: "Theorem Reach", slug: "theorem", active: false, share: 72, website: "https://www.theoremreach.com" },
  { name: "BitLabs",       slug: "bitlabs", active: false, share: 70, website: "https://bitlabs.io" },
];

export default function AdminOfferwallsPage() {
  const [providers, setProviders]   = useState<Provider[]>(INITIAL_PROVIDERS);
  const [configuring, setConfiguring] = useState<Provider | null>(null);
  const [shareEdit, setShareEdit]   = useState("");

  function toggleActive(slug: string) {
    setProviders((prev) =>
      prev.map((p) => p.slug === slug ? { ...p, active: !p.active } : p)
    );
  }

  function openConfigure(p: Provider) {
    setConfiguring(p);
    setShareEdit(String(p.share));
  }

  function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!configuring) return;
    const share = Math.min(100, Math.max(0, parseInt(shareEdit) || configuring.share));
    setProviders((prev) =>
      prev.map((p) => p.slug === configuring.slug ? { ...p, share } : p)
    );
    setConfiguring(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Offerwalls</h1>
        <p className="text-sm text-[var(--text-secondary)]">Configure offerwall provider integrations and revenue share.</p>
      </div>

      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
              {["Provider", "Status", "Contributor Share", "Platform Share", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {providers.map((p) => (
              <tr key={p.slug} className="hover:bg-[var(--surface-subtle)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{p.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.active ? "success" : "neutral"}>{p.active ? "Enabled" : "Disabled"}</Badge>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{p.share}%</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{100 - p.share}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openConfigure(p)}>
                      <Settings2 className="h-3.5 w-3.5" /> Configure
                    </Button>
                    <Button
                      size="sm"
                      variant={p.active ? "destructive" : "secondary"}
                      onClick={() => toggleActive(p.slug)}
                    >
                      {p.active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Note: Offerwall provider API keys and embed codes are configured in environment variables. Enable/disable controls are saved locally until a settings DB table is implemented.
      </p>

      {/* Configure Modal */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Configure {configuring.name}</h2>
              <button onClick={() => setConfiguring(null)}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            <form onSubmit={saveConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Contributor Revenue Share (%)
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={shareEdit}
                  onChange={(e) => setShareEdit(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Platform keeps {100 - (parseInt(shareEdit) || configuring.share)}%. Contributors earn {shareEdit || configuring.share}%.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Provider Website</label>
                <a
                  href={configuring.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--brand-500)] hover:underline"
                >
                  {configuring.website}
                </a>
                <p className="text-xs text-[var(--text-muted)] mt-1">Set your API key in <code className="font-mono">.env.local</code></p>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfiguring(null)}>Cancel</Button>
                <Button type="submit" className="flex-1">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
