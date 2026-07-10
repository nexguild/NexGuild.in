"use client";

import { useEffect, useState, useRef } from "react";
import {
  Crown, Copy, Check, Users, TrendingUp, Zap, BookOpen,
  Loader2, AlertCircle, MessageCircle, ArrowRight, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

const WHATSAPP_LINK = "https://chat.whatsapp.com/PLACEHOLDER";

interface StatusData {
  profile: {
    nexcoins: number;
    is_nexleader: boolean;
    nexleader_approved_at: string | null;
    guild_total_members: number;
    guild_total_earned: number;
    referral_code: string | null;
    is_active: boolean;
    auth_created_at: string | null;
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

const MIN_DAYS     = 7;
const MIN_EARNED   = 500;
const MIN_RECRUITS = 10;

function mask(name: string | null): string {
  if (!name) return "Member";
  const parts = name.trim().split(" ");
  return parts.map((p) => p[0] + "***").join(" ");
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ── NexLeader Dashboard (approved) ────────────────────────────────────────────
function NexLeaderDashboard({ data, copyLink, copied }: {
  data: StatusData;
  copyLink: () => void;
  copied: boolean;
}) {
  const { profile, members, commissions, activeThisWeek } = data;
  const recruitLink = `https://nexguild.in/signup?ref=${profile.referral_code ?? ""}`;

  return (
    <div className="space-y-5">
      {/* Header banner — stays dark indigo (intentional contrast) */}
      <div className="rounded-2xl p-6 sm:p-8" style={{
        background: "linear-gradient(135deg,#312e81 0%,#3730a3 55%,#1e1b4b 100%)",
        border: "1px solid rgba(99,102,241,0.35)",
      }}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)" }}>
            <Crown className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(165,180,252,0.9)" }}>NexLeader Program</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your NexLeader Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              Approved {profile.nexleader_approved_at
                ? new Date(profile.nexleader_approved_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Members",     value: profile.guild_total_members,       color: "#6366f1", border: "rgba(99,102,241,0.35)"  },
          { label: "Active This Week",  value: activeThisWeek,                     color: "#16a34a", border: "rgba(22,163,74,0.35)"   },
          { label: "Commission Earned", value: `${profile.guild_total_earned} NC`, color: "#d97706", border: "rgba(217,119,6,0.35)"   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5 bg-white shadow-sm"
            style={{ border: "1px solid #E5E7EB", borderLeft: `4px solid ${s.color}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-[var(--text-muted)]">{s.label}</p>
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recruitment link */}
      <div className="rounded-xl p-5 space-y-3 bg-white shadow-sm" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Your Recruitment Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm rounded-lg px-3 py-2 truncate font-mono"
            style={{ color: "#02b491", background: "rgba(2,180,145,0.07)", border: "1px solid rgba(2,180,145,0.2)" }}>
            {recruitLink}
          </code>
          <Button size="sm" variant="secondary" onClick={copyLink} className="flex-shrink-0 gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Share this link — you earn 10% commission on everything your members earn.</p>
      </div>

      {/* WhatsApp community */}
      <div className="rounded-xl p-5 bg-white shadow-sm" style={{ border: "1px solid #E5E7EB", borderLeft: "4px solid #25D366" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50">
              <MessageCircle className="h-5 w-5" style={{ color: "#25D366" }} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-sm">Join the NexLeader WhatsApp Community</p>
              <p className="text-xs mt-0.5 text-[var(--text-secondary)]">Connect with other NexLeaders, share strategies, get updates</p>
            </div>
          </div>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "#25D366", color: "#fff" }}>
            Join <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Handbook */}
      <a href="/nexleader-handbook.pdf" download
        className="flex items-center gap-3 rounded-xl p-4 bg-white shadow-sm transition-opacity hover:opacity-80"
        style={{ border: "1px solid #E5E7EB", borderLeft: "4px solid #d97706" }}>
        <BookOpen className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">NexLeader Handbook</p>
          <p className="text-xs text-[var(--text-secondary)]">Download your guide to growing a successful guild</p>
        </div>
        <ArrowRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
      </a>

      {/* Members */}
      {members.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-white shadow-sm" style={{ border: "1px solid #E5E7EB" }}>
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Guild Members</h2>
          </div>
          {members.map((m) => {
            const memberComm = commissions
              .filter((c) => c.member_id === m.id)
              .reduce((s, c) => s + c.nexleader_credit, 0);
            return (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{mask(m.full_name)}</p>
                  <p className="text-xs text-[var(--text-muted)]">Joined {daysAgo(m.created_at)}d ago</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <NexCoinIcon size={12} /> +{memberComm} NC
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Commission history */}
      {commissions.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-white shadow-sm" style={{ border: "1px solid #E5E7EB" }}>
          <div className="px-5 py-4 border-b border-[var(--border-default)]">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Commission History</h2>
          </div>
          {commissions.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{c.event_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                <p className="text-xs text-[var(--text-muted)]">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <span className="text-sm font-semibold text-amber-600">+{c.nexleader_credit} NC</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NexLeaderPage() {
  const tokenRef = useRef<string | null>(null);
  const [data, setData]       = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  const [reason, setReason]         = useState("");
  const [community, setCommunity]   = useState("");
  const [recruits, setRecruits]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [tncChecked, setTncChecked] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      if (!tokenRef.current) { setLoading(false); return; }
      const res = await fetch("/api/nexleader/status", {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) setData(await res.json() as StatusData);
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
    if (!tncChecked) { setFormError("Please accept the terms to continue."); return; }
    const recruitCount = parseInt(recruits, 10);
    if (!recruits || isNaN(recruitCount) || recruitCount < MIN_RECRUITS) {
      setFormError(`Please enter at least ${MIN_RECRUITS} community members ready to join.`);
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/nexleader/apply", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ reason, community_description: community, estimated_recruits: recruitCount }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setFormError(json.error ?? "Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    const sr = await fetch("/api/nexleader/status", { headers: { Authorization: `Bearer ${tokenRef.current}` } });
    if (sr.ok) setData(await sr.json() as StatusData);
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
    return <div className="text-center py-20 text-[var(--text-muted)]">Failed to load. Please refresh.</div>;
  }

  const { profile, totalEarned, application } = data;

  if (profile.is_nexleader) {
    return <NexLeaderDashboard data={data} copyLink={copyLink} copied={copied} />;
  }

  const formProps = {
    profile, totalEarned, reason, setReason, community, setCommunity,
    recruits, setRecruits, tncChecked, setTncChecked, formError, submitting, onSubmit: handleApply,
  };

  if (application?.status === "pending") {
    return <PendingView application={application} />;
  }

  if (application?.status === "rejected" && !submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <PageHero />
        <div className="rounded-xl px-5 py-4 flex items-start gap-3 bg-red-50" style={{ border: "1px solid #fca5a5" }}>
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-600">Previous Application Not Approved</p>
            {application.rejection_reason && (
              <p className="text-sm mt-1 text-red-500">{application.rejection_reason}</p>
            )}
            <p className="text-xs mt-1 text-[var(--text-muted)]">You may reapply after improving your profile.</p>
          </div>
        </div>
        <BenefitCards />
        <EligibilityAndForm {...formProps} />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <PageHero />
        <div className="rounded-xl p-8 text-center space-y-3 bg-white shadow-sm" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-4xl">🎉</p>
          <p className="text-lg font-bold text-[var(--text-primary)]">Application Submitted!</p>
          <p className="text-sm text-[var(--text-secondary)]">We review applications within 3–5 business days. You&apos;ll receive an email when a decision is made.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHero />
      <BenefitCards />
      <EligibilityAndForm {...formProps} />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PageHero() {
  return (
    <div className="rounded-2xl p-8 sm:p-10 text-center" style={{
      background: "linear-gradient(135deg,#312e81 0%,#3730a3 60%,#1e1b4b 100%)",
      border: "1px solid rgba(99,102,241,0.3)",
    }}>
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mx-auto mb-4"
        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
        <Crown className="h-7 w-7 text-amber-300" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-white">
        Become a NexLeader
      </h1>
      <p className="text-sm sm:text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.72)" }}>
        Recruit members to your guild and earn <strong className="text-white">10% commission</strong> on every NexCoin they earn — from tasks and offerwalls, automatically.
      </p>
    </div>
  );
}

function BenefitCards() {
  const benefits = [
    {
      icon: NexCoinIcon,
      label: "EARN",
      title: "Passive Commission",
      desc: "Earn 10% of every NexCoin your guild members earn from tasks and offerwalls — automatically.",
      accentColor: "#02b491",
      textColor: "#027a65",
    },
    {
      icon: Crown,
      label: "LEAD",
      title: "Build Your Guild",
      desc: "Lead your own community on NexGuild. Your unique link tracks every member you recruit.",
      accentColor: "#6366f1",
      textColor: "#4338ca",
    },
    {
      icon: TrendingUp,
      label: "GROW",
      title: "Scalable Income",
      desc: "The more active members you have, the more you earn. Commission scales with your guild.",
      accentColor: "#d97706",
      textColor: "#92400e",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {benefits.map((b) => (
        <div key={b.label} className="rounded-xl p-5 space-y-3 bg-white shadow-sm"
          style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${b.accentColor}` }}>
          <div className="flex items-center gap-2">
            <b.icon size={16} style={{ color: b.accentColor }} />
            <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: b.accentColor }}>{b.label}</span>
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)]">{b.title}</p>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{b.desc}</p>
        </div>
      ))}
    </div>
  );
}

function PendingView({ application }: { application: NonNullable<StatusData["application"]> }) {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PageHero />
      <div className="rounded-xl p-6 space-y-4 bg-white shadow-sm" style={{ border: "1px solid #E5E7EB", borderLeft: "4px solid #d97706" }}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
          <p className="font-semibold text-[var(--text-primary)]">Application Under Review</p>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Submitted on {new Date(application.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.<br />
          We review applications within 3–5 business days. You&apos;ll receive an email when a decision is made.
        </p>
        <div className="flex gap-2 pt-1">
          {["Submitted", "Under Review", "Decision"].map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center gap-1">
              <div className="h-2 w-full rounded-full" style={{ background: i === 0 ? "#d97706" : i === 1 ? "#fde68a" : "#E5E7EB" }} />
              <span className="text-xs font-medium" style={{ color: i <= 1 ? "#d97706" : "var(--text-muted)" }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FormProps {
  profile:       StatusData["profile"];
  totalEarned:   number;
  reason:        string;
  setReason:     (v: string) => void;
  community:     string;
  setCommunity:  (v: string) => void;
  recruits:      string;
  setRecruits:   (v: string) => void;
  tncChecked:    boolean;
  setTncChecked: (v: boolean) => void;
  formError:     string;
  submitting:    boolean;
  onSubmit:      (e: React.FormEvent) => void;
}

function EligibilityAndForm(props: FormProps) {
  const {
    profile, totalEarned, reason, setReason, community, setCommunity,
    recruits, setRecruits, tncChecked, setTncChecked, formError, submitting, onSubmit,
  } = props;

  const ageMs   = profile.auth_created_at ? Date.now() - new Date(profile.auth_created_at).getTime() : 0;
  const ageDays = Math.floor(ageMs / 86400000);

  const recruitCount = parseInt(recruits, 10);
  const recruitMet   = !isNaN(recruitCount) && recruitCount >= MIN_RECRUITS;

  const criteria = [
    {
      label:    "Account at least 7 days old",
      met:      ageDays >= MIN_DAYS,
      detail:   `${ageDays} / ${MIN_DAYS} days`,
      progress: Math.min(100, (ageDays / MIN_DAYS) * 100),
      showBar:  ageDays < MIN_DAYS,
    },
    {
      label:    "Earned at least 500 NexCoins",
      met:      totalEarned >= MIN_EARNED,
      detail:   `${totalEarned} / ${MIN_EARNED} NC`,
      progress: Math.min(100, (totalEarned / MIN_EARNED) * 100),
      showBar:  totalEarned < MIN_EARNED,
    },
    {
      label:    "Account in good standing",
      met:      profile.is_active,
      detail:   profile.is_active ? "Active" : "Not active",
      progress: 0,
      showBar:  false,
    },
    {
      label:       "Community of at least 10 people ready to join",
      met:         recruitMet,
      detail:      recruits ? (recruitCount < MIN_RECRUITS ? `Need ${MIN_RECRUITS}+` : `${recruitCount} declared`) : "Self-declared below",
      selfDeclared: true,
      progress:    0,
      showBar:     false,
    },
  ];

  const autoMet = criteria.slice(0, 3).every((c) => c.met);
  const allMet  = autoMet && recruitMet;

  return (
    <div className="space-y-4">
      {/* Eligibility card */}
      <div className="rounded-xl p-5 space-y-4 bg-white shadow-sm" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Eligibility Requirements</p>
        {criteria.map((c) => (
          <div key={c.label} className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={c.met
                  ? { background: "#dcfce7", color: "#16a34a" }
                  : (c as { selfDeclared?: boolean }).selfDeclared
                  ? { background: "#fef3c7", color: "#d97706" }
                  : { background: "#F3F4F6", color: "#9CA3AF" }}>
                {c.met ? <CheckCircle2 className="h-3.5 w-3.5" /> : (c as { selfDeclared?: boolean }).selfDeclared ? <Zap className="h-3 w-3" /> : "○"}
              </span>
              <span className="text-sm flex-1 text-[var(--text-primary)]">
                {c.label}
                {(c as { selfDeclared?: boolean }).selfDeclared && (
                  <span className="ml-1.5 text-xs text-amber-600">(self-declared)</span>
                )}
              </span>
              <span className="text-xs font-medium flex-shrink-0" style={{ color: c.met ? "#16a34a" : "var(--text-muted)" }}>
                {c.detail}
              </span>
            </div>
            {c.showBar && (
              <div className="ml-8 h-1.5 rounded-full overflow-hidden bg-[var(--surface-subtle)]">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${c.progress}%`, background: "linear-gradient(90deg,#6366f1,#02b491)" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Handbook download */}
      <a href="/nexleader-handbook.pdf" download
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium bg-amber-50 transition-opacity hover:opacity-80"
        style={{ border: "1px solid #fde68a", color: "#92400e" }}>
        <BookOpen className="h-4 w-4 flex-shrink-0" />
        Download NexLeader Handbook (PDF)
      </a>

      {!autoMet ? (
        <div className="rounded-xl px-5 py-4 flex items-start gap-3 bg-[var(--surface-subtle)]"
          style={{ border: "1px solid var(--border-default)" }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Meet all eligibility criteria above to unlock the application form.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Agreement */}
          <div className="rounded-xl p-5 space-y-3 bg-indigo-50" style={{ border: "1px solid rgba(99,102,241,0.25)" }}>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-bold text-indigo-700">NexLeader Agreement</p>
            </div>
            <ul className="space-y-1.5 text-xs text-indigo-700">
              <li>• You will earn <strong>10% commission</strong> on all your members&apos; earnings</li>
              <li>• If you are under another NexLeader, <strong>500 NC will be deducted</strong> from your balance as a transfer fee upon approval</li>
              <li>• Your members will never see commission details</li>
              <li>• NexGuild can revoke NexLeader status for policy violations</li>
            </ul>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              Why do you want to become a NexLeader?{" "}
              <span className="font-normal text-xs text-[var(--text-muted)]">(min 100 chars)</span>
            </label>
            <textarea
              required value={reason} onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe your motivation, what community you have, and how you plan to recruit…"
              className="w-full rounded-lg text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 text-[var(--text-primary)]"
              style={{ background: "var(--surface-subtle)", border: "1px solid var(--border-default)" }}
            />
            <p className="text-xs mt-1" style={{ color: reason.length >= 100 ? "#16a34a" : "var(--text-muted)" }}>
              {reason.length} / 100 minimum
            </p>
          </div>

          {/* Community description */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              Describe your community{" "}
              <span className="font-normal text-xs text-[var(--text-muted)]">(min 50 chars)</span>
            </label>
            <textarea
              required value={community} onChange={(e) => setCommunity(e.target.value)}
              rows={3}
              placeholder="WhatsApp group, college batch, Telegram channel, YouTube audience…"
              className="w-full rounded-lg text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 text-[var(--text-primary)]"
              style={{ background: "var(--surface-subtle)", border: "1px solid var(--border-default)" }}
            />
          </div>

          {/* Community size */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              How many people in your community are ready to join NexGuild?{" "}
              <span className="font-normal text-xs text-[var(--text-muted)]">(minimum 10)</span>
            </label>
            <input
              type="number" required min={MIN_RECRUITS}
              value={recruits} onChange={(e) => setRecruits(e.target.value)}
              placeholder="e.g. 25"
              className="w-full h-10 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-[var(--text-primary)]"
              style={{ background: "var(--surface-subtle)", border: `1px solid ${recruitMet ? "#86efac" : "var(--border-default)"}` }}
            />
            {recruits && !recruitMet && <p className="text-xs mt-1 text-red-500">Must be at least {MIN_RECRUITS}</p>}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox" checked={tncChecked} onChange={(e) => setTncChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded flex-shrink-0 accent-indigo-600"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              I have read and agree to the NexLeader Agreement above
            </span>
          </label>

          {formError && (
            <div className="rounded-lg px-4 py-3 text-sm text-red-600 bg-red-50" style={{ border: "1px solid #fca5a5" }}>
              {formError}
            </div>
          )}

          <Button type="submit" disabled={submitting || !tncChecked || !allMet} className="w-full">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit Application"}
          </Button>
        </form>
      )}
    </div>
  );
}
