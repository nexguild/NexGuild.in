"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flame,
  Globe2,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";

type ProviderName = "CPX Research" | "TheoremReach";
type ProviderFilter = "All surveys" | ProviderName;
type SortMode = "Recommended" | "Fastest" | "Highest reward" | "Best rated";

interface Survey {
  id: string;
  provider: ProviderName;
  durationMinutes: number;
  rewardCoins: number;
  rating: number | null;
  ratingCount: number;
  rankScore: number;
  recommended: boolean;
  entryUrl: string;
}

interface SurveyResponse {
  surveys: Survey[];
  offers: FeaturedOffer[];
  errors: {
    cpx_research: string | null;
    theoremreach: string | null;
    theoremreach_offers: string | null;
  };
}

interface FeaturedOffer {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  providerName: string | null;
  kind: "diy" | "network";
  estimatedRewardCoins: number;
  rankScore: number;
  events: { name: string; estimatedRewardCoins: number }[];
  entryUrl: string;
}

interface OfferwallProvider {
  id: string;
  name: string;
  slug: string;
  is_ad_network: boolean;
  description: string | null;
  logo_url: string | null;
  feature_tags: string[];
  available_countries: string[];
  isLive: boolean;
}

interface OfferwallsResponse {
  providers: OfferwallProvider[];
}

const SORT_MODES: SortMode[] = ["Recommended", "Fastest", "Highest reward", "Best rated"];
const PROVIDER_FILTERS: ProviderFilter[] = ["All surveys", "CPX Research", "TheoremReach"];

function formatCoins(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [offerwalls, setOfferwalls] = useState<OfferwallProvider[]>([]);
  const [offerwallsLoading, setOfferwallsLoading] = useState(true);
  const [offerwallsError, setOfferwallsError] = useState<string | null>(null);
  const [errors, setErrors] = useState<SurveyResponse["errors"]>({
    cpx_research: null,
    theoremreach: null,
    theoremreach_offers: null,
  });
  const [sortMode, setSortMode] = useState<SortMode>("Recommended");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("All surveys");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSurveys = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoadError("Please sign in again to view surveys.");
        return;
      }

      const response = await fetch("/api/surveys", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
        signal,
      });
      const result = await response.json() as SurveyResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load surveys right now.");
      setSurveys(result.surveys);
      setOffers(result.offers ?? []);
      setErrors(result.errors);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLoadError(error instanceof Error ? error.message : "Unable to load surveys right now.");
      setSurveys([]);
      setOffers([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const loadOfferwalls = useCallback(async (signal?: AbortSignal) => {
    setOfferwallsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setOfferwallsError("Please sign in again to view partner offerwalls.");
        return;
      }

      const response = await fetch("/api/offerwalls", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
        signal,
      });
      const result = await response.json() as OfferwallsResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load partner offerwalls.");
      if (!Array.isArray(result.providers)) throw new Error("Partner offerwalls returned an invalid response.");
      setOfferwalls(result.providers.filter((provider) => !provider.is_ad_network && provider.isLive));
      setOfferwallsError(null);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setOfferwallsError(error instanceof Error ? error.message : "Unable to load partner offerwalls.");
    } finally {
      if (!signal?.aborted) setOfferwallsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSurveys(controller.signal);
    void loadOfferwalls(controller.signal);
    return () => controller.abort();
  }, [loadOfferwalls, loadSurveys]);

  const visibleSurveys = useMemo(() => {
    const filtered = surveys.filter(
      (survey) => providerFilter === "All surveys" || survey.provider === providerFilter,
    );
    switch (sortMode) {
      case "Fastest":
        return [...filtered].sort((a, b) => a.durationMinutes - b.durationMinutes);
      case "Highest reward":
        return [...filtered].sort((a, b) => b.rewardCoins - a.rewardCoins);
      case "Best rated":
        return [...filtered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return [...filtered].sort((a, b) => Number(b.recommended) - Number(a.recommended));
    }
  }, [providerFilter, sortMode, surveys]);

  const featuredSurvey = visibleSurveys[0];
  const otherSurveys = visibleSurveys.slice(1);
  const featuredOffer = offers[0];
  const otherOffers = offers.slice(1);
  const featuredOffersSection = (
    <section aria-labelledby="featured-offers-heading" className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-3 shadow-[0_8px_24px_rgba(190,72,48,0.1)] sm:rounded-3xl sm:p-6 sm:shadow-[0_12px_36px_rgba(190,72,48,0.1)]">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-1.5 sm:mb-4 sm:gap-2">
        <div>
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-600 sm:gap-1.5 sm:text-[11px] sm:tracking-[0.15em]"><Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Beyond surveys</p>
        <h2 id="featured-offers-heading" className="mt-0.5 text-base font-extrabold text-slate-900 sm:mt-1 sm:text-xl">Featured offers</h2>
        </div>
      <span className="text-[9px] text-slate-500 sm:text-[11px]">TheoremReach · estimated rewards</span>
      </div>

      {loading ? (
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3" aria-label="Loading featured offers">
          {[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-white/80 sm:h-64 sm:rounded-2xl" />)}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 sm:p-4 sm:text-sm">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadSurveys()} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[10px] font-bold text-rose-700 shadow-sm hover:bg-rose-100 sm:mt-3 sm:min-h-10 sm:gap-2 sm:px-3 sm:text-xs">
            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Try again
          </button>
        </div>
      ) : featuredOffer ? (
        <>
          {errors.theoremreach_offers && (
            <p role="status" className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900 sm:mb-3 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs">
              Some individual offers could not be loaded: {errors.theoremreach_offers}. You can still browse the <Link href="/dashboard/offerwalls/theoremreach" className="font-bold underline underline-offset-2">TheoremReach offerwall</Link>.
            </p>
          )}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
            {[featuredOffer, ...otherOffers.slice(0, 2)].map((offer) => (
              <article key={offer.id} className="flex min-w-0 flex-row overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md sm:flex-col sm:rounded-2xl sm:hover:-translate-y-0.5 sm:hover:shadow-lg">
                {offer.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={offer.imageUrl} alt="" className="h-auto w-16 shrink-0 self-stretch bg-slate-100 object-cover sm:h-28 sm:w-full" loading="lazy" />
                ) : (
                  <div className="flex w-16 shrink-0 items-center justify-center bg-gradient-to-br from-orange-400 via-rose-500 to-violet-600 text-white sm:h-28 sm:w-full"><Sparkles className="h-7 w-7 opacity-75 sm:h-10 sm:w-10" /></div>
                )}
                <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-700 sm:px-2.5 sm:py-1 sm:text-[10px]">{offer.kind === "network" ? offer.providerName || "Partner offer" : "Featured offer"}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600 sm:gap-1 sm:text-xs"><NexCoinIcon size={12} /> Up to {formatCoins(offer.estimatedRewardCoins)}</span>
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-xs font-extrabold leading-snug text-slate-900 sm:mt-3 sm:line-clamp-2 sm:text-sm">{offer.name}</h3>
                  {offer.description && <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-slate-500 sm:mt-1 sm:line-clamp-2 sm:text-xs sm:leading-relaxed">{offer.description}</p>}
                  {offer.events.length > 0 && (
                    <ul className="mt-1 space-y-0.5 sm:mt-3 sm:space-y-1">
                      {offer.events.slice(0, 2).map((event) => (
                        <li key={event.name} className="flex items-center justify-between gap-1 text-[10px] text-slate-500 sm:gap-2 sm:text-[11px]">
                          <span className="truncate">{event.name}</span>
                          <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-teal-700"><NexCoinIcon size={10} /> ~{formatCoins(event.estimatedRewardCoins)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <a href={offer.entryUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-9 items-center justify-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-2 text-[10px] font-extrabold text-white shadow-sm transition hover:from-orange-600 hover:to-rose-600 sm:mt-4 sm:min-h-10 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-sm sm:hover:-translate-y-0.5">
                    Start offer <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 px-4 py-6 text-center">
          <p className="text-sm font-bold text-slate-800">No featured offers available right now</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Offers vary by location and partner inventory. Check the partner wall for more earning options.</p>
          {errors.theoremreach_offers && <p role="status" className="mt-2 text-xs text-amber-800">{errors.theoremreach_offers}</p>}
          <Link href="/dashboard/offerwalls/theoremreach" className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white transition hover:bg-orange-600">
            Browse TheoremReach offers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl space-y-4 overflow-x-clip pb-20 text-slate-900 sm:space-y-6 sm:pb-12">
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#111b38] px-4 py-4 text-white shadow-[0_12px_32px_rgba(22,34,73,0.16)] sm:rounded-[28px] sm:px-8 sm:py-7 sm:shadow-[0_20px_52px_rgba(22,34,73,0.18)]">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_82%_15%,rgba(45,212,191,0.38),transparent_35%),radial-gradient(ellipse_at_100%_100%,rgba(99,102,241,0.48),transparent_44%),linear-gradient(115deg,#101a35_5%,#173a53_62%,#143f4a_100%)]" />
        <div aria-hidden className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative grid gap-3 sm:gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-teal-200/20 bg-teal-200/10 px-2.5 py-1 text-[10px] font-bold text-teal-100 sm:mb-3 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
              <Sparkles className="h-3 w-3 text-teal-300 sm:h-3.5 sm:w-3.5" /> YOUR OPINION HAS VALUE
            </div>
            <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
              Make your spare minutes <span className="bg-gradient-to-r from-teal-200 via-cyan-200 to-sky-300 bg-clip-text text-transparent">count.</span>
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-200 sm:mt-3 sm:text-base sm:leading-6">
              Find available surveys, compare the estimated time and NexCoin reward, and choose what works for you.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold text-white/90 sm:mt-4 sm:gap-2 sm:text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2"><Clock3 className="h-3.5 w-3.5 text-teal-200 sm:h-4 sm:w-4" /> Time estimates</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2"><Globe2 className="h-3.5 w-3.5 text-cyan-200 sm:h-4 sm:w-4" /> Provider-matched surveys</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2"><NexCoinIcon size={14} /> Earn NexCoins</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
              <Link href="#featured-heading" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-teal-300 px-3.5 text-xs font-extrabold text-slate-950 shadow-md shadow-teal-950/20 transition hover:bg-teal-200 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-5 sm:text-sm">
                Browse surveys <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
              <Link href="#offerwall-partners-heading" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3.5 text-xs font-bold text-white transition hover:bg-white/20 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-5 sm:text-sm">
                Explore offerwalls <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.08] p-2.5 backdrop-blur-sm sm:gap-3 sm:rounded-2xl sm:p-3.5 lg:min-w-56">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-300/15 text-teal-200 sm:h-10 sm:w-10 sm:rounded-xl"><CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /></div>
            <div>
              <p className="text-[10px] font-semibold text-slate-300 sm:text-xs">
                {loading ? "Checking earning options" : surveys.length || offers.length || offerwalls.length ? "Live partner inventory" : "Partner inventory"}
              </p>
              <p className="mt-0.5 text-xs font-bold text-white sm:text-sm">
                {surveys.length || offers.length
                  ? "Personalized listings ready"
                  : offerwalls.length
                    ? `${offerwalls.length} partner offerwalls ready`
                    : "Availability varies by region"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {featuredOffersSection}

      <section aria-labelledby="offerwall-partners-heading" className="relative isolate overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-teal-50 p-3 shadow-[0_8px_24px_rgba(47,57,99,0.1)] sm:rounded-[28px] sm:p-7 sm:shadow-[0_16px_44px_rgba(47,57,99,0.12)]">
        <div aria-hidden className="absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2 sm:mb-5 sm:gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700 sm:gap-2 sm:text-xs sm:tracking-[0.16em]"><Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> One hub · more ways to earn</p>
            <h2 id="offerwall-partners-heading" className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-3xl">Surveys &amp; offerwalls</h2>
            <p className="mt-1 text-xs text-slate-600 sm:mt-1.5 sm:text-sm">Jump straight into a partner to find surveys, apps, sign-ups, and other offers.</p>
          </div>
          <Link href="#offerwall-partners-heading" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-2.5 text-[11px] font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 sm:h-10 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm">
            View all partners <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Link>
        </div>
        {offerwallsLoading ? (
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-white/80 sm:h-44 sm:rounded-2xl" />)}
          </div>
        ) : offerwallsError ? (
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{offerwallsError}</p>
        ) : offerwalls.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-2">
            {offerwalls.map((provider) => (
              <Link
                key={provider.id}
                href={`/dashboard/offerwalls/${encodeURIComponent(provider.slug)}`}
                onClick={() => {
                  try {
                    sessionStorage.setItem("nexguild:offerwall-return", JSON.stringify({
                      slug: provider.slug,
                      path: "/dashboard/surveys",
                    }));
                  } catch {
                    // The provider page falls back to the Offerwall Hub when storage is unavailable.
                  }
                }}
                className="group flex min-h-0 items-start gap-2.5 rounded-xl border border-indigo-200 bg-white p-3 shadow-[0_5px_16px_rgba(49,46,129,0.1)] transition hover:border-indigo-400 hover:shadow-[0_10px_24px_rgba(49,46,129,0.16)] sm:min-h-48 sm:gap-5 sm:rounded-2xl sm:p-6 sm:shadow-[0_8px_24px_rgba(49,46,129,0.12)] sm:hover:-translate-y-1 sm:hover:shadow-[0_16px_34px_rgba(49,46,129,0.2)]"
              >
                {provider.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-indigo-100 bg-white object-contain p-1.5 shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl sm:p-2" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-black text-white shadow-sm sm:h-16 sm:w-16 sm:rounded-2xl sm:text-base sm:shadow-md">
                    {provider.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col self-stretch">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-extrabold leading-tight text-slate-950 sm:text-lg">{provider.name}</span>
                  </span>
                  <span className="mt-1 line-clamp-1 text-[10px] leading-snug text-slate-700 sm:mt-2 sm:line-clamp-2 sm:text-sm sm:leading-relaxed">{provider.description || "Browse opportunities from this partner and earn NexCoins after confirmed completion."}</span>
                  <span className="mt-auto flex flex-wrap gap-1 pt-2 sm:gap-1.5 sm:pt-3">
                    {(provider.feature_tags.length ? provider.feature_tags.slice(0, 3) : ["Surveys", "Offers"]).map((tag) => (
                      <span key={tag} className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-800 sm:px-2.5 sm:py-1 sm:text-[11px]">{tag}</span>
                    ))}
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 sm:px-2.5 sm:py-1 sm:text-[11px]">Available</span>
                  </span>
                  <span className="mt-2 inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 text-[10px] font-extrabold text-white shadow-sm shadow-indigo-900/20 transition group-hover:from-indigo-700 group-hover:to-violet-700 sm:mt-3 sm:min-h-9 sm:gap-1.5 sm:px-3 sm:text-xs">
                    Start earning <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1 sm:h-4 sm:w-4" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          !loading && <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">No partner offerwalls are available right now.</p>
        )}
      </section>

      <section aria-labelledby="featured-heading">
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              <Sparkles className="h-3.5 w-3.5" /> Provider matches
            </div>
            <h2 id="featured-heading" className="text-xl font-black tracking-tight sm:text-2xl">Featured survey</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Survey availability and eligibility are confirmed by the provider.</p>
          </div>
          <div className="flex flex-wrap items-center gap-0.5 self-start rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm sm:gap-1 sm:self-auto sm:rounded-xl sm:p-1">
            <ArrowDownWideNarrow className="ml-1 h-3.5 w-3.5 text-slate-400 sm:ml-2 sm:h-4 sm:w-4" />
            {SORT_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                aria-pressed={sortMode === mode}
                className={`rounded-md px-1.5 py-1.5 text-[10px] font-semibold transition sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-xs ${sortMode === mode ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {loadError && (
          <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadSurveys()} className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-36 items-center justify-center rounded-2xl border border-slate-200 bg-white sm:min-h-52 sm:rounded-3xl">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600 sm:h-7 sm:w-7" aria-label="Loading surveys" />
          </div>
        ) : featuredSurvey ? (
          <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_8px_24px_rgba(31,52,84,0.08)] sm:rounded-3xl sm:p-7 sm:shadow-[0_16px_44px_rgba(31,52,84,0.09)]">
            <div aria-hidden className={`absolute inset-y-0 left-0 w-2 ${featuredSurvey.provider === "CPX Research" ? "bg-gradient-to-b from-violet-500 to-blue-500" : "bg-gradient-to-b from-teal-400 to-emerald-500"}`} />
            <div className="relative grid gap-3 sm:gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[10px]">
                    <Star className="h-3 w-3 fill-current sm:h-3.5 sm:w-3.5" /> {featuredSurvey.recommended ? "Recommended" : "Featured"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 sm:px-2.5 sm:text-[11px]">{featuredSurvey.provider}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:text-[11px]"><Clock3 className="h-3 w-3" /> {featuredSurvey.durationMinutes} min</span>
                </div>
                <h3 className="mt-2.5 text-base font-extrabold text-slate-900 sm:mt-4 sm:text-2xl">Survey #{featuredSurvey.id}</h3>
                <p className="mt-1 text-xs text-slate-500 sm:mt-1.5 sm:text-sm">The provider will confirm your eligibility and survey details when you continue.</p>
                {featuredSurvey.rating !== null && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{featuredSurvey.rating.toFixed(1)}</span>
                    <span className="text-slate-400">({featuredSurvey.ratingCount} ratings)</span>
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-2.5 sm:gap-5 sm:rounded-2xl sm:p-4 md:min-w-56 md:flex-col md:items-end md:bg-transparent md:p-0">
                <div className="md:text-right">
                  <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">ESTIMATED REWARD</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xl font-black tracking-tight text-slate-900 sm:gap-2 sm:text-3xl"><NexCoinIcon size={20} /> {formatCoins(featuredSurvey.rewardCoins)}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-teal-700 sm:text-xs">NexCoins</p>
                </div>
                <a href={featuredSurvey.entryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 px-3 text-xs font-bold text-white shadow-md shadow-teal-700/15 transition hover:shadow-lg sm:h-11 sm:gap-2 sm:rounded-xl sm:px-5 sm:text-sm sm:hover:-translate-y-0.5">
                  Start survey <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm sm:rounded-3xl sm:px-5 sm:py-10">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:h-12 sm:w-12 sm:rounded-2xl"><Info className="h-5 w-5 sm:h-6 sm:w-6" /></div>
            <h3 className="mt-3 text-base font-bold text-slate-900 sm:mt-4 sm:text-lg">No surveys available right now</h3>
            <p className="mx-auto mt-1 max-w-lg text-xs text-slate-500 sm:text-sm">Providers may have no surveys matching your profile at the moment. Try a partner offerwall below or check again later.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="daily-picks-heading">
        <div className="mb-3 flex flex-col gap-2.5 sm:mb-4 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600"><Flame className="h-3.5 w-3.5" /> Available now</div>
            <h2 id="daily-picks-heading" className="text-xl font-black tracking-tight sm:text-2xl">Today&apos;s survey picks</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">These listings come directly from your connected survey partners.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROVIDER_FILTERS.map((filter) => (
              <button key={filter} type="button" onClick={() => setProviderFilter(filter)} aria-pressed={providerFilter === filter} className={`rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition sm:px-3.5 sm:py-2 sm:text-xs ${providerFilter === filter ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        {otherSurveys.length > 0 ? (
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
            {otherSurveys.map((survey) => (
              <article key={`${survey.provider}-${survey.id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md sm:rounded-2xl sm:hover:-translate-y-1 sm:hover:shadow-xl sm:hover:shadow-slate-900/10">
                <div className={`relative h-16 overflow-hidden p-2.5 sm:h-24 sm:p-4 ${survey.provider === "CPX Research" ? "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600" : "bg-gradient-to-br from-teal-500 via-emerald-500 to-lime-500"}`}>
                  <div aria-hidden className="absolute -right-3 -top-12 h-36 w-36 rounded-full border-[18px] border-white/10" />
                  <div className="relative flex items-start justify-between">
                    <span className="rounded-full border border-white/20 bg-black/10 px-2 py-0.5 text-[9px] font-bold text-white sm:px-2.5 sm:py-1 sm:text-[10px]">{survey.provider}</span>
                    <span className="flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white sm:px-2 sm:py-1 sm:text-[10px]"><Clock3 className="h-3 w-3" /> {survey.durationMinutes} min</span>
                  </div>
                  <BarChart3 className="absolute bottom-[-8px] right-3 h-12 w-12 text-white/30 sm:bottom-[-10px] sm:right-5 sm:h-16 sm:w-16" strokeWidth={1.5} />
                </div>
                <div className="flex min-h-0 flex-col p-3 sm:min-h-40 sm:p-5">
                  <h3 className="text-sm font-extrabold leading-snug text-slate-900 sm:text-base">Survey #{survey.id}</h3>
                  <p className="mt-1 text-[10px] leading-snug text-slate-500 sm:mt-1.5 sm:text-xs sm:leading-relaxed">Eligibility and final reward are confirmed by the survey provider.</p>
                  <div className="mt-2 flex items-center justify-between gap-2 pt-1 sm:mt-auto sm:items-end sm:gap-3 sm:pt-5">
                    <div>
                      <p className="flex items-center gap-1 text-base font-black text-slate-900 sm:gap-1.5 sm:text-xl"><NexCoinIcon size={16} /> {formatCoins(survey.rewardCoins)}</p>
                      <p className="ml-[21px] text-[9px] font-semibold text-teal-700 sm:ml-[26px] sm:text-[10px]">NexCoins</p>
                      {survey.rating !== null && <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 sm:mt-1.5 sm:text-[11px]"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {survey.rating.toFixed(1)} <span>·</span> {survey.ratingCount} ratings</p>}
                    </div>
                    <a href={survey.entryUrl} target="_blank" rel="noopener noreferrer" aria-label={`Start survey ${survey.id} from ${survey.provider}`} className="flex h-9 items-center gap-1 rounded-lg bg-teal-600 px-2 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-teal-700 sm:h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-xs sm:hover:-translate-y-0.5">
                      Start survey <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loading && <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:px-4 sm:py-6 sm:text-sm">More matching surveys will appear here when the providers have inventory.</p>
        )}

        {!loading && (errors.cpx_research || errors.theoremreach) && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            <p className="font-bold">Some partner listings could not load</p>
            {errors.cpx_research && <p className="mt-1">CPX Research: {errors.cpx_research}</p>}
            {errors.theoremreach && <p className="mt-1">TheoremReach surveys: {errors.theoremreach}</p>}
            <button type="button" onClick={() => { void loadSurveys(); void loadOfferwalls(); }} className="mt-3 inline-flex items-center gap-1.5 font-bold text-amber-950 underline underline-offset-2"><RefreshCw className="h-3 w-3" /> Refresh partner listings</button>
          </div>
        )}
      </section>

      <p className="mx-auto flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Survey availability, eligibility, estimated time, and rewards can vary by location and provider. NexCoins are credited only after provider confirmation.
      </p>
    </main>
  );
}
