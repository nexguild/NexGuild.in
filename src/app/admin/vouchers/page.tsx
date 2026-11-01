"use client";

import { useEffect, useState } from "react";
import { Gift, CheckCircle, Loader2, Search, Pencil, X, Save, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface VoucherRequest {
  id: string;
  contributor_id: string;
  voucher_type: string;
  voucher_value: number | null;
  coins_spent: number;
  charged_coins: number | null;
  status: string;
  voucher_code: string | null;
  requested_at: string;
  delivered_at: string | null;
  refund_reason: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400",
  processing: "bg-blue-500/10 text-blue-400",
  delivered:  "bg-green-500/10 text-green-400",
  cancelled:  "bg-red-500/10 text-red-400",
};

const TABS = ["pending", "processing", "delivered", "cancelled"];

export default function VouchersPage() {
  const allowed = usePageGuard(ADMIN_ROLES.FINANCE);

  const [requests, setRequests] = useState<VoucherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [delivering, setDelivering] = useState<string | null>(null);
  const [deliverErrors, setDeliverErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    async function fetchRequests() {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/voucher-requests", {
        headers: session?.access_token ? { Authorization: "Bearer " + session.access_token } : {},
        /*
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      */
      });
      setLoadError(null);
      const data = await res.json().catch(() => ({})) as { requests?: VoucherRequest[]; error?: string };
      if (res.ok) {
        setRequests(data.requests ?? []);
      } else {
        setLoadError(data.error ?? "Unable to load voucher requests.");
      }
      setLoading(false);
    }
    fetchRequests().catch((error) => {
      console.error("[admin-vouchers] request loading failed:", error);
      setLoadError(error instanceof Error ? error.message : "Unable to load voucher requests.");
      setLoading(false);
    });
  }, []);

  async function markDelivered(req: VoucherRequest) {
    const code = codes[req.id]?.trim();
    if (!code) return;

    setDelivering(req.id);
    setDeliverErrors((prev) => { const next = { ...prev }; delete next[req.id]; return next; });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch("/api/admin/deliver-voucher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
        /*
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
        */
      },
      body: JSON.stringify({ requestId: req.id, voucherCode: code }),
    });

    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: "delivered", voucher_code: code, delivered_at: new Date().toISOString() }
            : r
        )
      );
    } else {
      const data = await res.json().catch(() => ({}));
      setDeliverErrors((prev) => ({ ...prev, [req.id]: data.error ?? "Failed to deliver voucher. Check server logs." }));
    }

    setDelivering(null);
  }

  function startEdit(req: VoucherRequest) {
    setEditingId(req.id);
    setEditCode(req.voucher_code ?? "");
    setUpdateError(null);
  }

  async function saveEditedCode(req: VoucherRequest) {
    if (!editCode.trim()) return;
    setUpdating(true);
    setUpdateError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch("/api/admin/update-voucher-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
        /*
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
        */
      },
      body: JSON.stringify({ requestId: req.id, voucherCode: editCode }),
    });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => r.id === req.id ? { ...r, voucher_code: editCode.trim() } : r)
      );
      setEditingId(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setUpdateError(data.error ?? "Update failed.");
    }
    setUpdating(false);
  }

  async function cancelAndRefund(req: VoucherRequest) {
    const reason = refundReason.trim();
    if (reason.length < 10 || reason.length > 500) return;

    setRefunding(true);
    setRefundError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/refund-voucher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: "Bearer " + session.access_token } : {}),
          /*
          ...(session?.access_token ? { Authorization: `****** } : {}),
        },
          */
        },
        body: JSON.stringify({ requestId: req.id, reason }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; refundAmount?: number };
      if (!res.ok) {
        setRefundError(data.error ?? "Failed to cancel and refund voucher.");
        return;
      }

      setRequests((prev) => prev.map((request) => request.id === req.id
        ? {
          ...request,
          status: "cancelled",
          refund_reason: reason,
          refund_amount: data.refundAmount ?? req.charged_coins,
          refunded_at: new Date().toISOString(),
        }
        : request
      ));
      setCancellingId(null);
      setRefundReason("");
    } catch (error) {
      console.error("[admin-vouchers] refund request failed:", error);
      setRefundError("Unable to reach the server. Please try again.");
    } finally {
      setRefunding(false);
    }
  }

  const filtered = requests.filter((r) => {
    const matchTab = r.status === activeTab;
    const term = search.toLowerCase();
    const matchSearch =
      search === "" ||
      r.profiles?.full_name?.toLowerCase().includes(term) ||
      r.profiles?.email?.toLowerCase().includes(term) ||
      r.voucher_type.toLowerCase().includes(term);
    return matchTab && matchSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const statusCounts = Object.fromEntries(TABS.map((status) => [
    status,
    requests.filter((request) => request.status === status).length,
  ]));

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Voucher Requests</h1>
          <p className="text-sm text-[var(--text-secondary)]">Manage and deliver contributor voucher redemptions.</p>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--brand-500)] text-white">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px capitalize transition-colors " +
              (activeTab === tab
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            {tab} <span className="ml-1 text-xs opacity-70">({statusCounts[tab] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] max-w-xs">
        <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contributor or voucher…"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />)}
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Could not load voucher requests: {loadError}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center">
          <Gift className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No {activeTab} requests</p>
          <p className="text-sm text-[var(--text-secondary)]">Voucher requests will appear here when contributors redeem coins.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)] truncate">{req.voucher_type}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                    {req.profiles?.full_name ?? "Unknown"} · {req.profiles?.email ?? "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {req.coins_spent.toLocaleString()} coins ·{" "}
                    {new Date(req.requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {req.delivered_at && (
                      <span> · Delivered {new Date(req.delivered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    )}
                  </p>
                  {req.charged_coins !== null && req.charged_coins !== req.coins_spent && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Actual charge: {req.charged_coins.toLocaleString()} coins
                    </p>
                  )}
                  {req.status === "cancelled" && (
                    <div className="mt-2 text-xs text-[var(--text-secondary)]">
                      <p>Refunded {req.refund_amount?.toLocaleString() ?? 0} coins{req.refunded_at ? " - " + new Date(req.refunded_at).toLocaleDateString("en-IN") : ""}</p>
                      {req.refund_reason && <p>Reason: {req.refund_reason}</p>}
                    </div>
                  )}
                  {req.voucher_code && editingId !== req.id && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs font-mono text-[var(--brand-500)]">Code: {req.voucher_code}</p>
                      {req.status === "delivered" && (
                        <button
                          onClick={() => startEdit(req)}
                          title="Edit code"
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                  {editingId === req.id && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          placeholder="Correct voucher code…"
                          className="flex-1 h-8 px-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                        />
                        <Button size="sm" disabled={updating || !editCode.trim()} onClick={() => saveEditedCode(req)}>
                          {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> Save</>}
                        </Button>
                        <button onClick={() => setEditingId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {updateError && <p className="text-xs text-red-400">{updateError}</p>}
                    </div>
                  )}
                </div>
                <span className={"text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 " + (STATUS_STYLES[req.status] ?? "")}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>

              {["pending", "processing"].includes(req.status) && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={codes[req.id] ?? ""}
                      onChange={(e) => setCodes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder="Enter voucher code…"
                      className="flex-1 h-9 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                    />
                    <Button size="sm" disabled={delivering === req.id || !codes[req.id]?.trim()}
                      onClick={() => markDelivered(req)}>
                      {delivering === req.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><CheckCircle className="h-4 w-4" /> Mark Delivered</>}
                    </Button>
                  </div>
                  {deliverErrors[req.id] && (
                    <p className="text-xs text-red-400">{deliverErrors[req.id]}</p>
                  )}
                  {req.charged_coins === null ? (
                    <p className="text-xs text-amber-400">
                      Automatic refund is unavailable: the exact charge was not recorded for this older request.
                    </p>
                  ) : cancellingId === req.id ? (
                    <div className="space-y-2 rounded-md border border-[var(--border-default)] p-3">
                      <label className="block text-xs text-[var(--text-secondary)]" htmlFor={"refund-reason-" + req.id}>
                        Refund reason (10–500 characters)
                      </label>
                      <textarea
                        id={"refund-reason-" + req.id}
                        value={refundReason}
                        onChange={(event) => setRefundReason(event.target.value)}
                        maxLength={500}
                        rows={2}
                        className="w-full rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          disabled={refunding || refundReason.trim().length < 10 || refundReason.trim().length > 500}
                          onClick={() => cancelAndRefund(req)}
                        >
                          {refunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Ban className="h-4 w-4" /> Cancel &amp; Refund</>}
                        </Button>
                        <button
                          type="button"
                          disabled={refunding}
                          onClick={() => { setCancellingId(null); setRefundError(null); setRefundReason(""); }}
                          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          Keep request
                        </button>
                      </div>
                      {refundError && <p className="text-xs text-red-400">{refundError}</p>}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={delivering === req.id}
                      onClick={() => { setCancellingId(req.id); setRefundError(null); setRefundReason(""); }}
                    >
                      <Ban className="h-4 w-4" /> Cancel &amp; Refund
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
