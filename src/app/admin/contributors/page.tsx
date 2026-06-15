"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Search, Eye, Ban, Coins, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [banning, setBanning]           = useState<string | null>(null);

  // Send Coins modal
  const [sendTarget, setSendTarget]   = useState<Contributor | null>(null);
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

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, country, status, nexcoins, joined_at")
        .neq("role", "admin")
        .order("joined_at", { ascending: false });
      setContributors(data ?? []);
      setLoading(false);
    }
    fetchContributors();
  }, []);

  async function toggleBan(contributor: Contributor) {
    const newStatus = contributor.status === "banned" ? "active" : "banned";
    setBanning(contributor.id);
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", contributor.id);
    if (!error) {
      setContributors((prev) =>
        prev.map((c) => c.id === contributor.id ? { ...c, status: newStatus } : c)
      );
    }
    setBanning(null);
  }

  function openSendCoins(c: Contributor) {
    setSendTarget(c);
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
      const res = await fetch("/api/admin/send-coins", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body:    JSON.stringify({ contributorId: sendTarget.id, amount, reason: sendReason.trim() || undefined }),
      });
      const data = await res.json() as { error?: string; newBalance?: number };
      if (!res.ok) {
        setSendErr(data.error ?? "Failed to send coins.");
      } else {
        setSentAmount(amount);
        setSendOk(true);
        // Update local nexcoins
        setContributors((prev) =>
          prev.map((c) => c.id === sendTarget.id ? { ...c, nexcoins: data.newBalance ?? c.nexcoins + amount } : c)
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openSendCoins(c)}
                        className="text-[var(--brand-500)] border-[var(--brand-500)]/30 hover:bg-[var(--brand-500)]/10"
                      >
                        <Coins className="h-3.5 w-3.5" /> Send
                      </Button>
                      <Button
                        variant={c.status === "banned" ? "secondary" : "destructive"}
                        size="sm"
                        disabled={banning === c.id}
                        onClick={() => toggleBan(c)}
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

      {/* ── Send Coins Modal ─────────────────────────────────────────── */}
      {sendTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-[var(--brand-500)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Send NexCoins</h2>
              </div>
              <button onClick={() => setSendTarget(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sendOk ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">
                  {sentAmount.toLocaleString()} coins sent!
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {sendTarget.full_name ?? sendTarget.email} has been notified.
                </p>
                <Button className="w-full mt-2" onClick={() => setSendTarget(null)}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleSendCoins} className="space-y-4">
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
                  <Button type="submit" className="flex-1" disabled={sending}>
                    {sending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</>
                      : <>
                          <Coins className="h-4 w-4 mr-1.5" />
                          Send Coins
                        </>}
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
