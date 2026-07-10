"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Loader2, X, CheckCircle2, Tag, ToggleLeft, ToggleRight, Crown, ChevronDown, Globe, RefreshCw, Database, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  joined_at: string;
}

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  discount_coins: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

type MaintenanceSections = Record<string, boolean>;

const TEAM_ROLES = ["admin", "reviewer", "finance", "support", "moderator"] as const;
type TeamRole = typeof TEAM_ROLES[number];

const ROLE_META: Record<string, { label: string; desc: string; badge: string; dot: string }> = {
  owner:       { label: "Owner",       desc: "Full platform control",              badge: "bg-amber-500/15 text-amber-400",    dot: "#f59e0b" },
  admin:       { label: "Admin",       desc: "Full access except ownership",       badge: "bg-violet-500/15 text-violet-400",  dot: "#a78bfa" },
  reviewer:    { label: "Reviewer",    desc: "Review tasks & submissions",         badge: "bg-blue-500/15 text-blue-400",      dot: "#60a5fa" },
  finance:     { label: "Finance",     desc: "Manage payouts & coupons",           badge: "bg-emerald-500/15 text-emerald-400",dot: "#34d399" },
  support:     { label: "Support",     desc: "Handle user support tickets",        badge: "bg-sky-500/15 text-sky-400",        dot: "#38bdf8" },
  moderator:   { label: "Moderator",   desc: "Moderate content & flag abuse",      badge: "bg-orange-500/15 text-orange-400",  dot: "#fb923c" },
  contributor: { label: "Contributor", desc: "Regular platform user",              badge: "bg-[var(--surface-subtle)] text-[var(--text-muted)]", dot: "#6b7280" },
};

const MAINTENANCE_SECTIONS: { key: string; label: string; desc: string }[] = [
  { key: "org",          label: "Organization Side",    desc: "Client-facing pages (/services, /for-organizations, /client)" },
  { key: "contributor",  label: "Contributor Side",     desc: "Earn pages (/earn, /opportunities, /how-it-works, /faq)" },
  { key: "dashboard",    label: "Dashboard",            desc: "Contributor dashboard (/dashboard/*)" },
  { key: "store",        label: "Store",                desc: "NexGuild store (/dashboard/store)" },
  { key: "offerwalls",   label: "Offerwalls",           desc: "Offerwall section (/dashboard/offerwalls)" },
  { key: "nexleader",    label: "NexLeader",            desc: "NexLeader program page (/dashboard/nexleader)" },
  { key: "signup",       label: "New Registrations",    desc: "Prevent new signups (/signup)" },
];

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      style={{ backgroundColor: on ? "#14b8a6" : "#4b5563", transition: "background-color 0.2s ease" }}
      className="h-6 w-11 rounded-full relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2 focus:ring-offset-[var(--surface-card)] disabled:opacity-50"
    >
      <span
        style={{ transform: on ? "translateX(22px)" : "translateX(2px)", transition: "transform 0.2s ease" }}
        className="absolute top-[2px] left-0 h-5 w-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const tokenRef = useRef<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  const [admins, setAdmins]               = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [maintenanceSections, setMaintenanceSections] = useState<MaintenanceSections>({});
  const [togglingSection, setTogglingSection] = useState<string | null>(null);

  // Coupons
  const [coupons, setCoupons]               = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [togglingCoupon, setTogglingCoupon] = useState<string | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<string | null>(null);

  // Add team member modal
  const [showInvite, setShowInvite]     = useState(false);
  const [inviteEmail, setInviteEmail]   = useState("");
  const [inviteRole, setInviteRole]     = useState<TeamRole>("admin");
  const [inviting, setInviting]         = useState(false);
  const [inviteErr, setInviteErr]       = useState<string | null>(null);
  const [inviteOk, setInviteOk]         = useState(false);

  // Inline role change
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Streak settings
  const [streakDailyBonus,    setStreakDailyBonus]    = useState("10");
  const [streakDay7Bonus,     setStreakDay7Bonus]      = useState("50");
  const [streakTasksRequired, setStreakTasksRequired]  = useState("5");
  const [savingStreak, setSavingStreak]                = useState(false);
  const [streakSaved, setStreakSaved]                  = useState(false);
  const [streakErr, setStreakErr]                      = useState<string | null>(null);

  // Signup domains
  const [allowedDomains, setAllowedDomains]       = useState<string[]>(["gmail.com", "outlook.com"]);
  const [newDomain, setNewDomain]                 = useState("");
  const [savingDomains, setSavingDomains]         = useState(false);
  const [domainsSaved, setDomainsSaved]           = useState(false);
  const [domainsErr, setDomainsErr]               = useState<string | null>(null);

  // Exchange rates
  const [nexcoinPerInr, setNexcoinPerInr]         = useState("12.5");
  const [nexcoinPerUsd, setNexcoinPerUsd]         = useState("1000");
  const [savingRates, setSavingRates]             = useState(false);
  const [ratesSaved, setRatesSaved]               = useState(false);
  const [ratesErr, setRatesErr]                   = useState<string | null>(null);

  // Database backup
  const [backingUp, setBackingUp]   = useState(false);
  const [backupMsg, setBackupMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Create coupon modal
  const [showCoupon, setShowCoupon]         = useState(false);
  const [newCode, setNewCode]               = useState("");
  const [discountType, setDiscountType]     = useState<"percent" | "coins">("coins");
  const [discountValue, setDiscountValue]   = useState("");
  const [maxUses, setMaxUses]               = useState("1");
  const [expiresAt, setExpiresAt]           = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [couponErr, setCouponErr]           = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;
      if (!session) return;

      // Get current user's role for owner-check
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setCurrentRole((profile as { role: string } | null)?.role ?? null);
      }

      const [settingsRes, couponsRes] = await Promise.all([
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch("/api/admin/coupons",  { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);

      if (settingsRes.ok) {
        const d = await settingsRes.json() as {
          admins: AdminUser[];
          maintenanceSections: MaintenanceSections;
          streakDailyBonus?: number;
          streakDay7Bonus?: number;
          streakTasksRequired?: number;
          allowedDomains?: string[];
          nexcoinPerInr?: number;
          nexcoinPerUsd?: number;
        };
        setAdmins(d.admins ?? []);
        setMaintenanceSections(d.maintenanceSections ?? {});
        if (d.streakDailyBonus    != null) setStreakDailyBonus(String(d.streakDailyBonus));
        if (d.streakDay7Bonus     != null) setStreakDay7Bonus(String(d.streakDay7Bonus));
        if (d.streakTasksRequired != null) setStreakTasksRequired(String(d.streakTasksRequired));
        if (d.allowedDomains      != null) setAllowedDomains(d.allowedDomains);
        if (d.nexcoinPerInr       != null) setNexcoinPerInr(String(d.nexcoinPerInr));
        if (d.nexcoinPerUsd       != null) setNexcoinPerUsd(String(d.nexcoinPerUsd));
      }
      setLoadingAdmins(false);

      if (couponsRes.ok) {
        const { coupons: data } = await couponsRes.json() as { coupons: Coupon[] };
        setCoupons(data ?? []);
      }
      setLoadingCoupons(false);
    }
    load();
  }, []);

  async function toggleSection(section: string) {
    const next = !maintenanceSections[section];
    setMaintenanceSections((prev) => ({ ...prev, [section]: next }));
    setTogglingSection(section);
    await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "maintenance_section", section, value: next }),
    });
    setTogglingSection(null);
  }

  async function promoteToAdmin(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteErr(null);
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "promote", email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
    });
    const data = await res.json() as { ok?: boolean; admins?: AdminUser[]; error?: string };
    if (!res.ok) { setInviteErr(data.error ?? "Failed to assign role."); setInviting(false); return; }
    setAdmins(data.admins ?? []);
    setInviteOk(true);
    setInviting(false);
  }

  async function changeRole(id: string, newRole: TeamRole) {
    setChangingRole(id);
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "change_role", id, role: newRole }),
    });
    if (res.ok) {
      const data = await res.json() as { admins?: AdminUser[] };
      setAdmins(data.admins ?? []);
    }
    setChangingRole(null);
  }

  async function demoteAdmin(id: string) {
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "demote", id }),
    });
    if (res.ok) setAdmins((prev) => prev.filter((a) => a.id !== id));
  }

  async function toggleCoupon(id: string, current: boolean) {
    setTogglingCoupon(id);
    const next = !current;
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, is_active: next } : c));
    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ action: "toggle", id, is_active: next }),
    });
    setTogglingCoupon(null);
  }

  async function deleteCoupon(id: string) {
    setDeletingCoupon(id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({ action: "delete", id }),
    });
    setDeletingCoupon(null);
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponErr(null);
    if (!newCode.trim()) { setCouponErr("Code is required."); return; }
    const val = parseInt(discountValue, 10);
    if (isNaN(val) || val <= 0) { setCouponErr("Discount value must be a positive number."); return; }
    setCreatingCoupon(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        action: "create",
        code: newCode.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: val,
        max_uses: parseInt(maxUses, 10) || 1,
        expires_at: expiresAt || null,
      }),
    });
    const data = await res.json() as { coupon?: Coupon; error?: string };
    if (!res.ok || data.error) {
      setCouponErr(data.error ?? "Failed to create coupon.");
    } else {
      setCoupons((prev) => [data.coupon!, ...prev]);
      setShowCoupon(false);
      setNewCode(""); setDiscountType("coins"); setDiscountValue(""); setMaxUses("1"); setExpiresAt("");
    }
    setCreatingCoupon(false);
  }

  async function saveStreakSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingStreak(true);
    setStreakErr(null);
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "update_streak_settings", dailyBonus: streakDailyBonus, day7Bonus: streakDay7Bonus, tasksRequired: streakTasksRequired }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      setStreakErr(data.error ?? "Failed to save.");
    } else {
      setStreakSaved(true);
      setTimeout(() => setStreakSaved(false), 3000);
    }
    setSavingStreak(false);
  }

  function addDomain() {
    const d = newDomain.trim().toLowerCase().replace(/^@/, "");
    if (!d || !d.includes(".")) { setDomainsErr("Enter a valid domain like gmail.com"); return; }
    if (allowedDomains.includes(d)) { setDomainsErr("Domain already in list."); return; }
    setAllowedDomains((prev) => [...prev, d]);
    setNewDomain("");
    setDomainsErr(null);
  }

  function removeDomain(d: string) {
    if (allowedDomains.length <= 1) { setDomainsErr("At least one domain must remain."); return; }
    setAllowedDomains((prev) => prev.filter((x) => x !== d));
    setDomainsErr(null);
  }

  async function saveDomains(e: React.FormEvent) {
    e.preventDefault();
    setSavingDomains(true);
    setDomainsErr(null);
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "update_signup_domains", domains: allowedDomains }),
    });
    const data = await res.json() as { error?: string; allowedDomains?: string[] };
    if (!res.ok) {
      setDomainsErr(data.error ?? "Failed to save.");
    } else {
      if (data.allowedDomains) setAllowedDomains(data.allowedDomains);
      setDomainsSaved(true);
      setTimeout(() => setDomainsSaved(false), 3000);
    }
    setSavingDomains(false);
  }

  async function handleBackup() {
    setBackingUp(true);
    setBackupMsg(null);
    const res = await fetch("/api/admin/backup", {
      method:  "POST",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
    const data = await res.json() as { ok?: boolean; message?: string; error?: string };
    setBackupMsg({
      ok:   res.ok && !!data.ok,
      text: data.message ?? data.error ?? (res.ok ? "Backup triggered." : "Backup failed."),
    });
    setBackingUp(false);
  }

  async function saveExchangeRates(e: React.FormEvent) {
    e.preventDefault();
    setSavingRates(true);
    setRatesErr(null);
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ action: "update_exchange_rates", nexcoinPerInr, nexcoinPerUsd }),
    });
    const data = await res.json() as { error?: string };
    if (!res.ok) {
      setRatesErr(data.error ?? "Failed to save.");
    } else {
      setRatesSaved(true);
      setTimeout(() => setRatesSaved(false), 3000);
    }
    setSavingRates(false);
  }

  const isOwner = currentRole === "owner";
  const isOwnerOrAdmin = currentRole === "owner" || currentRole === "admin";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Platform-wide configuration and admin management.</p>
      </div>

      {/* Platform Config */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Platform Configuration</h2>
        </div>
        {[
          { label: "Minimum Withdrawal",        value: "N/A (NexCoins only)",  desc: "Cash withdrawals replaced by voucher redemption" },
          { label: "Max Active Tasks per User",  value: "5",                    desc: "Simultaneous in-progress tasks allowed" },
          { label: "Assignment Review SLA",      value: "48 hours",             desc: "Target time to review submitted assignments" },
          { label: "Submission Review SLA",      value: "72 hours",             desc: "Target time to review submitted work" },
        ].map((item) => (
          <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)] flex-shrink-0">{item.value}</span>
          </div>
        ))}
      </section>

      {/* Section Maintenance — owner only */}
      {isOwner && (
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
          <div className="px-6 py-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Section Maintenance</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Toggle maintenance mode per platform section. Active sections show a maintenance page to visitors.</p>
          </div>
          {MAINTENANCE_SECTIONS.map(({ key, label, desc }) => {
            const on = maintenanceSections[key] ?? false;
            return (
              <div key={key} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                    {on && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
                <Toggle
                  on={on}
                  onToggle={() => toggleSection(key)}
                  disabled={togglingSection === key}
                />
              </div>
            );
          })}
        </section>
      )}

      {/* Team & Roles */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Team &amp; Roles</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {isOwner ? "Assign roles to team members. Only the owner can make changes." : "Only the owner can manage team roles."}
            </p>
          </div>
          {isOwner && (
            <Button size="sm" variant="secondary" onClick={() => { setShowInvite(true); setInviteOk(false); setInviteErr(null); setInviteEmail(""); setInviteRole("admin"); }}>
              <Plus className="h-3.5 w-3.5" /> Add Member
            </Button>
          )}
        </div>
        {loadingAdmins ? (
          <div className="px-6 py-6 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-6 text-sm text-[var(--text-muted)]">No team members found.</div>
        ) : (
          admins.map((member) => {
            const isOwnerAccount = member.role === "owner";
            const meta = ROLE_META[member.role] ?? ROLE_META.contributor;
            return (
              <div key={member.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{member.full_name ?? "—"}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${meta.badge}`}>
                      {isOwnerAccount && <Crown className="h-3 w-3" />}
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {member.email} · Since {new Date(member.joined_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </p>
                </div>
                {isOwner && !isOwnerAccount && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Inline role dropdown */}
                    <div className="relative">
                      <select
                        value={member.role}
                        disabled={changingRole === member.id}
                        onChange={(e) => changeRole(member.id, e.target.value as TeamRole)}
                        className="appearance-none h-8 pl-3 pr-7 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)] disabled:opacity-50 cursor-pointer"
                      >
                        {TEAM_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_META[r].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)]" />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => demoteAdmin(member.id)}
                      title="Remove from team"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Coupon Management */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Coupon Codes</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Create discount coupons contributors can apply in the store cart.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setShowCoupon(true); setCouponErr(null); }}>
            <Plus className="h-3.5 w-3.5" /> New Coupon
          </Button>
        </div>

        {loadingCoupons ? (
          <div className="px-6 py-6 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : coupons.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Tag className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">No coupons yet. Create one to get started.</p>
          </div>
        ) : (
          coupons.map((c) => {
            const expired   = c.expires_at && new Date(c.expires_at) < new Date();
            const exhausted = c.max_uses > 0 && c.used_count >= c.max_uses;
            return (
              <div key={c.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono font-semibold text-[var(--brand-500)]">{c.code}</code>
                    {!c.is_active  && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-default)]">Inactive</span>}
                    {expired       && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">Expired</span>}
                    {exhausted && !expired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Exhausted</span>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {c.discount_percent > 0 ? `${c.discount_percent}% off` : `${c.discount_coins.toLocaleString()} coins off`}
                    {" · "}{c.used_count}/{c.max_uses === 0 ? "∞" : c.max_uses} uses
                    {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleCoupon(c.id, c.is_active)}
                    disabled={togglingCoupon === c.id}
                    className="text-[var(--text-muted)] hover:text-[var(--brand-500)] transition-colors disabled:opacity-50"
                    title={c.is_active ? "Deactivate" : "Activate"}
                  >
                    {c.is_active
                      ? <ToggleRight className="h-5 w-5 text-[var(--brand-500)]" />
                      : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    disabled={deletingCoupon === c.id}
                    className="text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete coupon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Streak Rewards */}
      {isOwner && (
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
          <div className="px-6 py-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Streak Rewards</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">NexCoins awarded to contributors for daily submission streaks.</p>
          </div>
          <form onSubmit={saveStreakSettings} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Tasks required per day</label>
                <input
                  type="number"
                  min="1"
                  value={streakTasksRequired}
                  onChange={(e) => setStreakTasksRequired(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Tasks needed to unlock daily claim</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Daily Bonus (coins)</label>
                <input
                  type="number"
                  min="1"
                  value={streakDailyBonus}
                  onChange={(e) => setStreakDailyBonus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Awarded each day contributor claims streak</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Day 7 Milestone (coins)</label>
                <input
                  type="number"
                  min="1"
                  value={streakDay7Bonus}
                  onChange={(e) => setStreakDay7Bonus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Bonus awarded instead on day 7 (streak resets)</p>
              </div>
            </div>
            {streakErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{streakErr}</p>}
            {streakSaved && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
                <CheckCircle2 className="h-4 w-4" /> Streak settings saved.
              </div>
            )}
            <Button type="submit" size="sm" disabled={savingStreak}>
              {savingStreak ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Streak Settings"}
            </Button>
          </form>
        </section>
      )}

      {/* Signup Domains — owner + admin */}
      {isOwnerOrAdmin && (
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--brand-500)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Signup Domains</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Only email addresses from these domains can register. Individual exceptions are managed via the signup_exceptions table.
            </p>
          </div>
          <form onSubmit={saveDomains} className="px-6 py-5 space-y-4">
            {/* Current domain list */}
            <div className="flex flex-wrap gap-2">
              {allowedDomains.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]"
                >
                  @{d}
                  <button
                    type="button"
                    onClick={() => removeDomain(d)}
                    className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    title={`Remove @${d}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            {/* Add new domain */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDomain(); } }}
                placeholder="e.g. yahoo.com or company.org"
                className="flex-1 h-9 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
              />
              <button
                type="button"
                onClick={addDomain}
                className="h-9 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--brand-500)] hover:border-[var(--brand-500)] transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {domainsErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{domainsErr}</p>}
            {domainsSaved && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
                <CheckCircle2 className="h-4 w-4" /> Signup domains saved.
              </div>
            )}
            <Button type="submit" size="sm" disabled={savingDomains}>
              {savingDomains ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Domains"}
            </Button>
          </form>
        </section>
      )}

      {/* Exchange Rates — owner only */}
      {isOwner && (
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[var(--brand-500)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">NexCoin Exchange Rates</h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Controls the auto-calculated NexCoin price in the Voucher Catalog. Changing rates does NOT retroactively update already-set voucher prices.
            </p>
          </div>
          <form onSubmit={saveExchangeRates} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">NexCoins per ₹1 (INR)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={nexcoinPerInr}
                  onChange={(e) => setNexcoinPerInr(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">₹100 voucher = {(parseFloat(nexcoinPerInr) || 12.5) * 100} NexCoins</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">NexCoins per $1 (USD)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={nexcoinPerUsd}
                  onChange={(e) => setNexcoinPerUsd(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">$10 voucher = {(parseFloat(nexcoinPerUsd) || 1000) * 10} NexCoins</p>
              </div>
            </div>
            {ratesErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{ratesErr}</p>}
            {ratesSaved && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
                <CheckCircle2 className="h-4 w-4" /> Exchange rates saved.
              </div>
            )}
            <Button type="submit" size="sm" disabled={savingRates}>
              {savingRates ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Rates"}
            </Button>
          </form>
        </section>
      )}

      {/* Database Backup — owner only */}
      {isOwner && (
        <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-[var(--brand-500)] mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-[var(--text-primary)]">Database Backup</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Automated daily backup at 2&nbsp;AM IST via GitHub Actions. Last 7 backups kept in Google Drive.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={backingUp}
              onClick={handleBackup}
              className="flex-shrink-0"
            >
              {backingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Backup Now"}
            </Button>
          </div>
          {backupMsg && (
            <div className={`px-6 py-3 text-sm flex items-center gap-2 ${backupMsg.ok ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
              {backupMsg.ok
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                : <AlertCircle  className="h-4 w-4 flex-shrink-0" />}
              {backupMsg.text}
            </div>
          )}
        </section>
      )}

      {/* ── Add Team Member Modal ──────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Team Member</h2>
              <button onClick={() => setShowInvite(false)}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            {inviteOk ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">Role assigned</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  The user has been assigned the <span className={`font-semibold ${ROLE_META[inviteRole]?.badge ?? ""} px-1 rounded`}>{ROLE_META[inviteRole]?.label}</span> role.
                </p>
                <Button className="w-full mt-2" onClick={() => setShowInvite(false)}>Done</Button>
              </div>
            ) : (
              <form onSubmit={promoteToAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">User Email</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">The user must already have an account on NexGuild.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Role</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {TEAM_ROLES.map((r) => {
                      const m = ROLE_META[r];
                      const selected = inviteRole === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setInviteRole(r)}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                            selected
                              ? "border-[var(--brand-500)] bg-[var(--brand-50)]"
                              : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <span
                            className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: m.dot }}
                          />
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{m.label}</p>
                            <p className="text-xs text-[var(--text-muted)]">{m.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {inviteErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{inviteErr}</p>}
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={inviting}>
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Role"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Create Coupon Modal ──────────────────────────────────────── */}
      {showCoupon && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Coupon</h2>
              <button onClick={() => setShowCoupon(false)}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            <form onSubmit={createCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Code</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER25"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Discount Type</label>
                <div className="flex gap-2">
                  {(["coins", "percent"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDiscountType(t)}
                      className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                        discountType === t
                          ? "bg-[var(--brand-500)] text-white border-[var(--brand-500)]"
                          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--brand-500)]"
                      }`}
                    >
                      {t === "coins" ? "Fixed Coins" : "Percentage"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  {discountType === "percent" ? "Percentage (e.g. 10)" : "Coins off (e.g. 500)"}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={discountType === "percent" ? "100" : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percent" ? "10" : "500"}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Expires (optional)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                </div>
              </div>
              {couponErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{couponErr}</p>}
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCoupon(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={creatingCoupon}>
                  {creatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
