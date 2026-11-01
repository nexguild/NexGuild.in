"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Monitor, Smartphone } from "lucide-react";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface EmailTemplatePreview {
  id: string;
  name: string;
  html: string;
}

export default function AdminEmailPreviewsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);
  const [templates, setTemplates] = useState<EmailTemplatePreview[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    async function loadPreviews() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/admin/email-previews", {
          headers: session?.access_token ? { Authorization: "Bearer " + session.access_token } : {},
          cache: "no-store",
        });
        const data = await response.json() as { templates?: EmailTemplatePreview[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load email previews.");
        if (!cancelled) {
          setTemplates(data.templates ?? []);
          setSelectedId(data.templates?.[0]?.id ?? "");
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load email previews.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreviews();
    return () => { cancelled = true; };
  }, [allowed]);

  if (!allowed) return null;

  const selectedTemplate = templates.find((template) => template.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Email Template Previews</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review sample versions of transactional emails. These previews do not send email or contain real user data.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Templates</h2>
            {!loading && <span className="text-xs text-[var(--text-muted)]">{templates.length}</span>}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading previews…
            </div>
          ) : error ? (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          ) : (
            <div className="max-h-[70vh] space-y-1 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedId(template.id)}
                  aria-current={selectedId === template.id ? "page" : undefined}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedId === template.id
                      ? "bg-[var(--brand-500)]/10 font-medium text-[var(--brand-500)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Mail className="h-4 w-4 flex-shrink-0 text-[var(--brand-500)]" />
              <h2 className="truncate font-semibold text-[var(--text-primary)]">
                {selectedTemplate?.name ?? "Select a template"}
              </h2>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] p-1">
              <button
                type="button"
                onClick={() => setViewport("desktop")}
                aria-label="Desktop preview"
                aria-pressed={viewport === "desktop"}
                className={`rounded-md p-2 ${viewport === "desktop" ? "bg-[var(--surface-subtle)] text-[var(--brand-500)]" : "text-[var(--text-muted)]"}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewport("mobile")}
                aria-label="Mobile preview"
                aria-pressed={viewport === "mobile"}
                className={`rounded-md p-2 ${viewport === "mobile" ? "bg-[var(--surface-subtle)] text-[var(--brand-500)]" : "text-[var(--text-muted)]"}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center overflow-auto bg-[#e5e7eb] p-4 sm:p-8">
            {loading ? (
              <div className="flex min-h-[600px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
              </div>
            ) : error ? (
              <p className="py-12 text-sm text-red-600">{error}</p>
            ) : selectedTemplate ? (
              <iframe
                key={`${selectedTemplate.id}-${viewport}`}
                title={`${selectedTemplate.name} email preview`}
                srcDoc={selectedTemplate.html}
                sandbox=""
                className="min-h-[700px] border-0 bg-white shadow-xl"
                style={{ width: viewport === "mobile" ? 390 : "100%", maxWidth: "100%" }}
              />
            ) : (
              <div className="flex min-h-[600px] flex-col items-center justify-center gap-2 text-center text-slate-500">
                <Mail className="h-8 w-8" />
                <p>No email templates are available.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
