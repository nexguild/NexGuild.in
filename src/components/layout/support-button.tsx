"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "general",  label: "General Inquiry" },
  { value: "task",     label: "Task Issue" },
  { value: "coins",    label: "Payment / Coins Issue" },
  { value: "account",  label: "Account Problem" },
  { value: "voucher",  label: "Voucher Issue" },
  { value: "bug",      label: "Bug Report" },
];

const inputClass =
  "w-full px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";

export function SupportButton() {
  const [open, setOpen]         = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [category, setCategory] = useState("general");
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (!position) return;
    function keepInViewport() {
      setPosition((current) => current && ({
        x: Math.max(8, Math.min(current.x, window.innerWidth - 64)),
        y: Math.max(8, Math.min(current.y, window.innerHeight - 64)),
      }));
    }
    window.addEventListener("resize", keepInViewport);
    return () => window.removeEventListener("resize", keepInViewport);
  }, [position]);

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    setPosition({
      x: Math.max(8, Math.min(drag.originX + deltaX, window.innerWidth - 64)),
      y: Math.max(8, Math.min(drag.originY + deltaY, window.innerHeight - 64)),
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = event.type === "pointerup" && drag.moved;
    if (suppressClickRef.current) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragRef.current = null;
  }

  function handleOpen() { setOpen(true); setSuccess(false); setError(null); }

  function handleClose() {
    setOpen(false);
    setCategory("general"); setSubject(""); setMessage("");
    setSuccess(false); setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not logged in."); setSubmitting(false); return; }

    const res = await fetch("/api/support/create-ticket", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body:    JSON.stringify({ subject: subject.trim(), message: message.trim(), category }),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <>
      {/* Floating contact button */}
      <button
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          handleOpen();
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Contact Support"
        title="Drag to move · click to contact support"
        style={position ? { left: position.x, top: position.y } : undefined}
        className={`fixed ${position ? "" : "bottom-24 right-5 lg:right-6"} z-40 flex h-14 w-14 touch-none select-none items-center justify-center rounded-full bg-[#f59e0b] shadow-lg transition-transform duration-200 hover:scale-110 active:cursor-grabbing cursor-grab`}
      >
        <MessageCircle className="h-6 w-6 text-[#0c0c10]" />
      </button>

      {/* Support modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-[var(--surface-card)] rounded-xl border border-[var(--border-default)] shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Submit a Support Ticket</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">We typically respond within 24 hours.</p>
              </div>
              <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              {success ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-400" />
                  </div>
                  <p className="font-semibold text-[var(--text-primary)]">Ticket Submitted!</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    We&apos;ll get back to you soon. View your tickets in{" "}
                    <a href="/dashboard/support" className="text-[var(--brand-500)] hover:underline">My Support</a>.
                  </p>
                  <Button size="sm" className="mt-2" onClick={handleClose}>Done</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} h-10`}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Subject <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <input
                      type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className={`${inputClass} h-10`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Message <span className="text-[var(--danger-text)]">*</span>
                    </label>
                    <textarea
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue in detail…"
                      rows={4} className={`${inputClass} py-2.5 resize-none`}
                    />
                  </div>
                  {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
