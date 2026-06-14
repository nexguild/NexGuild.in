"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, Loader2 } from "lucide-react";

const PROJECT_TYPES = [
  "Audio Recording",
  "Transcription",
  "Image Labeling / Annotation",
  "Survey / Research",
  "Content Writing",
  "Managed Workforce Project",
  "Other",
];

const BUDGETS = ["Under ₹10,000", "₹10k – ₹50k", "₹50k – ₹2L", "₹2L+", "Let's discuss"];
const TIMELINES = ["ASAP", "Within 1 month", "1–3 months", "Flexible"];

interface FormState {
  name: string;
  email: string;
  company: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
}

const EMPTY: FormState = {
  name: "", email: "", company: "", projectType: "",
  budget: "", timeline: "", message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setForm(EMPTY);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--text-primary)]">Message sent!</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
          Thank you for reaching out. We will get back to you within 24–48 hours.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-sm text-[var(--text-link)] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Full Name <span className="text-[var(--brand-500)]">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="Your name"
            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            Email <span className="text-[var(--brand-500)]">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            placeholder="you@company.com"
            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Company / Organisation</label>
        <input
          type="text"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
          placeholder="Optional"
          className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Project Type</label>
          <select
            value={form.projectType}
            onChange={(e) => set("projectType", e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          >
            <option value="">Select type</option>
            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Budget</label>
          <select
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          >
            <option value="">Select budget</option>
            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Timeline</label>
          <select
            value={form.timeline}
            onChange={(e) => set("timeline", e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent"
          >
            <option value="">Select timeline</option>
            {TIMELINES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
          Message <span className="text-[var(--brand-500)]">*</span>
        </label>
        <textarea
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          required
          rows={5}
          placeholder="Tell us about your project, requirements, or any questions you have..."
          className="w-full px-3 py-2.5 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y min-h-[120px]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 rounded-md bg-red-500/10 px-4 py-3">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="h-4 w-4" /> Send Message</>
        )}
      </Button>
    </form>
  );
}
