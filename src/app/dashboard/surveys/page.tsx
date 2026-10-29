"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  ExternalLink,
  Flame,
  Info,
  Layers,
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
    notik_offers: string | null;
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
    notik_offers: null,
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

  const featuredOffer = offers[0];
  const otherOffers = offers.slice(1);
  const featuredOffersSection = (
    <section aria-labelledby="featured-offers-heading" className="order-1 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700 sm:text-xs"><Flame className="h-3.5 w-3.5" /> Picked for you</p>
          <h2 id="featured-offers-heading" className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl">Featured activities</h2>
          <p className="mt-1 text-xs text-slate-500">Try apps, play games, or complete other activities to earn.</p>
        </div>
        <span className="text-[10px] text-slate-500 sm:text-xs">Estimated NexCoin rewards</span>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden" aria-label="Loading featured offers">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-48 w-36 shrink-0 animate-pulse rounded-xl bg-slate-200 sm:w-40" />)}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadSurveys()} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-rose-700 shadow-sm hover:bg-rose-100">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </button>
        </div>
      ) : featuredOffer ? (
        <>
          {(errors.theoremreach_offers || errors.notik_offers) && (
            <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900 sm:text-xs">
              Some tasks could not be loaded. {errors.notik_offers && `Notik: ${errors.notik_offers}. `}{errors.theoremreach_offers && `TheoremReach: ${errors.theoremreach_offers}. `}Other tasks are still available below.
            </p>
          )}
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
            {[featuredOffer, ...otherOffers].map((offer) => (
              <article key={offer.id} className="group flex w-[148px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md sm:w-[168px]">
                <div className="relative flex h-24 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#12314A] to-teal-800 text-teal-100">
                  {offer.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <Sparkles className="h-8 w-8 opacity-80" />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#071321]/85 via-[#071321]/10 to-black/20" />
                  <span className="absolute left-2 top-2 max-w-[90px] truncate rounded-full border border-white/20 bg-[#071321]/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                    {offer.providerName || "Partner task"}
                  </span>
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-teal-300 px-2 py-0.5 text-[9px] font-extrabold text-slate-950 shadow-sm">
                    <NexCoinIcon size={10} /> {formatCoins(offer.estimatedRewardCoins)}
                  </span>
                </div>
                <div className="flex min-h-[112px] min-w-0 flex-1 flex-col p-2.5">
                  <h3 className="mt-1.5 line-clamp-2 text-xs font-extrabold leading-snug text-slate-900">{offer.name}</h3>
                  {offer.description && <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">{offer.description}</p>}
                  {offer.events.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {offer.events.slice(0, 1).map((event) => (
                        <li key={event.name} className="flex items-center justify-between gap-1 text-[9px] text-slate-500">
                          <span className="truncate">{event.name}</span>
                          <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-teal-700"><NexCoinIcon size={10} /> ~{formatCoins(event.estimatedRewardCoins)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                    <a href={offer.entryUrl} target="_blank" rel="noopener noreferrer" aria-label={`Try activity: ${offer.name}`} className="inline-flex h-7 items-center gap-1 rounded-md bg-teal-600 px-2 text-[9px] font-extrabold text-white transition hover:bg-teal-700">
                      Try task <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-[9px] font-semibold text-slate-500">{offer.kind === "network" ? "Partner task" : "Featured task"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
          <p className="text-sm font-bold text-slate-800">No featured tasks showing right now</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Try the partner apps below or check back later for new activities.</p>
          {(errors.theoremreach_offers || errors.notik_offers) && <p role="status" className="mt-2 text-xs text-amber-800">{errors.notik_offers && `Notik: ${errors.notik_offers} `}{errors.theoremreach_offers && `TheoremReach: ${errors.theoremreach_offers}`}</p>}
        </div>
      )}
    </section>
  );

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 overflow-x-clip pb-20 text-slate-900 sm:gap-7 sm:pb-12">
      <header className="relative order-0 isolate overflow-hidden rounded-2xl border border-[#1e3a5f] bg-[#0A1628] px-4 py-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] sm:rounded-3xl sm:px-6 sm:py-5">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_0%,rgba(20,184,166,0.28),transparent_38%),linear-gradient(115deg,#0A1628_10%,#102d44_72%,#0d514d_100%)]" />
        <div className="flex items-center justify-between gap-3 sm:gap-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-teal-200 sm:text-[10px]">
              <Sparkles className="h-3.5 w-3.5" /> Your next reward starts here
            </p>
            <h1 className="mt-1.5 text-lg font-black leading-tight tracking-tight sm:text-2xl">Pick a task. Earn NexCoins.</h1>
            <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-slate-200 sm:text-xs">
              Answer a few questions, try an app, or complete a quick activity. Rewards arrive after partner confirmation.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Link href="#featured-offers-heading" className="inline-flex h-7 items-center gap-1 rounded-lg bg-teal-300 px-2.5 text-[10px] font-extrabold text-slate-950 transition hover:bg-teal-200 sm:h-8 sm:text-xs">
                Find activities <ArrowRight className="h-3 w-3" />
              </Link>
              <Link href="#featured-heading" className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 text-[10px] font-bold text-white transition hover:bg-white/15 sm:h-8 sm:text-xs">
                Answer questions <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="relative flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-teal-400/20 via-[#12314A] to-[#0d9488] shadow-lg sm:h-24 sm:w-24 sm:rounded-2xl">
            {featuredOffer?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featuredOffer.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Sparkles className="h-7 w-7 text-teal-200 sm:h-9 sm:w-9" />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#071321]/65 to-transparent" />
            <span className="absolute bottom-1 left-0 right-0 text-center text-[7px] font-extrabold uppercase tracking-wide text-white sm:bottom-1.5 sm:text-[8px]">
              Earn more
            </span>
          </div>
        </div>
      </header>

      {featuredOffersSection}

      <section aria-labelledby="offerwall-partners-heading" className="relative order-3 overflow-hidden rounded-2xl border border-[#1e3a5f] bg-gradient-to-br from-[#0A1628] via-[#0d1f38] to-[#0d514d] p-3.5 shadow-[0_12px_30px_rgba(10,22,40,0.18)] sm:rounded-3xl sm:p-5">
        <div className="relative mb-3 flex items-start gap-3 sm:mb-4 sm:gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-200/20 bg-teal-300/10 text-teal-200 sm:h-11 sm:w-11">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-teal-200 sm:text-[10px]">MORE TO EARN</p>
            <h2 id="offerwall-partners-heading" className="mt-0.5 text-base font-extrabold tracking-tight text-white sm:text-lg">Explore more ways to earn</h2>
            <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-300 sm:text-xs">
              Choose a partner to browse its apps, games, sign-ups, and other activities. Each one has different ways to earn.
            </p>
          </div>
        </div>
        <p className="mb-1 flex items-center justify-end gap-1 text-[9px] font-semibold text-teal-100 sm:text-[10px]">
          Swipe to explore <ArrowRight className="h-3 w-3" />
        </p>
        {offerwallsLoading ? (
          <div className="flex gap-3 overflow-hidden" aria-label="Loading partner activities">
            {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 w-44 shrink-0 animate-pulse rounded-xl bg-white/10" />)}
          </div>
        ) : offerwallsError ? (
          <p role="alert" className="rounded-xl border border-amber-200/30 bg-amber-200/10 px-3 py-2 text-xs text-amber-100">{offerwallsError}</p>
        ) : offerwalls.length ? (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
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
                aria-label={`Browse ${provider.name} activities`}
                className="group flex w-[176px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-white/15 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-[0_10px_24px_rgba(20,184,166,0.18)] sm:w-[196px]"
              >
                <span className="relative flex h-[100px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#12314A] to-[#0d9488] sm:h-28">
                  <span aria-hidden className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[16px] border-white/10 transition-transform duration-300 group-hover:scale-110" />
                  {provider.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={provider.logo_url} alt="" className="relative h-14 w-14 rounded-xl bg-white object-contain p-2 shadow-lg sm:h-16 sm:w-16" />
                  ) : (
                    <span className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-base font-black text-white shadow-lg sm:h-16 sm:w-16">
                      {provider.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  </span>
                <span className="flex min-h-[68px] items-center justify-between gap-2 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-extrabold text-slate-950 sm:text-sm">{provider.name}</span>
                    <span className="mt-0.5 block truncate text-[9px] text-slate-500">{provider.feature_tags.slice(0, 2).join(" · ") || "Apps, games & more"}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-teal-100 px-2 py-1 text-[9px] font-extrabold text-teal-900 sm:px-2.5 sm:text-[10px]">
                    Browse <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          !loading && <p className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-3 text-xs text-slate-300">No partner activities are available right now.</p>
        )}
      </section>

      <section aria-labelledby="featured-heading" className="order-2 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Picked for you
            </p>
            <h2 id="featured-heading" className="mt-1 text-lg font-extrabold tracking-tight text-slate-950 sm:text-xl">Quick questions</h2>
            <p className="mt-1 text-xs text-slate-500">Answer a few questions and earn when the partner confirms completion.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDER_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setProviderFilter(filter)}
                aria-pressed={providerFilter === filter}
                className={`rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition ${providerFilter === filter ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"}`}
              >
                {filter === "All surveys" ? "All questions" : filter}
              </button>
            ))}
            <label className="sr-only" htmlFor="survey-sort">Sort surveys</label>
            <select
              id="survey-sort"
              value={sortMode}
              onChange={(event) => {
                const mode = SORT_MODES.find((option) => option === event.target.value);
                if (mode) setSortMode(mode);
              }}
              className="h-8 rounded-full border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-teal-500"
            >
              {SORT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
        </div>

        {loadError && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadSurveys()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-bold text-rose-700 shadow-sm hover:bg-rose-100">
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex gap-3 overflow-hidden" aria-label="Loading surveys">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-44 w-[148px] shrink-0 animate-pulse rounded-xl bg-slate-200" />)}
          </div>
        ) : visibleSurveys.length ? (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
            {visibleSurveys.map((survey) => (
              <article key={`${survey.provider}-${survey.id}`} className="group flex w-[148px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-md sm:w-[168px]">
                <div className={`relative h-[70px] overflow-hidden p-2.5 ${survey.provider === "CPX Research" ? "bg-gradient-to-br from-[#322b69] via-indigo-700 to-blue-700" : "bg-gradient-to-br from-[#0A514F] via-teal-700 to-emerald-700"}`}>
                  <div aria-hidden className="absolute -right-4 -top-10 h-24 w-24 rounded-full border-[12px] border-white/10" />
                  <div className="relative flex items-start justify-between gap-1">
                    <span className="max-w-[94px] truncate rounded-full border border-white/20 bg-black/15 px-2 py-0.5 text-[9px] font-bold text-white">{survey.provider}</span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white"><Clock3 className="h-3 w-3" /> {survey.durationMinutes}m</span>
                  </div>
                  <BarChart3 className="absolute -bottom-2 right-3 h-10 w-10 text-white/25" strokeWidth={1.5} />
                  {survey.recommended && <span className="absolute bottom-2 left-2 rounded-full bg-teal-300 px-1.5 py-0.5 text-[8px] font-black text-slate-950">PICK</span>}
                </div>
                <div className="flex min-h-[104px] flex-1 flex-col p-2.5">
                  <h3 className="truncate text-xs font-extrabold text-slate-900">Answer a few questions</h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">The partner checks your answers and eligibility.</p>
                  <div className="mt-auto flex items-end justify-between gap-1 pt-2">
                    <div>
                      <p className="flex items-center gap-1 text-sm font-black text-slate-900"><NexCoinIcon size={14} /> {formatCoins(survey.rewardCoins)}</p>
                      {survey.rating !== null && <p className="mt-0.5 flex items-center gap-0.5 text-[9px] text-slate-500"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {survey.rating.toFixed(1)}</p>}
                    </div>
                    <a href={survey.entryUrl} target="_blank" rel="noopener noreferrer" aria-label={`Start survey ${survey.id} from ${survey.provider}`} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md bg-teal-600 px-2 text-[9px] font-extrabold text-white transition hover:bg-teal-700">
                      Start <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Info className="h-4 w-4" /></div>
            <h3 className="mt-2 text-sm font-bold text-slate-900">No questions available right now</h3>
            <p className="mt-1 text-xs text-slate-500">Try a different partner or explore the featured tasks above.</p>
          </div>
        )}

        {!loading && (errors.cpx_research || errors.theoremreach) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900 sm:text-xs">
            <p className="font-bold">Some questions could not be loaded</p>
            {errors.cpx_research && <p className="mt-1">CPX Research: {errors.cpx_research}</p>}
            {errors.theoremreach && <p className="mt-1">TheoremReach: {errors.theoremreach}</p>}
            <button type="button" onClick={() => { void loadSurveys(); void loadOfferwalls(); }} className="mt-2 inline-flex items-center gap-1.5 font-bold underline underline-offset-2">
              <RefreshCw className="h-3 w-3" /> Refresh partner listings
            </button>
          </div>
        )}
      </section>

      <p className="order-5 mx-auto flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Available activities, eligibility, time, and rewards can vary by location. NexCoins are added after the partner confirms completion.
      </p>
    </main>
  );
}
