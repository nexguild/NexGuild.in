"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Settings2, Copy, Check, Eye, EyeOff, Plus, Trash2, Loader2, Link2 } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_ad_network: boolean;
  is_active: boolean;
  api_key: string | null;
  postback_secret: string | null;
  embed_url_template: string | null;
  contributor_share_pct: number;
  notes: string | null;
  updated_at: string;
  integration_type: string;
  postback_param_map: Record<string, string> | null;
  hash_format: string | null;
  custom_config: Record<string, unknown> | null;
  display_order: number;
  logo_url: string | null;
  description: string | null;
}

interface ConfigForm {
  name: string;
  api_key: string;
  postback_secret: string;
  embed_url_template: string;
  contributor_share_pct: string;
  notes: string;
  integration_type: string;
  logo_url: string;
  description: string;
  hash_format: string;
  postback_param_map: string;
  custom_config: string;
  is_active: boolean;
  display_order: string;
  feature_tags: string;
  available_countries: string;
}

interface AddForm {
  name: string;
  slug: string;
  is_ad_network: boolean;
  integration_type: string;
  contributor_share_pct: string;
  description: string;
}

const INTEGRATION_TYPES = [
  { value: "iframe",       label: "iFrame Embed" },
  { value: "script_tag",  label: "Script Tag" },
  { value: "api",          label: "API / Server-side" },
  { value: "direct_link", label: "Direct Link" },
];

function isLive(p: Provider) {
  const hasCredentials = !!(p.api_key && p.api_key.trim().length > 0);
  const hasEmbedUrl    = !!(p.embed_url_template && p.embed_url_template.trim().length > 0);
  return (hasCredentials || hasEmbedUrl) && p.is_active;
}

function PostbackUrlCell({ slug }: { slug: string }) {
  const url = `https://nexguild.in/api/offerwall/postback/${slug}`;
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="flex items-center gap-1.5">
      <code className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[220px]">{url}</code>
      <button onClick={copy} className="text-[var(--text-muted)] hover:text-[var(--brand-500)] transition-colors flex-shrink-0">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function SecretField({ value, label }: { value: string; label: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">{label}</label>
      <div className="relative">
        <input readOnly type={show ? "text" : "password"} value={value}
          className="w-full h-9 px-3 pr-9 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] font-mono focus:outline-none" />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

const EMPTY_FORM: ConfigForm = {
  name: "", api_key: "", postback_secret: "", embed_url_template: "",
  contributor_share_pct: "70", notes: "", integration_type: "iframe",
  logo_url: "", description: "", hash_format: "",
  postback_param_map: "", custom_config: "", is_active: true, display_order: "0",
  feature_tags: "", available_countries: "",
};

export default function AdminOfferwallsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [providers, setProviders]   = useState<Provider[]>([]);
  const [loading, setLoading]       = useState(true);
  const [configuring, setConfiguring] = useState<Provider | null>(null);
  const [form, setForm]             = useState<ConfigForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const [logoPreviewError, setLogoPreviewError] = useState(false);

  // Add provider modal
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState<AddForm>({
    name: "", slug: "", is_ad_network: false, integration_type: "iframe",
    contributor_share_pct: "70", description: "",
  });
  const [adding, setAdding]         = useState(false);
  const [addError, setAddError]     = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { if (allowed) loadProviders(); }, [allowed]);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }

  async function loadProviders() {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/admin/offerwalls", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    setLogoPreviewError(false);

    const cc = p.custom_config ?? {};
    const featureTags = Array.isArray(cc.feature_tags)
      ? (cc.feature_tags as string[]).join(", ")
      : typeof cc.feature_tags === "string" ? cc.feature_tags : "";
    const availableCountries = Array.isArray(cc.available_countries)
      ? (cc.available_countries as string[]).join(", ")
      : typeof cc.available_countries === "string" ? cc.available_countries : "";

    // Strip the dedicated fields from the raw JSON textarea
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { feature_tags: _ft, available_countries: _ac, ...restConfig } = cc;

    setForm({
      name:                  p.name,
      api_key:               p.api_key ?? "",
      postback_secret:       p.postback_secret ?? "",
      embed_url_template:    p.embed_url_template ?? "",
      contributor_share_pct: String(p.contributor_share_pct),
      notes:                 p.notes ?? "",
      integration_type:      p.integration_type ?? "iframe",
      logo_url:              p.logo_url ?? "",
      description:           p.description ?? "",
      hash_format:           p.hash_format ?? "",
      postback_param_map:    p.postback_param_map ? JSON.stringify(p.postback_param_map, null, 2) : "",
      custom_config:         Object.keys(restConfig).length > 0 ? JSON.stringify(restConfig, null, 2) : "",
      is_active:             p.is_active ?? true,
      display_order:         String(p.display_order ?? 0),
      feature_tags:          featureTags,
      available_countries:   availableCountries,
    });
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    if (!configuring) return;
    setSaving(true);
    setSaveError(null);

    let paramMap: Record<string, string> | undefined;
    let customCfg: Record<string, unknown> = {};
    if (form.postback_param_map.trim()) {
      try { paramMap = JSON.parse(form.postback_param_map); }
      catch { setSaveError("Postback Param Map is not valid JSON."); setSaving(false); return; }
    }
    if (form.custom_config.trim()) {
      try { customCfg = JSON.parse(form.custom_config); }
      catch { setSaveError("Custom Config is not valid JSON."); setSaving(false); return; }
    }

    // Merge feature_tags and available_countries back into custom_config
    const tags      = form.feature_tags.split(",").map((t) => t.trim()).filter(Boolean);
    const countries = form.available_countries.split(",").map((c) => c.trim()).filter(Boolean);
    if (tags.length > 0)      customCfg.feature_tags       = tags;
    if (countries.length > 0) customCfg.available_countries = countries;

    const token = await getToken();
    const res = await fetch("/api/admin/offerwalls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id:                    configuring.id,
        name:                  form.name,
        api_key:               form.api_key,
        postback_secret:       form.postback_secret,
        embed_url_template:    form.embed_url_template,
        contributor_share_pct: form.contributor_share_pct,
        notes:                 form.notes,
        integration_type:      form.integration_type,
        logo_url:              form.logo_url,
        description:           form.description,
        hash_format:           form.hash_format,
        postback_param_map:    paramMap ?? {},
        custom_config:         customCfg,
        is_active:             form.is_active,
        display_order:         form.display_order,
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) { setAddError("Name is required."); return; }
    setAdding(true);
    setAddError(null);
    const token = await getToken();
    const res = await fetch("/api/admin/offerwalls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name:                  addForm.name.trim(),
        slug:                  addForm.slug.trim(),
        is_ad_network:         addForm.is_ad_network,
        integration_type:      addForm.integration_type,
        contributor_share_pct: parseFloat(addForm.contributor_share_pct) || 70,
        description:           addForm.description.trim(),
      }),
    });
    if (res.ok) {
      const { provider } = await res.json() as { provider: Provider };
      setProviders((prev) => [...prev, provider].sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)));
      setShowAdd(false);
      setAddForm({ name: "", slug: "", is_ad_network: false, integration_type: "iframe", contributor_share_pct: "70", description: "" });
    } else {
      const { error } = await res.json() as { error: string };
      setAddError(error ?? "Failed to create provider.");
    }
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const token = await getToken();
    const res = await fetch("/api/admin/offerwalls", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "delete", id: deleteTarget.id }),
    });
    if (res.ok) {
      setProviders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (!allowed) return null;

  const taskOfferwalls = providers.filter((p) => !p.is_ad_network);
  const adNetworks     = providers.filter((p) => p.is_ad_network);

  function ProviderTable({ rows, title }: { rows: Provider[]; title: string }) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
          {title} ({rows.length})
        </h2>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Provider", "Type", "Status", "Share %", "Postback URL", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-[var(--surface-subtle)] animate-pulse w-24" /></td>
                    ))}</tr>
                  ))
                : rows.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                        {p.name}
                        {!p.is_active && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">Inactive</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] font-mono">{p.integration_type ?? "iframe"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={isLive(p) ? "success" : "neutral"}>
                          {isLive(p) ? "🟢 Live" : "🔜 Coming Soon"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{p.contributor_share_pct}%</td>
                      <td className="px-4 py-3"><PostbackUrlCell slug={p.slug} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openConfigure(p)}>
                            <Settings2 className="h-3.5 w-3.5" /> Configure
                          </Button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-1"
                            title="Delete provider"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const tagPills = form.feature_tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Offerwalls</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configure offerwall integrations. Setting an API key makes a provider Live — no code changes needed for most providers.
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setAddError(null); }}>
          <Plus className="h-4 w-4" /> Add Provider
        </Button>
      </div>

      <ProviderTable rows={taskOfferwalls} title="Task Offerwalls" />
      <ProviderTable rows={adNetworks} title="Ad Networks" />

      {/* ── Configure Modal ───────────────────────────────────────────── */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-lg bg-[var(--surface-card)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-default)] shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">{configuring.name}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {configuring.is_ad_network ? "Ad Network" : "Task Offerwall"} · slug: <code className="font-mono">{configuring.slug}</code>
                </p>
              </div>
              <button onClick={() => setConfiguring(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveConfig} className="px-6 py-5 space-y-4">
              {/* Status indicator */}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className="text-[var(--text-secondary)]">Status after save:</span>
                <Badge variant={(form.api_key.trim() || form.embed_url_template.trim()) && form.is_active ? "success" : "neutral"}>
                  {(form.api_key.trim() || form.embed_url_template.trim()) && form.is_active ? "🟢 Live" : "🔜 Coming Soon"}
                </Badge>
                <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                  <input type="checkbox" checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded" />
                  <span className="text-xs text-[var(--text-secondary)]">Active</span>
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Display Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
              </div>

              {/* Integration type */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Integration Type</label>
                <select value={form.integration_type} onChange={(e) => setForm((f) => ({ ...f, integration_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
                  {INTEGRATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">API Key</label>
                <input type="text" value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="Paste API key from provider dashboard"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:font-sans placeholder:text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Non-empty key + Active = provider goes Live.</p>
              </div>

              {/* Postback Secret */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Postback Secret / App Secure Hash</label>
                <input type="text" value={form.postback_secret} onChange={(e) => setForm((f) => ({ ...f, postback_secret: e.target.value }))}
                  placeholder="Secret used to validate incoming postbacks"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:font-sans placeholder:text-[var(--text-muted)]" />
              </div>

              {/* Hash Format */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Hash Format</label>
                <input type="text" value={form.hash_format} onChange={(e) => setForm((f) => ({ ...f, hash_format: e.target.value }))}
                  placeholder="e.g. {trans_id}-{secret} or {user_id}-{secret}"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:font-sans placeholder:text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Template for md5 hash validation. Leave blank for simple secret comparison.</p>
              </div>

              {/* Embed URL Template */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Embed URL Template <span className="text-[var(--text-muted)] font-normal text-xs">(iframe only)</span></label>
                <input type="text" value={form.embed_url_template} onChange={(e) => setForm((f) => ({ ...f, embed_url_template: e.target.value }))}
                  placeholder="https://provider.com/embed?uid={user_id}"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:font-sans placeholder:text-[var(--text-muted)]" />
              </div>

              {/* Contributor Share % */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Contributor Share (%)</label>
                <input type="number" min={0} max={100} value={form.contributor_share_pct}
                  onChange={(e) => setForm((f) => ({ ...f, contributor_share_pct: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  For CPX Research: set to 100 — the margin is already baked into CPX&apos;s Currency Factor.
                </p>
              </div>

              {/* Postback Param Map */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Postback Param Map <span className="text-[var(--text-muted)] font-normal text-xs">JSON</span></label>
                <textarea rows={4} value={form.postback_param_map}
                  onChange={(e) => setForm((f) => ({ ...f, postback_param_map: e.target.value }))}
                  placeholder={'{\n  "user_id": "uid",\n  "trans_id": "transaction_id",\n  "amount": "reward"\n}'}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none placeholder:font-sans placeholder:text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] mt-1">Maps internal field names → provider&apos;s actual param names.</p>
              </div>

              {/* Custom Config */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Custom Config <span className="text-[var(--text-muted)] font-normal text-xs">JSON — script_tag providers</span></label>
                <textarea rows={5} value={form.custom_config}
                  onChange={(e) => setForm((f) => ({ ...f, custom_config: e.target.value }))}
                  placeholder={'{\n  "script_url": "https://cdn.provider.com/widget.js",\n  "widget_configs": []\n}'}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y placeholder:font-sans placeholder:text-[var(--text-muted)]" />
              </div>

              {/* ── Logo URL ────────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Provider Logo</label>
                <div className="flex items-center gap-3">
                  {/* Live preview */}
                  <div className="h-11 w-11 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {form.logo_url && !logoPreviewError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.logo_url}
                        alt=""
                        className="h-full w-full object-contain p-1"
                        onError={() => setLogoPreviewError(true)}
                        onLoad={() => setLogoPreviewError(false)}
                      />
                    ) : (
                      <Link2 className="h-4 w-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="relative">
                      <input
                        type="url"
                        value={form.logo_url}
                        onChange={(e) => {
                          setLogoPreviewError(false);
                          setForm((f) => ({ ...f, logo_url: e.target.value }));
                        }}
                        placeholder="https://example.com/logo.png"
                        className="w-full h-9 px-3 pr-16 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:font-sans placeholder:text-[var(--text-muted)]"
                      />
                      {form.logo_url && (
                        <button
                          type="button"
                          onClick={() => { setForm((f) => ({ ...f, logo_url: "" })); setLogoPreviewError(false); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors px-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {logoPreviewError && <p className="text-xs text-red-400">Could not load image from this URL.</p>}
                    <p className="text-xs text-[var(--text-muted)]">Paste the logo URL — preview updates live.</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Short Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Complete surveys and earn NexCoins"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-muted)]" />
              </div>

              {/* Feature Tags */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Feature Tags</label>
                <input
                  type="text"
                  value={form.feature_tags}
                  onChange={(e) => setForm((f) => ({ ...f, feature_tags: e.target.value }))}
                  placeholder="Surveys, High Rewards, Daily Bonus"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-muted)]"
                />
                {tagPills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tagPills.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-1">Comma-separated. Displayed as pills on provider cards.</p>
              </div>

              {/* Available Countries */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Available Countries</label>
                <input
                  type="text"
                  value={form.available_countries}
                  onChange={(e) => setForm((f) => ({ ...f, available_countries: e.target.value }))}
                  placeholder="IN, US, UK, CA, AU"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-muted)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Comma-separated country codes. Shown on provider cards.</p>
              </div>

              {/* Display Order + Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Display Order</label>
                  <input type="number" min={0} value={form.display_order}
                    onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Notes (admin only)</label>
                  <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Internal notes"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-muted)]" />
                </div>
              </div>

              {/* Saved credentials (read-only) */}
              {(configuring.api_key || configuring.postback_secret) && (
                <div className="space-y-3 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4">
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Currently saved credentials</p>
                  {configuring.api_key      && <SecretField label="Saved API Key"            value={configuring.api_key} />}
                  {configuring.postback_secret && <SecretField label="Saved Postback Secret" value={configuring.postback_secret} />}
                </div>
              )}

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setConfiguring(null)}>Cancel</Button>
                <Button type="submit" className="flex-1" loading={saving}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Provider Modal ────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add New Provider</h2>
              <button onClick={() => setShowAdd(false)}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Provider Name *</label>
                <input type="text" required value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. TheoremReach"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-muted)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Slug (auto-generated if blank)</label>
                <input type="text" value={addForm.slug}
                  onChange={(e) => setAddForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
                  placeholder="theorem_reach"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:font-sans placeholder:text-[var(--text-muted)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Integration Type</label>
                <select value={addForm.integration_type}
                  onChange={(e) => setAddForm((f) => ({ ...f, integration_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]">
                  {INTEGRATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
                <input type="text" value={addForm.description}
                  onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Complete surveys and earn NexCoins"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-muted)]" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Contributor Share %</label>
                  <input type="number" min={0} max={100} value={addForm.contributor_share_pct}
                    onChange={(e) => setAddForm((f) => ({ ...f, contributor_share_pct: e.target.value }))}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={addForm.is_ad_network}
                    onChange={(e) => setAddForm((f) => ({ ...f, is_ad_network: e.target.checked }))} />
                  <span className="text-sm text-[var(--text-primary)]">Ad Network</span>
                </label>
              </div>
              {addError && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{addError}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Provider"}
                </Button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">After adding, use Configure to set API keys, postback secret, and other details.</p>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Delete {deleteTarget.name}?</p>
                <p className="text-xs text-[var(--text-muted)]">This cannot be undone. All transactions referencing this provider will remain.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={deleting} onClick={handleDelete}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
