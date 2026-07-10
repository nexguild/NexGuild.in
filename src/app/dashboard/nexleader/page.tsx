"use client";

import { useEffect, useState, useRef } from "react";
import { Crown, Copy, Check, Users, TrendingUp, Star, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface StatusData {
  profile: {
    nexcoins: number;
    is_nexleader: boolean;
    nexleader_approved_at: string | null;
    guild_total_members: number;
    guild_total_earned: number;
    referral_code: string | null;
    is_active: boolean;
    created_at: string | null;
  };
  totalEarned: number;
  application: {
    id: string;
    status: string;
    reason: string;
    created_at: string;
    rejection_reason: string | null;
  } | null;
  members: { id: string; full_name: string | null; created_at: string }[];
  commissions: {
    id: string;
    member_id: string;
    event_type: string;
    nexleader_credit: number;
    created_at: string;
  }[];
  activeThisWeek: number;
}

const SOMEN_ID = "6c95c54a-33e6-489b-9175-3626c774635e";
const MIN_DAYS   = 7;
const MIN_EARNED = 500;

function mask(name: string | null): string {
  if (!name) return "Member";
  const parts = name.trim().split(" ");
  return parts.map((p) => p[0] + "***").join(" ");
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function NexLeaderPage() {
  const tokenRef = useRef<string | null>(null);
  const [data, setData]       = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  // Application form state
  const [reason, setReason]             = useState("");
  const [community, setCommunity]       = useState("");
  const [recruits, setRecruits]         = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState("");
  const [submitted, setSubmitted]       = useState(false);
  const [tncChecked, setTncChecked]     = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      if (!tokenRef.current) { setLoading(false); return; }

      const res = await fetch("/api/nexleader/status", {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        setData(await res.json() as StatusData);
      }
      setLoading(false);
    }
    load();
  }, []);

  function copyLink() {
    const code = data?.profile.referral_code;
    if (!code) return;
    navigator.clipboard.writeText(`https://nexguild.in/signup?ref=${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!tncChecked) { setFormError("Please accept the terms."); return; }
    setSubmitting(true);

    const res = await fetch("/api/nexleader/apply", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ reason, community_description: community, estimated_recruits: recruits ? parseInt(recruits) : undefined }),
    });

    const json = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setFormError(json.error ?? "Failed to submit application.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    // Refresh data so pending state shows
    const statusRes = await fetch("/api/nexleader/status", {
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    if (statusRes.ok) setData(await statusRes.json() as StatusData);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-7 w-7 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">Failed to load. Please refresh.</div>
    );
  }

  const { profile, totalEarned, application, members, commissions, activeThisWeek } = data;

  // ── NexLeader Dashboard ──────────────────────────────────────────────────────
  if (profile.is_nexleader) {
    const recruitLink = `https://nexguild.in/signup?ref=${profile.referral_code ?? ""}`;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-yellow-400" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">NexLeader Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Approved {profile.nexleader_approved_at ? new Date(profile.nexleader_approved_at).toLocaleDateString() : ""}
            </p>
          </div>
        </div>

        {/* Recruitment Link */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Recruitment Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-[var(--brand-500)] bg-[var(--surface-subtle)] rounded-lg px-3 py-2 truncate">
              {recruitLink}
            </code>
            <Button size="sm" variant="secondary" onClick={copyLink} className="flex-shrink-0 gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Members",     value: profile.guild_total_members, icon: Users,      color: "text-blue-400" },
            { label: "Active This Week",  value: activeThisWeek,              icon: TrendingUp,  color: "text-green-400" },
            { label: "Commission Earned", value: `${profile.guild_total_earned} NC`, icon: NexCoinIcon, color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
              <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Guild Members</h2>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {members.map((m) => {
                const memberComm = commissions
                  .filter((c) => c.member_id === m.id)
                  .reduce((s, c) => s + c.nexleader_credit, 0);
                return (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{mask(m.full_name)}</p>
                      <p className="text-xs text-[var(--text-muted)]">Joined {daysAgo(m.created_at)}d ago</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                      <NexCoinIcon size={12} />
                      +{memberComm} NC earned
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Commission history */}
        {commissions.length > 0 && (
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Commission History</h2>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)] capitalize">{c.event_type.replace("_", " ")}</p>
                    <p className="text-xs text-[var(--text-muted)]">{new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-yellow-400">+{c.nexleader_credit} NC</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Pending Application ──────────────────────────────────────────────────────
  if (application?.status === "pending") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-[var(--brand-500)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">NexLeader Application</h1>
        </div>
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 space-y-3">
          <div className="flex items-center gap-2 text-yellow-400 font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" /> Application Under Review
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Submitted {new Date(application.created_at).toLocaleDateString()}. We review applications within 3–5 business days.
          </p>
        </div>
      </div>
    );
  }

  // ── Rejected Application ─────────────────────────────────────────────────────
  if (application?.status === "rejected" && !submitted) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-[var(--brand-500)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">NexLeader</h1>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-2">
          <p className="text-sm font-semibold text-red-400">Application Not Approved</p>
          {application.rejection_reason && (
            <p className="text-sm text-[var(--text-secondary)]">Reason: {application.rejection_reason}</p>
          )}
          <p className="text-xs text-[var(--text-muted)]">You may reapply after improving your profile.</p>
        </div>
        <EligibilityAndForm
          profile={profile}
          totalEarned={totalEarned}
          reason={reason}
          setReason={setReason}
          community={community}
          setCommunity={setCommunity}
          recruits={recruits}
          setRecruits={setRecruits}
          tncChecked={tncChecked}
          setTncChecked={setTncChecked}
          formError={formError}
          submitting={submitting}
          onSubmit={handleApply}
        />
      </div>
    );
  }

  // ── Eligible / Not Eligible ──────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Crown className="h-6 w-6 text-[var(--brand-500)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Become a NexLeader</h1>
          <p className="text-sm text-[var(--text-secondary)]">Recruit members and earn 8% commission on their earnings.</p>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center space-y-3">
          <p className="text-2xl">✅</p>
          <p className="font-semibold text-green-400">Application Submitted!</p>
          <p className="text-sm text-[var(--text-secondary)]">We&apos;ll review your application within 3–5 business days.</p>
        </div>
      ) : (
        <EligibilityAndForm
          profile={profile}
          totalEarned={totalEarned}
          reason={reason}
          setReason={setReason}
          community={community}
          setCommunity={setCommunity}
          recruits={recruits}
          setRecruits={setRecruits}
          tncChecked={tncChecked}
          setTncChecked={setTncChecked}
          formError={formError}
          submitting={submitting}
          onSubmit={handleApply}
        />
      )}
    </div>
  );
}

interface FormProps {
  profile:        StatusData["profile"];
  totalEarned:    number;
  reason:         string;
  setReason:      (v: string) => void;
  community:      string;
  setCommunity:   (v: string) => void;
  recruits:       string;
  setRecruits:    (v: string) => void;
  tncChecked:     boolean;
  setTncChecked:  (v: boolean) => void;
  formError:      string;
  submitting:     boolean;
  onSubmit:       (e: React.FormEvent) => void;
}

function EligibilityAndForm({
  profile, totalEarned,
  reason, setReason, community, setCommunity, recruits, setRecruits,
  tncChecked, setTncChecked, formError, submitting, onSubmit,
}: FormProps) {
  const ageMs = profile.created_at ? Date.now() - new Date(profile.created_at).getTime() : 0;
  const ageDays = Math.floor(ageMs / 86400000);

  const criteria = [
    { label: "Account at least 7 days old", met: ageDays >= MIN_DAYS,   detail: `${ageDays} days` },
    { label: "Earned at least 500 NexCoins", met: totalEarned >= MIN_EARNED, detail: `${totalEarned} NC` },
    { label: "Account in good standing",     met: profile.is_active,    detail: "" },
  ];

  const allMet = criteria.every((c) => c.met);

  return (
    <div className="space-y-5">
      {/* Eligibility */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Eligibility</p>
        {criteria.map((c) => (
          <div key={c.label} className="flex items-center gap-3">
            <span className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs ${
              c.met ? "bg-green-500/15 text-green-400" : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
            }`}>
              {c.met ? "✓" : "○"}
            </span>
            <span className={`text-sm ${c.met ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>
              {c.label}
            </span>
            {c.detail && (
              <span className="ml-auto text-xs text-[var(--text-muted)]">{c.detail}</span>
            )}
          </div>
        ))}
      </div>

      {!allMet ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--text-secondary)]">
            Meet all eligibility criteria above to apply.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {/* T&C */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <p className="text-sm font-bold text-[var(--text-primary)]">NexLeader Agreement</p>
            </div>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li>• You will earn 8% commission on all your members&apos; earnings</li>
              <li>• If you are under another NexLeader, <strong className="text-[var(--text-primary)]">500 NC will be deducted</strong> from your balance as a transfer fee upon approval</li>
              <li>• Your members will never see commission details</li>
              <li>• NexGuild can revoke NexLeader status for violations</li>
            </ul>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              Why do you want to become a NexLeader? <span className="text-[var(--text-muted)] font-normal">(min 100 chars)</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe your motivation…"
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">{reason.length}/100 minimum</p>
          </div>

          {/* Community */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              Describe your community <span className="text-[var(--text-muted)] font-normal">(min 50 chars)</span>
            </label>
            <textarea
              required
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
              rows={3}
              placeholder="WhatsApp group, college batch, Telegram channel…"
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
            />
          </div>

          {/* Estimated recruits */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              How many people can you recruit? <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min={1}
              value={recruits}
              onChange={(e) => setRecruits(e.target.value)}
              placeholder="e.g. 20"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
            />
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={tncChecked}
              onChange={(e) => setTncChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--brand-500)] flex-shrink-0"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              I have read and agree to the NexLeader Agreement above
            </span>
          </label>

          {formError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting || !tncChecked}
            className="w-full"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit Application"}
          </Button>
        </form>
      )}
    </div>
  );
}
