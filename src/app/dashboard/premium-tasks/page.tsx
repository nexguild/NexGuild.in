"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Clock3,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";
import { formatNexcoins } from "@/lib/nexcoins";

type PremiumTaskCategory = "CPI" | "CPR" | "CPE" | "General Survey";

interface PremiumTask {
  id: string;
  advertiserName: string;
  name: string;
  category: PremiumTaskCategory;
  description: string;
  terms: string | null;
  confirmationTime: string | null;
  imageUrl: string | null;
  countries: string[];
  devices: string[];
  os: string | null;
  estimatedRewardCoins: number;
  events: { name: string; estimatedRewardCoins: number }[];
}

interface PremiumTasksResponse {
  offers: PremiumTask[];
  countryCode?: string | null;
  countryMissing?: boolean;
  error?: string;
}

const CATEGORIES: PremiumTaskCategory[] = ["CPI", "CPR", "CPE", "General Survey"];
const CATEGORY_LABELS: Record<PremiumTaskCategory, string> = {
  CPI: "App install",
  CPR: "Sign-up",
  CPE: "In-app goal",
  "General Survey": "Survey",
};
const CATEGORY_STYLES: Record<PremiumTaskCategory, string> = {
  CPI: "border-sky-200 bg-sky-50 text-sky-700",
  CPR: "border-violet-200 bg-violet-50 text-violet-700",
  CPE: "border-amber-200 bg-amber-50 text-amber-700",
  "General Survey": "border-teal-200 bg-teal-50 text-teal-700",
};

function formatCoins(value: number) {
  return formatNexcoins(value);
}

function displayList(values: string[], emptyLabel: string) {
  return values.length ? values.join(", ") : emptyLabel;
}

export default function PremiumTasksPage() {
  const [offers, setOffers] = useState<PremiumTask[]>([]);
  const [countryMissing, setCountryMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<PremiumTask | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const startRequestRef = useRef<AbortController | null>(null);
  const offerWindowRef = useRef<Window | null>(null);

  const closeOffer = useCallback(() => {
    startRequestRef.current?.abort();
    startRequestRef.current = null;
    offerWindowRef.current?.close();
    offerWindowRef.current = null;
    setStarting(false);
    setSelectedOffer(null);
    setStartError(null);
  }, []);

  const loadOffers = useCallback(async (signal?: AbortSignal, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again to view premium tasks.");

      const response = await fetch("/api/premium-tasks", {
        headers: { Authorization: "Bearer " + session.access_token },
        cache: "no-store",
        signal,
      });
      const result = await response.json() as PremiumTasksResponse;
      if (!response.ok) throw new Error("Premium tasks are temporarily unavailable. Please try again later.");
      if (!Array.isArray(result.offers)) throw new Error("The premium task feed returned an invalid response.");
      setOffers(result.offers);
      setCountryMissing(result.countryMissing === true);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(loadError instanceof Error && loadError.message.includes("sign in again")
        ? loadError.message
        : "Premium tasks are temporarily unavailable. Please try again later.");
      setOffers([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadOffers(controller.signal);
    return () => controller.abort();
  }, [loadOffers]);

  useEffect(() => {
    if (!selectedOffer) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeOffer();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOffer, selectedOffer]);

  const visibleOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return offers
      .filter((offer) =>
        CATEGORIES.includes(offer.category)
        && (!query || `${offer.advertiserName} ${offer.name} ${offer.description} ${CATEGORY_LABELS[offer.category]}`
          .toLowerCase().includes(query)),
      )
      .sort((a, b) => b.estimatedRewardCoins - a.estimatedRewardCoins);
  }, [offers, search]);

  async function startOffer() {
    if (!selectedOffer || starting) return;
    const offerWindow = window.open("about:blank", "_blank");
    const request = new AbortController();
    startRequestRef.current = request;
    offerWindowRef.current = offerWindow;
    if (offerWindow) offerWindow.opener = null;
    setStarting(true);
    setStartError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again to start this offer.");
      const response = await fetch("/api/premium-tasks/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify({ offerId: selectedOffer.id }),
        signal: request.signal,
      });
      const result = await response.json() as { trackingUrl?: string; error?: string };
      if (request.signal.aborted) return;
      if (!response.ok || !result.trackingUrl) {
        throw new Error(result.error ?? "This offer could not be started. Please try again.");
      }
      if (offerWindow) {
        offerWindow.location.replace(result.trackingUrl);
        offerWindowRef.current = null;
        startRequestRef.current = null;
        setStarting(false);
        setSelectedOffer(null);
      } else {
        window.location.assign(result.trackingUrl);
      }
    } catch (startFailure) {
      offerWindow?.close();
      if (!request.signal.aborted) {
        setStartError(startFailure instanceof Error ? startFailure.message : "This offer could not be started. Please try again.");
      }
    } finally {
      if (startRequestRef.current === request) {
        startRequestRef.current = null;
        offerWindowRef.current = null;
        setStarting(false);
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <section className="relative isolate overflow-hidden rounded-[1.6rem] bg-[#102d49] text-white shadow-[0_18px_45px_rgba(15,76,69,0.12)]">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_5%,rgba(99,102,241,0.34),transparent_35%),radial-gradient(ellipse_at_4%_100%,rgba(20,184,166,0.2),transparent_45%)]" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" /> Offers from top brands
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Premium Tasks</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
              Explore offers available in your country, review the requirements, and earn NexCoins after confirmed completion.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5 backdrop-blur-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-300/15 text-indigo-200">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/55">Available now</p>
              <p className="mt-0.5 text-xl font-semibold">{loading ? "—" : visibleOffers.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">Explore brand offers</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Install, sign up, engage, or take a survey</h2>
          </div>
          <button
            type="button"
            onClick={() => void loadOffers(undefined, true)}
            disabled={loading || refreshing}
            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search offers or brands"
              aria-label="Search premium offers"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-label="Included task categories">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"><Filter className="h-3.5 w-3.5" /> Task types</span>
          {CATEGORIES.map((category) => (
            <span key={category} className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${CATEGORY_STYLES[category]}`}>{CATEGORY_LABELS[category]}</span>
          ))}
        </div>

        {countryMissing && (
          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-900">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Your profile country is unavailable. Only worldwide offers can be shown; contact support to update your profile country.</p>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Premium offers could not be loaded</p>
              <p className="mt-0.5 text-xs leading-5">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading premium offers">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : visibleOffers.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleOffers.map((offer) => (
              <article key={offer.id} className="flex min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-3 p-4">
                  {offer.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.imageUrl} alt={`${offer.advertiserName} logo`} className="h-12 w-12 flex-shrink-0 rounded-xl border border-slate-100 object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Target className="h-5 w-5" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${CATEGORY_STYLES[offer.category]}`}>{CATEGORY_LABELS[offer.category]}</span>
                    <h3 className="mt-1.5 line-clamp-1 text-sm font-bold leading-5 text-slate-900">{offer.advertiserName}</h3>
                    <p className="line-clamp-1 text-xs text-slate-500">{offer.name}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-extrabold text-emerald-800">
                    <NexCoinIcon size={13} /> {formatCoins(offer.estimatedRewardCoins)}
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-4 pb-4">
                  <p className="line-clamp-3 text-xs leading-5 text-slate-500">{offer.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="text-[10px] text-slate-500">{displayList(offer.countries, "Worldwide")}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedOffer(offer); setStartError(null); }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-700"
                    >
                      View offer <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : !error ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Target className="h-5 w-5" /></span>
            <p className="mt-3 text-sm font-bold text-slate-800">{offers.length ? "No offers match your search" : "No premium offers available for your country right now"}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
              {offers.length ? "Try another advertiser or offer name." : "Check back later for new app installs, sign-ups, in-app goals, and surveys."}
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] leading-5 text-slate-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
        <p>Coin amounts are estimates. NexCoins are credited only after the advertiser confirms a valid completion; pending, rejected, or reversed events are not guaranteed rewards.</p>
      </div>

      {selectedOffer && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeOffer();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="premium-offer-title"
            className="flex max-h-[calc(100dvh-0.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[min(88vh,48rem)] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:gap-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                {selectedOffer.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedOffer.imageUrl} alt={`${selectedOffer.advertiserName} logo`} className="h-10 w-10 flex-shrink-0 rounded-xl border border-slate-100 object-cover sm:h-12 sm:w-12" />
                ) : <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 sm:h-12 sm:w-12"><Target className="h-5 w-5" /></span>}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{selectedOffer.advertiserName}</p>
                  <h2 id="premium-offer-title" className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 sm:text-lg">{selectedOffer.name}</h2>
                </div>
              </div>
              <button type="button" onClick={closeOffer} aria-label="Close offer details" className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:bg-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 px-4 pt-3 sm:px-7 sm:pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${CATEGORY_STYLES[selectedOffer.category]}`}>{CATEGORY_LABELS[selectedOffer.category]}</span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-extrabold text-emerald-800 sm:px-3 sm:text-sm">
                  <NexCoinIcon size={15} /> ~{formatCoins(selectedOffer.estimatedRewardCoins)} NexCoins
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3 sm:space-y-4 sm:px-7 sm:py-4">
              <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Description</h3>
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6">{selectedOffer.description}</p>
                {selectedOffer.terms && <p className="mt-3 whitespace-pre-line text-xs leading-5 text-slate-500"><span className="font-bold">Requirements:</span> {selectedOffer.terms}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Countries</h3>
                  <p className="mt-2 text-sm text-slate-700">{displayList(selectedOffer.countries, "All eligible countries")}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Devices</h3>
                  <p className="mt-2 text-sm capitalize text-slate-700">{displayList(selectedOffer.devices, "All supported devices")}</p>
                  {selectedOffer.os && <p className="mt-1 text-xs text-slate-500">OS: {selectedOffer.os}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 sm:p-4">
                <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Completion steps{selectedOffer.events.length ? ` (${selectedOffer.events.length})` : ""}
                </h3>
                {selectedOffer.events.length ? (
                  <ol className="mt-3 space-y-2">
                    {selectedOffer.events.map((event, index) => (
                      <li key={`${event.name}-${index}`} className="flex items-start justify-between gap-3 text-sm text-slate-700">
                        <span>{event.name}</span>
                        <span className="inline-flex flex-shrink-0 items-center gap-1 font-semibold text-teal-700"><NexCoinIcon size={12} /> ~{formatCoins(event.estimatedRewardCoins)}</span>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-2 text-sm text-slate-700">{selectedOffer.name}</p>}
                {selectedOffer.confirmationTime && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> {selectedOffer.confirmationTime}</p>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-5 sm:pt-4">
              {startError && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{startError}</p>}
              <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <p className="max-w-sm text-[10px] leading-4 text-slate-500">Reward is estimated. It is credited after a confirmed partner completion and may be reversed if invalidated.</p>
                <button
                  type="button"
                  onClick={() => void startOffer()}
                  disabled={starting}
                  className="inline-flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 min-[420px]:w-auto"
                >
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {starting ? "Opening offer…" : "Start offer"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
