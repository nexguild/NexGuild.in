"use client";

import { useEffect, useRef, useState } from "react";
import {
  Headphones, Plus, ArrowLeft, Send,
  Loader2, CheckCircle2, Clock, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketMessage {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const CATEGORIES: Record<string, string> = {
  general: "General Inquiry", task: "Task Issue", coins: "Payment / Coins Issue",
  account: "Account Problem", voucher: "Voucher Issue", bug: "Bug Report",
};

const CAT_INPUT = Object.entries(CATEGORIES).map(([value, label]) => ({ value, label }));

const STATUS_META: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
  open:    { label: "Open",    style: "bg-amber-100 text-amber-600 border-amber-200",  icon: <Clock className="h-3 w-3" /> },
  replied: { label: "Replied", style: "bg-green-100 text-green-600 border-green-200",  icon: <CheckCircle2 className="h-3 w-3" /> },
  closed:  { label: "Closed",  style: "bg-slate-100 text-slate-500 border-slate-200",  icon: <X className="h-3 w-3" /> },
};

const inputClass =
  "w-full px-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-colors shadow-sm";

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function SupportPage() {
  // List state
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId]     = useState<string | null>(null);
  const [token, setToken]       = useState<string | null>(null);

  // New ticket form
  const [category, setCategory] = useState("general");
  const [subject, setSubject]   = useState("");
  const [formMsg, setFormMsg]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Conversation state
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [messages, setMessages]     = useState<TicketMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Init
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);

      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, message, category, status, admin_reply, replied_at, created_at, updated_at")
        .eq("contributor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) console.error("[support] fetch:", error.message);
      setTickets((data as Ticket[]) ?? []);
      setLoading(false);
    }
    init();
  }, []);

  // Load messages when ticket is opened
  useEffect(() => {
    if (!openTicket) { setMessages([]); return; }
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadMsgs() {
      setLoadingMsgs(true);
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("id, sender_type, message, created_at")
        .eq("ticket_id", openTicket!.id)
        .order("created_at", { ascending: true });
      if (error) console.error("[support] messages fetch:", error.message);
      setMessages((data as TicketMessage[]) ?? []);
      setLoadingMsgs(false);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "auto" }), 60);
    }
    loadMsgs();

    channel = supabase
      .channel(`tmsg:${openTicket.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "ticket_messages",
        filter: `ticket_id=eq.${openTicket.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (payload.new as TicketMessage).id)) return prev;
          return [...prev, payload.new as TicketMessage];
        });
        // Update ticket status in list when admin replies
        setOpenTicket((prev) => {
          if (!prev || prev.id !== openTicket.id) return prev;
          const newStatus = (payload.new as TicketMessage).sender_type === "admin" ? "replied" : prev.status;
          return { ...prev, status: newStatus };
        });
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      })
      .subscribe();

    return () => { if (channel) supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTicket?.id]);

  async function handleNewTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !formMsg.trim()) { setFormError("Subject and message are required."); return; }
    setSubmitting(true); setFormError(null);

    if (!token) { setFormError("Not logged in."); setSubmitting(false); return; }

    const res = await fetch("/api/support/create-ticket", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ subject: subject.trim(), message: formMsg.trim(), category }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setFormError(d.error ?? "Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    const { ticket } = await res.json();
    setTickets((prev) => [ticket as Ticket, ...prev]);
    setFormSuccess(true); setSubmitting(false);
    setSubject(""); setFormMsg(""); setCategory("general");
    setTimeout(() => { setFormSuccess(false); setShowForm(false); }, 2500);
  }

  async function sendReply() {
    if (!replyText.trim() || !openTicket || !token) return;
    setSending(true);

    const res = await fetch("/api/support/send-message", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ ticketId: openTicket.id, message: replyText.trim() }),
    });

    if (res.ok) {
      const { message: newMsg } = await res.json();
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg as TicketMessage];
      });
      setReplyText("");
      setOpenTicket((prev) => prev ? { ...prev, status: "open" } : prev);
      setTickets((prev) => prev.map((t) => t.id === openTicket.id ? { ...t, status: "open" } : t));
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Failed to send message.");
    }
    setSending(false);
  }

  // ── Conversation view ────────────────────────────────────────────────
  if (openTicket) {
    const st = STATUS_META[openTicket.status] ?? STATUS_META.open;
    const isClosed = openTicket.status === "closed";

    return (
      <div className="flex flex-col h-[calc(100vh-4rem-5rem)] lg:h-[calc(100vh-4rem-2rem)] -mx-6 -mt-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-100 bg-white flex-shrink-0 shadow-sm">
          <button
            onClick={() => { setOpenTicket(null); setReplyText(""); }}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{openTicket.subject}</p>
            <p className="text-xs text-slate-400">
              {CATEGORIES[openTicket.category] ?? openTicket.category} · {fmtTime(openTicket.created_at)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${st.style}`}>
            {st.icon} {st.label}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {/* Original ticket message */}
          <div className="flex justify-end">
            <div className="max-w-[82%] sm:max-w-[70%]">
              <div
                className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-white"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{openTicket.message}</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{fmtTime(openTicket.created_at)}</p>
            </div>
          </div>

          {/* Thread messages */}
          {loadingMsgs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            </div>
          ) : (
            <>
              {messages.length === 0 && openTicket.admin_reply && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] sm:max-w-[70%]">
                    <p className="text-xs text-slate-400 mb-1 ml-1">Support Team</p>
                    <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{openTicket.admin_reply}</p>
                    </div>
                    {openTicket.replied_at && (
                      <p className="text-[10px] text-slate-400 mt-1">{fmtTime(openTicket.replied_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isContributor = msg.sender_type === "contributor";
                return (
                  <div key={msg.id} className={`flex ${isContributor ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[82%] sm:max-w-[70%]">
                      {!isContributor && (
                        <p className="text-xs text-slate-400 mb-1 ml-1">Support Team</p>
                      )}
                      {isContributor ? (
                        <div
                          className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-white"
                          style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>
                      )}
                      <p className={`text-[10px] text-slate-400 mt-1 ${isContributor ? "text-right" : "text-left"}`}>
                        {fmtTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {isClosed && (
            <p className="text-xs text-center text-slate-400 py-2">— Ticket closed —</p>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Reply input */}
        {!isClosed && (
          <div className="border-t border-slate-100 px-4 py-3 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-all disabled:opacity-40 hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Ticket list view ─────────────────────────────────────────────────
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="animate-fade-slide-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg" style={{ animationDelay: "0ms" }}>
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-white/70" />
              <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Help Center</span>
            </div>
            <h1 className="mb-1 text-2xl font-extrabold text-white">Support</h1>
            <p className="text-sm text-white/75">
              {openCount > 0
                ? `${openCount} open ticket${openCount > 1 ? "s" : ""} — we typically reply within 24 hours.`
                : "Submit a ticket and we'll get back to you within 24 hours."}
            </p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setFormSuccess(false); }}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/25"
          >
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div
            className="flex items-center justify-between border-b border-slate-50 px-5 py-4"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(20,184,166,0.03))" }}
          >
            <h2 className="font-bold text-slate-800">New Support Ticket</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5">
            {formSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 mb-1">Ticket Submitted!</p>
                  <p className="text-sm text-slate-500">We&apos;ll get back to you soon.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNewTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} h-10`}>
                      {CAT_INPUT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description" className={`${inputClass} h-10`} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea value={formMsg} onChange={(e) => setFormMsg(e.target.value)} placeholder="Describe your issue in detail…" rows={4} className={`${inputClass} py-2.5 resize-none`} />
                </div>
                {formError && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">{formError}</p>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-20 text-center shadow-sm">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(20,184,166,0.1))" }}
          >
            <Headphones className="h-7 w-7 text-indigo-500" />
          </div>
          <div>
            <p className="mb-1 font-bold text-slate-800">No support tickets yet</p>
            <p className="text-sm text-slate-500">Click &quot;New Ticket&quot; to get in touch with the team.</p>
          </div>
        </div>
      ) : (
        <ul className="animate-fade-slide-up space-y-2" style={{ animationDelay: "100ms" }}>
          {tickets.map((t) => {
            const st = STATUS_META[t.status] ?? STATUS_META.open;
            return (
              <li key={t.id}>
                <button
                  className="group w-full rounded-2xl border border-slate-100 bg-white px-5 py-4 flex items-center gap-4 text-left shadow-sm hover:border-indigo-200 hover:-translate-y-0.5 hover:shadow-md transition-all duration-150"
                  onClick={() => setOpenTicket(t)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{t.subject}</p>
                      {t.status === "replied" && (
                        <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600">
                          New Reply
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {CATEGORIES[t.category] ?? t.category} · {fmtTime(t.created_at)}
                    </p>
                  </div>
                  <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${st.style}`}>
                    {st.icon} {st.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
