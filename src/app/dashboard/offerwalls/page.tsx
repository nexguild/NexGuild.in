"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Info, Loader2 } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";
import { applyWidgetConfig, injectScript, type WidgetInitConfig } from "@/lib/offerwall-widget-inject";
import { BlogTipCard } from "@/components/dashboard/BlogTipCard";

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_ad_network: boolean;
  embed_url_template: string | null;
  integration_type: string;
  description: string | null;
  logo_url: string | null;
  isLive: boolean;
}


export default function OfferwallsPage() {
  const router = useRouter();

  const [providers, setProviders]   = useState<Provider[]>([]);
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // TheoremReach iframe state
  const [trIframeUrl, setTrIframeUrl]     = useState<string | null>(null);
  const [trIframeLoading, setTrIframeLoading] = useState(false);
  const [trToken, setTrToken]             = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const [
        { data: { user } },
        { data: { session } },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);

      setUserId(user?.id ?? null);
      setTrToken(session?.access_token ?? null);

      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/offerwalls", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const { providers: p } = await res.json() as { providers: Provider[] };
        setProviders(p);
        // Restore tab from URL (?tab=slug), fall back to first live provider
        const tabParam = new URLSearchParams(window.location.search).get("tab");
        const matched  = tabParam ? p.find((x) => !x.is_ad_network && x.isLive && x.slug === tabParam) : null;
        const firstLive = matched ?? p.find((x) => !x.is_ad_network && x.isLive);
        if (firstLive) setActiveSlug(firstLive.slug);
      }
      setLoading(false);
    }
    init();
  }, []);

  const taskOfferwalls = providers.filter((p) => !p.is_ad_network);
  const adNetworks     = providers.filter((p) => p.is_ad_network);
  const liveWalls      = taskOfferwalls.filter((p) => p.isLive);
  const comingSoon     = taskOfferwalls.filter((p) => !p.isLive);

  const activeProv = taskOfferwalls.find((p) => p.slug === activeSlug) ?? null;

  // Fetch signed TheoremReach iframe URL whenever their tab becomes active
  useEffect(() => {
    if (activeProv?.slug !== "theoremreach" || !trToken) return;
    setTrIframeUrl(null);
    setTrIframeLoading(true);
    fetch("/api/offerwall/theoremreach/iframe-url", {
      headers: { Authorization: `Bearer ${trToken}` },
    })
      .then((r) => r.json())
      .then((d: { iframeUrl?: string }) => setTrIframeUrl(d.iframeUrl ?? null))
      .catch(() => setTrIframeUrl(null))
      .finally(() => setTrIframeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  // script_tag: re-inject after #fullscreen div is in the DOM
  useEffect(() => {
    const slug    = activeProv?.slug;
    const intType = activeProv?.integration_type;
    if (!slug || intType !== "script_tag") return;

    async function inject() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/offerwall/widget-config", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const { widgets } = await res.json() as { widgets: WidgetInitConfig[] };
      const w = widgets?.find((x) => x.slug === slug);
      if (!w?.scriptUrl) return;
      applyWidgetConfig(w);
      injectScript(w.scriptUrl, true);
    }

    inject().catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProv?.slug, activeProv?.integration_type]);

  function switchTab(slug: string) {
    setActiveSlug(slug);
    router.replace(`/dashboard/offerwalls?tab=${slug}`, { scroll: false });
  }

  function buildEmbedUrl(p: Provider): string | null {
    if (!p.embed_url_template || !userId) return null;
    return p.embed_url_template.replace(/\{user_id\}/g, userId);
  }

  function renderEmbedArea(p: Provider) {
    const infoBar = (label: string) => (
      <div
        className="flex items-center gap-2 px-5 py-3 border-b border-indigo-50"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(20,184,166,0.04) 100%)" }}
      >
        <NexCoinIcon size={15} />
        <p className="text-xs text-slate-500">
          Earnings from <span className="font-semibold text-slate-700">{label}</span> are credited to your NexCoins automatically after confirmation.
        </p>
      </div>
    );

    if (p.slug === "theoremreach") {
      return (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          {infoBar(p.name)}
          {trIframeLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : trIframeUrl ? (
            <iframe
              key={activeSlug ?? "tr"}
              src={trIframeUrl}
              className="w-full border-0"
              style={{ height: "600px" }}
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-forms allow-scripts allow-same-origin allow-top-navigation"
              title="TheoremReach Offerwall"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Layers className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 mb-1">Unable to load</p>
              <p className="text-sm text-slate-400 max-w-sm">
                Could not load the TheoremReach offerwall. Please try refreshing.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (p.integration_type === "script_tag") {
      const widgetDivId = p.slug === "cpx_research" ? "fullscreen" : `${p.slug.replace(/_/g, "-")}-widget`;
      return (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          {infoBar(p.name)}
          <div key={activeSlug ?? ""} id={widgetDivId} className="min-h-[480px] sm:min-h-[600px] w-full" />
        </div>
      );
    }

    const embedUrl = buildEmbedUrl(p);
    return (
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
        {infoBar(p.name)}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full border-0 min-h-[480px] sm:h-[600px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title={`${p.name} Offerwall`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Layers className="h-7 w-7 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">{p.name}</p>
            <p className="text-sm text-slate-400 max-w-sm">
              Provider is live but the embed URL hasn&apos;t been configured yet. Check back soon.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-white/70" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Earn NexCoins</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Offerwall Hub</h1>
          <p className="text-sm text-white/75 max-w-lg">
            Complete offers from our partner providers and earn NexCoins — credited automatically after confirmation.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-32 rounded-full bg-slate-100 animate-pulse" />
            ))}
          </div>
          <div className="h-[480px] rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : taskOfferwalls.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white py-20 flex flex-col items-center gap-4 text-center px-6 shadow-sm">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
          >
            <Layers className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 mb-1">Offerwall Hub Coming Soon</p>
            <p className="text-sm text-slate-500 max-w-sm">
              Partner offerwall integrations are being set up. Check back soon — more earning opportunities are on the way.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Provider Tabs ─────────────────────────────────────── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {taskOfferwalls.map((p) => (
              <button
                key={p.slug}
                disabled={!p.isLive}
                onClick={() => p.isLive && switchTab(p.slug)}
                className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                  !p.isLive
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"
                    : activeSlug === p.slug
                    ? "border-transparent text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600"
                }`}
                style={p.isLive && activeSlug === p.slug
                  ? { background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }
                  : undefined}
              >
                {p.name}
                {!p.isLive && (
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Embed / Widget Area ───────────────────────────────── */}
          {liveWalls.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white py-20 flex flex-col items-center gap-4 text-center px-6 shadow-sm">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
              >
                <Layers className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-1">Coming Soon</p>
                <p className="text-sm text-slate-500 max-w-sm">
                  Our offerwall partners are being configured. You&apos;ll be able to complete offers and earn NexCoins once they&apos;re live.
                </p>
              </div>
            </div>
          ) : activeProv && activeProv.isLive ? (
            renderEmbedArea(activeProv)
          ) : null}

          {/* ── Coming Soon grid ──────────────────────────────────── */}
          {comingSoon.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                More Coming Soon
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {comingSoon.map((p) => (
                  <div
                    key={p.slug}
                    className="rounded-xl border border-slate-100 bg-white/60 backdrop-blur-sm p-4 text-center opacity-70"
                  >
                    <p className="text-xs font-bold text-slate-600 mb-1">{p.name}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      {p.description ?? "We're working on this — check back soon!"}
                    </p>
                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Ad Networks notice ────────────────────────────────────── */}
      {!loading && adNetworks.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Ad Network integrations</span>
            {" "}({adNetworks.map((p) => p.name).join(", ")}) serve site-wide display ads on NexGuild rather than individual offer tasks.
            These don&apos;t appear as offer tabs — ad revenue is tracked automatically in the background once enabled.
          </p>
        </div>
      )}

      <BlogTipCard
        slug="offerwalls-explained-how-to-earn"
        title="What is an Offerwall? How They Work"
        excerpt="Learn how offerwalls work and how to maximize your survey earnings."
      />
    </div>
  );
}
