"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, Plus, Star } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface Profile {
  full_name: string | null;
  country: string | null;
  phone: string | null;
  joined_at: string | null;
  nexcoins: number;
  xp: number | null;
  level: number | null;
  skills: string[] | null;
  languages: string[] | null;
  avatar_url: string | null;
}

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Singapore", "UAE", "Bangladesh", "Pakistan",
  "Sri Lanka", "Nepal", "Philippines", "Other",
];

export default function ProfilePage() {
  const [email, setEmail]       = useState<string | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [userId, setUserId]     = useState<string | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tasksCompleted, setTasksCompleted] = useState<number | null>(null);
  const [approvalRate, setApprovalRate]     = useState<number | null>(null);
  const [totalEarned, setTotalEarned]       = useState<number | null>(null);

  // File input ref for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [showEdit, setShowEdit]     = useState(false);
  const [skillInput, setSkillInput]   = useState("");
  const [skillSaving, setSkillSaving] = useState(false);
  const [langInput, setLangInput]     = useState("");
  const [langSaving, setLangSaving]   = useState(false);
  const [editName, setEditName]     = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPhone, setEditPhone]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      setUserId(user.id);

      const [
        { data },
        { count: approvedCount },
        { count: reviewedCount },
        { data: txnData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, country, phone, joined_at, nexcoins, xp, level, skills, languages, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contributor_id", user.id)
          .eq("status", "approved"),
        supabase
          .from("submissions")
          .select("*", { count: "exact", head: true })
          .eq("contributor_id", user.id)
          .in("status", ["approved", "rejected"]),
        supabase
          .from("coin_transactions")
          .select("amount")
          .eq("contributor_id", user.id)
          .eq("type", "earned"),
      ]);

      const approved = approvedCount ?? 0;
      const reviewed = reviewedCount ?? 0;
      setTasksCompleted(approved);
      setApprovalRate(reviewed > 0 ? Math.round((approved / reviewed) * 100) : null);
      setTotalEarned((txnData ?? []).reduce((s: number, t: { amount: number }) => s + (t.amount ?? 0), 0));

      setProfile(data ?? { full_name: null, country: null, phone: null, joined_at: null, nexcoins: 0, xp: 0, level: 1, skills: [], languages: [], avatar_url: null });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setUploadError("Upload failed. Please try again.");
      console.error("[avatar] upload error:", uploadErr.message);
      setUploading(false);
      // Reset file input so the same file can be retried
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    if (updateErr) {
      setUploadError("Saved image but failed to update profile.");
      console.error("[avatar] profile update error:", updateErr.message);
    } else {
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
      // Notify the dashboard header (same tab) so it updates without a page refresh
      window.dispatchEvent(new CustomEvent("nexguild:avatar-updated", { detail: { url: publicUrl } }));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

  async function addLanguage(e: React.FormEvent) {
    e.preventDefault();
    const lang = langInput.trim();
    if (!lang || !userId) return;
    const current = profile?.languages ?? [];
    if (current.includes(lang)) { setLangInput(""); return; }
    setLangSaving(true);
    const updated = [...current, lang];
    const { error } = await supabase.from("profiles").update({ languages: updated }).eq("id", userId);
    if (error) {
      console.error("[profile] addLanguage error:", error.message);
    } else {
      setProfile((prev) => prev ? { ...prev, languages: updated } : prev);
      setLangInput("");
    }
    setLangSaving(false);
  }

  async function removeLanguage(lang: string) {
    if (!userId) return;
    const updated = (profile?.languages ?? []).filter((l) => l !== lang);
    const { error } = await supabase.from("profiles").update({ languages: updated }).eq("id", userId);
    if (!error) setProfile((prev) => prev ? { ...prev, languages: updated } : prev);
    else console.error("[profile] removeLanguage error:", error.message);
  }

  const level      = profile?.level ?? 1;
  const xp         = profile?.xp ?? 0;
  const xpInLevel  = xp % 1000;
  const xpPct      = (xpInLevel / 1000) * 100;

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
          {/* Avatar with camera button */}
          <div className="relative flex-shrink-0">
            <Avatar src={profile?.avatar_url} name={initials} size="lg" />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-[var(--brand-500)] flex items-center justify-center border-2 border-[var(--surface-card)] hover:bg-[var(--brand-400)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Change profile picture"
            >
              {uploading
                ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                : <Camera className="h-3.5 w-3.5 text-white" />
              }
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {loading ? "Loading…" : displayName}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {loading ? "—" : (email ?? "—")}
                </p>
              </div>
              {!loading && (
                <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-3 py-1.5 flex-shrink-0">
                  <Star className="h-3.5 w-3.5 text-[var(--brand-500)]" />
                  <span className="text-sm font-bold text-[var(--text-primary)]">Level {level}</span>
                </div>
              )}
            </div>
            {!loading && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>{xpInLevel.toLocaleString()} / 1,000 XP</span>
                  <span>Next level</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${xpPct}%`, background: "linear-gradient(90deg,#02b491,#029470)" }}
                  />
                </div>
              </div>
            )}
            {uploadError && (
              <p className="text-xs text-red-400 mt-1">{uploadError}</p>
            )}
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
          <NexCoinIcon size={20} />
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

      {/* Languages */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-1">Languages</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Add languages you speak fluently — used to match you with language-specific tasks.</p>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {(profile?.languages ?? []).map((lang) => (
            <span key={lang} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
              {lang}
              <button onClick={() => removeLanguage(lang)} className="hover:text-red-400 transition-colors leading-none ml-0.5">×</button>
            </span>
          ))}
          {!loading && (profile?.languages ?? []).length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No languages added yet.</p>
          )}
        </div>
        <form onSubmit={addLanguage} className="flex gap-2">
          <input
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            placeholder="e.g. English, Hindi, Tamil…"
            className="flex-1 h-9 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          />
          <Button type="submit" size="sm" disabled={langSaving || !langInput.trim()}>
            {langSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {/* Lifetime Stats */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <h3 className="font-semibold text-[var(--text-primary)] mb-4">Lifetime Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Tasks Completed",
              value: loading || tasksCompleted === null ? "—" : tasksCompleted.toLocaleString(),
            },
            {
              label: "Approval Rate",
              value: loading || approvalRate === null ? (loading ? "—" : "N/A") : `${approvalRate}%`,
            },
            {
              label: "Member Since",
              value: loading ? "—" : (profile?.joined_at
                ? new Date(profile.joined_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                : "—"),
            },
            {
              label: "Total Earned",
              value: loading || totalEarned === null ? "—" : totalEarned.toLocaleString(),
              isCoins: true,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-[var(--surface-subtle)] px-4 py-3 text-center">
              <p className="text-xs text-[var(--text-muted)] mb-1.5">{stat.label}</p>
              <div className="flex items-center justify-center gap-1">
                {stat.isCoins && !loading && <NexCoinIcon size={14} />}
                <p className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              </div>
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
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Country</label>
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
