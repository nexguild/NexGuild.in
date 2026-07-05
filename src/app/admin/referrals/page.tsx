"use client";

import { useEffect, useState } from "react";
import { Share2, Loader2, Users, Coins, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Stats {
  total_referrals:      number;
  total_milestones:     number;
  total_nexcoins_paid:  number;
  signup_bonus_paid:    number;
  milestone_bonus_paid: number;
}

interface Referrer {
  id:                      string;
  full_name:               string | null;
  email:                   string | null;
  total_referrals:         number;
  total_referral_earnings: number;
}

export default function AdminReferralsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [stats, setStats]       = useState<Stats | null>(null);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [token, setToken]       = useState<string | null>(null);
  const [voiding, setVoiding]   = useState<string | null>(null);
  const [voidError, setVoidError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const tok = session?.access_token ?? null;
      setToken(tok);
      if (!tok) { setLoading(false); return; }

      const res = await fetch("/api/admin/referrals", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json.stats as Stats);
        setReferrers((json.referrers ?? []) as Referrer[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function voidReferrer(referrerId: string, name: string | null) {
    if (!token) return;
    if (!confirm(`Void all referral bonuses for "${name ?? referrerId}" and deduct earned NexCoins? This cannot be undone.`)) return;

    setVoiding(referrerId);
    setVoidError(null);

    const res = await fetch("/api/admin/referrals/void", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ referrerId }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setVoidError(d.error ?? "Failed to void referral.");
    } else {
      const d = await res.json() as { voided: number };
      // Update local state
      setReferrers((prev) => prev.map((r) =>
        r.id === referrerId
          ? { ...r, total_referral_earnings: Math.max(0, r.total_referral_earnings - d.voided) }
          : r
      ));
      if (stats) {
        setStats((s) => s ? { ...s, total_nexcoins_paid: Math.max(0, s.total_nexcoins_paid - d.voided) } : s);
      }
    }
    setVoiding(null);
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Referral Program</h1>
        <p className="text-sm text-[var(--text-secondary)]">Platform-wide referral activity and fraud controls.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : (
        <>
          {/* ── Stats ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Referrals",    value: stats?.total_referrals ?? 0,      icon: Users,      color: "text-[var(--brand-500)]" },
              { label: "Milestones Reached", value: stats?.total_milestones ?? 0,     icon: TrendingUp, color: "text-purple-400" },
              { label: "Signup Bonuses Paid",    value: `${stats?.signup_bonus_paid ?? 0} NC`,    icon: Coins, color: "text-amber-400" },
              { label: "Milestone Bonuses Paid", value: `${stats?.milestone_bonus_paid ?? 0} NC`, icon: Coins, color: "text-green-400" },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <div key={tile.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${tile.color}`} />
                    <p className="text-xs text-[var(--text-muted)]">{tile.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{tile.value}</p>
                </div>
              );
            })}
          </div>

          {/* Total paid summary */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Total NexCoins Paid via Referrals</p>
              <p className="text-3xl font-bold text-[var(--brand-500)]">{stats?.total_nexcoins_paid ?? 0}</p>
            </div>
            <Share2 className="h-8 w-8 text-[var(--text-muted)]" />
          </div>

          {/* ── Error ─────────────────────────────────────────────── */}
          {voidError && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {voidError}
            </div>
          )}

          {/* ── Referrers table ───────────────────────────────────── */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="font-bold text-[var(--text-primary)]">Top Referrers</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Sorted by number of referrals.</p>
            </div>

            {referrers.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <Share2 className="h-10 w-10 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-muted)]">No referrals yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border-default)]">
                      {["Referrer", "Referred Users", "Total Earned (NC)", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-[var(--text-secondary)] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)]">
                    {referrers.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={r.full_name ?? "?"} size="sm" />
                            <div>
                              <p className="font-medium text-[var(--text-primary)]">{r.full_name ?? "Unknown"}</p>
                              <p className="text-xs text-[var(--text-muted)]">{r.email ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-primary)] font-semibold">
                          {r.total_referrals}
                        </td>
                        <td className="px-4 py-3 text-[var(--brand-500)] font-semibold">
                          {r.total_referral_earnings}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={voiding === r.id || r.total_referral_earnings === 0}
                            onClick={() => voidReferrer(r.id, r.full_name)}
                          >
                            {voiding === r.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : "Void & Deduct"
                            }
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
