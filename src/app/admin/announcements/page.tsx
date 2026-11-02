"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Plus, Loader2, CheckCircle2, Megaphone, Search, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardPromotionEditor } from "@/components/admin/dashboard-promotion-editor";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { COUNTRY_OPTIONS } from "@/lib/countries";

interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  created_at: string;
}

interface AnnouncementRecipient {
  id: string;
  full_name: string | null;
  email: string | null;
}

const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

const TARGET_LABELS: Record<string, string> = {
  all:    "All Contributors",
  active: "Active Contributors",
  new:    "New Contributors",
  users:  "Specific Contributors",
};

function getTargetLabel(target: string): string {
  if (target.startsWith("country:")) {
    const code = target.slice("country:".length);
    return `Contributors in ${COUNTRY_OPTIONS.find((country) => country.code === code)?.name ?? code}`;
  }
  if (target.startsWith("users:")) return `Specific Contributors (${target.slice("users:".length)})`;
  return TARGET_LABELS[target] ?? target;
}

export default function AdminAnnouncementsPage() {
  const tokenRef = useRef<string | null>(null);
  const allowed = usePageGuard(ADMIN_ROLES.ANNOUNCE);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [target, setTarget]     = useState("all");
  const [countryCode, setCountryCode] = useState("IN");
  const [selectedUsers, setSelectedUsers] = useState<AnnouncementRecipient[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<AnnouncementRecipient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [sent, setSent]         = useState(false);
  const [deliverySummary, setDeliverySummary] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      tokenRef.current = session?.access_token ?? null;

      const { data } = await supabase
        .from("announcements")
        .select("id, title, message, target, created_at")
        .order("created_at", { ascending: false });

      setAnnouncements((data as unknown as Announcement[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAudience() {
      setPreviewLoading(true);
      setPreviewError(null);
      setRecipientCount(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Your session has expired. Sign in again to preview recipients.");
        tokenRef.current = session.access_token;
        const params = new URLSearchParams({ target });
        if (target === "country") params.set("country", countryCode);
        if (target === "users") params.set("userIds", selectedUsers.map((user) => user.id).join(","));
        const response = await fetch(`/api/admin/announcements?${params.toString()}`, {
          headers: { Authorization: "Bearer " + session.access_token },
        });
        const result = await response.json() as { recipientCount?: number; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to preview recipients.");
        if (!cancelled) setRecipientCount(result.recipientCount ?? 0);
      } catch (previewErr) {
        if (!cancelled) setPreviewError(previewErr instanceof Error ? previewErr.message : "Unable to preview recipients.");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }
    loadAudience();
    return () => { cancelled = true; };
  }, [target, countryCode, selectedUsers]);

  useEffect(() => {
    if (target !== "users") {
      setUserResults([]);
      setSearchLoading(false);
      return;
    }

    const search = userSearch.trim();
    if (search.length < 2) {
      setUserResults([]);
      setSearchLoading(false);
      setUserSearchError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setUserSearchError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Your session has expired. Sign in again to search contributors.");
        const params = new URLSearchParams({ target: "users", search });
        const response = await fetch(`/api/admin/announcements?${params.toString()}`, {
          headers: { Authorization: "Bearer " + session.access_token },
        });
        const result = await response.json() as { users?: AnnouncementRecipient[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to search contributors.");
        if (!cancelled) setUserResults(result.users ?? []);
      } catch (searchError) {
        if (!cancelled) {
          setUserResults([]);
          setUserSearchError(searchError instanceof Error ? searchError.message : "Unable to search contributors.");
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [target, userSearch]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (!confirmSend) {
      if (previewLoading || recipientCount === null || previewError) {
        setError(previewError ?? "Wait for the audience preview before sending.");
        return;
      }
      setError(null);
      setConfirmSend(true);
      return;
    }
    setSending(true);
    setError(null);

    try {
    const res = await fetch("/api/admin/announcements", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify({
        title: title.trim(),
        message: message.trim(),
        target,
        countryCode: target === "country" ? countryCode : undefined,
        userIds: target === "users" ? selectedUsers.map((user) => user.id) : undefined,
        expectedRecipientCount: recipientCount,
      }),
    });
    const data = await res.json() as {
      ok?: boolean;
      announcement?: Announcement;
      recipientCount?: number;
      notifsSent?: number;
      emailsSent?: number;
      emailConfigured?: boolean;
      deliveryWarning?: string | null;
      error?: string;
    };

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to send announcement.");
      if (res.status === 409) setConfirmSend(false);
      setSending(false);
      return;
    }

    if (data.announcement) {
      setAnnouncements((prev) => [data.announcement!, ...prev]);
    }
    const emailStatus = data.emailConfigured
      ? `${data.emailsSent ?? 0} emails sent`
      : "email sending is not configured";
    setDeliverySummary(
      `${data.notifsSent ?? 0}/${data.recipientCount ?? 0} dashboard notifications created; ${emailStatus}.`,
    );
    if (data.deliveryWarning) setError(data.deliveryWarning);
    setTitle("");
    setMessage("");
    setTarget("all");
    setCountryCode("IN");
    setSelectedUsers([]);
    setUserSearch("");
    setConfirmSend(false);
    setSent(true);
    setSending(false);
    setTimeout(() => setSent(false), 6000);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send announcement.");
      setSending(false);
    }
  }

  if (!allowed) return null;
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage dashboard promotions and send announcements to contributors.</p>
      </div>

      <DashboardPromotionEditor />

      {/* New Announcement Form */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="h-4 w-4 text-[var(--brand-500)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">New Announcement</h2>
        </div>

        <form onSubmit={send} className="space-y-5">
          <div>
            <label className={labelClass}>Title <span className="text-[var(--danger-text)]">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => { setTitle(e.target.value); setConfirmSend(false); }}
              maxLength={120}
              placeholder="Announcement title…"
              className={inputClass}
            />
            <p className="mt-1 text-right text-xs text-[var(--text-muted)]">{title.length}/120</p>
          </div>

          <div>
            <label className={labelClass}>Message <span className="text-[var(--danger-text)]">*</span></label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setConfirmSend(false); }}
              maxLength={2000}
              placeholder="Write your announcement message here…"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors resize-y"
            />
            <p className="mt-1 text-right text-xs text-[var(--text-muted)]">{message.length}/2000</p>
          </div>

          <div>
            <label className={labelClass}>Send To</label>
            <select value={target} onChange={(e) => { setTarget(e.target.value); setConfirmSend(false); }} className={inputClass}>
              <option value="all">All Contributors</option>
              <option value="active">Active Contributors</option>
              <option value="new">New Contributors (joined last 30 days)</option>
              <option value="country">Contributors in a country</option>
              <option value="users">Specific contributors</option>
            </select>
          </div>

          {target === "country" && (
            <div>
              <label htmlFor="announcement-country" className={labelClass}>Country</label>
              <select
                id="announcement-country"
                value={countryCode}
                onChange={(e) => { setCountryCode(e.target.value); setConfirmSend(false); }}
                className={inputClass}
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Only contributor profiles with this country set will receive the announcement.</p>
            </div>
          )}

          {target === "users" && (
            <div className="space-y-3">
              <label htmlFor="announcement-recipient-search" className={labelClass}>Choose contributors</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="announcement-recipient-search"
                  type="search"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setConfirmSend(false); }}
                  placeholder="Search by name or email…"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-2">
                {searchLoading ? (
                  <p className="px-2 py-3 text-sm text-[var(--text-muted)]">Searching contributors…</p>
                ) : userSearchError ? (
                  <p className="px-2 py-3 text-sm text-red-500">{userSearchError}</p>
                ) : userSearch.trim().length < 2 ? (
                  <p className="px-2 py-3 text-sm text-[var(--text-muted)]">Enter at least 2 characters to search.</p>
                ) : userResults.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-[var(--text-muted)]">No contributors found.</p>
                ) : userResults.map((user) => {
                  const selected = selectedUsers.some((item) => item.id === user.id);
                  return (
                    <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-[var(--surface-subtle)]">
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!selected && selectedUsers.length >= 100}
                        onChange={() => {
                          setSelectedUsers((current) => selected
                            ? current.filter((item) => item.id !== user.id)
                            : [...current, user]);
                          setConfirmSend(false);
                        }}
                        className="h-4 w-4 flex-shrink-0 accent-teal-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{user.full_name || "Unnamed contributor"}</span>
                        <span className="block truncate text-xs text-[var(--text-muted)]">{user.email || user.id}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <span key={user.id} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span className="max-w-48 truncate">{user.full_name || user.email || user.id}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${user.full_name || user.email || "contributor"}`}
                        onClick={() => {
                          setSelectedUsers((current) => current.filter((item) => item.id !== user.id));
                          setConfirmSend(false);
                        }}
                        className="rounded-full hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedUsers.length >= 100 && <p className="text-xs text-amber-700">You can select up to 100 contributors per announcement.</p>}
            </div>
          )}

          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            {previewLoading ? "Counting recipients…" : previewError ? previewError : target === "users" && selectedUsers.length === 0 ? (
              "Select one or more contributors to continue."
            ) : (
              <>This announcement will be sent to <strong className="text-[var(--text-primary)]">{recipientCount}</strong> {recipientCount === 1 ? "account" : "accounts"} in {target === "country"
                ? (COUNTRY_OPTIONS.find((country) => country.code === countryCode)?.name ?? countryCode)
                : TARGET_LABELS[target] ?? target}.</>
            )}
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{error}</p>}
          {sent && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
              <CheckCircle2 className="h-4 w-4" /> Announcement saved. {deliverySummary}
            </div>
          )}

          <Button type="submit" size="lg" disabled={sending || previewLoading || recipientCount === null || !!previewError || (target === "users" && selectedUsers.length === 0) || (confirmSend && recipientCount === 0)}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmSend ? `Confirm send to ${recipientCount} accounts` : <><Bell className="h-4 w-4" /> Review Audience</>}
          </Button>
        </form>
      </section>

      {/* Past Announcements */}
      <section>
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Past Announcements</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-10 flex flex-col items-center gap-2 text-center">
            <Megaphone className="h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">No announcements sent yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <h3 className="font-medium text-[var(--text-primary)] text-sm">{ann.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--brand-500)]/10 text-[var(--brand-500)]">
                      {getTargetLabel(ann.target)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(ann.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{ann.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
