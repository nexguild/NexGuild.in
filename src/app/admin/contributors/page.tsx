"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Search, Eye, Ban, Coins, Loader2, X, CheckCircle2, Minus, Copy, CheckCheck, Trash2, AlertTriangle } from "lucide-react";
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
  is_active: boolean | null;
  device_fingerprint: string | null;
  last_seen_ip: string | null;
  ip_vpn_detected: boolean | null;
  ip_fraud_score: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  active:      "bg-green-500/10 text-green-400",
  suspended:   "bg-yellow-500/10 text-yellow-400",
  banned:      "bg-red-500/10 text-red-400",
  deactivated: "bg-stone-500/10 text-stone-400",
};

export default function ContributorsPage() {
  const tokenRef = useRef<string | null>(null);

  const allowed = usePageGuard(ADMIN_ROLES.USERS);

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  // Ban modal
  const [banTarget, setBanTarget]   = useState<Contributor | null>(null);
  const [banReason, setBanReason]   = useState("");
  const [banning, setBanning]       = useState(false);
  const [banErr, setBanErr]         = useState<string | null>(null);

  // Reactivate
  const [reactivating, setReactivating] = useState<string | null>(null);

  // Send / Deduct Coins modal
  const [sendTarget, setSendTarget]   = useState<Contributor | null>(null);
  const [sendMode, setSendMode]       = useState<"send" | "deduct">("send");
  const [sendAmount, setSendAmount]   = useState("");
  const [sendReason, setSendReason]   = useState("");
  const [sending, setSending]         = useState(false);
  const [sendErr, setSendErr]         = useState<string | null>(null);
  const [sendOk, setSendOk]           = useState(false);
  const [sentAmount, setSentAmount]   = useState(0);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Contributor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting]         = useState(false);
  const [deleteErr, setDeleteErr]       = useState<string | null>(null);

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

  async function handleReactivate(c: Contributor) {
    if (!confirm(`Reactivate account for "${c.full_name ?? c.email}"? They will be able to log in again.`)) return;
    setReactivating(c.id);
    const res = await fetch("/api/admin/contributors", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ contributorId: c.id, is_active: true }),
    });
    if (res.ok) {
      setContributors((prev) =>
        prev.map((co) => co.id === c.id ? { ...co, is_active: true } : co)
      );
    }
    setReactivating(null);
  }

  function openDelete(c: Contributor) {
    setDeleteTarget(c);
    setDeleteConfirm("");
    setDeleteErr(null);
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    if (deleteConfirm !== "DELETE") { setDeleteErr('Type DELETE to confirm.'); return; }
    setDeleting(true);
    setDeleteErr(null);

    const res = await fetch(`/api/admin/contributors?id=${deleteTarget.id}`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });

    if (res.ok) {
      setContributors((prev) => prev.filter((c) => c.id !== deleteTarget!.id));
      setDeleteTarget(null);
    } else {
      const data = await res.json();
      setDeleteErr(data.error ?? "Failed to delete user.");
    }
    setDeleting(false);
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

  // Build shared fingerprint / IP maps
  const fpMap  = new Map<string, Contributor[]>();
  const ipMap  = new Map<string, Contributor[]>();
  for (const c of contributors) {
    if (c.device_fingerprint) {
      const existing = fpMap.get(c.device_fingerprint) ?? [];
      fpMap.set(c.device_fingerprint, [...existing, c]);
    }
    if (c.last_seen_ip) {
      const existing = ipMap.get(c.last_seen_ip) ?? [];
      ipMap.set(c.last_seen_ip, [...existing, c]);
    }
  }
  // Only keep groups with 2+ accounts
  const sharedFp = new Map([...fpMap].filter(([, v]) => v.length >= 2));
  const sharedIp = new Map([...ipMap].filter(([, v]) => v.length >= 3));

  function getFlags(c: Contributor): { type: "device" | "ip" | "vpn"; accounts: Contributor[]; score?: number }[] {
    const flags: { type: "device" | "ip" | "vpn"; accounts: Contributor[]; score?: number }[] = [];
    if (c.device_fingerprint && sharedFp.has(c.device_fingerprint)) {
      flags.push({ type: "device", accounts: sharedFp.get(c.device_fingerprint)!.filter((x) => x.id !== c.id) });
    }
    if (c.last_seen_ip && sharedIp.has(c.last_seen_ip)) {
      flags.push({ type: "ip", accounts: sharedIp.get(c.last_seen_ip)!.filter((x) => x.id !== c.id) });
    }
    if (c.ip_vpn_detected) {
      flags.push({ type: "vpn", accounts: [], score: c.ip_fraud_score ?? undefined });
    }
    return flags;
  }

  const [flagTooltip, setFlagTooltip] = useState<string | null>(null);

  const filtered = contributors.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      search === "" ||
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "All"
        ? true
        : statusFilter === "Flagged"
        ? getFlags(c).length > 0 || !!c.ip_vpn_detected
        : statusFilter === "Deactivated"
        ? c.is_active === false
        : c.status === statusFilter.toLowerCase();
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
            placeholder="Search by name, email or UID…"
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 pr-8 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] text-sm text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
        >
          {["All", "Active", "Suspended", "Banned", "Deactivated", "Flagged"].map((s) => (
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
                {["Name / ID", "Email", "Country", "NexCoins", "Status", "Joined", "Flags", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                    <div className="whitespace-nowrap">{c.full_name ?? "—"}</div>
                    <button
                      onClick={() => copyId(c.id)}
                      title={c.id}
                      className="flex items-center gap-1 font-mono font-normal text-xs text-[var(--text-muted)] hover:text-[var(--brand-500)] transition-colors mt-0.5"
                    >
                      {c.id.slice(0, 8)}…
                      {copiedId === c.id
                        ? <CheckCheck className="h-3 w-3 text-green-400 flex-shrink-0" />
                        : <Copy className="h-3 w-3 flex-shrink-0 opacity-50" />
                      }
                    </button>
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
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      c.is_active === false
                        ? STATUS_STYLES.deactivated
                        : (STATUS_STYLES[c.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]")
                    }`}>
                      {c.is_active === false ? "deactivated" : (c.status ?? "active")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                    {c.joined_at
                      ? new Date(c.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const flags = getFlags(c);
                      if (flags.length === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;
                      return (
                        <div className="flex flex-col gap-1">
                          {flags.map((f) => {
                            const isVpn = f.type === "vpn";
                            const key   = `${c.id}-${f.type}`;
                            return (
                              <div key={f.type} className="relative">
                                <button
                                  onClick={() => setFlagTooltip(flagTooltip === key ? null : key)}
                                  className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
                                    isVpn
                                      ? "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25"
                                      : "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25"
                                  }`}
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  {isVpn
                                    ? `VPN/Proxy${f.score !== undefined ? ` (${f.score})` : ""}`
                                    : f.type === "device"
                                    ? `Same device (${f.accounts.length + 1})`
                                    : `Same IP (${f.accounts.length + 1})`}
                                </button>
                                {flagTooltip === key && (
                                  <div className={`absolute left-0 top-full mt-1 z-50 w-64 bg-[var(--surface-card)] rounded-lg shadow-xl p-3 border ${isVpn ? "border-red-500/30" : "border-amber-500/30"}`}>
                                    <p className={`text-xs font-semibold mb-2 ${isVpn ? "text-red-400" : "text-amber-400"}`}>
                                      {isVpn
                                        ? `VPN / Proxy / Datacenter detected — fraud score: ${f.score ?? "?"}/100`
                                        : f.type === "device"
                                        ? "Same device fingerprint — shared with:"
                                        : "Same login IP — shared with:"}
                                    </p>
                                    {!isVpn && (
                                      <ul className="space-y-1">
                                        {f.accounts.map((a) => (
                                          <li key={a.id} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <span className="truncate">{a.full_name ?? "—"} · {a.email ?? "—"}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {isVpn && (
                                      <p className="text-xs text-[var(--text-muted)]">
                                        Detected via IPQualityScore on last login. User may be using a VPN, proxy, or hosted server to mask their real IP.
                                      </p>
                                    )}
                                    <button onClick={() => setFlagTooltip(null)} className="mt-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]">Close</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
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
                      {c.is_active === false && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={reactivating === c.id}
                          onClick={() => handleReactivate(c)}
                          className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                        >
                          {reactivating === c.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : "Reactivate"
                          }
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDelete(c)}
                        className="text-red-500 border-red-700/30 hover:bg-red-500/10"
                        title="Permanently delete user"
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

      {/* ── Delete User Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-red-700/40 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-400" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Delete User Permanently</h2>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 mb-4 text-sm text-red-300 leading-relaxed">
              This will permanently delete <strong className="text-red-200">{deleteTarget.full_name ?? deleteTarget.email}</strong> and all their data — earnings, submissions, transactions, and notifications. <strong className="text-red-200">This cannot be undone.</strong>
            </div>

            <form onSubmit={handleDelete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Type <span className="font-mono text-red-400">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full h-10 px-3 rounded-md border border-red-700/40 bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>

              {deleteErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{deleteErr}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={deleting || deleteConfirm !== "DELETE"}
                  className="flex-1 bg-red-600 hover:bg-red-500 border-0 text-white disabled:opacity-40"
                >
                  {deleting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Trash2 className="h-4 w-4 mr-1" />Delete Forever</>}
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
