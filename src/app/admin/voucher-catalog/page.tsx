"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Package, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface DbVoucher {
  id: string;
  brand_name: string;
  description: string;
  value_inr: number;
  coins_required: number;
  category: string;
  emoji: string;
  is_available: boolean;
  created_at: string;
}

type FormState = {
  brand_name: string;
  description: string;
  value_inr: string;
  coins_required: string;
  category: string;
  emoji: string;
};

const EMPTY_FORM: FormState = {
  brand_name: "", description: "", value_inr: "", coins_required: "", category: "shopping", emoji: "🎁",
};

const CATEGORIES = ["shopping", "apps", "food", "other"];

const CATEGORY_LABELS: Record<string, string> = {
  shopping: "Shopping", apps: "Apps", food: "Food", other: "Other",
};

export default function VoucherCatalogPage() {
  const tokenRef = useRef<string | null>(null);

  const allowed = usePageGuard(ADMIN_ROLES.FINANCE);

  const [vouchers, setVouchers]   = useState<DbVoucher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  // Add / Edit modal
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState<string | null>(null);
  const [saveOk, setSaveOk]         = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<DbVoucher | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      await fetchVouchers(session?.access_token ?? "");
    }
    load();
  }, []);

  async function fetchVouchers(token: string) {
    const res  = await fetch("/api/admin/voucher-catalog", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json() as { vouchers?: DbVoucher[] };
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

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setFormErr(null);
    setSaveOk(false);
    setShowForm(true);
  }

  function openEdit(v: DbVoucher) {
    setEditId(v.id);
    setForm({
      brand_name:     v.brand_name,
      description:    v.description,
      value_inr:      String(v.value_inr),
      coins_required: String(v.coins_required),
      category:       v.category,
      emoji:          v.emoji,
    });
    setFormErr(null);
    setSaveOk(false);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);

    const val   = parseInt(form.value_inr, 10);
    const coins = parseInt(form.coins_required, 10);
    if (!form.brand_name.trim())         { setFormErr("Brand name is required."); return; }
    if (isNaN(val) || val <= 0)          { setFormErr("Enter a valid value (₹)."); return; }
    if (isNaN(coins) || coins <= 0)      { setFormErr("Enter valid coins required."); return; }

    setSaving(true);
    const body = editId
      ? { action: "update", id: editId, ...form, value_inr: val, coins_required: coins }
      : { action: "create", ...form, value_inr: val, coins_required: coins };

    const res  = await callApi(body);
    const data = await res.json() as { voucher?: DbVoucher; error?: string };

    if (!res.ok || data.error) {
      setFormErr(data.error ?? "Save failed.");
    } else {
      setSaveOk(true);
      if (editId) {
        setVouchers((prev) => prev.map((v) => v.id === editId ? data.voucher! : v));
      } else {
        setVouchers((prev) => [...prev, data.voucher!].sort((a, b) =>
          a.brand_name.localeCompare(b.brand_name) || a.value_inr - b.value_inr
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
    setForm((prev) => ({ ...prev, [k]: val }));
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Voucher Catalog</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage vouchers shown in the contributor store.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1.5" /> Add Voucher
        </Button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap text-sm text-[var(--text-muted)]">
        <span>{vouchers.length} total</span>
        <span>·</span>
        <span className="text-green-400">{vouchers.filter((v) => v.is_available).length} in stock</span>
        <span>·</span>
        <span className="text-red-400">{vouchers.filter((v) => !v.is_available).length} sold out</span>
      </div>

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
          <p className="text-sm text-[var(--text-secondary)]">Add vouchers using the button above — they will appear in the contributor store.</p>
          <Button className="mt-2" onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Add First Voucher</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["", "Brand", "Description", "₹ Value", "Coins", "Category", "Status", "Actions"].map((h) => (
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
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">₹{v.value_inr}</td>
                  <td className="px-4 py-3 text-[var(--brand-500)] font-medium">{v.coins_required.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] capitalize">
                      {CATEGORY_LABELS[v.category] ?? v.category}
                    </span>
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
          <div className="w-full max-w-md bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
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
                {/* Emoji + Brand row */}
                <div className="flex gap-3">
                  <div className="w-20 flex-shrink-0">
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Emoji</label>
                    <input
                      type="text"
                      value={form.emoji}
                      onChange={(e) => setField("emoji", e.target.value)}
                      maxLength={4}
                      className="w-full h-10 px-2 text-center text-xl rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                    />
                  </div>
                  <div className="flex-1">
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

                {/* Value + Coins row */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Value (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.value_inr}
                      onChange={(e) => setField("value_inr", e.target.value)}
                      placeholder="100"
                      className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Coins Required *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={form.coins_required}
                      onChange={(e) => setField("coins_required", e.target.value)}
                      placeholder="1000"
                      className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
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
              {deleteTarget.emoji} {deleteTarget.brand_name} · ₹{deleteTarget.value_inr} · {deleteTarget.coins_required.toLocaleString()} coins
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
