"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Info, AlertTriangle, ArrowRight, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  feature_tags: string[];
  available_countries: string[];
  isLive: boolean;
}

/* Top ~30% of card: image or gradient with large initials */
function CardBanner({ provider }: { provider: Provider }) {
  if (provider.logo_url) {
    return (
      <div className="w-full h-28 overflow-hidden flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={provider.logo_url}
          alt={provider.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  const initials = provider.name.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-full h-28 flex items-center justify-center flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
    >
      <span className="text-4xl font-extrabold text-white/90 tracking-tight select-none">{initials}</span>
    </div>
  );
}

export default function OfferwallsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const res = await fetch("/api/offerwalls", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { providers: p } = await res.json() as { providers: Provider[] };
        setProviders(p);
      }
      setLoading(false);
    }
    init();
  }, []);

  const taskOfferwalls = providers.filter((p) => !p.is_ad_network);
  const adNetworks     = providers.filter((p) => p.is_ad_network);
  const liveWalls      = taskOfferwalls.filter((p) => p.isLive);
  const comingSoon     = taskOfferwalls.filter((p) => !p.isLive);

  return (
    <div className="space-y-5">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 shadow-lg"
        style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-white/70" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Earn NexCoins</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">Offerwall Hub</h1>
          <p className="text-sm text-white/80 max-w-lg">
            Complete offers, surveys, and tasks from our trusted partner providers. Earnings are credited to your NexCoins balance automatically after confirmation.
          </p>
        </div>
      </div>

      {/* ── Fraud Warning ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">Fraud Warning</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Never attempt to cheat, fake completions, or use VPNs to manipulate offers. All partners have advanced fraud detection systems.
            Fraudulent activity results in <span className="font-semibold">permanent account suspension</span> and forfeiture of all earnings.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white overflow-hidden animate-pulse">
              <div className="h-28 bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : taskOfferwalls.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white py-20 flex flex-col items-center gap-4 text-center px-6 shadow-sm">
          <div className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}>
            <Layers className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800 mb-1">Offerwall Hub Coming Soon</p>
            <p className="text-sm text-slate-500 max-w-sm">
              Partner integrations are being set up. Check back soon — more earning opportunities are on the way.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Live Providers Grid ───────────────────────────────────── */}
          {liveWalls.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Available Now</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {liveWalls.map((p) => (
                  <div
                    key={p.slug}
                    className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Logo banner — top 30% of card */}
                    <CardBanner provider={p} />

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-4 gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{p.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 flex-shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                          Live
                        </span>
                      </div>

                      {p.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{p.description}</p>
                      )}

                      {p.feature_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.feature_tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{tag}</span>
                          ))}
                        </div>
                      )}

                      {p.available_countries.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Globe className="h-3 w-3" />
                          {p.available_countries.join(" · ")}
                        </div>
                      )}

                      <Link
                        href={`/dashboard/offerwalls/${p.slug}`}
                        className="mt-auto flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                      >
                        Start Earning <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Coming Soon ───────────────────────────────────────────── */}
          {comingSoon.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Coming Soon</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {comingSoon.map((p) => (
                  <div key={p.slug} className="rounded-xl border border-slate-100 bg-white/60 overflow-hidden opacity-60 flex flex-col">
                    <div
                      className="h-16 w-full flex items-center justify-center"
                      style={p.logo_url
                        ? undefined
                        : { background: "linear-gradient(135deg, #e0e7ff 0%, #ccfbf1 100%)" }}
                    >
                      {p.logo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.logo_url} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-xl font-extrabold text-indigo-300 select-none">{p.name.slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-slate-600 truncate">{p.name}</p>
                      {p.description && (
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{p.description}</p>
                      )}
                      <span className="mt-auto inline-block text-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Soon
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Ad Networks notice ────────────────────────────────────────── */}
      {!loading && adNetworks.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">Ad Network integrations</span>
            {" "}({adNetworks.map((p) => p.name).join(", ")}) serve site-wide display ads on NexGuild rather than individual offer tasks.
            These don&apos;t appear as clickable offers — ad revenue is tracked automatically in the background once enabled.
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
