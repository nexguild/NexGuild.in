"use client";

import { useEffect, useState } from "react";
import { Layers, Info } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface Provider {
  id: string;
  name: string;
  slug: string;
  is_ad_network: boolean;
  embed_url_template: string | null;
  isLive: boolean;
}

export default function OfferwallsPage() {
  const [providers, setProviders]   = useState<Provider[]>([]);
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

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
        // Default-select the first live task offerwall if any
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

  function buildEmbedUrl(p: Provider): string | null {
    if (!p.embed_url_template || !userId) return null;
    return p.embed_url_template.replace(/\{user_id\}/g, userId);
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
        /* No providers in DB yet (migration not run) */
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

          {/* Embed Area */}
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
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
              {/* Embed header */}
              <div className="px-5 py-3 border-b border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center gap-2">
                <NexCoinIcon size={16} />
                <p className="text-xs text-[var(--text-muted)]">
                  Earnings from <span className="font-semibold text-[var(--text-primary)]">{activeProv.name}</span> are credited to your NexCoins automatically after confirmation.
                </p>
              </div>
              {buildEmbedUrl(activeProv) ? (
                <iframe
                  src={buildEmbedUrl(activeProv)!}
                  className="w-full border-0 min-h-[480px] sm:h-[600px]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  title={`${activeProv.name} Offerwall`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-[var(--surface-page)]">
                  <Layers className="h-10 w-10 text-[var(--text-muted)] mb-4" />
                  <p className="font-semibold text-[var(--text-primary)] mb-2">{activeProv.name}</p>
                  <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                    Provider is live but the embed URL hasn&apos;t been configured yet. Check back soon.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Coming Soon grid — only shown if there are some coming-soon providers */}
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
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">We&apos;re working on this — check back soon!</p>
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
