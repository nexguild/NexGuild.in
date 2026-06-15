"use client";

import { useEffect, useRef, useState } from "react";
import {
  Headphones, Search, ArrowLeft, Send,
  CheckCircle2, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  profiles: { full_name: string | null; email: string | null } | null;
}

interface TicketMessage {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

const CATEGORIES: Record<string, string> = {
  general: "General", task: "Task", coins: "Coins",
  account: "Account", voucher: "Voucher", bug: "Bug",
};

const STATUS_META: Record<string, { label: string; variant: "success" | "warning" | "neutral" }> = {
  open:    { label: "Open",    variant: "warning" },
  replied: { label: "Replied", variant: "success" },
  closed:  { label: "Closed",  variant: "neutral" },
};

const TABS = ["open", "replied", "closed"] as const;
type Tab = typeof TABS[number];

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminSupportPage() {
  // List state
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("open");
  const [search, setSearch]       = useState("");
  const [token, setToken]         = useState<string | null>(null);
  const [adminId, setAdminId]     = useState<string | null>(null);

  // Conversation state
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [messages, setMessages]     = useState<TicketMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token ?? null);
      setAdminId(session?.user.id ?? null);
      await fetchTickets();
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTickets() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, subject, message, category, status, admin_reply, replied_at, created_at, updated_at, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (error) console.error("[admin/support] fetch:", error.message);
    setTickets((data as unknown as Ticket[]) ?? []);
    setLoading(false);
  }

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
      if (error) console.error("[admin/support] messages fetch:", error.message);
      setMessages((data as TicketMessage[]) ?? []);
      setLoadingMsgs(false);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "auto" }), 60);
    }
    loadMsgs();

    channel = supabase
      .channel(`tmsg-admin:${openTicket.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "ticket_messages",
        filter: `ticket_id=eq.${openTicket.id}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (payload.new as TicketMessage).id)) return prev;
          return [...prev, payload.new as TicketMessage];
        });
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      })
      .subscribe();

    return () => { if (channel) supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTicket?.id]);

  async function handleSend(closeTicket = false) {
    if (!openTicket || !token) return;
    if (!replyText.trim() && !closeTicket) return;
    setSending(true);
    setActionError(null);

    const res = await fetch("/api/admin/reply-ticket", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ ticketId: openTicket.id, reply: replyText.trim() || undefined, closeTicket }),
    });

    if (res.ok) {
      const { status: newStatus, message: newMsg } = await res.json();
      const updatedTicket = { ...openTicket, status: newStatus, ...(replyText.trim() ? { admin_reply: replyText.trim() } : {}) };
      setOpenTicket(updatedTicket);
      setTickets((prev) => prev.map((t) => t.id === openTicket.id ? updatedTicket : t));

      if (newMsg) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === (newMsg as TicketMessage).id)) return prev;
          return [...prev, newMsg as TicketMessage];
        });
        setReplyText("");
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
      }
    } else {
      const d = await res.json().catch(() => ({}));
      setActionError(d.error ?? "Action failed — check server logs.");
    }
    setSending(false);
  }

  const counts: Record<Tab, number> = {
    open:    tickets.filter((t) => t.status === "open").length,
    replied: tickets.filter((t) => t.status === "replied").length,
    closed:  tickets.filter((t) => t.status === "closed").length,
  };

  const filtered = tickets.filter((t) => {
    if (t.status !== activeTab) return false;
    if (!search) return true;
    const q    = search.toLowerCase();
    const name  = (t.profiles as { full_name: string | null } | null)?.full_name?.toLowerCase() ?? "";
    const email = (t.profiles as { email: string | null } | null)?.email?.toLowerCase() ?? "";
    return t.subject.toLowerCase().includes(q) || name.includes(q) || email.includes(q);
  });

  // ── Conversation view ────────────────────────────────────────────────
  if (openTicket) {
    const st       = STATUS_META[openTicket.status] ?? STATUS_META.open;
    const isClosed = openTicket.status === "closed";
    const name     = (openTicket.profiles as { full_name: string | null } | null)?.full_name ?? "Contributor";
    const email    = (openTicket.profiles as { email: string | null } | null)?.email ?? "";

    return (
      <div className="flex flex-col h-[calc(100vh-4rem-2rem)] -m-6">
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
              {name}{email ? ` · ${email}` : ""} · {CATEGORIES[openTicket.category] ?? openTicket.category}
            </p>
          </div>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--surface-page)]">
          {/* Original ticket message */}
          <div className="flex justify-start">
            <div className="max-w-[82%] sm:max-w-[70%]">
              <p className="text-xs text-[var(--text-muted)] mb-1 ml-1">{name}</p>
              <div className="bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] px-4 py-2.5 rounded-2xl rounded-tl-sm">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{openTicket.message}</p>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{fmtTime(openTicket.created_at)}</p>
            </div>
          </div>

          {/* Thread messages */}
          {loadingMsgs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <>
              {/* Backwards-compat: show legacy admin_reply if no thread messages */}
              {messages.length === 0 && openTicket.admin_reply && (
                <div className="flex justify-end">
                  <div className="max-w-[82%] sm:max-w-[70%]">
                    <p className="text-xs text-[var(--text-muted)] mb-1 text-right mr-1">You (legacy reply)</p>
                    <div className="bg-[var(--brand-500)] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{openTicket.admin_reply}</p>
                    </div>
                    {openTicket.replied_at && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 text-right">{fmtTime(openTicket.replied_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isAdmin = msg.sender_type === "admin";
                const label   = isAdmin ? "You" : name;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[82%] sm:max-w-[70%]">
                      <p className={`text-xs text-[var(--text-muted)] mb-1 ${isAdmin ? "text-right mr-1" : "ml-1"}`}>{label}</p>
                      <div className={`px-4 py-2.5 rounded-2xl ${
                        isAdmin
                          ? "bg-[var(--brand-500)] text-white rounded-tr-sm"
                          : "bg-[var(--surface-card)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      </div>
                      <p className={`text-[10px] text-[var(--text-muted)] mt-1 ${isAdmin ? "text-right" : "text-left"}`}>
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

        {/* Reply input + actions */}
        {!isClosed && (
          <div className="border-t border-[var(--border-default)] px-4 py-3 bg-[var(--surface-card)] flex-shrink-0 space-y-2">
            {actionError && (
              <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-md">{actionError}</p>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Reply to contributor… (Enter to send)"
                className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
              />
              <Button
                size="sm" className="flex-shrink-0 h-10 w-10 p-0"
                disabled={!replyText.trim() || sending} onClick={() => handleSend()}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="ghost"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                disabled={sending} onClick={() => handleSend(true)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {replyText.trim() ? "Send & Close" : "Close Ticket"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Ticket list view ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Support Tickets</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {counts.open} open · {counts.replied} replied · {counts.closed} closed
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px capitalize transition-colors ${
              activeTab === tab
                ? "border-[var(--brand-500)] text-[var(--brand-500)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {counts[tab] > 0 && (
              <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-500)] text-white">
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] max-w-sm">
        <Search className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contributor or subject…"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center">
          <Headphones className="h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No {activeTab} tickets</p>
          {search && <p className="text-sm text-[var(--text-secondary)]">No results for &quot;{search}&quot;</p>}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => {
            const st    = STATUS_META[t.status] ?? STATUS_META.open;
            const name  = (t.profiles as { full_name: string | null } | null)?.full_name ?? "Unknown";
            const email = (t.profiles as { email: string | null } | null)?.email ?? "—";
            return (
              <li key={t.id}>
                <button
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4 flex items-center gap-4 text-left hover:bg-[var(--surface-subtle)] transition-colors"
                  onClick={() => setOpenTicket(t)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{t.subject}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {name} · {email} · {CATEGORIES[t.category] ?? t.category} ·{" "}
                      {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
