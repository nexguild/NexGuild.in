"use client";

import { useEffect, useState } from "react";
import { Gift, CheckCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface VoucherRequest {
  id: string;
  contributor_id: string;
  voucher_type: string;
  voucher_value: number | null;
  coins_spent: number;
  status: string;
  voucher_code: string | null;
  requested_at: string;
  delivered_at: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400",
  processing: "bg-blue-500/10 text-blue-400",
  delivered:  "bg-green-500/10 text-green-400",
};

const TABS = ["pending", "processing", "delivered"];

export default function VouchersPage() {
  const [requests, setRequests] = useState<VoucherRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [delivering, setDelivering] = useState<string | null>(null);
  const [deliverErrors, setDeliverErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchRequests() {
      const { data } = await supabase
        .from("voucher_requests")
        .select("id, contributor_id, voucher_type, voucher_value, coins_spent, status, voucher_code, requested_at, delivered_at, profiles(full_name, email)")
        .order("requested_at", { ascending: false });
      setRequests((data as unknown as VoucherRequest[]) ?? []);
      setLoading(false);
    }
    fetchRequests();
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px capitalize transition-colors ${
              activeTab === tab
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>
            {tab}
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
                  {req.voucher_code && (
                    <p className="text-xs font-mono text-[var(--brand-500)] mt-1">Code: {req.voucher_code}</p>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[req.status] ?? ""}`}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>

              {req.status !== "delivered" && (
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
