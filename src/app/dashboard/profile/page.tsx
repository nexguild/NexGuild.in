"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Coins } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Profile {
  full_name: string | null;
  country: string | null;
  joined_at: string | null;
  nexcoins: number;
}

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? null);

      const { data } = await supabase
        .from("profiles")
        .select("full_name, country, joined_at, nexcoins")
        .eq("id", user.id)
        .single();

      setProfile(data ?? { full_name: null, country: null, joined_at: null, nexcoins: 0 });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const displayName = profile?.full_name ?? email ?? "—";
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const joinedDate = profile?.joined_at
    ? new Date(profile.joined_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
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
              <Button size="sm" variant="secondary" disabled>Edit Profile</Button>
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
          { label: "Full Name", value: loading ? "Loading…" : (profile?.full_name ?? "—") },
          { label: "Email",     value: loading ? "Loading…" : (email ?? "—") },
          { label: "Country",   value: loading ? "Loading…" : (profile?.country ?? "—") },
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
    </div>
  );
}
