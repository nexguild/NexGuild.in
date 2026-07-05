"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const NOTIF_KEYS = [
  { key: "task_approved",      label: "Task approved",      desc: "Get notified when a submission is approved" },
  { key: "voucher_delivered",  label: "Voucher delivered",  desc: "Updates when your voucher request is fulfilled" },
  { key: "new_opportunities",  label: "New opportunities",  desc: "Alerts for high-paying new tasks" },
] as const;

type NotifKey = typeof NOTIF_KEYS[number]["key"];

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    task_approved: true, voucher_delivered: true, new_opportunities: true,
  });

  // Email modal
  const [showEmail, setShowEmail]           = useState(false);
  const [newEmail, setNewEmail]             = useState("");
  const [emailSaving, setEmailSaving]       = useState(false);
  const [emailError, setEmailError]         = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess]     = useState(false);

  // Password modal
  const [showPassword, setShowPassword]     = useState(false);
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPass, setConfirmPass]       = useState("");
  const [passSaving, setPassSaving]         = useState(false);
  const [passError, setPassError]           = useState<string | null>(null);
  const [passSuccess, setPassSuccess]       = useState(false);

  // Deactivate confirm
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating]     = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? null);
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", user.id)
        .single();

      if (data?.notification_prefs) {
        setNotifs((prev) => ({ ...prev, ...data.notification_prefs }));
      }
    }
    fetchUser();
  }, []);

  async function toggleNotif(key: NotifKey) {
    if (!userId) return;
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    await supabase
      .from("profiles")
      .update({ notification_prefs: updated })
      .eq("id", userId);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailError(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) { setEmailError(error.message); setEmailSaving(false); return; }
    setEmailSuccess(true);
    setEmailSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPass) { setPassError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setPassError("Password must be at least 8 characters."); return; }
    setPassSaving(true);
    setPassError(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPassError(error.message); setPassSaving(false); return; }
    setPassSuccess(true);
    setPassSaving(false);
  }

  async function handleDeactivate() {
    setDeactivating(true);
    setDeactivateError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setDeactivateError("No active session found."); setDeactivating(false); return; }

    const res = await fetch("/api/account/deactivate", {
      method:  "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setDeactivateError(d.error ?? "Failed to deactivate account.");
      setDeactivating(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/deactivated");
  }

  function closeEmailModal() {
    setShowEmail(false); setNewEmail(""); setEmailError(null); setEmailSuccess(false);
  }
  function closePassModal() {
    setShowPassword(false); setNewPassword(""); setConfirmPass(""); setPassError(null); setPassSuccess(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage your account preferences.</p>
      </div>

      {/* Account */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Account</h2>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Email</p>
            <p className="text-sm text-[var(--text-muted)]">{email ?? "Loading…"}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowEmail(true)}>Change</Button>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Password</p>
            <p className="text-sm text-[var(--text-muted)]">••••••••••••</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowPassword(true)}>Change</Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Notifications</h2>
        </div>
        {NOTIF_KEYS.map((item) => (
          <div key={item.key} className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={notifs[item.key]}
              onClick={() => toggleNotif(item.key)}
              style={{
                backgroundColor: notifs[item.key] ? "#14b8a6" : "#4b5563",
                transition: "background-color 0.2s ease",
              }}
              className="h-6 w-11 rounded-full relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2 focus:ring-offset-[var(--surface-card)]"
            >
              <span
                style={{
                  transform: notifs[item.key] ? "translateX(22px)" : "translateX(2px)",
                  transition: "transform 0.2s ease",
                }}
                className="absolute top-[2px] left-0 h-5 w-5 rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        ))}
      </section>

      {/* Danger Zone */}
      <section className="rounded-lg border border-[var(--danger-text)] bg-[rgba(239,68,68,0.05)] divide-y divide-[rgba(239,68,68,0.15)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--danger-text)]">Danger Zone</h2>
          <p className="text-xs text-[var(--danger-text)] opacity-70 mt-1">These actions are irreversible.</p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Deactivate Account</p>
            <p className="text-xs text-[var(--text-muted)]">Disable your account. Pending NexCoins will be frozen.</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDeactivate(true)}>Deactivate</Button>
        </div>
      </section>

      {/* Change Email Modal */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Change Email</h2>
              <button onClick={closeEmailModal}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            {emailSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-10 w-10 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">Confirmation email sent</p>
                <p className="text-sm text-[var(--text-secondary)]">Check your new email inbox to confirm the change.</p>
                <Button className="w-full mt-2" onClick={closeEmailModal}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">New Email Address</label>
                  <input
                    type="email" required value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                  />
                </div>
                {emailError && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{emailError}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1" onClick={closeEmailModal}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={emailSaving}>
                    {emailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Email"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Change Password</h2>
              <button onClick={closePassModal}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            {passSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-10 w-10 text-green-400" />
                <p className="font-semibold text-[var(--text-primary)]">Password updated</p>
                <Button className="w-full mt-2" onClick={closePassModal}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">New Password</label>
                  <input
                    type="password" required value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Confirm Password</label>
                  <input
                    type="password" required value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
                  />
                </div>
                {passError && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{passError}</p>}
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" className="flex-1" onClick={closePassModal}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={passSaving}>
                    {passSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Deactivate Confirm Modal */}
      {showDeactivate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-[var(--surface-card)] rounded-xl border border-[var(--danger-text)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Deactivate Account?</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              This will freeze your account and NexCoins balance. You will be signed out immediately. To reactivate, contact <strong>admin@nexguild.in</strong>.
            </p>
            {deactivateError && (
              <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md mb-4">{deactivateError}</p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" disabled={deactivating} onClick={() => { setShowDeactivate(false); setDeactivateError(null); }}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" disabled={deactivating} onClick={handleDeactivate}>
                {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
