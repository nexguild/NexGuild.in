"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Settings2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_ad_network: boolean;
  api_key: string | null;
  postback_secret: string | null;
  embed_url_template: string | null;
  contributor_share_pct: number;
  notes: string | null;
  updated_at: string;
}

interface FormState {
  api_key: string;
  postback_secret: string;
  embed_url_template: string;
  contributor_share_pct: string;
  notes: string;
}

function isLive(p: Provider) {
  return !!(p.api_key && p.api_key.trim().length > 0);
}

function PostbackUrlCell({ slug }: { slug: string }) {
  const url = `https://nexguild.in/api/offerwall/postback/${slug}`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[260px]">{url}</code>
      <button onClick={copy} className="text-[var(--text-muted)] hover:text-[var(--brand-500)] transition-colors flex-shrink-0">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function SecretField({ value, label }: { value: string; label: string; onChange?: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          readOnly
          type={show ? "text" : "password"}
          value={value}
          className="w-full h-10 px-3 pr-10 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none font-mono"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AdminOfferwallsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading]     = useState(true);
  const [configuring, setConfiguring] = useState<Provider | null>(null);
  const [form, setForm]           = useState<FormState>({ api_key: "", postback_secret: "", embed_url_template: "", contributor_share_pct: "70", notes: "" });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    loadProviders();
  }, [allowed]);

  async function loadProviders() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/offerwalls", {
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (res.ok) {
      const { providers: p } = await res.json() as { providers: Provider[] };
      setProviders(p);
    }
    setLoading(false);
  }

  function openConfigure(p: Provider) {
    setConfiguring(p);
    setSaveError(null);
    setForm({
      api_key:               p.api_key ?? "",
      postback_secret:       p.postback_secret ?? "",
      embed_url_template:    p.embed_url_template ?? "",
      contributor_share_pct: String(p.contributor_share_pct),
      notes:                 p.notes ?? "",
    });
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!configuring) return;
    setSaving(true);
    setSaveError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/offerwalls", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        id:                    configuring.id,
        api_key:               form.api_key,
        postback_secret:       form.postback_secret,
        embed_url_template:    form.embed_url_template,
        contributor_share_pct: form.contributor_share_pct,
        notes:                 form.notes,
      }),
    });

    if (res.ok) {
      const { provider: updated } = await res.json() as { provider: Provider };
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setConfiguring(null);
    } else {
      const { error } = await res.json() as { error: string };
      setSaveError(error ?? "Save failed");
    }
    setSaving(false);
  }

  if (!allowed) return null;

  const taskOfferwalls = providers.filter((p) => !p.is_ad_network);
  const adNetworks     = providers.filter((p) => p.is_ad_network);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Offerwalls</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure offerwall integrations. Paste a provider&apos;s API key to make it go Live — no code changes needed.
        </p>
      </div>

      {/* Task Offerwalls */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Task Offerwalls (10)
        </h2>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Provider", "Status", "Share %", "Postback URL", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-[var(--surface-subtle)] animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : taskOfferwalls.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isLive(p) ? "success" : "neutral"}>
                          {isLive(p) ? "🟢 Live" : "🔜 Coming Soon"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{p.contributor_share_pct}%</td>
                      <td className="px-4 py-3">
                        <PostbackUrlCell slug={p.slug} />
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => openConfigure(p)}>
                          <Settings2 className="h-3.5 w-3.5" /> Configure
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ad Networks */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          Ad Networks (3)
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          These are site-wide ad integrations (Adsterra, Monetag, PropellerAds) — they place ads across NexGuild rather
          than showing a contributor task wall. Postback/revenue tracking can still be configured here.
        </p>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Provider", "Status", "Share %", "Postback URL", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-[var(--surface-subtle)] animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : adNetworks.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isLive(p) ? "success" : "neutral"}>
                          {isLive(p) ? "🟢 Live" : "🔜 Coming Soon"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{p.contributor_share_pct}%</td>
                      <td className="px-4 py-3">
                        <PostbackUrlCell slug={p.slug} />
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => openConfigure(p)}>
                          <Settings2 className="h-3.5 w-3.5" /> Configure
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Modal */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-[var(--surface-card)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-default)] shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">{configuring.name} Settings</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {configuring.is_ad_network ? "Ad Network" : "Task Offerwall"} · Postback:{" "}
                  <code className="font-mono">/api/offerwall/postback/{configuring.slug}</code>
                </p>
              </div>
              <button onClick={() => setConfiguring(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={saveConfig} className="px-6 py-5 space-y-4">

              {/* Status indicator */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--text-secondary)]">Status after save:</span>
                <Badge variant={form.api_key.trim() ? "success" : "neutral"}>
                  {form.api_key.trim() ? "🟢 Live" : "🔜 Coming Soon"}
                </Badge>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">API Key</label>
                <input
                  type="text"
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="Paste API key from provider dashboard"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] font-mono placeholder:font-sans placeholder:text-[var(--text-muted)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Non-empty key → provider goes Live for contributors.</p>
              </div>

              {/* Postback Secret */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Postback Secret</label>
                <input
                  type="text"
                  value={form.postback_secret}
                  onChange={(e) => setForm((f) => ({ ...f, postback_secret: e.target.value }))}
                  placeholder="Secret/token used to validate incoming postbacks"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] font-mono placeholder:font-sans placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Embed URL Template */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Embed URL Template</label>
                <input
                  type="url"
                  value={form.embed_url_template}
                  onChange={(e) => setForm((f) => ({ ...f, embed_url_template: e.target.value }))}
                  placeholder="https://provider.com/embed?uid={user_id}&key=..."
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] font-mono placeholder:font-sans placeholder:text-[var(--text-muted)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Use <code className="font-mono">{"{user_id}"}</code> where the provider needs the contributor&apos;s Supabase UUID.</p>
              </div>

              {/* Contributor Share % */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Contributor Share (%)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.contributor_share_pct}
                  onChange={(e) => setForm((f) => ({ ...f, contributor_share_pct: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Contributors earn {form.contributor_share_pct || "—"}% of the provider&apos;s reported payout as NexCoins.
                  Platform keeps {100 - (parseFloat(form.contributor_share_pct) || 0)}%.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Notes (admin only)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. approved June 25, contact: support@provider.com"
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Existing secrets (read-only masked display) */}
              {(configuring.api_key || configuring.postback_secret) && (
                <div className="space-y-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Currently saved credentials</p>
                  {configuring.api_key && (
                    <SecretField label="Saved API Key" value={configuring.api_key} />
                  )}
                  {configuring.postback_secret && (
                    <SecretField label="Saved Postback Secret" value={configuring.postback_secret} />
                  )}
                </div>
              )}

              {saveError && (
                <p className="text-sm text-red-500">{saveError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfiguring(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={saving}>
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
