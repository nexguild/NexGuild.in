"use client";

import { useEffect, useState } from "react";
import { Crown, CheckCircle2, XCircle, Loader2, Users, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";

interface Application {
  id: string;
  status: string;
  reason: string;
  community_description: string;
  estimated_recruits: number | null;
  created_at: string;
  rejection_reason: string | null;
  contributor_id: string;
  contributor_name: string | null;
  contributor_email: string | null;
  current_nexleader_name: string;
}

interface NexLeader {
  id: string;
  full_name: string | null;
  email: string | null;
  is_nexleader: boolean;
  nexleader_approved_at: string | null;
  guild_total_members: number;
  guild_total_earned: number;
  is_active: boolean | null;
}

interface Stats {
  total_active: number;
  total_nc_paid: number;
  top_leader_name: string;
  top_leader_nc: number;
}

type Tab = "applications" | "leaders";

export default function AdminNexLeadersPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);
  const [token, setToken]               = useState<string | null>(null);
  const [tab, setTab]                   = useState<Tab>("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [nexleaders, setNexLeaders]     = useState<NexLeader[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [acting, setActing]             = useState<string | null>(null);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting]       = useState(false);

  // Revoke confirmation
  const [revokeTarget, setRevokeTarget] = useState<NexLeader | null>(null);
  const [revoking, setRevoking]         = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const tok = session?.access_token ?? null;
      setToken(tok);
      if (!tok) { setLoading(false); return; }

      const res = await fetch("/api/admin/nexleaders", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) {
        const d = await res.json() as { applications: Application[]; nexleaders: NexLeader[]; stats: Stats };
        setApplications(d.applications);
        setNexLeaders(d.nexleaders);
        setStats(d.stats);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function approve(applicationId: string) {
    if (!token) return;
    setActing(applicationId);
    const res = await fetch("/api/admin/nexleaders", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ action: "approve", applicationId }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && json.ok) {
      setApplications((prev) => prev.map((a) => a.id === applicationId ? { ...a, status: "approved" } : a));
    } else {
      alert(json.error ?? "Approval failed.");
    }
    setActing(null);
  }

  async function confirmReject() {
    if (!token || !rejectTarget) return;
    setRejecting(true);
    const res = await fetch("/api/admin/nexleaders", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ action: "reject", applicationId: rejectTarget, reason: rejectReason }),
    });
    if (res.ok) {
      setApplications((prev) => prev.map((a) => a.id === rejectTarget ? { ...a, status: "rejected", rejection_reason: rejectReason } : a));
    }
    setRejectTarget(null);
    setRejectReason("");
    setRejecting(false);
  }

  async function confirmRevoke() {
    if (!token || !revokeTarget) return;
    setRevoking(true);
    const res = await fetch("/api/admin/nexleaders", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ action: "revoke", nexleaderId: revokeTarget.id }),
    });
    if (res.ok) {
      setNexLeaders((prev) => prev.filter((l) => l.id !== revokeTarget.id));
    }
    setRevokeTarget(null);
    setRevoking(false);
  }

  if (!allowed) return null;

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-6 w-6 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">NexLeader Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Review applications and manage active NexLeaders.</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active NexLeaders", value: stats.total_active, icon: Crown,       color: "text-yellow-400" },
            { label: "Pending Applications", value: pendingApps.length, icon: Loader2, color: "text-blue-400"   },
            { label: "Total NC in Commissions", value: stats.total_nc_paid, icon: NexCoinIcon, color: "text-green-400" },
            { label: "Top Leader", value: stats.top_leader_name || "—", icon: TrendingUp, color: "text-[var(--brand-500)]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color} truncate`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border-default)]">
        {(["applications", "leaders"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t === "applications" ? `Applications ${pendingApps.length > 0 ? `(${pendingApps.length})` : ""}` : "Active NexLeaders"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : tab === "applications" ? (
        /* ── Applications Tab ─────────────────────────────────────────────── */
        <div className="space-y-4">
          {applications.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-12">No applications yet.</p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{app.contributor_name ?? "Unknown"}</p>
                    <p className="text-xs text-[var(--text-muted)]">{app.contributor_email}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Current NexLeader: <span className="text-[var(--text-secondary)]">{app.current_nexleader_name}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    app.status === "pending"  ? "bg-yellow-500/10 text-yellow-400" :
                    app.status === "approved" ? "bg-green-500/10 text-green-400"  :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {app.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Reason</p>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{app.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Community</p>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{app.community_description}</p>
                  </div>
                  {app.estimated_recruits && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Estimated recruits: <span className="text-[var(--text-secondary)] font-semibold">{app.estimated_recruits}</span>
                    </p>
                  )}
                </div>

                {app.rejection_reason && (
                  <p className="text-xs text-red-400">Rejection reason: {app.rejection_reason}</p>
                )}

                {app.status === "pending" && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      disabled={acting === app.id}
                      onClick={() => approve(app.id)}
                      className="gap-1.5 bg-green-600 hover:bg-green-700"
                    >
                      {acting === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setRejectTarget(app.id); setRejectReason(""); }}
                      className="gap-1.5 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Active NexLeaders Tab ────────────────────────────────────────── */
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] overflow-hidden">
          {nexleaders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-12">No active NexLeaders.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Members</th>
                  <th className="text-left px-4 py-3 font-semibold">Commission</th>
                  <th className="text-left px-4 py-3 font-semibold">Since</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {nexleaders.map((l) => (
                  <tr key={l.id} className="hover:bg-[var(--surface-subtle)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{l.full_name ?? "—"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <Users className="h-3.5 w-3.5" />
                        {l.guild_total_members}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                        <NexCoinIcon size={12} />
                        {l.guild_total_earned}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {l.nexleader_approved_at
                        ? new Date(l.nexleader_approved_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        l.is_active !== false ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {l.is_active !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeTarget(l)}
                        className="text-red-400 hover:bg-red-500/10 text-xs"
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <h3 className="font-bold text-[var(--text-primary)]">Reject Application</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
            />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRejectTarget(null)} disabled={rejecting}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmReject} disabled={rejecting}>
                {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-[var(--text-primary)]">Revoke NexLeader Status?</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  <strong>{revokeTarget.full_name}</strong>&apos;s {revokeTarget.guild_total_members} member{revokeTarget.guild_total_members !== 1 ? "s" : ""} will be reassigned to Somen. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRevokeTarget(null)} disabled={revoking}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmRevoke} disabled={revoking}>
                {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revoke Status"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
