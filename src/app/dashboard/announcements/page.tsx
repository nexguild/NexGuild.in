"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AnnouncementNotif {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function formatAnnouncement(text: string): string {
  return text.split("\n").map(line => {
    const html = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    return `<p style="margin:0 0 0.25rem">${html || "&nbsp;"}</p>`;
  }).join("");
}

export default function AnnouncementsPage() {
  const [items, setItems]     = useState<AnnouncementNotif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, is_read, created_at")
        .eq("user_id", user.id)
        .eq("type", "announcement")
        .order("created_at", { ascending: false });

      const rows = (data as AnnouncementNotif[] | null) ?? [];
      setItems(rows);
      setLoading(false);

      // Mark all unread ones as read
      const unreadIds = rows.filter((r) => !r.is_read).map((r) => r.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Announcements</h1>
        <p className="text-sm text-[var(--text-secondary)]">Platform updates and messages from the NexGuild team.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center px-6">
          <Megaphone className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No announcements yet</p>
          <p className="text-sm text-[var(--text-secondary)]">We&apos;ll post updates here when there&apos;s something new.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cleanTitle = item.title.replace(/^📢\s*/, "");
            const unread     = !item.is_read;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 transition-colors ${
                  unread
                    ? "border-[#14b8a6]/30 bg-gradient-to-r from-[#14b8a6]/8 to-transparent"
                    : "border-[var(--border-default)] bg-[var(--surface-card)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    unread ? "bg-[#14b8a6]/15" : "bg-[var(--surface-subtle)]"
                  }`}>
                    <Megaphone className={`h-4 w-4 ${unread ? "text-[#14b8a6]" : "text-[var(--text-muted)]"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{cleanTitle}</p>
                      {unread && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-[#14b8a6]/15 text-[#14b8a6]">
                          New
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm text-[var(--text-secondary)] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatAnnouncement(item.message) }}
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
