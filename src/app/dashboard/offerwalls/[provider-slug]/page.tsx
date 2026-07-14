"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Layers, Loader2 } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";
import { applyWidgetConfig, buildScriptUrl, injectScript, type WidgetInitConfig } from "@/lib/offerwall-widget-inject";

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_ad_network: boolean;
  embed_url_template: string | null;
  integration_type: string;
  description: string | null;
  logo_url: string | null;
  feature_tags: string[];
  available_countries: string[];
  isLive: boolean;
}

export default function ProviderExperiencePage({
  params,
}: {
  params: Promise<{ "provider-slug": string }>;
}) {
  const { "provider-slug": providerSlug } = use(params);
  const router = useRouter();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // TheoremReach signed iframe URL
  const [trIframeUrl, setTrIframeUrl]         = useState<string | null>(null);
  const [trIframeLoading, setTrIframeLoading] = useState(false);

  // CPAGrip: srcdoc HTML — needed because their script uses document.write and cannot
  // be injected as an async dynamic script tag (browsers block document.write in that case).
  const [cpagripSrcDoc, setCpagripSrcDoc] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const [{ data: { user } }, { data: { session } }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      setUserId(user?.id ?? session?.user?.id ?? null);
      setToken(session?.access_token ?? null);

      if (!session?.access_token) { setLoading(false); return; }

      const res = await fetch("/api/offerwalls", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) { setLoading(false); return; }

      const { providers } = await res.json() as { providers: Provider[] };
      const found = providers.find((p) => p.slug === providerSlug && !p.is_ad_network);
      if (!found) { setNotFound(true); setLoading(false); return; }
      if (!found.isLive) { router.replace("/dashboard/offerwalls"); return; }
      setProvider(found);
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerSlug]);

  // TheoremReach: fetch signed iframe URL
  useEffect(() => {
    if (provider?.slug !== "theoremreach" || !token) return;
    setTrIframeLoading(true);
    setTrIframeUrl(null);
    fetch("/api/offerwall/theoremreach/iframe-url", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d: { iframeUrl?: string }) => setTrIframeUrl(d.iframeUrl ?? null))
      .catch(() => setTrIframeUrl(null))
      .finally(() => setTrIframeLoading(false));
  }, [provider?.slug, token]);

  // script_tag providers: inject widget script after mount.
  // Exception: CPAGrip uses document.write which is blocked in async scripts —
  // instead we build a srcdoc HTML string and render it inside an <iframe>.
  useEffect(() => {
    if (!provider || provider.integration_type !== "script_tag") return;
    async function inject() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/offerwall/widget-config", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const { widgets } = await res.json() as { widgets: WidgetInitConfig[] };
      const w = widgets?.find((x) => x.slug === provider!.slug);
      if (!w?.scriptUrl) return;
      const builtUrl = buildScriptUrl(w);
      if (!builtUrl) return;

      if (provider!.slug === "cpagrip") {
        // CPAGrip's script calls document.write — run it inside an iframe srcdoc
        // so it operates on the iframe's own document (where document.write is valid).
        setCpagripSrcDoc(
          `<!DOCTYPE html><html><head><meta charset="utf-8">` +
          `<style>html,body{margin:0;padding:0;width:100%;min-height:100%;overflow-x:hidden;}</style></head>` +
          `<body><script type="text/javascript" src="${builtUrl}"><\/script></body></html>`
        );
        return;
      }

      applyWidgetConfig(w);
      injectScript(builtUrl, true);
    }
    inject().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.slug]);

  function buildEmbedUrl(): string | null {
    if (!provider?.embed_url_template || !userId) return null;
    return provider.embed_url_template.replace(/\{user_id\}/g, userId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 120px)" }}>
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white py-24 flex flex-col items-center gap-4 text-center px-6 shadow-sm">
        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
          <Layers className="h-7 w-7 text-slate-400" />
        </div>
        <div>
          <p className="font-bold text-slate-800 mb-1">Provider Not Found</p>
          <p className="text-sm text-slate-500">This offerwall provider doesn&apos;t exist or isn&apos;t active yet.</p>
        </div>
        <Link
          href="/dashboard/offerwalls"
          className="mt-2 inline-flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
        >
          Back to Offerwall Hub
        </Link>
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div
      className="-m-4 sm:-m-6 flex flex-col"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2 px-4 sm:px-6 h-12 border-b border-slate-100 bg-white flex-shrink-0">
        <Link
          href="/dashboard/offerwalls"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Offerwall Hub
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-semibold">{provider.name}</span>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <NexCoinIcon size={13} />
          <span>Earnings credited automatically</span>
        </div>
      </div>

      {/* Widget — fills remaining height */}
      <div className="flex-1 flex flex-col">
        {renderWidget(provider, trIframeUrl, trIframeLoading, buildEmbedUrl(), cpagripSrcDoc)}
      </div>
    </div>
  );
}

function renderWidget(
  provider: Provider,
  trIframeUrl: string | null,
  trIframeLoading: boolean,
  embedUrl: string | null,
  cpagripSrcDoc: string | null,
) {
  if (provider.slug === "theoremreach") {
    if (trIframeLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      );
    }
    if (trIframeUrl) {
      return (
        <iframe
          src={trIframeUrl}
          className="flex-1 w-full border-0"
          style={{ minHeight: "calc(100vh - 112px)" }}
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-forms allow-scripts allow-same-origin allow-top-navigation"
          title="TheoremReach Offerwall"
        />
      );
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
          <Layers className="h-7 w-7 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-700">Unable to load</p>
        <p className="text-sm text-slate-400 max-w-sm">Could not load the offerwall. Please refresh the page.</p>
      </div>
    );
  }

  // CPAGrip: srcdoc iframe so document.write works inside the frame's own document
  if (provider.slug === "cpagrip") {
    if (!cpagripSrcDoc) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      );
    }
    return (
      <iframe
        srcDoc={cpagripSrcDoc}
        className="flex-1 w-full border-0"
        style={{ minHeight: "calc(100vh - 112px)" }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        title="CPAGrip Offerwall"
      />
    );
  }

  if (provider.integration_type === "script_tag") {
    const widgetDivId = provider.slug === "cpx_research" ? "fullscreen" : `${provider.slug.replace(/_/g, "-")}-widget`;
    return (
      <div
        id={widgetDivId}
        className="flex-1 w-full"
        style={{ minHeight: "calc(100vh - 112px)" }}
      />
    );
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="flex-1 w-full border-0"
        style={{ minHeight: "calc(100vh - 112px)" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        title={`${provider.name} Offerwall`}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
        <Layers className="h-7 w-7 text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700">{provider.name}</p>
      <p className="text-sm text-slate-400 max-w-sm">Provider is live but the embed URL hasn&apos;t been configured yet. Check back soon.</p>
    </div>
  );
}
