"use client";

import { useEffect, useState } from "react";
import { Layers, Info, Star, Clock } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";
import { applyWidgetConfig, injectScript, type WidgetInitConfig } from "@/lib/offerwall-widget-inject";

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

interface TRSurvey {
  campaign_id:    string;
  loi:            number;
  cpi:            number;
  rank:           number;
  average_rating: number;
  rating_count:   number;
  nexcoins:       number;
  entry_link:     string;
}

export default function OfferwallsPage() {
  const [providers, setProviders]   = useState<Provider[]>([]);
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // TheoremReach survey state
  const [trSurveys, setTrSurveys]         = useState<TRSurvey[]>([]);
  const [trLoading, setTrLoading]         = useState(false);
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
        const firstLive = p.find((x) => !x.is_ad_network && x.isLive);
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

  // Fetch TheoremReach surveys when their tab becomes active
  useEffect(() => {
    if (activeProv?.slug !== "theoremreach" || activeProv?.integration_type !== "api" || !trToken) return;
    setTrLoading(true);
    fetch("/api/offerwall/theoremreach/surveys", {
      headers: { Authorization: `Bearer ${trToken}` },
    })
      .then((r) => r.json())
      .then((d: { surveys?: TRSurvey[] }) => setTrSurveys(d.surveys ?? []))
      .catch(() => setTrSurveys([]))
      .finally(() => setTrLoading(false));
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

  function buildEmbedUrl(p: Provider): string | null {
    if (!p.embed_url_template || !userId) return null;
    return p.embed_url_template.replace(/\{user_id\}/g, userId);
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-stone-300"}`}
      />
    ));
  }

  function renderApiSurveys() {
    if (trLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3 animate-pulse">
              <div className="h-4 w-3/4 bg-[var(--surface-subtle)] rounded" />
              <div className="h-3 w-1/2 bg-[var(--surface-subtle)] rounded" />
              <div className="h-8 w-full bg-[var(--surface-subtle)] rounded-lg mt-4" />
            </div>
          ))}
        </div>
      );
    }

    if (trSurveys.length === 0) {
      return (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-20 flex flex-col items-center gap-4 text-center px-6">
          <div className="h-14 w-14 rounded-full bg-[#E6FAF5] flex items-center justify-center">
            <Layers className="h-7 w-7 text-[#02b491]" />
          </div>
          <p className="font-semibold text-[var(--text-primary)]">No surveys available right now</p>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            TheoremReach matches surveys to your profile. Check back soon — new surveys appear throughout the day.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{trSurveys.length}</span> surveys available
          </p>
          <p className="text-xs text-[var(--text-muted)]">Sorted by best match</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trSurveys.map((s) => (
            <div
              key={s.campaign_id}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 flex flex-col gap-4 hover:border-[var(--brand-500)] transition-colors"
            >
              {/* Rating row */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">{renderStars(s.average_rating)}</div>
                <span className="text-xs text-[var(--text-muted)]">
                  {s.average_rating.toFixed(1)} ({s.rating_count})
                </span>
              </div>

              {/* Reward + time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <NexCoinIcon size={18} />
                  <span className="text-lg font-bold text-[var(--text-primary)]">{s.nexcoins}</span>
                  <span className="text-xs text-[var(--text-muted)]">NexCoins</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>~{s.loi} min</span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={s.entry_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center text-sm font-semibold py-2 rounded-lg bg-[var(--brand-500)] text-white hover:opacity-90 transition-opacity"
              >
                Start Survey →
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderEmbedArea(p: Provider) {
    if (p.integration_type === "api") {
      return (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center gap-2">
            <NexCoinIcon size={16} />
            <p className="text-xs text-[var(--text-muted)]">
              Earnings from <span className="font-semibold text-[var(--text-primary)]">{p.name}</span> are credited to your NexCoins automatically after survey completion.
            </p>
          </div>
          <div className="p-5">{renderApiSurveys()}</div>
        </div>
      );
    }

    if (p.integration_type === "script_tag") {
      // Each script_tag provider gets its own target div ID so the CPX script
      // (loaded globally for its notification widget) cannot accidentally fill
      // a div that belongs to a different provider's tab.
      const widgetDivId = p.slug === "cpx_research" ? "fullscreen" : `${p.slug.replace(/_/g, "-")}-widget`;
      return (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center gap-2">
            <NexCoinIcon size={16} />
            <p className="text-xs text-[var(--text-muted)]">
              Earnings from <span className="font-semibold text-[var(--text-primary)]">{p.name}</span> are credited to your NexCoins automatically after confirmation.
            </p>
          </div>
          <div id={widgetDivId} className="min-h-[480px] sm:min-h-[600px] w-full" />
        </div>
      );
    }

    // iframe (default)
    const embedUrl = buildEmbedUrl(p);
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center gap-2">
          <NexCoinIcon size={16} />
          <p className="text-xs text-[var(--text-muted)]">
            Earnings from <span className="font-semibold text-[var(--text-primary)]">{p.name}</span> are credited to your NexCoins automatically after confirmation.
          </p>
        </div>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full border-0 min-h-[480px] sm:h-[600px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            title={`${p.name} Offerwall`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-[var(--surface-page)]">
            <Layers className="h-10 w-10 text-[var(--text-muted)] mb-4" />
            <p className="font-semibold text-[var(--text-primary)] mb-2">{p.name}</p>
            <p className="text-sm text-[var(--text-secondary)] max-w-sm">
              Provider is live but the embed URL hasn&apos;t been configured yet. Check back soon.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Offerwall Hub</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Complete offers from our partner providers and earn NexCoins — credited automatically after confirmation.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-28 rounded-lg bg-[var(--surface-subtle)] animate-pulse" />
            ))}
          </div>
          <div className="h-[480px] rounded-xl bg-[var(--surface-subtle)] animate-pulse" />
        </div>
      ) : taskOfferwalls.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-20 flex flex-col items-center gap-4 text-center px-6">
          <Layers className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">Offerwall Hub Coming Soon</p>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            Partner offerwall integrations are being set up. Check back soon — more earning opportunities are on the way.
          </p>
        </div>
      ) : (
        <>
          {/* Provider Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-thin pb-1">
            {taskOfferwalls.map((p) => (
              <button
                key={p.slug}
                disabled={!p.isLive}
                onClick={() => p.isLive && setActiveSlug(p.slug)}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors flex-shrink-0 ${
                  p.isLive
                    ? activeSlug === p.slug
                      ? "bg-[var(--brand-500)] text-white"
                      : "bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-500)]"
                    : "bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)] cursor-not-allowed opacity-60"
                }`}
              >
                {p.name}
                {!p.isLive && (
                  <span className="text-[10px] font-semibold bg-[var(--surface-subtle)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-full border border-[var(--border-default)]">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Embed / Survey Area */}
          {liveWalls.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-20 flex flex-col items-center gap-4 text-center px-6">
              <div className="h-14 w-14 rounded-full bg-[#E6FAF5] flex items-center justify-center">
                <Layers className="h-7 w-7 text-[#02b491]" />
              </div>
              <p className="font-semibold text-[var(--text-primary)]">Coming Soon</p>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                Our offerwall partners are being configured. You&apos;ll be able to complete offers and earn NexCoins once they&apos;re live.
              </p>
            </div>
          ) : activeProv && activeProv.isLive ? (
            renderEmbedArea(activeProv)
          ) : null}

          {/* Coming Soon grid */}
          {comingSoon.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                More Coming Soon
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {comingSoon.map((p) => (
                  <div
                    key={p.slug}
                    className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-3 opacity-60 text-center"
                  >
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {p.description ?? "We're working on this — check back soon!"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Ad Networks notice */}
      {!loading && adNetworks.length > 0 && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text-primary)]">Ad Network integrations</span>
            {" "}({adNetworks.map((p) => p.name).join(", ")}) serve site-wide display ads on NexGuild rather than individual offer tasks.
            These don&apos;t appear as offer tabs — ad revenue is tracked automatically in the background once enabled.
          </div>
        </div>
      )}
    </div>
  );
}
