"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Edit2, ExternalLink, Loader2, Plus, Power, Save, Trash2, X } from "lucide-react";
import { CountryMultiSelect } from "@/components/forms/CountrySelect";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";
import { formatNexcoins } from "@/lib/nexcoins";

type Partner = "gemiad" | "notik";
type Category = "CPI" | "CPR" | "CPE" | "General Survey";
type Device = "android" | "ios" | "desktop";

interface OfferEvent {
  partner_event_id: string;
  name: string;
  reward_nexcoins: number;
}

interface PremiumOffer {
  id: string;
  partner_slug: Partner;
  partner_offer_id: string;
  advertiser_name: string;
  offer_name: string;
  category: Category;
  description: string;
  terms: string | null;
  confirmation_time: string | null;
  image_url: string | null;
  countries: string[];
  devices: Device[];
  os: string | null;
  reward_nexcoins: number;
  events: OfferEvent[];
  tracking_url_template: string;
  is_active: boolean;
}

interface OfferForm {
  id: string | null;
  partner_slug: Partner;
  partner_offer_id: string;
  advertiser_name: string;
  offer_name: string;
  category: Category;
  description: string;
  terms: string;
  confirmation_time: string;
  image_url: string;
  countries: string[];
  devices: Device[];
  os: string;
  reward_nexcoins: string;
  events: OfferEvent[];
  tracking_url_template: string;
  is_active: boolean;
}

const EMPTY_FORM: OfferForm = {
  id: null,
  partner_slug: "gemiad",
  partner_offer_id: "",
  advertiser_name: "",
  offer_name: "",
  category: "CPI",
  description: "",
  terms: "",
  confirmation_time: "",
  image_url: "",
  countries: [],
  devices: [],
  os: "",
  reward_nexcoins: "",
  events: [],
  tracking_url_template: "",
  is_active: false,
};

const CATEGORIES: Category[] = ["CPI", "CPR", "CPE", "General Survey"];
const DEVICES: { value: Device; label: string }[] = [
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "desktop", label: "Desktop" },
];
const inputClass = "h-10 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]";
const selectClass = `${inputClass} bg-white text-slate-900 [color-scheme:light]`;
const labelClass = "mb-1.5 block text-sm font-semibold text-[var(--text-primary)]";

function formatCoins(value: number) {
  return formatNexcoins(value);
}

function newEvent(): OfferEvent {
  return { partner_event_id: "", name: "", reward_nexcoins: 0 };
}

export default function AdminPremiumTasksPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);
  const [offers, setOffers] = useState<PremiumOffer[]>([]);
  const [partners, setPartners] = useState<Record<Partner, boolean>>({ gemiad: false, notik: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm | null>(null);

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  }, []);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/premium-tasks", {
        headers: token ? { Authorization: "Bearer " + token } : {},
        cache: "no-store",
      });
      const result = await response.json() as { offers?: PremiumOffer[]; partners?: Record<Partner, boolean>; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not load premium offers.");
      setOffers(result.offers ?? []);
      setPartners(result.partners ?? { gemiad: false, notik: false });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load premium offers.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (allowed) void loadOffers();
  }, [allowed, loadOffers]);

  function editOffer(offer: PremiumOffer) {
    setForm({
      id: offer.id,
      partner_slug: offer.partner_slug,
      partner_offer_id: offer.partner_offer_id,
      advertiser_name: offer.advertiser_name,
      offer_name: offer.offer_name,
      category: offer.category,
      description: offer.description,
      terms: offer.terms ?? "",
      confirmation_time: offer.confirmation_time ?? "",
      image_url: offer.image_url ?? "",
      countries: offer.countries ?? [],
      devices: offer.devices ?? [],
      os: offer.os ?? "",
      reward_nexcoins: String(offer.reward_nexcoins),
      events: Array.isArray(offer.events) ? offer.events : [],
      tracking_url_template: offer.tracking_url_template,
      is_active: offer.is_active,
    });
  }

  function updateEvent(index: number, patch: Partial<OfferEvent>) {
    setForm((current) => current ? ({
      ...current,
      events: current.events.map((event, eventIndex) => eventIndex === index ? { ...event, ...patch } : event),
    }) : current);
  }

  async function saveOffer(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in again.");
      const response = await fetch("/api/admin/premium-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          ...form,
          reward_nexcoins: Number(form.reward_nexcoins),
          terms: form.terms || null,
          confirmation_time: form.confirmation_time || null,
          image_url: form.image_url || null,
          os: form.os || null,
        }),
      });
      const result = await response.json() as { offer?: PremiumOffer; error?: string };
      const savedOffer = result.offer;
      if (!response.ok || !savedOffer) throw new Error(result.error ?? "Could not save this offer.");
      setOffers((current) => [
        savedOffer,
        ...current.filter((offer) => offer.id !== savedOffer.id),
      ]);
      setForm(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this offer.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateOffer(offer: PremiumOffer) {
    setDeactivatingId(offer.id);
    setError(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/premium-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ action: "deactivate", id: offer.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not deactivate the offer.");
      setOffers((current) => current.map((item) => item.id === offer.id ? { ...item, is_active: false } : item));
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : "Could not deactivate the offer.");
    } finally {
      setDeactivatingId(null);
    }
  }

  const totalReward = form?.events.length
    ? form.events.reduce((sum, item) => sum + Number(item.reward_nexcoins || 0), 0)
    : Number(form?.reward_nexcoins || 0);

  if (!allowed) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Premium Tasks</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Manually curate partner offers, country eligibility, tracking links, and NexCoin rewards.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setError(null); setForm({ ...EMPTY_FORM }); }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--brand-500)] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add offer
        </button>
      </header>

      <section className="grid gap-3 md:grid-cols-2" aria-label="Partner callback configuration">
        {(["gemiad", "notik"] as const).map((partner) => (
          <div key={partner} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">{partner === "gemiad" ? "GemiAd" : "Notik"} callback</h2>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${partners[partner] ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                {partners[partner] ? "Secret configured" : "Configure secret first"}
              </span>
            </div>
            <p className="mt-2 break-all rounded-lg bg-[var(--surface-subtle)] p-2 font-mono text-[10px] leading-5 text-[var(--text-secondary)]">
              {partner === "gemiad"
                ? "https://nexguild.in/api/premium-tasks/postback/gemiad?userId={USER_ID}&offerId={OFFER_ID}&eventId={EVENT_ID}&txid={TXID}&status={STATUS}&hash={HASH}"
                : "https://nexguild.in/api/premium-tasks/postback/notik?user_id={user_id}&offer_id={offer_id}&trans_id={trans_id}&status={status}&s1={s1}&hash={hash}"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              Add this callback in the partner dashboard and store its callback secret in Admin → Offerwalls. GemiAd uses its documented SHA-256 signature; Notik uses its signed callback URL.
            </p>
          </div>
        ))}
      </section>

      {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 text-sm text-[var(--text-muted)]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading offers…
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--surface-card)] px-6 py-14 text-center">
          <p className="font-semibold text-[var(--text-primary)]">No manually curated offers yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Add an offer and keep it inactive until its partner callback has been tested.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Advertiser / offer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Countries</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--text-primary)]">{offer.advertiser_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{offer.offer_name} · {offer.partner_slug}</p>
                  </td>
                  <td className="px-4 py-3">{offer.category}</td>
                  <td className="px-4 py-3">{offer.countries.length ? offer.countries.join(", ") : "Worldwide"}</td>
                  <td className="px-4 py-3">{formatCoins(offer.reward_nexcoins)} NC</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${offer.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {offer.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => editOffer(offer)} className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] px-2.5 py-1.5 text-xs hover:bg-[var(--surface-subtle)]">
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      {offer.is_active && (
                        <button
                          type="button"
                          onClick={() => void deactivateOffer(offer)}
                          disabled={deactivatingId === offer.id}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deactivatingId === offer.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 text-[var(--text-primary)] shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{form.id ? "Edit Premium Offer" : "Add Premium Offer"}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Add the offer details and tracking link. Extra eligibility settings are optional.</p>
              </div>
              <button type="button" onClick={() => setForm(null)} aria-label="Close form" className="rounded-md p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={saveOffer} className="space-y-4">
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                Offers are entered manually and stay hidden from members until you turn them on.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Partner</label>
                  <select value={form.partner_slug} onChange={(event) => setForm({ ...form, partner_slug: event.target.value as Partner })} className={selectClass} style={{ colorScheme: "light" }}>
                    <option value="gemiad" className="bg-white text-slate-900">GemiAd</option>
                    <option value="notik" className="bg-white text-slate-900">Notik</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Partner offer ID</label>
                  <input required value={form.partner_offer_id} onChange={(event) => setForm({ ...form, partner_offer_id: event.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Brand name</label>
                  <input required maxLength={160} value={form.advertiser_name} onChange={(event) => setForm({ ...form, advertiser_name: event.target.value })} className={inputClass} placeholder="e.g. Koho" />
                </div>
                <div>
                  <label className={labelClass}>Offer name</label>
                  <input required maxLength={200} value={form.offer_name} onChange={(event) => setForm({ ...form, offer_name: event.target.value })} className={inputClass} placeholder="e.g. Install and open the app" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Task type</label>
                    <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as Category })} className={selectClass} style={{ colorScheme: "light" }}>
                      {CATEGORIES.map((category) => <option key={category} value={category} className="bg-white text-slate-900">{category === "CPI" ? "App install (CPI)" : category === "CPR" ? "Sign-up (CPR)" : category === "CPE" ? "In-app goal (CPE)" : "Survey"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{form.events.length ? "Total reward" : "Reward (NexCoins)"}</label>
                    {form.events.length ? (
                      <p className={`${inputClass} flex items-center`}>{formatCoins(totalReward)} NC across {form.events.length} steps</p>
                    ) : (
                      <input type="number" min="1" step="1" required value={form.reward_nexcoins} onChange={(event) => setForm({ ...form, reward_nexcoins: event.target.value })} className={inputClass} placeholder="e.g. 500" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea required maxLength={5000} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} h-auto py-2`} placeholder="Tell members what to do to earn the reward." />
              </div>

              <div>
                <label className={labelClass}>Partner tracking link</label>
                <textarea required rows={2} value={form.tracking_url_template} onChange={(event) => setForm({ ...form, tracking_url_template: event.target.value })} className={`${inputClass} h-auto break-all py-2 font-mono text-xs`} placeholder={form.partner_slug === "gemiad" ? "Paste the GemiAd link and use {{click_id}} as its userId" : "Paste the Notik link and use {{user_id}} in its user ID"} />
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  {form.partner_slug === "gemiad"
                    ? "Replace the link's userId with {{click_id}}. NexGuild adds a unique click ID."
                    : "Replace the link's user ID with {{user_id}}. NexGuild adds a unique click ID in s1."}
                </p>
              </div>

              <details className="rounded-xl border border-[var(--border-default)]">
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  Advanced options <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
                </summary>
                <div className="space-y-5 border-t border-[var(--border-default)] p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Offer image URL</label>
                      <input type="url" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} className={inputClass} placeholder="https://…" />
                    </div>
                    <div>
                      <label className={labelClass}>Reward confirmation timing</label>
                      <input value={form.confirmation_time} onChange={(event) => setForm({ ...form, confirmation_time: event.target.value })} className={inputClass} placeholder="e.g. After partner confirmation" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Terms / requirements</label>
                    <textarea rows={2} value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} className={`${inputClass} h-auto py-2`} placeholder="Optional eligibility details or exclusions" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Eligible countries <span className="font-normal text-[var(--text-secondary)]">(default: worldwide)</span></label>
                      <CountryMultiSelect value={form.countries} onChange={(countries) => setForm({ ...form, countries })} className={inputClass} />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Eligible devices <span className="font-normal text-[var(--text-secondary)]">(default: all)</span></label>
                        <div className="flex flex-wrap gap-3">
                          {DEVICES.map((device) => (
                            <label key={device.value} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                              <input
                                type="checkbox"
                                checked={form.devices.includes(device.value)}
                                onChange={(event) => setForm({
                                  ...form,
                                  devices: event.target.checked
                                    ? [...form.devices, device.value]
                                    : form.devices.filter((value) => value !== device.value),
                                })}
                              />
                              {device.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Operating system</label>
                        <input value={form.os} onChange={(event) => setForm({ ...form, os: event.target.value })} className={inputClass} placeholder="Optional, e.g. Android 10+" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-default)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className={labelClass}>Multi-step rewards</p>
                        <p className="text-xs text-[var(--text-secondary)]">Only add steps when the partner sends a separate event ID for each one.</p>
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, events: [...form.events, newEvent()] })} className="inline-flex items-center gap-1 rounded-md border border-[var(--border-strong)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]">
                        <Plus className="h-3 w-3" /> Add step
                      </button>
                    </div>
                    {form.events.length > 0 && (
                      <div className="space-y-3">
                        {form.events.map((item, index) => (
                          <div key={`${index}-${item.partner_event_id}`} className="grid gap-2 rounded-lg bg-[var(--surface-subtle)] p-3 sm:grid-cols-[1fr_1.2fr_150px_auto]">
                            <input required value={item.partner_event_id} onChange={(event) => updateEvent(index, { partner_event_id: event.target.value })} className={inputClass} placeholder="Partner event ID" />
                            <input required value={item.name} onChange={(event) => updateEvent(index, { name: event.target.value })} className={inputClass} placeholder="What members must do" />
                            <input required type="number" min="1" step="1" value={item.reward_nexcoins || ""} onChange={(event) => updateEvent(index, { reward_nexcoins: Number(event.target.value) })} className={inputClass} placeholder="NexCoins" />
                            <button type="button" aria-label="Remove event" onClick={() => setForm({ ...form, events: form.events.filter((_, eventIndex) => eventIndex !== index) })} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Total across steps: {formatCoins(totalReward)} NC</p>
                      </div>
                    )}
                  </div>
                </div>
              </details>

              <label className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] p-3">
                <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">Show this offer to eligible members</span>
                  <span className="block text-xs leading-5 text-[var(--text-secondary)]">Keep off until the partner callback is configured and a test has verified without awarding coins.</span>
                </span>
              </label>

              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-default)] pt-4">
                <button type="button" onClick={() => setForm(null)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border-strong)] px-4 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]">
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--brand-500)] px-4 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {form.id ? "Save changes" : "Create offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
