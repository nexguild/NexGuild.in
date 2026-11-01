"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatAnnouncementHtml, formatAnnouncementInlineHtml } from "@/lib/announcement-format";

interface AnnouncementNotif {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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
      <div className="animate-fade-slide-up relative isolate overflow-hidden rounded-[1.6rem] bg-[#103f38] p-6 text-white shadow-[0_18px_45px_rgba(15,76,69,0.14)]" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(214,182,110,0.22),transparent_35%),radial-gradient(ellipse_at_5%_100%,rgba(20,184,166,0.16),transparent_42%)]" />
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
                      <p
                        className="text-sm font-semibold text-slate-800"
                        dangerouslySetInnerHTML={{ __html: formatAnnouncementInlineHtml(cleanTitle) }}
                      />
                      {unread && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                          NEW
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm leading-relaxed text-slate-600"
                      dangerouslySetInnerHTML={{ __html: formatAnnouncementHtml(item.message) }}
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
