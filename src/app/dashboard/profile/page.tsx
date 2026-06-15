"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Coins, X, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Profile {
  full_name: string | null;
  country: string | null;
  phone: string | null;
  joined_at: string | null;
  nexcoins: number;
  skills: string[] | null;
}

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Singapore", "UAE", "Bangladesh", "Pakistan",
  "Sri Lanka", "Nepal", "Philippines", "Other",
];

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skillSaving, setSkillSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, country, phone, joined_at, nexcoins, skills")
        .eq("id", user.id)
        .single();

      setProfile(data ?? { full_name: null, country: null, phone: null, joined_at: null, nexcoins: 0, skills: [] });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  function openEdit() {
    setEditName(profile?.full_name ?? "");
    setEditCountry(profile?.country ?? "");
    setEditPhone(profile?.phone ?? "");
    setSaveError(null);
    setShowEdit(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName.trim() || null,
        country: editCountry || null,
        phone: editPhone.trim() || null,
      })
      .eq("id", userId);

    if (error) {
      setSaveError("Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    setProfile((prev) => prev
      ? { ...prev, full_name: editName.trim() || null, country: editCountry || null, phone: editPhone.trim() || null }
      : prev);
    setSaving(false);
    setShowEdit(false);
  }

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    const skill = skillInput.trim();
    if (!skill || !userId) return;
    const current = profile?.skills ?? [];
    if (current.includes(skill)) { setSkillInput(""); return; }
    setSkillSaving(true);
    const updated = [...current, skill];
    const { error } = await supabase.from("profiles").update({ skills: updated }).eq("id", userId);
    if (error) {
      console.error("[profile] addSkill error:", error.message);
    } else {
      setProfile((prev) => prev ? { ...prev, skills: updated } : prev);
      setSkillInput("");
    }
    setSkillSaving(false);
  }

  async function removeSkill(skill: string) {
    if (!userId) return;
    const updated = (profile?.skills ?? []).filter((s) => s !== skill);
    const { error } = await supabase.from("profiles").update({ skills: updated }).eq("id", userId);
    if (!error) setProfile((prev) => prev ? { ...prev, skills: updated } : prev);
    else console.error("[profile] removeSkill error:", error.message);
  }

  const displayName = profile?.full_name ?? email ?? "—";
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "?");

  const joinedDate = profile?.joined_at
    ? new Date(profile.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)]">Your contributor profile and account details.</p>
      </div>

      {/* Profile Header */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <Avatar name={initials} size="lg" />
            <button className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[var(--brand-500)] flex items-center justify-center border-2 border-[var(--surface-card)]">
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {loading ? "Loading…" : displayName}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {loading ? "—" : (email ?? "—")}
            </p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={openEdit} disabled={loading}>
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Account Details</h3>
        </div>
        {[
          { label: "Full Name",    value: loading ? "Loading…" : (profile?.full_name ?? "Not set") },
          { label: "Email",        value: loading ? "Loading…" : (email ?? "—") },
          { label: "Country",      value: loading ? "Loading…" : (profile?.country ?? "Not set") },
          { label: "Phone",        value: loading ? "Loading…" : (profile?.phone ?? "Not set") },
          { label: "Member Since", value: loading ? "Loading…" : joinedDate },
        ].map((row) => (
          <div key={row.label} className="px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)] w-32 flex-shrink-0">{row.label}</p>
            <p className="text-sm text-[var(--text-primary)] text-right">{row.value}</p>
          </div>
        ))}
      </div>

      {/* NexCoins Balance */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-[var(--brand-500)]" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">NexCoins Balance</p>
            <p className="text-xs text-[var(--text-muted)]">Redeem in the store for vouchers</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-[var(--brand-500)]">
          {loading ? "—" : (profile?.nexcoins ?? 0).toLocaleString()}
        </p>
      </div>

      {/* Skills */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {(profile?.skills ?? []).map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-100)] text-[var(--brand-500)] text-sm font-medium">
              {skill}
              <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors leading-none ml-0.5">×</button>
            </span>
          ))}
          {!loading && (profile?.skills ?? []).length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No skills added yet.</p>
          )}
        </div>
        <form onSubmit={addSkill} className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="e.g. Transcription, Data Annotation…"
            className="flex-1 h-9 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          />
          <Button type="submit" size="sm" disabled={skillSaving || !skillInput.trim()}>
            {skillSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-xs text-[var(--text-muted)] mt-2">Skills help match you with relevant project opportunities.</p>
      </div>

      {/* Reputation */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Reputation</h3>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--surface-subtle)] px-2 py-1 rounded-full">Coming in V2</span>
        </div>
        <div className="grid grid-cols-3 gap-4 opacity-50">
          {[
            { label: "Tier",          value: "—" },
            { label: "Approval Rate", value: "—" },
            { label: "Tasks Done",    value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Edit Profile</h2>
              <button onClick={() => setShowEdit(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Country
                </label>
                <select
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Phone <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 99999 00000"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                />
              </div>

              {saveError && (
                <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{saveError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowEdit(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
