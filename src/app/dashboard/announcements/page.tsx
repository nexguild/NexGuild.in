"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2, CalendarDays, Sparkles } from "lucide-react";
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
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-[#102b3f] via-[#14504b] to-[#0f766e] p-5 text-white shadow-[0_20px_55px_rgba(15,76,69,0.2)] sm:p-7" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_0%,rgba(245,158,11,0.2),transparent_35%),radial-gradient(ellipse_at_0%_100%,rgba(45,212,191,0.16),transparent_42%)]" />
        <div aria-hidden className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 rounded-full border border-white/[0.08]" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100/80">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Megaphone className="h-4 w-4" />
              </span>
              <span>NexGuild team</span>
            </div>
            <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Announcements</h1>
            <p className="text-sm text-teal-50/80">Platform updates and messages from the NexGuild team.</p>
          </div>
          <div className="hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 sm:flex">
            <Sparkles className="h-4 w-4 text-amber-200" />
            <span className="text-xs font-medium text-white/80">Product news & important updates</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white py-16 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 ring-1 ring-teal-100"
          >
            <Megaphone className="h-7 w-7 text-teal-600" />
          </div>
          <div>
            <p className="mb-1 font-bold text-slate-800">No announcements yet</p>
            <p className="text-sm text-slate-500">We&apos;ll post updates here when there&apos;s something new.</p>
          </div>
        </div>
      ) : (
        <div className="animate-fade-slide-up mx-auto max-w-5xl space-y-4" style={{ animationDelay: "100ms" }}>
          {items.map((item) => {
            const cleanTitle = item.title.replace(/^📢\s*/, "");
            const unread     = !item.is_read;
            return (
              <div
                key={item.id}
                className={`group overflow-hidden rounded-[1.5rem] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,76,69,0.1)] ${
                  unread ? "border border-teal-200" : "border border-slate-200/80"
                }`}
              >
                {unread && (
                  <div className="h-1 w-full bg-gradient-to-r from-teal-700 via-teal-500 to-amber-400" />
                )}
                <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-6">
                  <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ${
                    unread ? "bg-teal-50 text-teal-700 ring-teal-100" : "bg-slate-50 text-slate-500 ring-slate-100"
                  }`}>
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p
                        className="text-sm font-bold leading-snug text-slate-800 sm:text-base"
                        dangerouslySetInnerHTML={{ __html: formatAnnouncementInlineHtml(cleanTitle) }}
                      />
                      {unread && (
                        <span className="rounded-full border border-teal-100 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                          NEW
                        </span>
                      )}
                    </div>
                    <div
                      className="text-sm leading-7 text-slate-600 [&_a]:font-semibold [&_a]:text-teal-700 [&_a]:underline [&_a]:decoration-teal-200 [&_a]:underline-offset-2 [&_a:hover]:text-teal-900 [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-slate-800"
                      dangerouslySetInnerHTML={{ __html: formatAnnouncementHtml(item.message) }}
                    />
                    <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <time dateTime={item.created_at}>
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </time>
                    </div>
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
