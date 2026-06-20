"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Plus, Loader2, CheckCircle2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

interface Announcement {
  id: string;
  title: string;
  message: string;
  target: string;
  created_at: string;
}

const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";
const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5";

const TARGET_LABELS: Record<string, string> = {
  all:    "All Contributors",
  active: "Active Contributors",
  new:    "New Contributors",
};

export default function AdminAnnouncementsPage() {
  const tokenRef = useRef<string | null>(null);
  const allowed = usePageGuard(ADMIN_ROLES.ANNOUNCE);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading]   = useState(true);
  const [title, setTitle]       = useState("");
  const [message, setMessage]   = useState("");
  const [target, setTarget]     = useState("all");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [sent, setSent]         = useState(false);

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

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }
    setSending(true);
    setError(null);

    const res = await fetch("/api/admin/announcements", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
      body:    JSON.stringify({ title: title.trim(), message: message.trim(), target }),
    });
    const data = await res.json() as { ok?: boolean; announcement?: Announcement; error?: string };

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to send announcement.");
      setSending(false);
      return;
    }

    if (data.announcement) {
      setAnnouncements((prev) => [data.announcement!, ...prev]);
    }
    setTitle("");
    setMessage("");
    setTarget("all");
    setSent(true);
    setSending(false);
    setTimeout(() => setSent(false), 4000);
  }

  if (!allowed) return null;
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
        <p className="text-sm text-[var(--text-secondary)]">Send announcements to all contributors or specific groups.</p>
      </div>

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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title…"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Message <span className="text-[var(--danger-text)]">*</span></label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement message here…"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors resize-y"
            />
          </div>

          <div>
            <label className={labelClass}>Send To</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
              <option value="all">All Contributors</option>
              <option value="active">Active Contributors</option>
              <option value="new">New Contributors (joined last 30 days)</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{error}</p>}
          {sent && (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-md">
              <CheckCircle2 className="h-4 w-4" /> Announcement sent and notifications created.
            </div>
          )}

          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Bell className="h-4 w-4" /> Send Announcement</>}
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
                      {TARGET_LABELS[ann.target] ?? ann.target}
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
