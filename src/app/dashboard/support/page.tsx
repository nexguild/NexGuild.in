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
  open:    { label: "Open",    style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  replied: { label: "Replied", style: "bg-green-500/10 text-green-400 border-green-500/20",   icon: <CheckCircle2 className="h-3 w-3" /> },
  closed:  { label: "Closed",  style: "bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)]", icon: <X className="h-3 w-3" /> },
};

const inputClass =
  "w-full px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";

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
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--border-default)] bg-[var(--surface-card)] flex-shrink-0">
          <button
            onClick={() => { setOpenTicket(null); setReplyText(""); }}
            className="h-8 w-8 flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{openTicket.subject}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {CATEGORIES[openTicket.category] ?? openTicket.category} · {fmtTime(openTicket.created_at)}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${st.style}`}>
            {st.icon} {st.label}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--surface-page)]">
          {/* Original ticket message always first */}
          <div className="flex justify-end">
            <div className="max-w-[82%] sm:max-w-[70%]">
              <div className="bg-[var(--brand-500)] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{openTicket.message}</p>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{fmtTime(openTicket.created_at)}</p>
            </div>
          </div>

          {/* Thread messages */}
          {loadingMsgs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              {/* Backwards-compat: show admin_reply from old ticket if no thread messages */}
              {messages.length === 0 && openTicket.admin_reply && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] sm:max-w-[70%]">
                    <p className="text-xs text-[var(--text-muted)] mb-1 ml-1">Support Team</p>
                    <div className="bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] px-4 py-2.5 rounded-2xl rounded-tl-sm">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{openTicket.admin_reply}</p>
                    </div>
                    {openTicket.replied_at && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{fmtTime(openTicket.replied_at)}</p>
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
                        <p className="text-xs text-[var(--text-muted)] mb-1 ml-1">Support Team</p>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl ${
                        isContributor
                          ? "bg-[var(--brand-500)] text-white rounded-tr-sm"
                          : "bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                      <p className={`text-[10px] text-[var(--text-muted)] mt-1 ${isContributor ? "text-right" : "text-left"}`}>
                        {fmtTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {isClosed && (
            <p className="text-xs text-center text-[var(--text-muted)] py-2">— Ticket closed —</p>
          )}
          <div ref={msgEndRef} />
        </div>

        {/* Reply input */}
        {!isClosed && (
          <div className="border-t border-[var(--border-default)] px-4 py-3 bg-[var(--surface-card)] flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
              />
              <Button size="sm" className="flex-shrink-0 h-10 w-10 p-0" disabled={!replyText.trim() || sending} onClick={sendReply}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Ticket list view ─────────────────────────────────────────────────
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Support</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {openCount > 0
              ? `${openCount} open ticket${openCount > 1 ? "s" : ""} · we typically reply within 24 hours.`
              : "Submit a ticket and we'll get back to you within 24 hours."}
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setFormSuccess(false); }}>
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--brand-500)]/30 bg-[var(--surface-card)] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[var(--text-primary)]">New Support Ticket</h2>
            <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X className="h-5 w-5" />
            </button>
          </div>
          {formSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
              <p className="font-semibold text-[var(--text-primary)]">Ticket submitted!</p>
              <p className="text-sm text-[var(--text-secondary)]">We&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleNewTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} h-10`}>
                    {CAT_INPUT.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Subject <span className="text-[var(--danger-text)]">*</span>
                  </label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description" className={`${inputClass} h-10`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Message <span className="text-[var(--danger-text)]">*</span>
                </label>
                <textarea value={formMsg} onChange={(e) => setFormMsg(e.target.value)} placeholder="Describe your issue in detail…" rows={4} className={`${inputClass} py-2.5 resize-none`} />
              </div>
              {formError && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-20 flex flex-col items-center gap-4 text-center px-6">
          <div className="h-14 w-14 rounded-full bg-[var(--brand-100)] flex items-center justify-center">
            <Headphones className="h-7 w-7 text-[var(--brand-500)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] mb-1">No support tickets yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Click &quot;New Ticket&quot; to get in touch.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => {
            const st = STATUS_META[t.status] ?? STATUS_META.open;
            return (
              <li key={t.id}>
                <button
                  className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4 flex items-center gap-4 text-left hover:bg-[var(--surface-subtle)] transition-colors"
                  onClick={() => setOpenTicket(t)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.subject}</p>
                      {t.status === "replied" && (
                        <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full flex-shrink-0">New Reply</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {CATEGORIES[t.category] ?? t.category} · {fmtTime(t.created_at)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${st.style}`}>
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
