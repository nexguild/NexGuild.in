"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, Layers, Loader2, RefreshCw } from "lucide-react";
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

interface TapRainOffer {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  estimatedRewardCoins: number;
  entryUrl: string;
}

interface TapRainOffersResponse {
  title: string;
  offers: TapRainOffer[];
}

export default function ProviderExperiencePage({
  params,
}: {
  params: Promise<{ "provider-slug": string }>;
}) {
  const { "provider-slug": providerSlug } = use(params);
  const router = useRouter();
  const [returnTo, setReturnTo] = useState("/dashboard/surveys");
  const returnLabel = returnTo === "/dashboard/surveys" ? "Surveys & Offers" : "Offerwall Hub";

  const [provider, setProvider] = useState<Provider | null>(null);
  const [userId, setUserId]     = useState<string | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // TheoremReach signed iframe URL
  const [trIframeUrl, setTrIframeUrl]         = useState<string | null>(null);
  const [trIframeLoading, setTrIframeLoading] = useState(false);

  // CPAGrip: served from a real API route (not srcdoc) to avoid Chrome Trusted Types
  // blocking innerHTML calls on Android, and to support proper viewport meta.
  const [cpagripFrameUrl, setCpagripFrameUrl] = useState<string | null>(null);
  const [notikFrameUrl, setNotikFrameUrl] = useState<string | null>(null);
  const [clixwallFrameUrl, setClixwallFrameUrl] = useState<string | null>(null);
  const [clixwallFrameError, setClixwallFrameError] = useState<string | null>(null);
  const [tapRainOffers, setTapRainOffers] = useState<TapRainOffer[]>([]);
  const [tapRainTitle, setTapRainTitle] = useState("TapRain offers");
  const [tapRainLoading, setTapRainLoading] = useState(false);
  const [tapRainError, setTapRainError] = useState<string | null>(null);
  const [cpxFrameUrl, setCpxFrameUrl] = useState<string | null>(null);
  const [cpxFrameError, setCpxFrameError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedReturn = sessionStorage.getItem("nexguild:offerwall-return");
      if (!savedReturn) return;
      sessionStorage.removeItem("nexguild:offerwall-return");
      const parsed = JSON.parse(savedReturn) as { slug?: unknown; path?: unknown };
      if (parsed.slug === providerSlug && parsed.path === "/dashboard/surveys") {
        setReturnTo("/dashboard/surveys");
      }
    } catch {
      return;
    }
  }, [providerSlug]);

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
      if (!found.isLive) { router.replace("/dashboard/surveys"); return; }
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

  useEffect(() => {
    if (provider?.slug !== "cpx_research" || !token) return;
    setCpxFrameUrl(null);
    setCpxFrameError(null);
    fetch("/api/offerwall/widget-config", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json() as { widgets?: WidgetInitConfig[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load CPX Research configuration");
        const cpxConfig = data.widgets?.find((widget) => widget.slug === "cpx_research");
        if (!cpxConfig?.appId) throw new Error("CPX Research app ID is not configured");
        const params = new URLSearchParams({
          app_id: cpxConfig.appId,
          ext_user_id: cpxConfig.userId,
        });
        if (cpxConfig.secureHash) params.set("secure_hash", cpxConfig.secureHash);
        setCpxFrameUrl(`https://offers.cpx-research.com/index.php?${params.toString()}`);
      })
      .catch((error: unknown) => {
        console.error("[offerwall/cpx_research] frame configuration request failed:", error);
        setCpxFrameError(error instanceof Error ? error.message : "Unable to load CPX Research");
      });
  }, [provider?.slug, token]);

  useEffect(() => {
    if (provider?.slug !== "notik" || !token) return;
    setNotikFrameUrl(null);
    fetch(`/api/offerwall/notik-frame?token=${encodeURIComponent(token)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load Notik offerwall");
        return response.json() as Promise<{ iframeUrl?: string }>;
      })
      .then(({ iframeUrl }) => setNotikFrameUrl(iframeUrl ?? null))
      .catch(() => setNotikFrameUrl(null));
  }, [provider?.slug, token]);

  useEffect(() => {
    if (provider?.slug !== "clixwall" || !token) return;
    setClixwallFrameUrl(null);
    setClixwallFrameError(null);
    fetch("/api/offerwall/clixwall/wall-url", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        return response.json().then((data: { wallUrl?: string; error?: string }) => {
          if (!response.ok) throw new Error(data.error ?? "Unable to load ClixWall");
          return data;
        });
      })
      .then(({ wallUrl }) => setClixwallFrameUrl(wallUrl ?? null))
      .catch((error: unknown) => {
        console.error("[offerwall/clixwall] wall URL request failed:", error);
        setClixwallFrameError(error instanceof Error ? error.message : "Unable to load ClixWall");
      });
  }, [provider?.slug, token]);

  useEffect(() => {
    if (provider?.slug !== "taprain" || !token) return;
    const controller = new AbortController();
    setTapRainLoading(true);
    setTapRainError(null);
    fetch("/api/offerwall/taprain/offers", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json() as TapRainOffersResponse & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load TapRain offers");
        if (!Array.isArray(data.offers)) throw new Error("TapRain returned an invalid offer list");
        setTapRainTitle(data.title || "TapRain offers");
        setTapRainOffers(data.offers);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[offerwall/taprain] offer feed request failed:", error);
        setTapRainError(error instanceof Error ? error.message : "Unable to load TapRain offers");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTapRainLoading(false);
      });
    return () => controller.abort();
  }, [provider?.slug, token]);

  // script_tag providers: inject widget script after mount.
  // Exception: CPAGrip uses document.write which is blocked in async scripts —
  // instead we build a srcdoc HTML string and render it inside an <iframe>.
  useEffect(() => {
    if (!provider || provider.integration_type !== "script_tag") return;
    if (provider.slug === "cpx_research") return;
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
        // Load CPAGrip via a real server-rendered HTML page (not srcdoc) to avoid
        // Chrome's Trusted Types policy on Android blocking innerHTML calls.
        const uid = w.userId;
        const tok = session?.access_token ?? "";
        setCpagripFrameUrl(`/api/offerwall/cpagrip-frame?user_id=${encodeURIComponent(uid)}&token=${encodeURIComponent(tok)}`);
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
          href={returnTo}
          className="mt-2 inline-flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
        >
          Back to {returnLabel}
        </Link>
      </div>
    );
  }

  if (!provider) return null;

  const embedUrl = buildEmbedUrl();

  return (
    <div
      className="-m-4 flex min-h-0 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain sm:-m-6"
      style={{ minHeight: "calc(100dvh - 64px)" }}
    >
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-2 px-4 sm:px-6 h-12 border-b border-slate-100 bg-white flex-shrink-0">
        <Link
          href={returnTo}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          {returnLabel}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-semibold">{provider.name}</span>
        {provider.slug === "mylead" && embedUrl && (
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open full MyLead offerwall in a new tab"
            title="Open full MyLead offerwall in a new tab"
            className="ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 sm:w-auto sm:gap-1 sm:px-2"
          >
            <span className="sr-only sm:not-sr-only">Open full offerwall</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
          <NexCoinIcon size={13} />
          <span>Earnings credited automatically</span>
        </div>
      </div>

      {/* Widget — fills remaining height */}
      <div className="flex min-h-0 flex-1 flex-col">
        {renderWidget(provider, trIframeUrl, trIframeLoading, embedUrl, cpagripFrameUrl, notikFrameUrl, clixwallFrameUrl, clixwallFrameError, tapRainOffers, tapRainTitle, tapRainLoading, tapRainError, cpxFrameUrl, cpxFrameError, token)}
      </div>
    </div>
  );
}

function renderWidget(
  provider: Provider,
  trIframeUrl: string | null,
  trIframeLoading: boolean,
  embedUrl: string | null,
  cpagripFrameUrl: string | null,
  notikFrameUrl: string | null,
  clixwallFrameUrl: string | null,
  clixwallFrameError: string | null,
  tapRainOffers: TapRainOffer[],
  tapRainTitle: string,
  tapRainLoading: boolean,
  tapRainError: string | null,
  cpxFrameUrl: string | null,
  cpxFrameError: string | null,
  token: string | null,
) {
  const widgetH = "calc(100dvh - 112px)";
  if (provider.slug === "cpx_research") {
    if (cpxFrameError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-semibold text-slate-800">CPX Research is unavailable</p>
          <p className="max-w-md text-sm text-slate-500">{cpxFrameError}</p>
        </div>
      );
    }
    if (!cpxFrameUrl) {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      );
    }
    return (
      <iframe
        src={cpxFrameUrl}
        className="h-full min-h-0 w-full flex-1 border-0"
        title="CPX Research Surveys"
        allow="clipboard-write"
      />
    );
  }

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
          style={{ minHeight: widgetH }}
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

  if (provider.slug === "notik") {
    if (!notikFrameUrl) {
      return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>;
    }
    return <iframe src={notikFrameUrl} className="flex-1 w-full border-0" style={{ minHeight: widgetH }} title="Notik Offerwall" />;
  }

  if (provider.slug === "clixwall") {
    if (clixwallFrameError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-semibold text-slate-700">ClixWall is unavailable</p>
          <p className="max-w-md text-sm text-slate-500">{clixwallFrameError}</p>
        </div>
      );
    }
    if (!clixwallFrameUrl) {
      return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>;
    }
    return (
      <iframe
        src={clixwallFrameUrl}
        className="flex-1 w-full border-0"
        style={{ minHeight: widgetH }}
        title="ClixWall Offers"
        allow="clipboard-write"
      />
    );
  }

  if (provider.slug === "taprain") {
    if (tapRainLoading) {
      return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>;
    }
    if (tapRainError) {
      return (
        <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-semibold text-slate-700">TapRain offers are unavailable</p>
          <p className="max-w-md text-sm text-slate-500">{tapRainError}</p>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600 sm:text-xs">Personalized offers</p>
              <h1 className="mt-1 text-lg font-black text-slate-900 sm:text-2xl">{tapRainTitle}</h1>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Estimated NexCoins are based on the offer payout. Final rewards depend on provider confirmation.</p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500 shadow-sm sm:text-xs">{tapRainOffers.length} offers</span>
          </div>
          {tapRainOffers.length ? (
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {tapRainOffers.map((offer) => (
                <article key={offer.id} className="flex min-w-0 flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:flex-col sm:rounded-2xl">
                  {offer.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.imageUrl} alt="" className="h-20 w-20 shrink-0 self-stretch bg-slate-100 object-cover sm:h-28 sm:w-full sm:self-auto" loading="lazy" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500 to-teal-500 text-xl font-black text-white sm:h-28 sm:w-full sm:text-3xl">{offer.name.slice(0, 1)}</div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 text-xs font-extrabold leading-snug text-slate-900 sm:text-sm">{offer.name}</h2>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-teal-700 sm:text-xs"><NexCoinIcon size={12} /> {new Intl.NumberFormat("en").format(offer.estimatedRewardCoins)}</span>
                    </div>
                    {offer.description && <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500 sm:text-xs">{offer.description}</p>}
                    <a href={offer.entryUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[10px] font-extrabold text-white hover:bg-indigo-700 sm:mt-3 sm:text-xs">
                      Start offer <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">No matching TapRain offers are available right now.</p>
          )}
        </div>
      </div>
    );
  }

  // CPAGrip: load from a real API-served HTML page so viewport meta and innerHTML
  // work correctly on Android (srcdoc + sandbox triggers Trusted Types blocks).
  if (provider.slug === "cpagrip") {
    if (!cpagripFrameUrl) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      );
    }
    return (
      <iframe
        src={cpagripFrameUrl}
        className="w-full border-0"
        style={{ height: widgetH, display: "block" }}
        title="CPAGrip Offerwall"
      />
    );
  }

  if (provider.integration_type === "script_tag") {
    const widgetDivId = `${provider.slug.replace(/_/g, "-")}-widget`;
    return (
      <div
        id={widgetDivId}
        className="w-full"
        style={{ height: widgetH, overflowY: "auto", overflowX: "hidden" }}
      />
    );
  }

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        className="flex-1 w-full border-0"
        style={{ minHeight: widgetH, touchAction: "pan-y" }}
        scrolling="yes"
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
