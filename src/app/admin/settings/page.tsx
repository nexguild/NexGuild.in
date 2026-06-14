"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  joined_at: string;
}

const METHODS = ["UPI", "Bank Transfer", "PayPal"] as const;

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{ backgroundColor: on ? "#14b8a6" : "#4b5563", transition: "background-color 0.2s ease" }}
      className="h-6 w-11 rounded-full relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2 focus:ring-offset-[var(--surface-card)]"
    >
      <span
        style={{ transform: on ? "translateX(22px)" : "translateX(2px)", transition: "transform 0.2s ease" }}
        className="absolute top-[2px] left-0 h-5 w-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [admins, setAdmins]               = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [maintenance, setMaintenance]     = useState(false);
  const [methods, setMethods]             = useState<Record<string, boolean>>({
    UPI: true, "Bank Transfer": true, PayPal: true,
  });

  // Invite modal
  const [showInvite, setShowInvite]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting]       = useState(false);
  const [inviteErr, setInviteErr]     = useState<string | null>(null);
  const [inviteOk, setInviteOk]       = useState(false);

  useEffect(() => {
    async function loadAdmins() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, joined_at")
        .eq("role", "admin")
        .order("joined_at", { ascending: true });
      setAdmins((data as AdminUser[]) ?? []);
      setLoadingAdmins(false);
    }
    loadAdmins();
  }, []);

  async function promoteToAdmin(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteErr(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("email", inviteEmail.trim().toLowerCase());

    if (error) { setInviteErr(error.message); setInviting(false); return; }

    // Reload admins
    const { data } = await supabase.from("profiles").select("id, full_name, email, role, joined_at").eq("role", "admin").order("joined_at", { ascending: true });
    setAdmins((data as AdminUser[]) ?? []);
    setInviteOk(true);
    setInviting(false);
  }

  async function demoteAdmin(id: string) {
    await supabase.from("profiles").update({ role: "contributor" }).eq("id", id);
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  }

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
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Maintenance Mode</p>
            <p className="text-xs text-[var(--text-muted)]">
              {maintenance ? "Dashboard is in maintenance mode — contributors cannot access it." : "Dashboard is live and accessible to contributors."}
            </p>
          </div>
          <Toggle on={maintenance} onToggle={() => setMaintenance((v) => !v)} />
        </div>
      </section>

      {/* Admin Users */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Admin Users</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Promote a contributor to admin by their email.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => { setShowInvite(true); setInviteOk(false); setInviteErr(null); setInviteEmail(""); }}>
            <Plus className="h-3.5 w-3.5" /> Add Admin
          </Button>
        </div>

        {loadingAdmins ? (
          <div className="px-6 py-6 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : admins.length === 0 ? (
          <div className="px-6 py-6 text-sm text-[var(--text-muted)]">No admins found.</div>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{admin.full_name ?? "—"}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {admin.email} · Admin · Since {new Date(admin.joined_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => demoteAdmin(admin.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </section>

      {/* Voucher Methods */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Voucher Types</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Toggle which voucher redemption options are available in the store.</p>
        </div>
        {METHODS.map((m) => (
          <div key={m} className="px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">{m}</p>
            <Toggle on={methods[m]} onToggle={() => setMethods((prev) => ({ ...prev, [m]: !prev[m] }))} />
          </div>
        ))}
      </section>

      {/* Add Admin Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Admin</h2>
              <button onClick={() => setShowInvite(false)}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            {inviteOk ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">Role updated</p>
                <p className="text-sm text-[var(--text-secondary)]">The user has been promoted to admin.</p>
                <Button className="w-full mt-2" onClick={() => setShowInvite(false)}>Done</Button>
              </div>
            ) : (
              <form onSubmit={promoteToAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Contributor Email
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="contributor@email.com"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">The user must already have an account on NexGuild.</p>
                </div>
                {inviteErr && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{inviteErr}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={inviting}>
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Promote to Admin"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
