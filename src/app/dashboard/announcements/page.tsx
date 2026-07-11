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
    <div className="space-y-5 max-w-2xl">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-white/70" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">NexGuild Team</span>
          </div>
          <h1 className="mb-1 text-2xl font-extrabold text-white">Announcements</h1>
          <p className="text-sm text-white/75">Platform updates and messages from the NexGuild team.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
          >
            <Megaphone className="h-7 w-7 text-indigo-500" />
          </div>
          <div>
            <p className="mb-1 font-bold text-slate-800">No announcements yet</p>
            <p className="text-sm text-slate-500">We&apos;ll post updates here when there&apos;s something new.</p>
          </div>
        </div>
      ) : (
        <div className="animate-fade-slide-up space-y-3" style={{ animationDelay: "100ms" }}>
          {items.map((item) => {
            const cleanTitle = item.title.replace(/^📢\s*/, "");
            const unread     = !item.is_read;
            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  unread ? "border border-indigo-200" : "border border-slate-100"
                }`}
              >
                {unread && (
                  <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #14b8a6)" }} />
                )}
                <div className="flex items-start gap-4 p-5">
                  <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                    unread ? "bg-indigo-100" : "bg-slate-100"
                  }`}>
                    <Megaphone className={`h-4 w-4 ${unread ? "text-indigo-600" : "text-slate-400"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{cleanTitle}</p>
                      {unread && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                          NEW
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm leading-relaxed text-slate-600"
                      dangerouslySetInnerHTML={{ __html: formatAnnouncement(item.message) }}
                    />
                    <p className="mt-2.5 text-xs text-slate-400">
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
