"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Coins, ClipboardList, Loader2, Ban, Globe,
  Send, Minus, Trash2, X, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  status: string;
  nexcoins: number;
  xp: number | null;
  level: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  last_streak_claim_date: string | null;
  joined_at: string | null;
}

interface Submission {
  id: string;
  status: string;
  coins_awarded: number | null;
  submitted_at: string;
  tasks: { title: string } | null;
}

interface CoinTxn {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-500/10 text-green-400",
  suspended: "bg-yellow-500/10 text-yellow-400",
  banned:    "bg-red-500/10 text-red-400",
};

export default function ContributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const tokenRef = useRef<string | null>(null);
  const allowed = usePageGuard(ADMIN_ROLES.USERS);

  const [id, setId]                     = useState<string | null>(null);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [submissions, setSubmissions]   = useState<Submission[]>([]);
  const [transactions, setTransactions] = useState<CoinTxn[]>([]);
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [loading, setLoading]           = useState(true);
  const [banModal, setBanModal]         = useState(false);
  const [banReason, setBanReason]       = useState("");
  const [banning, setBanning]           = useState(false);
  const [banErr, setBanErr]             = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Coins modal
  const [coinsModal, setCoinsModal]     = useState(false);
  const [coinsMode, setCoinsMode]       = useState<"send" | "deduct">("send");
  const [coinsAmount, setCoinsAmount]   = useState("");
  const [coinsReason, setCoinsReason]   = useState("");
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [coinsErr, setCoinsErr]         = useState<string | null>(null);
  const [coinsOk, setCoinsOk]           = useState(false);
  const [coinsDone, setCoinsDone]       = useState(0);

  useEffect(() => {
    params.then(({ id: resolvedId }) => setId(resolvedId));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      const res = await fetch(`/api/admin/contributors/${id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) { setLoading(false); return; }

      const { profile: p, submissions: s, transactions: t, tickets: tk } = await res.json();
      setProfile(p ?? null);
      setSubmissions(s ?? []);
      setTransactions(t ?? []);
      setTickets(tk ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  function openBanModal() {
    setBanReason("");
    setBanErr(null);
    setBanModal(true);
  }

  async function handleBan(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const isBanning = profile.status !== "banned";
    if (isBanning && !banReason.trim()) { setBanErr("A reason is required."); return; }
    setBanning(true);
    setBanErr(null);
    const newStatus = isBanning ? "banned" : "active";
    const res = await fetch("/api/admin/contributors", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({
        contributorId: profile.id,
        status: newStatus,
        reason: isBanning ? banReason.trim() : undefined,
      }),
    });
    if (res.ok) {
      setProfile({ ...profile, status: newStatus });
      setBanModal(false);
    } else {
      const data = await res.json();
      setBanErr(data.error ?? "Failed.");
    }
    setBanning(false);
  }

  async function handleCoins(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(coinsAmount, 10);
    if (isNaN(amount) || amount <= 0) { setCoinsErr("Enter a valid positive amount."); return; }
    setCoinsLoading(true);
    setCoinsErr(null);

    const endpoint = coinsMode === "send" ? "/api/admin/send-coins" : "/api/admin/deduct-coins";
    const res = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ contributorId: profile!.id, amount, reason: coinsReason.trim() || undefined }),
    });
    const data = await res.json() as { error?: string; newBalance?: number; amountDeducted?: number };
    if (!res.ok) {
      setCoinsErr(data.error ?? "Failed.");
    } else {
      setCoinsDone(coinsMode === "deduct" ? (data.amountDeducted ?? amount) : amount);
      setCoinsOk(true);
      if (data.newBalance !== undefined && profile) {
        setProfile({ ...profile, nexcoins: data.newBalance });
      }
    }
    setCoinsLoading(false);
  }

  async function deleteAccount() {
    if (!profile) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/contributors/${profile.id}`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (res.ok) {
      window.location.href = "/admin/contributors";
    } else {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  function openCoinsModal(mode: "send" | "deduct") {
    setCoinsMode(mode);
    setCoinsAmount("");
    setCoinsReason("");
    setCoinsErr(null);
    setCoinsOk(false);
    setCoinsModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Link href="/admin/contributors" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Contributors
        </Link>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 text-center">
          <p className="font-semibold text-[var(--text-primary)]">Contributor not found</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">This user may have been deleted or does not exist.</p>
        </div>
      </div>
    );
  }

  const approvedSubs = submissions.filter((s) => s.status === "approved");
  const totalEarned  = approvedSubs.reduce((sum, s) => sum + (s.coins_awarded ?? 0), 0);

  if (!allowed) return null;
  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/contributors" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Contributors
      </Link>

      {/* ── Profile card ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-[var(--brand-500)]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-[var(--brand-500)]">
                {(profile.full_name ?? profile.email ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{profile.full_name ?? "—"}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{profile.email}</p>
              {profile.country && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {profile.country}
                </p>
              )}
              {profile.joined_at && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Joined {new Date(profile.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[profile.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
              {profile.status}
            </span>
            <Button variant="secondary" size="sm" onClick={() => openCoinsModal("send")}>
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
            <Button variant="secondary" size="sm" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => openCoinsModal("deduct")}>
              <Minus className="h-3.5 w-3.5" /> Deduct
            </Button>
            <Button variant={profile.status === "banned" ? "secondary" : "destructive"} size="sm" onClick={openBanModal}>
              <Ban className="h-3.5 w-3.5" />
              {profile.status === "banned" ? "Unban" : "Ban"}
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "NexCoins",     value: (profile.nexcoins ?? 0).toLocaleString(), icon: <Coins className="h-4 w-4 text-[var(--brand-500)]" /> },
            { label: "Submissions",  value: submissions.length,                       icon: <ClipboardList className="h-4 w-4 text-[var(--brand-500)]" /> },
            { label: "Approved",     value: approvedSubs.length,                      icon: <ClipboardList className="h-4 w-4 text-green-400" /> },
            { label: "Coins Earned", value: totalEarned.toLocaleString(),             icon: <Coins className="h-4 w-4 text-green-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">{stat.icon}<p className="text-xs text-[var(--text-muted)]">{stat.label}</p></div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Level & Activity ──────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Level &amp; Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Level",          value: profile.level ?? 1 },
            { label: "Total XP",       value: (profile.xp ?? 0).toLocaleString() },
            { label: "Current Streak", value: `${profile.current_streak ?? 0}d` },
            { label: "Longest Streak", value: `${profile.longest_streak ?? 0}d` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3">
              <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{s.value}</p>
            </div>
          ))}
        </div>
        {(() => {
          const xp    = profile.xp ?? 0;
          const level = profile.level ?? 1;
          const xpInLevel   = xp % 1000;
          const xpNeeded    = 1000;
          const pct         = Math.round((xpInLevel / xpNeeded) * 100);
          const lastClaim   = profile.last_streak_claim_date;
          return (
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-muted)]">XP Progress — Level {level} → {level + 1}</span>
                  <span className="text-xs font-medium text-[var(--text-primary)]">{xpInLevel} / {xpNeeded}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--brand-500)] transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {lastClaim && (
                <p className="text-xs text-[var(--text-muted)]">
                  Last streak claim: {new Date(lastClaim).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Recent Submissions ─────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Recent Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="px-5 py-8 text-center"><p className="text-sm text-[var(--text-muted)]">No submissions yet.</p></div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {submissions.map((sub) => (
              <li key={sub.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {(sub.tasks as { title: string } | null)?.title ?? "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(sub.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {sub.coins_awarded ? ` · ${sub.coins_awarded} coins` : ""}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  sub.status === "approved" ? "bg-green-500/10 text-green-400"
                  : sub.status === "rejected" ? "bg-red-500/10 text-red-400"
                  : "bg-yellow-500/10 text-yellow-400"
                }`}>{sub.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Coin Transactions ──────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Coin Transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="px-5 py-8 text-center"><p className="text-sm text-[var(--text-muted)]">No transactions yet.</p></div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {transactions.map((txn) => (
              <li key={txn.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{txn.type}</p>
                  {txn.description && <p className="text-xs text-[var(--text-muted)] truncate">{txn.description}</p>}
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(txn.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${
                  txn.type === "earned" || txn.type === "bonus" ? "text-[var(--brand-500)]" : "text-red-400"
                }`}>
                  {txn.type === "earned" || txn.type === "bonus" ? "+" : "-"}{txn.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Support Tickets ────────────────────────────────────────── */}
      {tickets.length > 0 && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Support Tickets</h2>
          </div>
          <ul className="divide-y divide-[var(--border-default)]">
            {tickets.map((t) => (
              <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.subject}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                  t.status === "open" ? "bg-yellow-500/10 text-yellow-400"
                  : t.status === "replied" ? "bg-green-500/10 text-green-400"
                  : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
                }`}>{t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Send / Deduct Coins Modal ────────────────────────────── */}
      {coinsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[var(--brand-500)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">NexCoins</h2>
              </div>
              <button onClick={() => setCoinsModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {coinsOk ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">
                  {coinsDone.toLocaleString()} coins {coinsMode === "send" ? "sent!" : "deducted."}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">New balance: {(profile.nexcoins).toLocaleString()} coins</p>
                <Button className="w-full mt-2" onClick={() => setCoinsModal(false)}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleCoins} className="space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(["send", "deduct"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setCoinsMode(m)}
                      className={`flex-1 py-2 rounded-lg text-sm border font-medium transition-colors ${
                        coinsMode === m
                          ? m === "send" ? "bg-[var(--brand-500)] text-white border-[var(--brand-500)]" : "bg-red-500 text-white border-red-500"
                          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-500)]"
                      }`}>
                      {m === "send" ? "Send Coins" : "Deduct Coins"}
                    </button>
                  ))}
                </div>

                <div className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3">
                  <p className="text-xs text-[var(--text-muted)]">Current balance</p>
                  <p className="text-base font-bold text-[var(--text-primary)]">{(profile.nexcoins ?? 0).toLocaleString()} coins</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Amount</label>
                  <input type="number" required min="1" max={coinsMode === "deduct" ? profile.nexcoins : undefined} step="1"
                    value={coinsAmount} onChange={(e) => setCoinsAmount(e.target.value)} placeholder="e.g. 100"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Reason <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                  </label>
                  <input type="text" value={coinsReason} onChange={(e) => setCoinsReason(e.target.value)}
                    placeholder={coinsMode === "send" ? "e.g. Bonus reward" : "e.g. Policy violation"}
                    maxLength={200}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]" />
                </div>

                {coinsErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{coinsErr}</p>}

                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setCoinsModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={coinsLoading}
                    className={`flex-1 ${coinsMode === "deduct" ? "bg-red-500 hover:bg-red-400 border-0" : ""}`}>
                    {coinsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : coinsMode === "send" ? "Send" : "Deduct"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Ban Modal ────────────────────────────────────────────── */}
      {banModal && profile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {profile.status === "banned" ? "Unban" : "Ban"} User
                </h2>
              </div>
              <button onClick={() => setBanModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {profile.status === "banned"
                ? `Restore access for ${profile.full_name ?? profile.email}?`
                : `Ban ${profile.full_name ?? profile.email}? They will be signed out and notified by email.`}
            </p>
            <form onSubmit={handleBan} className="space-y-4">
              {profile.status !== "banned" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Reason <span className="text-red-400">*</span>
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
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setBanModal(false)}>Cancel</Button>
                <Button type="submit" disabled={banning}
                  className={`flex-1 ${profile.status !== "banned" ? "bg-red-500 hover:bg-red-400 border-0" : ""}`}>
                  {banning ? <Loader2 className="h-4 w-4 animate-spin" /> : profile.status === "banned" ? "Unban" : "Ban User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">Delete Account?</h2>
                <p className="text-xs text-[var(--text-muted)]">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Permanently deletes <strong className="text-[var(--text-primary)]">{profile.full_name ?? profile.email}</strong> and all their data.
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button disabled={deleting} onClick={deleteAccount}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white border-0">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
