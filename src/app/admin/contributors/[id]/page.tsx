"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, ClipboardList, Loader2, Ban, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  status: string;
  nexcoins: number;
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
  reason: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-500/10 text-green-400",
  suspended: "bg-yellow-500/10 text-yellow-400",
  banned:    "bg-red-500/10 text-red-400",
};

export default function ContributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const [submissions, setSubmissions]   = useState<Submission[]>([]);
  const [transactions, setTransactions] = useState<CoinTxn[]>([]);
  const [loading, setLoading]           = useState(true);
  const [banning, setBanning]           = useState(false);

  useEffect(() => {
    params.then(({ id: resolvedId }) => setId(resolvedId));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [
        { data: profileData },
        { data: subData },
        { data: txnData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, country, status, nexcoins, joined_at")
          .eq("id", id)
          .single(),
        supabase
          .from("submissions")
          .select("id, status, coins_awarded, submitted_at, tasks(title)")
          .eq("contributor_id", id)
          .order("submitted_at", { ascending: false })
          .limit(10),
        supabase
          .from("coin_transactions")
          .select("id, type, amount, reason, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      setProfile(profileData as unknown as Profile | null);
      setSubmissions((subData as unknown as Submission[]) ?? []);
      setTransactions((txnData as unknown as CoinTxn[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  async function toggleBan() {
    if (!profile) return;
    const newStatus = profile.status === "banned" ? "active" : "banned";
    setBanning(true);
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", profile.id);
    if (!error) setProfile({ ...profile, status: newStatus });
    setBanning(false);
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
          <p className="text-sm text-[var(--text-secondary)] mt-1">This user may have been deleted.</p>
        </div>
      </div>
    );
  }

  const approvedSubs = submissions.filter((s) => s.status === "approved");
  const totalEarned  = approvedSubs.reduce((sum, s) => sum + (s.coins_awarded ?? 0), 0);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/contributors" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Contributors
      </Link>

      {/* Profile card */}
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
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[profile.status] ?? "bg-[var(--surface-subtle)] text-[var(--text-secondary)]"}`}>
              {profile.status}
            </span>
            <Button
              variant={profile.status === "banned" ? "secondary" : "destructive"}
              size="sm"
              disabled={banning}
              onClick={toggleBan}
            >
              <Ban className="h-3.5 w-3.5" />
              {profile.status === "banned" ? "Unban" : "Ban"}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "NexCoins",      value: (profile.nexcoins ?? 0).toLocaleString(), icon: <Coins className="h-4 w-4 text-[var(--brand-500)]" /> },
            { label: "Submissions",   value: submissions.length,                       icon: <ClipboardList className="h-4 w-4 text-[var(--brand-500)]" /> },
            { label: "Approved",      value: approvedSubs.length,                      icon: <ClipboardList className="h-4 w-4 text-green-400" /> },
            { label: "Coins Earned",  value: totalEarned.toLocaleString(),             icon: <Coins className="h-4 w-4 text-green-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                {stat.icon}
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</p>
            </div>
          ))}
        </div>

        {profile.joined_at && (
          <p className="text-xs text-[var(--text-muted)] mt-4">
            Joined {new Date(profile.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Recent Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No submissions yet.</p>
          </div>
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
                }`}>
                  {sub.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Coin Transactions */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Coin Transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">No transactions yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {transactions.map((txn) => (
              <li key={txn.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{txn.type}</p>
                  {txn.reason && <p className="text-xs text-[var(--text-muted)] truncate">{txn.reason}</p>}
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(txn.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-sm font-semibold flex-shrink-0 ${txn.type === "earned" ? "text-[var(--brand-500)]" : "text-red-400"}`}>
                  {txn.type === "earned" ? "+" : "-"}{txn.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
