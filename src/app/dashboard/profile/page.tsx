"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2, Plus, Star, Copy, CheckCheck, Crown, CheckCircle2, Calendar, User } from "lucide-react";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import Link from "next/link";
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
  is_nexleader: boolean | null;
}

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Singapore", "UAE", "Bangladesh", "Pakistan",
  "Sri Lanka", "Nepal", "Philippines", "Other",
];

const SUGGESTED_SKILLS = [
  "Transcription", "Data Entry", "Data Annotation", "App Testing",
  "Game Testing", "Web Research", "Audio Recording", "Survey Completion",
  "Content Writing", "Translation", "Proofreading", "Social Media",
  "Image Labeling", "Video Review", "Voice Recording", "Copywriting",
  "Subtitling", "Product Review",
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
  const [copiedId, setCopiedId]             = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEdit, setShowEdit]       = useState(false);
  const [skillInput, setSkillInput]   = useState("");
  const [skillSaving, setSkillSaving] = useState(false);
  const [langInput, setLangInput]     = useState("");
  const [langSaving, setLangSaving]   = useState(false);
  const [editName, setEditName]       = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPhone, setEditPhone]     = useState("");
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

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
          .select("full_name, country, phone, joined_at, nexcoins, xp, level, skills, languages, avatar_url, is_nexleader")
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

      setProfile(data ?? { full_name: null, country: null, phone: null, joined_at: null, nexcoins: 0, xp: 0, level: 1, skills: [], languages: [], avatar_url: null, is_nexleader: null });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5 MB."); return; }

    setUploading(true);
    setUploadError(null);

    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setUploadError("Upload failed. Please try again.");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
    if (updateErr) {
      setUploadError("Saved image but failed to update profile.");
    } else {
      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
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
    const { error } = await supabase.from("profiles").update({
      full_name: editName.trim() || null,
      country: editCountry || null,
      phone: editPhone.trim() || null,
    }).eq("id", userId);
    if (error) { setSaveError("Failed to save. Please try again."); setSaving(false); return; }
    setProfile((prev) => prev ? { ...prev, full_name: editName.trim() || null, country: editCountry || null, phone: editPhone.trim() || null } : prev);
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
    if (!error) { setProfile((prev) => prev ? { ...prev, skills: updated } : prev); setSkillInput(""); }
    setSkillSaving(false);
  }

  async function addSkillByValue(skill: string) {
    if (!skill || !userId) return;
    const current = profile?.skills ?? [];
    if (current.includes(skill)) return;
    setSkillSaving(true);
    const updated = [...current, skill];
    const { error } = await supabase.from("profiles").update({ skills: updated }).eq("id", userId);
    if (!error) setProfile((prev) => prev ? { ...prev, skills: updated } : prev);
    setSkillSaving(false);
  }

  async function removeSkill(skill: string) {
    if (!userId) return;
    const updated = (profile?.skills ?? []).filter((s) => s !== skill);
    const { error } = await supabase.from("profiles").update({ skills: updated }).eq("id", userId);
    if (!error) setProfile((prev) => prev ? { ...prev, skills: updated } : prev);
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
    if (!error) { setProfile((prev) => prev ? { ...prev, languages: updated } : prev); setLangInput(""); }
    setLangSaving(false);
  }

  async function removeLanguage(lang: string) {
    if (!userId) return;
    const updated = (profile?.languages ?? []).filter((l) => l !== lang);
    const { error } = await supabase.from("profiles").update({ languages: updated }).eq("id", userId);
    if (!error) setProfile((prev) => prev ? { ...prev, languages: updated } : prev);
  }

  const level     = profile?.level ?? 1;
  const xp        = profile?.xp ?? 0;
  const xpInLevel = xp % 1000;
  const xpPct     = (xpInLevel / 1000) * 100;

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

      {/* ── Premium Hero Card ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-teal-500 p-6 text-white shadow-lg">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/5" />

        {/* Edit button — top right */}
        <button
          onClick={openEdit}
          disabled={loading}
          className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:opacity-50"
        >
          ✏️ Edit Profile
        </button>

        <div className="relative flex items-start gap-5 flex-wrap sm:flex-nowrap">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-indigo-400 to-teal-400 flex items-center justify-center">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{initials}</span>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-md border-2 border-indigo-100 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-60"
              title="Change profile picture"
            >
              {uploading
                ? <Loader2 className="h-3.5 w-3.5 text-slate-600 animate-spin" />
                : <Camera className="h-3.5 w-3.5 text-slate-600" />
              }
            </button>
          </div>

          {/* Name + email + badge */}
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="text-2xl font-bold text-white leading-tight">
              {loading ? "Loading…" : displayName}
            </h2>
            <p className="text-white/70 text-sm mt-0.5">{loading ? "—" : (email ?? "—")}</p>
            {!loading && profile?.is_nexleader && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                <Crown className="h-3 w-3" /> NexLeader
              </span>
            )}
            {uploadError && <p className="mt-1 text-xs text-red-200">{uploadError}</p>}
          </div>

          {/* Level + XP */}
          {!loading && (
            <div className="flex flex-col items-center gap-3 flex-shrink-0 sm:ml-auto">
              <div className="rounded-2xl bg-white/20 p-3 text-center min-w-[72px] backdrop-blur-sm">
                <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">Level</p>
                <p className="text-white text-4xl font-bold leading-none mt-0.5">{level}</p>
              </div>
              <div className="text-center">
                <p className="text-white/50 text-xs mb-1">Next level</p>
                <div className="w-28 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${xpPct}%` }} />
                </div>
                <p className="text-white/60 text-xs mt-1">{xpInLevel.toLocaleString()} / 1,000 XP</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NexCoins Balance ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 p-5 shadow-md">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🪙</span>
          <div>
            <p className="text-white/80 text-sm font-medium">NexCoins Balance</p>
            <p className="text-white text-4xl font-bold leading-tight">
              {loading ? "—" : (profile?.nexcoins ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/store"
          className="flex-shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
        >
          Redeem in Store →
        </Link>
      </div>

      {/* ── Account Details ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-slate-400" />
          <h3 className="font-bold text-slate-800">Account Details</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { label: "Full Name",    value: loading ? "Loading…" : (profile?.full_name ?? "Not set") },
            { label: "Email",        value: loading ? "Loading…" : (email ?? "—") },
            { label: "Country",      value: loading ? "Loading…" : (profile?.country ?? "Not set") },
            { label: "Phone",        value: loading ? "Loading…" : (profile?.phone ?? "Not set") },
            { label: "Member Since", value: loading ? "Loading…" : joinedDate },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3">
              <p className="text-sm text-slate-400 w-32 flex-shrink-0">{row.label}</p>
              <p className="text-sm text-slate-800 font-medium text-right">{row.value}</p>
            </div>
          ))}
          {!loading && userId && (
            <div className="flex items-center justify-between py-3">
              <p className="text-sm text-slate-400 w-32 flex-shrink-0">Contributor ID</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 1500);
                }}
                title="Click to copy your ID"
                className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600 transition-colors hover:bg-slate-100"
              >
                {userId.slice(0, 8)}…{userId.slice(-4)}
                {copiedId
                  ? <CheckCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
                  : <Copy className="h-3 w-3 opacity-50 flex-shrink-0" />
                }
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Lifetime Stats ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-5">Lifetime Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Tasks Completed",
              value: loading || tasksCompleted === null ? "—" : tasksCompleted.toLocaleString(),
              icon: <CheckCircle2 className="h-6 w-6 text-teal-500" />,
            },
            {
              label: "Approval Rate",
              value: loading || approvalRate === null ? (loading ? "—" : "N/A") : `${approvalRate}%`,
              icon: <Star className="h-6 w-6 text-indigo-500 fill-indigo-100" />,
            },
            {
              label: "Member Since",
              value: loading ? "—" : (profile?.joined_at
                ? new Date(profile.joined_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                : "—"),
              icon: <Calendar className="h-6 w-6 text-slate-400" />,
            },
            {
              label: "Total Earned",
              value: loading || totalEarned === null ? "—" : totalEarned.toLocaleString(),
              icon: <NexCoinIcon size={24} />,
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Skills ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🎯</span>
          <h3 className="font-bold text-slate-800">Skills</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {(profile?.skills ?? []).map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {skill}
              <button onClick={() => removeSkill(skill)} className="ml-0.5 leading-none transition-colors hover:text-red-500">×</button>
            </span>
          ))}
          {!loading && (profile?.skills ?? []).length === 0 && (
            <p className="text-sm text-slate-400">No skills added yet.</p>
          )}
        </div>
        {/* Quick-select skill chips */}
        {SUGGESTED_SKILLS.filter(s => !(profile?.skills ?? []).includes(s)).length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-1.5">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SKILLS.filter(s => !(profile?.skills ?? []).includes(s)).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkillByValue(s)}
                  disabled={skillSaving}
                  className="px-2.5 py-1 rounded-full border border-dashed border-indigo-200 bg-white text-xs text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 transition-colors disabled:opacity-50"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={addSkill} className="flex gap-2">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="e.g. Transcription, Data Annotation…"
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
          />
          <button
            type="submit"
            disabled={skillSaving || !skillInput.trim()}
            className="h-9 w-9 flex-shrink-0 rounded-xl bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {skillSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Skills help match you with relevant project opportunities.</p>
      </div>

      {/* ── Languages ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">🌐</span>
          <h3 className="font-bold text-slate-800">Languages</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Add languages you speak fluently — used to match you with language-specific tasks.</p>
        <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
          {(profile?.languages ?? []).map((lang) => (
            <span key={lang} className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
              {lang}
              <button onClick={() => removeLanguage(lang)} className="ml-0.5 leading-none transition-colors hover:text-red-500">×</button>
            </span>
          ))}
          {!loading && (profile?.languages ?? []).length === 0 && (
            <p className="text-sm text-slate-400">No languages added yet.</p>
          )}
        </div>
        <form onSubmit={addLanguage} className="flex gap-2">
          <input
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            placeholder="e.g. English, Hindi, Tamil…"
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300"
          />
          <button
            type="submit"
            disabled={langSaving || !langInput.trim()}
            className="h-9 w-9 flex-shrink-0 rounded-xl bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {langSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </form>
      </div>

      {/* ── Edit Profile Modal ───────────────────────────────────────── */}
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
