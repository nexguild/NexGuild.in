"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Search, Eye, Ban, Coins, Loader2, X, CheckCircle2, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Contributor {
  id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  status: string;
  nexcoins: number;
  joined_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-500/10 text-green-400",
  suspended: "bg-yellow-500/10 text-yellow-400",
  banned:    "bg-red-500/10 text-red-400",
};

export default function ContributorsPage() {
  const tokenRef = useRef<string | null>(null);

  const allowed = usePageGuard(ADMIN_ROLES.USERS);

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Ban modal
  const [banTarget, setBanTarget]   = useState<Contributor | null>(null);
  const [banReason, setBanReason]   = useState("");
  const [banning, setBanning]       = useState(false);
  const [banErr, setBanErr]         = useState<string | null>(null);

  // Send / Deduct Coins modal
  const [sendTarget, setSendTarget]   = useState<Contributor | null>(null);
  const [sendMode, setSendMode]       = useState<"send" | "deduct">("send");
  const [sendAmount, setSendAmount]   = useState("");
  const [sendReason, setSendReason]   = useState("");
  const [sending, setSending]         = useState(false);
  const [sendErr, setSendErr]         = useState<string | null>(null);
  const [sendOk, setSendOk]           = useState(false);
  const [sentAmount, setSentAmount]   = useState(0);

  useEffect(() => {
    async function fetchContributors() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      const res = await fetch("/api/admin/contributors", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        const { contributors: data } = await res.json() as { contributors: Contributor[] };
        setContributors(data ?? []);
      }
      setLoading(false);
    }
    fetchContributors();
  }, []);

  function openBan(c: Contributor) {
    setBanTarget(c);
    setBanReason("");
    setBanErr(null);
  }

  async function handleBan(e: React.FormEvent) {
    e.preventDefault();
    if (!banTarget) return;
    const isBanning = banTarget.status !== "banned";
    if (isBanning && !banReason.trim()) { setBanErr("A reason is required to ban a user."); return; }
    setBanning(true);
    setBanErr(null);

    const newStatus = isBanning ? "banned" : "active";
    const res = await fetch("/api/admin/contributors", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({
        contributorId: banTarget.id,
        status: newStatus,
        reason: isBanning ? banReason.trim() : undefined,
      }),
    });

    if (res.ok) {
      setContributors((prev) =>
        prev.map((c) => c.id === banTarget!.id ? { ...c, status: newStatus } : c)
      );
      setBanTarget(null);
    } else {
      const data = await res.json();
      setBanErr(data.error ?? "Failed to update status.");
    }
    setBanning(false);
  }

  function openSendCoins(c: Contributor, mode: "send" | "deduct" = "send") {
    setSendTarget(c);
    setSendMode(mode);
    setSendAmount("");
    setSendReason("");
    setSendErr(null);
    setSendOk(false);
  }

  async function handleSendCoins(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(sendAmount, 10);
    if (!sendTarget || isNaN(amount) || amount <= 0) {
      setSendErr("Enter a valid positive amount.");
      return;
    }
    setSending(true);
    setSendErr(null);

    try {
      const endpoint = sendMode === "send" ? "/api/admin/send-coins" : "/api/admin/deduct-coins";
      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body:    JSON.stringify({ contributorId: sendTarget.id, amount, reason: sendReason.trim() || undefined }),
      });
      const data = await res.json() as { error?: string; newBalance?: number; amountDeducted?: number };
      if (!res.ok) {
        setSendErr(data.error ?? `Failed to ${sendMode === "send" ? "send" : "deduct"} coins.`);
      } else {
        setSentAmount(sendMode === "deduct" ? (data.amountDeducted ?? amount) : amount);
        setSendOk(true);
        setContributors((prev) =>
          prev.map((c) => c.id === sendTarget.id ? { ...c, nexcoins: data.newBalance ?? c.nexcoins } : c)
        );
      }
    } catch {
      setSendErr("Network error. Please try again.");
    }
    setSending(false);
  }

  const filtered = contributors.filter((c) => {
    const matchSearch =
      search === "" ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "All" || c.status === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contributors</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage all registered contributor accounts.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] flex-1 min-w-[200px] max-w-xs">
          <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
        >
          {["All", "Active", "Suspended", "Banned"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center">
          <Users className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">
            {contributors.length === 0 ? "No contributors yet" : "No results found"}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {contributors.length === 0
              ? "Contributors will appear here after they sign up."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] overflow-x-auto">
          <table className="w-full text-sm min-w-[740px]">
            <thead>
              <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                {["Name", "Email", "Country", "NexCoins", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)] whitespace-nowrap">
                    {c.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{c.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5 text-[var(--brand-500)]" />
                      <span className="text-[var(--brand-500)] font-medium">{(c.nexcoins ?? 0).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
                      {c.status ?? "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                    {c.joined_at
                      ? new Date(c.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" asChild>
                        <a href={`/admin/contributors/${c.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </a>
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openSendCoins(c, "send")}
                        className="text-[var(--brand-500)] border-[var(--brand-500)]/30 hover:bg-[var(--brand-500)]/10">
                        <Coins className="h-3.5 w-3.5" /> Send
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => openSendCoins(c, "deduct")}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                        <Minus className="h-3.5 w-3.5" /> Deduct
                      </Button>
                      <Button
                        variant={c.status === "banned" ? "secondary" : "destructive"}
                        size="sm"
                        onClick={() => openBan(c)}
                      >
                        <Ban className="h-3.5 w-3.5" />
                        {c.status === "banned" ? "Unban" : "Ban"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Ban Modal ────────────────────────────────────────────────── */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {banTarget.status === "banned" ? "Unban" : "Ban"} User
                </h2>
              </div>
              <button onClick={() => setBanTarget(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {banTarget.status === "banned"
                ? `Restore access for ${banTarget.full_name ?? banTarget.email}?`
                : `You are about to ban ${banTarget.full_name ?? banTarget.email}. They will be signed out and notified by email.`}
            </p>

            <form onSubmit={handleBan} className="space-y-4">
              {banTarget.status !== "banned" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Reason for ban <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this account is being suspended…"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
                  />
                </div>
              )}

              {banErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{banErr}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setBanTarget(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={banning}
                  className={`flex-1 ${banTarget.status !== "banned" ? "bg-red-500 hover:bg-red-400 border-0" : ""}`}
                >
                  {banning
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : banTarget.status === "banned" ? "Unban" : "Ban User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Send Coins Modal ─────────────────────────────────────────── */}
      {sendTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[var(--brand-500)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">NexCoins</h2>
              </div>
              <button onClick={() => setSendTarget(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sendOk ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">
                  {sentAmount.toLocaleString()} coins {sendMode === "send" ? "sent!" : "deducted."}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {sendTarget.full_name ?? sendTarget.email} has been notified.
                </p>
                <Button className="w-full mt-2" onClick={() => setSendTarget(null)}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleSendCoins} className="space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(["send", "deduct"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setSendMode(m)}
                      className={`flex-1 py-2 rounded-lg text-sm border font-medium transition-colors ${
                        sendMode === m
                          ? m === "send" ? "bg-[var(--brand-500)] text-white border-[var(--brand-500)]" : "bg-red-500 text-white border-red-500"
                          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-500)]"
                      }`}>
                      {m === "send" ? "Send Coins" : "Deduct Coins"}
                    </button>
                  ))}
                </div>
                {/* Recipient */}
                <div className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--brand-500)]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-[var(--brand-500)]">
                      {(sendTarget.full_name ?? sendTarget.email ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{sendTarget.full_name ?? "—"}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{sendTarget.email} · {(sendTarget.nexcoins ?? 0).toLocaleString()} coins</p>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Amount <span className="text-[var(--text-muted)] font-normal">(NexCoins)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Reason <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={sendReason}
                    onChange={(e) => setSendReason(e.target.value)}
                    placeholder="e.g. Top contributor bonus"
                    maxLength={200}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                </div>

                {sendErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{sendErr}</p>}

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setSendTarget(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sending}
                    className={`flex-1 ${sendMode === "deduct" ? "bg-red-500 hover:bg-red-400 border-0" : ""}`}>
                    {sending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : sendMode === "send" ? <><Coins className="h-4 w-4 mr-1" />Send Coins</> : <><Minus className="h-4 w-4 mr-1" />Deduct Coins</>}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
