"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

const PROJECT_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "Image Collection",
  "Palm / Face / Gesture Data", "App Testing", "Game Testing", "Website Testing",
  "Content Moderation", "Web Research", "Social Media Tasks", "Other",
];
const BUDGETS = [
  "Under ₹10,000", "₹10,000 – ₹50,000", "₹50,000 – ₹2,00,000",
  "₹2,00,000+", "Let's discuss",
];
const TIMELINES = ["ASAP", "Within 2 weeks", "Within 1 month", "1–3 months", "Flexible"];

const INPUT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-white text-sm placeholder-white/25 focus:outline-none focus:border-[var(--brand-500)] transition-colors";
const SELECT_CLS =
  "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm focus:outline-none focus:border-[var(--brand-500)] transition-colors text-white/70";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "", email: "", company: "",
    projectType: "", budget: "", timeline: "", message: "",
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-[var(--brand-500)]/30 bg-[var(--brand-100)] p-10 text-center">
        <CheckCircle className="h-10 w-10 text-[var(--brand-500)] mx-auto mb-4" />
        <h3 className="text-white font-bold text-lg mb-2">Message Sent!</h3>
        <p className="text-[var(--text-secondary)] text-sm">
          We&apos;ll review your enquiry and get back to you within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Name *</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className={INPUT_CLS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Email *</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@company.com"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Company / Organisation</label>
        <input
          type="text" value={form.company}
          onChange={(e) => set("company", e.target.value)}
          placeholder="Company or organisation name"
          className={INPUT_CLS}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Project Type</label>
          <select value={form.projectType} onChange={(e) => set("projectType", e.target.value)} className={SELECT_CLS}>
            <option value="">Select type</option>
            {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Budget</label>
          <select value={form.budget} onChange={(e) => set("budget", e.target.value)} className={SELECT_CLS}>
            <option value="">Select budget</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Timeline</label>
          <select value={form.timeline} onChange={(e) => set("timeline", e.target.value)} className={SELECT_CLS}>
            <option value="">Select timeline</option>
            {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Message *</label>
        <textarea
          required value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={5}
          placeholder="Tell us about your project — type of work, approximate volume, any specific requirements."
          className={`${INPUT_CLS} h-auto py-2.5 resize-none`}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit" disabled={loading}
        className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-500)] text-[#0c0800] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          "Send Message"
        )}
      </button>
    </form>
  );
}
