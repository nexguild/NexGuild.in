"use client";

import { useEffect, useState } from "react";
import {
  Share2, Copy, CheckCheck, Users, Coins, ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface ReferralEntry {
  masked_name:           string;
  joined_at:             string;
  milestone_reached:     boolean;
  offerwall_earnings:    number;
  earnings_for_referrer: number;
}

interface ReferralData {
  referral_code:           string | null;
  total_referrals:         number;
  total_referral_earnings: number;
  referrals:               ReferralEntry[];
}

const MILESTONE = 1_000;

function maskName(s: string) {
  if (s.length <= 1) return s + "***";
  return s[0] + "***" + s[s.length - 1];
}

export default function ReferralsPage() {
  const [data, setData]       = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const res = await fetch("/api/referral/data", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json as ReferralData);
      }
      setLoading(false);
    }
    load();
  }, []);

  const referralLink = data?.referral_code
    ? `https://nexguild.in/signup?ref=${data.referral_code}`
    : null;

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Refer &amp; Earn</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          Share your link. Earn NexCoins when your friends join and complete surveys.
        </p>
      </div>

      {/* ── Your Referral Link ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
        <h2 className="font-bold text-[var(--text-primary)]">Your Referral Link</h2>

        {loading ? (
          <div className="h-10 rounded-lg bg-[var(--surface-subtle)] animate-pulse" />
        ) : referralLink ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 px-3 flex items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] overflow-hidden">
                <span className="text-sm text-[var(--text-secondary)] truncate font-mono">{referralLink}</span>
              </div>
              <Button size="sm" variant="secondary" onClick={copyLink} className="flex-shrink-0 gap-1.5">
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">People Referred</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.total_referrals ?? 0}</p>
              </div>
              <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4">
                <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1">
                  <Coins className="h-4 w-4" />
                  <span className="text-xs font-medium">NexCoins Earned</span>
                </div>
                <p className="text-2xl font-bold text-[var(--brand-500)]">{data?.total_referral_earnings ?? 0}</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Your referral code is being generated — check back shortly.</p>
        )}
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
        <h2 className="font-bold text-[var(--text-primary)]">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Share your link",
              desc: "Send your unique referral link to friends, family, or your community.",
              color: "text-[var(--brand-500)]",
              bg: "bg-[rgba(20,184,166,0.08)]",
            },
            {
              step: "2",
              title: "They sign up",
              desc: "You earn +100 NexCoins the moment they create a verified account.",
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              step: "3",
              title: "They complete surveys",
              desc: "You earn an extra +250 NexCoins when they hit 1,000 NexCoins from offerwalls.",
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-lg border border-[var(--border-default)] p-4 space-y-2">
              <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${item.bg} ${item.color} text-sm font-bold`}>
                {item.step}
              </div>
              <p className="font-semibold text-sm text-[var(--text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-[rgba(20,184,166,0.06)] border border-[rgba(20,184,166,0.15)] p-3 text-sm text-[var(--text-secondary)]">
          Maximum earnings per referred user: <span className="font-bold text-[var(--brand-500)]">350 NexCoins</span>
          <span className="text-[var(--text-muted)]"> (100 on signup + 250 milestone)</span>
        </div>
      </section>

      {/* ── Your Referrals ────────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
        <h2 className="font-bold text-[var(--text-primary)]">Your Referrals</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] animate-pulse" />
            ))}
          </div>
        ) : !data?.referrals.length ? (
          <div className="py-10 text-center">
            <Share2 className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">No referrals yet — share your link to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  {["User", "Joined", "Status", "Your Earnings"].map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-default)]">
                {data.referrals.map((r, i) => {
                  const progress = Math.min(100, Math.round((r.offerwall_earnings / MILESTONE) * 100));
                  return (
                    <tr key={i} className="hover:bg-[var(--surface-subtle)] transition-colors">
                      <td className="py-3 px-2 font-medium text-[var(--text-primary)]">{r.masked_name}</td>
                      <td className="py-3 px-2 text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(r.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-2">
                        {r.milestone_reached ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
                            Milestone reached ✓
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-xs text-[var(--text-muted)]">
                              {r.offerwall_earnings}/{MILESTONE} NexCoins
                            </span>
                            <div className="h-1.5 w-24 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[var(--brand-500)]"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 font-semibold text-[var(--brand-500)] whitespace-nowrap">
                        {r.earnings_for_referrer} NexCoins
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Terms & Conditions ────────────────────────────────────────── */}
      <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <h2 className="font-bold text-[var(--text-primary)]">Referral Program Terms &amp; Conditions</h2>
        </div>

        <div className="space-y-4 text-sm text-[var(--text-secondary)]">
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Rewards</p>
            <ul className="space-y-1 list-disc list-inside text-[var(--text-secondary)]">
              <li>You earn <strong className="text-[var(--text-primary)]">100 NexCoins</strong> when someone signs up using your unique referral link</li>
              <li>You earn an additional <strong className="text-[var(--text-primary)]">250 NexCoins</strong> when your referred user earns 1,000 NexCoins from offerwall surveys (CPX Research, TheoremReach, and future providers)</li>
              <li>The 250 NexCoins milestone bonus is paid <strong className="text-[var(--text-primary)]">once per referred user</strong></li>
              <li>Offerwall earnings only — task-based earnings do not count toward the milestone</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">Eligibility</p>
            <ul className="space-y-1 list-disc list-inside text-[var(--text-secondary)]">
              <li>You must have an active NexGuild account in good standing</li>
              <li>The referred user must sign up using your unique link</li>
              <li>You cannot refer yourself or create multiple accounts to earn referral bonuses</li>
              <li>Referred users must be new to NexGuild — existing users do not qualify</li>
            </ul>
          </div>

          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-2">
            <p className="font-semibold text-red-400">Fraud Warning</p>
            <p>
              Attempting to manipulate the referral system — including creating fake accounts,
              using bots, or coordinating artificial survey completions — will result in:
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Immediate account ban for all involved accounts</li>
              <li>Permanent forfeiture of all NexCoins (earned and referral bonuses)</li>
              <li>Reversal of any voucher redemptions pending fulfillment</li>
            </ul>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              NexGuild uses automated fraud detection across all offerwall completions.
              Suspicious patterns are flagged automatically and reviewed by our team.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">General</p>
            <ul className="space-y-1 list-disc list-inside text-[var(--text-secondary)]">
              <li>NexGuild reserves the right to modify or discontinue the referral program at any time</li>
              <li>NexCoins earned through referrals follow the same redemption rules as regularly earned coins</li>
              <li>NexGuild&apos;s decision on referral reward disputes is final</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
