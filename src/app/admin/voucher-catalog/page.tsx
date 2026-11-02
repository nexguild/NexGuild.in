"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Package, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { getVoucherCategoryEmoji, VOUCHER_CATEGORIES } from "@/lib/voucher-categories";
import { DEFAULT_VOUCHER_HOW_TO_USE, DEFAULT_VOUCHER_TERMS } from "@/lib/voucher-guidance";
import { getVoucherDiscountedCoins } from "@/lib/voucher-pricing";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  VOUCHER_CATEGORIES.map((category) => [category.value, category.label]),
);

interface DbVoucher {
  id: string;
  brand_name: string;
  description: string;
  value_inr: number | null;
  coins_required: number;
  discount_percent: number;
  category: string;
  emoji: string;
  how_to_use: string[];
  terms_and_conditions: string[];
  is_available: boolean;
  created_at: string;
}

function fmtPrice(v: DbVoucher): string {
  if (v.value_inr && v.value_inr > 0) return `₹${v.value_inr}`;
  return "—";
}

type DenominationForm = {
  id?: string;
  value_inr: string;
  coins_required: string;
  discount_percent: string;
  coins_overridden: boolean;
  is_available: boolean;
};

type FormState = {
  brand_name: string;
  description: string;
  denominations: DenominationForm[];
  category: string;
};

type GuidanceText = {
  how_to_use: string;
  terms_and_conditions: string;
};

function parseGuidanceText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line
      .trim()
      .replace(/^(?:(?:\d+|[a-z])[.)]\s+|[-*•▪‣]\s+)/i, "")
      .trim())
    .filter(Boolean);
}

const EMPTY_FORM: FormState = {
  brand_name: "",
  description: "",
  denominations: [{ value_inr: "", coins_required: "", discount_percent: "0", coins_overridden: false, is_available: true }],
  category: "shopping",
};

const EMPTY_GUIDANCE_TEXT: GuidanceText = {
  how_to_use: DEFAULT_VOUCHER_HOW_TO_USE.join("\n"),
  terms_and_conditions: DEFAULT_VOUCHER_TERMS.join("\n"),
};

export default function VoucherCatalogPage() {
  const allowed = usePageGuard(ADMIN_ROLES.FINANCE);
  const tokenRef = useRef<string | null>(null);

  const [vouchers, setVouchers]   = useState<DbVoucher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  // Exchange rates for auto-pricing
  const [nexcoinPerInr, setNexcoinPerInr] = useState(12.5);

  // Add / Edit modal
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [guidanceText, setGuidanceText] = useState<GuidanceText>(EMPTY_GUIDANCE_TEXT);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState<string | null>(null);
  const [saveOk, setSaveOk]         = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<DbVoucher | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      await Promise.all([
        fetchVouchers(session?.access_token ?? ""),
        fetchRates(session?.access_token ?? ""),
      ]);
    }
    load();
  }, []);

  async function fetchRates(token: string) {
    const res = await fetch("/api/admin/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json() as { nexcoinPerInr?: number };
      if (data.nexcoinPerInr) setNexcoinPerInr(data.nexcoinPerInr);
    }
  }

  async function fetchVouchers(token: string) {
    const res  = await fetch("/api/admin/voucher-catalog", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as { vouchers?: DbVoucher[]; error?: string };
    if (!res.ok) {
      const message = data.error ?? "Could not load the voucher catalog.";
      console.error("[voucher-catalog] load failed:", message);
      setLoadError(message);
      setLoading(false);
      return;
    }
    setVouchers(data.vouchers ?? []);
    setLoading(false);
  }

  async function callApi(body: Record<string, unknown>) {
    return fetch("/api/admin/voucher-catalog", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify(body),
    });
  }

  function calcCoins(inr: string): string {
    const inrVal = parseFloat(inr);
    if (!isNaN(inrVal) && inrVal > 0) return String(Math.round(inrVal * nexcoinPerInr));
    return "";
  }

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setGuidanceText(EMPTY_GUIDANCE_TEXT);
    setFormErr(null);
    setSaveOk(false);
    setShowForm(true);
  }

  function openEdit(v: DbVoucher) {
    const brandDenominations = vouchers
      .filter((voucher) => voucher.brand_name === v.brand_name)
      .sort((a, b) => (a.value_inr ?? 0) - (b.value_inr ?? 0));
    setEditId(v.id);
    setForm({
      brand_name:       v.brand_name,
      description:      v.description,
      denominations: brandDenominations.map((denomination) => ({
        id: denomination.id,
        value_inr: denomination.value_inr && denomination.value_inr > 0 ? String(denomination.value_inr) : "",
        coins_required: String(denomination.coins_required),
        discount_percent: String(denomination.discount_percent ?? 0),
        coins_overridden: true,
        is_available: denomination.is_available,
      })),
      category:         v.category,
    });
    setGuidanceText({
      how_to_use: (v.how_to_use?.length ? v.how_to_use : DEFAULT_VOUCHER_HOW_TO_USE).join("\n"),
      terms_and_conditions: (v.terms_and_conditions?.length ? v.terms_and_conditions : DEFAULT_VOUCHER_TERMS).join("\n"),
    });
    setFormErr(null);
    setSaveOk(false);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);

    if (!form.brand_name.trim())    { setFormErr("Brand name is required."); return; }
    if (form.denominations.length === 0) { setFormErr("Add at least one voucher denomination."); return; }
    const denominations = form.denominations.map((denomination) => ({
      value_inr: Number(denomination.value_inr),
      coins_required: Number(denomination.coins_required),
      discount_percent: Number(denomination.discount_percent),
      is_available: denomination.is_available,
    }));
    if (denominations.some(({ value_inr }) => !Number.isSafeInteger(value_inr) || value_inr <= 0)) {
      setFormErr("Enter a valid whole-number value in INR for every denomination."); return;
    }
    if (denominations.some(({ coins_required }) => !Number.isSafeInteger(coins_required) || coins_required <= 0)) {
      setFormErr("NexCoins required must be a positive whole number for every denomination."); return;
    }
    if (denominations.some(({ discount_percent }) => !Number.isSafeInteger(discount_percent) || discount_percent < 0 || discount_percent > 99)) {
      setFormErr("Discount must be a whole percentage from 0 to 99 for every denomination."); return;
    }
    if (denominations.some(({ coins_required, discount_percent }) => discount_percent > 0
      && getVoucherDiscountedCoins(coins_required, discount_percent) >= coins_required)) {
      setFormErr("The selected discount must reduce the NexCoins price by at least 1 coin."); return;
    }
    const howToUse = parseGuidanceText(guidanceText.how_to_use);
    const terms = parseGuidanceText(guidanceText.terms_and_conditions);
    if ([howToUse, terms].some((items) => items.length > 100 || items.some((item) => item.length > 2000))) {
      setFormErr("Each section can contain up to 100 lines, with a maximum of 2,000 characters per line."); return;
    }
    if (new Set(denominations.map(({ value_inr }) => value_inr)).size !== denominations.length) {
      setFormErr("Each denomination value must be unique."); return;
    }
    setSaving(true);
    const base = {
      brand_name:     form.brand_name,
      description:    form.description,
      category:       form.category,
      how_to_use: howToUse,
      terms_and_conditions: terms,
      country_codes:  ["IN"],
    };
    const body = editId
      ? {
          action: "update-denominations",
          id: editId,
          ...base,
          denominations: form.denominations.map((denomination, index) => ({
            ...denominations[index],
            ...(denomination.id ? { id: denomination.id } : {}),
          })),
        }
      : { action: "create", ...base, denominations };

    const res  = await callApi(body);
    const data = await res.json() as { voucher?: DbVoucher; vouchers?: DbVoucher[]; error?: string };

    if (!res.ok || data.error) {
      setFormErr(data.error ?? "Save failed.");
    } else {
      setSaveOk(true);
      if (editId) {
        const updatedVouchers = data.vouchers ?? (data.voucher ? [data.voucher] : []);
        const updatedIds = new Set(updatedVouchers.map((voucher) => voucher.id));
        setVouchers((prev) => [
          ...prev.filter((voucher) => !updatedIds.has(voucher.id)),
          ...updatedVouchers,
        ].sort((a, b) =>
          a.brand_name.localeCompare(b.brand_name) || ((a.value_inr ?? 0) - (b.value_inr ?? 0))
        ));
      } else {
        const createdVouchers = data.vouchers ?? (data.voucher ? [data.voucher] : []);
        setVouchers((prev) => [...prev, ...createdVouchers].sort((a, b) =>
          a.brand_name.localeCompare(b.brand_name) || ((a.value_inr ?? 0) - (b.value_inr ?? 0))
        ));
      }
      setTimeout(() => setShowForm(false), 800);
    }
    setSaving(false);
  }

  async function handleToggle(v: DbVoucher) {
    setToggling(v.id);
    const next = !v.is_available;
    setVouchers((prev) => prev.map((x) => x.id === v.id ? { ...x, is_available: next } : x));
    await callApi({ action: "toggle", id: v.id, is_available: next });
    setToggling(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    const res = await callApi({ action: "delete", id: deleteTarget.id });
    if (res.ok) {
      setVouchers((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    }
    setDeleting(null);
    setDeleteTarget(null);
  }

  function setField(k: keyof FormState, val: string) {
    setForm((prev) => {
      const next = { ...prev, [k]: val };
      return next;
    });
  }

  function setDenominationField(index: number, field: "value_inr" | "coins_required" | "discount_percent", value: string) {
    setForm((prev) => ({
      ...prev,
      denominations: prev.denominations.map((denomination, denominationIndex) => {
        if (denominationIndex !== index) return denomination;
        if (field === "discount_percent") return { ...denomination, discount_percent: value };
        if (field === "coins_required") {
          return { ...denomination, coins_required: value, coins_overridden: true };
        }
        return {
          ...denomination,
          value_inr: value,
          coins_required: denomination.coins_overridden ? denomination.coins_required : calcCoins(value),
        };
      }),
    }));
  }

  function toggleDenominationAvailability(index: number) {
    setForm((prev) => ({
      ...prev,
      denominations: prev.denominations.map((denomination, denominationIndex) => denominationIndex === index
        ? { ...denomination, is_available: !denomination.is_available }
        : denomination),
    }));
  }

  function addDenomination() {
    setForm((prev) => prev.denominations.length >= 20
      ? prev
      : { ...prev, denominations: [...prev.denominations, { value_inr: "", coins_required: "", discount_percent: "0", coins_overridden: false, is_available: true }] });
  }

  function removeDenomination(index: number) {
    setForm((prev) => prev.denominations.length <= 1
      ? prev
      : { ...prev, denominations: prev.denominations.filter((_, denominationIndex) => denominationIndex !== index) });
  }

  function resetDenominationCoins(index: number) {
    setForm((prev) => ({
      ...prev,
      denominations: prev.denominations.map((denomination, denominationIndex) => denominationIndex === index
        ? { ...denomination, coins_required: calcCoins(denomination.value_inr), coins_overridden: false }
        : denomination),
    }));
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Voucher Catalog</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage INR gift vouchers available to contributors in India.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Voucher
        </Button>
      </div>

      {/* Stats row */}
      {loadError && (
        <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Could not load the catalog: {loadError}. Ensure the latest voucher catalog migrations, including migrations_v46.sql, have been applied.
        </p>
      )}
      <div className="flex items-center gap-4 flex-wrap text-sm text-[var(--text-muted)]">
        <span>{vouchers.length} total</span>
        <span>·</span>
        <span className="text-green-400">{vouchers.filter((v) => v.is_available).length} in stock</span>
        <span>·</span>
        <span className="text-red-400">{vouchers.filter((v) => !v.is_available).length} sold out</span>
      </div>
      <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        This catalog is for India-only INR vouchers. Add products only when you have confirmed a purchase source and can fulfill contributor redemptions.
      </p>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-20 flex flex-col items-center gap-3 text-center">
          <Package className="h-12 w-12 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No vouchers yet</p>
          <p className="text-sm text-[var(--text-secondary)]">Add only Indian vouchers that you can purchase and reliably deliver.</p>
          <Button className="mt-2" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Add First Voucher</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["", "Brand", "Description", "Value", "NexCoins", "Category", "Countries", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                  <td className="px-4 py-3 text-xl w-10">{v.emoji}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)] whitespace-nowrap">{v.brand_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px] truncate">{v.description || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{fmtPrice(v)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-[var(--brand-500)]">{getVoucherDiscountedCoins(v.coins_required, v.discount_percent).toLocaleString()}</span>
                    {v.discount_percent > 0 && (
                      <span className="ml-2 text-xs text-[var(--text-muted)] line-through">{v.coins_required.toLocaleString()}</span>
                    )}
                    {v.discount_percent > 0 && <span className="ml-2 text-xs font-semibold text-emerald-500">{v.discount_percent}% off</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] capitalize">
                      {CATEGORY_LABELS[v.category] ?? v.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    India
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      v.is_available
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {v.is_available ? "In Stock" : "Sold Out"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(v)}
                        disabled={toggling === v.id}
                        title={v.is_available ? "Mark sold out" : "Mark in stock"}
                        className="text-[var(--text-muted)] hover:text-[var(--brand-500)] transition-colors disabled:opacity-50"
                      >
                        {v.is_available
                          ? <ToggleRight className="h-5 w-5 text-[var(--brand-500)]" />
                          : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deleting === v.id}
                        onClick={() => setDeleteTarget(v)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {editId ? "Edit Voucher" : "Add Voucher"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {saveOk ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">{editId ? "Voucher updated!" : "Voucher added!"}</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={form.brand_name}
                    onChange={(e) => setField("brand_name", e.target.value)}
                    placeholder="e.g. Amazon"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="e.g. ₹100 Amazon India gift voucher"
                    maxLength={200}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-primary)]">Voucher denominations</label>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">Availability is set separately for each value.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addDenomination}
                      disabled={form.denominations.length >= 20}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-500)] hover:underline disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add denomination
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.denominations.map((denomination, index) => (
                      <div key={`denomination-${index}`} className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border-default)] p-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Value in ₹ (INR) *</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={denomination.value_inr}
                            onChange={(event) => setDenominationField(index, "value_inr", event.target.value)}
                            placeholder="100"
                            aria-label={`Denomination ${index + 1} value in INR`}
                            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">Discount %</label>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="1"
                            required
                            value={denomination.discount_percent}
                            onChange={(event) => setDenominationField(index, "discount_percent", event.target.value)}
                            aria-label={`Denomination ${index + 1} discount percentage`}
                            className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                          />
                        </div>
                        <div>
                          <div className="mb-1.5 flex min-h-[18px] items-center justify-between gap-2">
                            <label className="block text-xs font-medium text-[var(--text-primary)]">Base NexCoins *</label>
                            {denomination.coins_overridden ? (
                              <button
                                type="button"
                                onClick={() => resetDenominationCoins(index)}
                                className="text-[10px] text-[var(--text-muted)] hover:text-[var(--brand-500)] underline"
                              >
                                Reset
                              </button>
                            ) : (
                              <span className="text-[10px] text-[var(--brand-500)]">Auto</span>
                            )}
                          </div>
                          <input
                            type="number"
                            required
                            min="1"
                            value={denomination.coins_required}
                            onChange={(event) => setDenominationField(index, "coins_required", event.target.value)}
                            placeholder={calcCoins(denomination.value_inr) || "1250"}
                            aria-label={`Denomination ${index + 1} NexCoins required`}
                            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                          />
                          {Number(denomination.coins_required) > 0 && Number(denomination.discount_percent) > 0 ? (
                            <p className="mt-1.5 min-h-6 text-[10px] font-medium leading-3 text-emerald-500">
                              Sale price: {getVoucherDiscountedCoins(
                                Number(denomination.coins_required),
                                Number(denomination.discount_percent),
                              ).toLocaleString()} NexCoins
                            </p>
                          ) : <p className="mt-1.5 min-h-6" aria-hidden="true" />}
                        </div>
                        <div className="flex items-start gap-2 sm:pt-6">
                          <button
                            type="button"
                            onClick={() => toggleDenominationAvailability(index)}
                            aria-label={`Mark denomination ${index + 1} ${denomination.is_available ? "out of stock" : "in stock"}`}
                            aria-pressed={denomination.is_available}
                            className={`flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition-colors ${
                              denomination.is_available
                                ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            }`}
                          >
                            {denomination.is_available ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            {denomination.is_available ? "In stock" : "Out of stock"}
                          </button>
                          {(!editId || !denomination.id) && (
                            <button
                              type="button"
                              onClick={() => removeDenomination(index)}
                              disabled={form.denominations.length <= 1}
                              aria-label={`Remove denomination ${index + 1}`}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Rate: ₹1 = {nexcoinPerInr} coins
                    {" "}(set in <span className="text-[var(--brand-500)]">Settings → Exchange Rates</span>)
                  </p>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                    >
                      {VOUCHER_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Category icon</label>
                    <div className="flex h-10 w-14 items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xl" aria-label="Icon selected automatically from category">
                      {getVoucherCategoryEmoji(form.category)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="voucher-how-to-use" className="block text-xs font-medium text-[var(--text-primary)]">How to use</label>
                  <textarea
                    id="voucher-how-to-use"
                    value={guidanceText.how_to_use}
                    onChange={(event) => setGuidanceText((current) => ({ ...current, how_to_use: event.target.value }))}
                    rows={5}
                    aria-label="How to use instructions"
                    placeholder={"Paste instructions here, one step per line.\nNumbered and bulleted lists are formatted automatically."}
                    className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    {parseGuidanceText(guidanceText.how_to_use).length} steps · paste numbered or bulleted text; list markers are cleaned automatically.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="voucher-terms" className="block text-xs font-medium text-[var(--text-primary)]">Terms &amp; Conditions</label>
                  <textarea
                    id="voucher-terms"
                    value={guidanceText.terms_and_conditions}
                    onChange={(event) => setGuidanceText((current) => ({ ...current, terms_and_conditions: event.target.value }))}
                    rows={6}
                    aria-label="Terms and conditions"
                    placeholder={"Paste terms and conditions here, one item per line.\nNumbered and bulleted lists are formatted automatically."}
                    className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    {parseGuidanceText(guidanceText.terms_and_conditions).length} items · paste numbered or bulleted text; list markers are cleaned automatically.
                  </p>
                </div>

                {formErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{formErr}</p>}

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Save Changes" : "Add Voucher"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Delete Voucher</p>
                <p className="text-xs text-[var(--text-muted)]">This cannot be undone.</p>
              </div>
            </div>
            <div className="rounded-lg bg-[var(--surface-subtle)] p-3 mb-5 text-sm text-[var(--text-secondary)]">
              {deleteTarget.emoji} {deleteTarget.brand_name} · {fmtPrice(deleteTarget)} · {deleteTarget.coins_required.toLocaleString()} coins
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={deleting === deleteTarget.id} onClick={handleDelete}>
                {deleting === deleteTarget.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
