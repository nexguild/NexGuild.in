"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_DASHBOARD_PROMOTION,
  type DashboardPromotion,
} from "@/lib/dashboard-promotion";

const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

function toUtcInput(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function fromUtcInput(value: string): string {
  return value ? new Date(`${value}:00Z`).toISOString() : "";
}

export function DashboardPromotionEditor() {
  const tokenRef = useRef<string | null>(null);
  const [promotion, setPromotion] = useState<DashboardPromotion>(DEFAULT_DASHBOARD_PROMOTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      if (!tokenRef.current) {
        setError("Your admin session has expired. Sign in again to manage the banner.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/dashboard-promotion", {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json() as DashboardPromotion | { error?: string };
      if (!res.ok) {
        setError("error" in data ? data.error ?? "Could not load the dashboard banner." : "Could not load the dashboard banner.");
        setLoading(false);
        return;
      }
      setPromotion(data as DashboardPromotion);
      setLoading(false);
    }

    load().catch((cause: unknown) => {
      console.error("[dashboard-promotion-editor] load failed:", cause);
      setError("Could not load the dashboard banner.");
      setLoading(false);
    });
  }, []);

  function update<K extends keyof DashboardPromotion>(key: K, value: DashboardPromotion[K]) {
    setPromotion((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenRef.current) {
      setError("Your admin session has expired. Sign in again to save changes.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/dashboard-promotion", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify(promotion),
      });
      const data = await res.json() as { error?: string; promotion?: DashboardPromotion };
      if (!res.ok) {
        setError(data.error ?? "Could not save the dashboard banner.");
        return;
      }
      if (data.promotion) setPromotion(data.promotion);
      setSaved(true);
    } catch (cause) {
      console.error("[dashboard-promotion-editor] save failed:", cause);
      setError("Could not save the dashboard banner. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
      <div className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[var(--brand-500)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">Dashboard Banner</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Control the promotional announcement shown at the top of contributor dashboards. Changes take effect after saving.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-6 py-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading banner settings…
        </div>
      ) : (
        <form onSubmit={save} className="px-6 py-5 space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={promotion.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Show dashboard banner during its scheduled dates
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Banner label</label>
              <input value={promotion.label} maxLength={100} onChange={(e) => update("label", e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Headline</label>
              <input value={promotion.headline} maxLength={180} onChange={(e) => update("headline", e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Message</label>
            <textarea
              value={promotion.message}
              maxLength={1200}
              rows={4}
              onChange={(e) => update("message", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Main button label</label>
              <input value={promotion.primaryLabel} maxLength={60} onChange={(e) => update("primaryLabel", e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Main button URL (https:// or site path)</label>
              <input type="text" value={promotion.primaryUrl} onChange={(e) => update("primaryUrl", e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Second button label (optional)</label>
              <input value={promotion.secondaryLabel} maxLength={60} onChange={(e) => update("secondaryLabel", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Second button URL (optional)</label>
              <input type="text" value={promotion.secondaryUrl} onChange={(e) => update("secondaryUrl", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Starts at (UTC, optional)</label>
              <input type="datetime-local" value={toUtcInput(promotion.startsAt)} onChange={(e) => update("startsAt", fromUtcInput(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ends at (UTC, optional)</label>
              <input type="datetime-local" value={toUtcInput(promotion.endsAt)} onChange={(e) => update("endsAt", fromUtcInput(e.target.value))} className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Leave either schedule field empty to make that side unlimited. The banner is automatically hidden outside the scheduled dates.
          </p>

          {error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{error}</p>}
          {saved && (
            <div role="status" className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
              <CheckCircle2 className="h-4 w-4" /> Dashboard banner saved.
            </div>
          )}
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Dashboard Banner"}
          </Button>
        </form>
      )}
    </section>
  );
}
