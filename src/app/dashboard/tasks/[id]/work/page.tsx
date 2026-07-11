"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Lock, CheckCircle2, ChevronDown,
  Upload, X, Loader2, Clock, Users, AlertCircle,
  FileText, ExternalLink, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface TaskStep {
  title: string;
  description: string;
  submitType: "text" | "file" | "none" | "proof_code";
  placeholder?: string;
  acceptedFiles?: string;
  url?: string;
  site_slug?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  requirements: string | null;
  pay_per_task: number | null;
  total_slots: number | null;
  filled_slots: number | null;
  deadline: string | null;
  status: string;
  assignment_required: boolean;
  is_private: boolean | null;
  validation_time: string | null;
  payment_time: string | null;
  steps: TaskStep[] | null;
}

interface StepSubmission {
  step_index: number;
  submission_type: string;
  text_value: string | null;
  file_url: string | null;
}

interface FileItem {
  name: string;
  url: string;
  size: number;
}

const TASK_TYPE_EMOJI: Record<string, string> = {
  "Transcription": "🎙️",
  "Data Annotation": "🏷️",
  "App Testing": "📱",
  "Game Testing": "🎮",
  "Survey": "📊",
  "Web Research": "🔍",
  "Audio Recording": "🎤",
  "Content Writing": "✍️",
  "Translation": "🌐",
  "Proofreading": "📝",
  "Data Entry": "⌨️",
  "Image Labeling": "🖼️",
  "Social Media": "📣",
};

function formatCountdown(deadline: string | null, now: Date): string {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function TaskWorkPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [userId, setUserId]                     = useState<string | null>(null);
  const [task, setTask]                         = useState<Task | null>(null);
  const [submissionId, setSubmissionId]         = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [stepSubs, setStepSubs]                 = useState<StepSubmission[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [pageError, setPageError]               = useState<string | null>(null);

  const [collapsedSteps, setCollapsedSteps] = useState<Set<number>>(new Set());
  const [modalStep, setModalStep]       = useState<number | null>(null);
  const [modalText, setModalText]       = useState("");
  const [modalFile, setModalFile]       = useState<File | null>(null);
  const [modalError, setModalError]     = useState<string | null>(null);
  const [submittingModal, setSubmittingModal] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [classicNotes, setClassicNotes]         = useState("");
  const [classicFiles, setClassicFiles]         = useState<File[]>([]);
  const [classicSubmitting, setClassicSubmitting] = useState(false);
  const [classicError, setClassicError]         = useState<string | null>(null);

  const [done, setDone] = useState(false);
  const [now, setNow]   = useState(() => new Date());

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const [taskRes, subRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("id", id).single(),
        supabase.from("submissions")
          .select("id, status")
          .eq("task_id", id)
          .eq("contributor_id", user.id)
          .maybeSingle(),
      ]);

      if (!taskRes.data) { setPageError("Task not found."); setLoading(false); return; }
      const t = taskRes.data as Task;
      setTask(t);

      let sid: string | null    = subRes.data?.id ?? null;
      let sstatus: string | null = subRes.data?.status ?? null;

      if (!sid) {
        const { data: newSub } = await supabase
          .from("submissions")
          .insert({ task_id: id, contributor_id: user.id, status: "in_progress" })
          .select("id, status")
          .single();
        if (newSub) {
          sid     = newSub.id;
          sstatus = newSub.status;
          const newFilled = (t.filled_slots ?? 0) + 1;
          const isClosed  = t.total_slots != null && newFilled >= t.total_slots;
          await supabase.from("tasks").update({
            filled_slots: newFilled,
            ...(isClosed ? { status: "closed" } : {}),
          }).eq("id", id);
        }
      }

      setSubmissionId(sid);
      setSubmissionStatus(sstatus);

      if (sid && sstatus !== "resubmit_requested") {
        try {
          const { data: subs } = await supabase
            .from("task_step_submissions")
            .select("step_index, submission_type, text_value, file_url")
            .eq("task_id", id)
            .eq("contributor_id", user.id);
          setStepSubs((subs ?? []) as StepSubmission[]);
        } catch {
          // table may not exist yet — fall back to classic mode
        }
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  function buildStepUrl(url: string | undefined): string | undefined {
    if (!url || !userId) return url;
    return url.replace(/\{user_id\}/g, userId);
  }

  function openModal(idx: number) {
    setModalStep(idx);
    setModalText("");
    setModalFile(null);
    setModalError(null);
  }

  function closeModal() {
    if (submittingModal) return;
    setModalStep(null);
    setModalText("");
    setModalFile(null);
    setModalError(null);
  }

  async function handleStepSubmit() {
    if (modalStep === null || !userId || !task) return;
    const step = task.steps![modalStep];
    setSubmittingModal(true);
    setModalError(null);

    let textValue: string | null = null;
    let fileUrl: string | null   = null;

    if (step.submitType === "text") {
      textValue = modalText.trim() || null;
      if (!textValue) { setModalError("Please enter a response."); setSubmittingModal(false); return; }
    } else if (step.submitType === "file") {
      if (!modalFile) { setModalError("Please select a file."); setSubmittingModal(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", modalFile);
      formData.append("stepIndex", String(modalStep));
      const upRes = await fetch(`/api/tasks/${id}/upload-to-drive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: formData,
      });
      if (!upRes.ok) {
        const errJson = await upRes.json().catch(() => ({})) as { error?: string };
        setModalError(errJson.error ?? "Upload failed — please try again.");
        setSubmittingModal(false);
        return;
      }
      const upJson = await upRes.json();
      fileUrl = upJson.url;
    } else if (step.submitType === "proof_code") {
      const code = modalText.trim().toUpperCase();
      if (!code || code.length !== 8) {
        setModalError("Please enter the 8-character verification code.");
        setSubmittingModal(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/tasks/proof-code/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          code,
          site_slug: step.site_slug ?? "starscoopdaily",
          task_id: id,
        }),
      });
      const json: { valid: boolean; reason?: string } = await res.json();
      if (!json.valid) {
        setModalError(
          json.reason === "already_used"
            ? "This code has already been used."
            : "Invalid or expired code. Please try again."
        );
        setSubmittingModal(false);
        return;
      }
      textValue = code;
    }

    const { error: saveErr } = await supabase.from("task_step_submissions").upsert({
      task_id: id,
      contributor_id: userId,
      step_index: modalStep,
      submission_type: step.submitType,
      text_value: textValue,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
    }, { onConflict: "task_id,contributor_id,step_index" });
    if (saveErr) { setModalError(saveErr.message); setSubmittingModal(false); return; }

    setStepSubs((prev) => [
      ...prev.filter((s) => s.step_index !== modalStep),
      { step_index: modalStep, submission_type: step.submitType, text_value: textValue, file_url: fileUrl },
    ]);
    setSubmittingModal(false);
    closeModal();
  }

  async function finalSubmit() {
    if (!submissionId) return;
    setFinalSubmitting(true);
    await supabase.from("submissions").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).eq("id", submissionId);
    setSubmissionStatus("submitted");
    setDone(true);
    setFinalSubmitting(false);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        fetch("/api/submissions/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ taskId: id }),
        }).catch(() => {});
      }
    });
  }

  async function submitClassic(e: React.FormEvent) {
    e.preventDefault();
    if (!submissionId) return;
    if (!classicNotes.trim() && classicFiles.length === 0) {
      setClassicError("Add notes or upload at least one file.");
      return;
    }
    setClassicSubmitting(true);
    setClassicError(null);

    const { data: { session: classicSession } } = await supabase.auth.getSession();
    const uploaded: FileItem[] = [];
    for (const file of classicFiles) {
      const classicFormData = new FormData();
      classicFormData.append("file", file);
      const upRes = await fetch(`/api/tasks/${id}/upload-to-drive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${classicSession?.access_token ?? ""}` },
        body: classicFormData,
      });
      if (!upRes.ok) {
        const errJson = await upRes.json().catch(() => ({})) as { error?: string };
        setClassicError(`Failed to upload "${file.name}": ${errJson.error ?? "upload failed"}`);
        setClassicSubmitting(false);
        return;
      }
      const upJson = await upRes.json();
      uploaded.push({ name: upJson.name ?? file.name, url: upJson.url, size: upJson.size ?? file.size });
    }

    const { error: updateErr } = await supabase.from("submissions").update({
      files: uploaded.length > 0 ? uploaded : null,
      notes: classicNotes.trim() || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).eq("id", submissionId);
    if (updateErr) { setClassicError(updateErr.message); setClassicSubmitting(false); return; }
    setDone(true);
    setClassicSubmitting(false);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        fetch("/api/submissions/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ taskId: id }),
        }).catch(() => {});
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (pageError || !task) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link
          href="/dashboard/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">{pageError ?? "Task not found"}</p>
        </div>
      </div>
    );
  }

  // Compute contributor-facing coin amount (66% of gross) — used in all display locations
  const contributorCoins = task.pay_per_task != null ? Math.floor(task.pay_per_task * 0.66) : null;

  if (done || submissionStatus === "submitted" || submissionStatus === "approved") {
    return (
      <div className="max-w-md mx-auto space-y-6 py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="h-8 w-8 text-teal-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            {submissionStatus === "approved" ? "Task Approved! 🎉" : "Submission Received!"}
          </h1>
          <p className="text-sm text-slate-500">
            {submissionStatus === "approved"
              ? "Your submission has been approved and NexCoins have been credited to your account."
              : "Our admin team will review your work and get back to you."}
          </p>
          {contributorCoins != null && (
            <p className="text-sm font-bold text-teal-600 mt-3">
              Reward: {contributorCoins} NexCoins
            </p>
          )}
          {task.validation_time && submissionStatus !== "approved" && (
            <p className="text-xs text-slate-400 mt-1">⏱ Review: {task.validation_time}</p>
          )}
          {task.payment_time && submissionStatus !== "approved" && (
            <p className="text-xs text-slate-400 mt-0.5">💰 Payment: within {task.payment_time} of approval</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link href="/dashboard/tasks">My Tasks</Link></Button>
          <Button variant="secondary" asChild><Link href="/dashboard/opportunities">Browse More</Link></Button>
        </div>
      </div>
    );
  }

  const steps          = task.steps ?? [];
  const hasSteps       = steps.length > 0;
  const doneSet        = new Set(stepSubs.map((s) => s.step_index));
  const completedCount = doneSet.size;
  const allDone        = hasSteps && completedCount >= steps.length;
  const progressPct    = hasSteps ? (completedCount / steps.length) * 100 : 0;
  const countdown      = formatCountdown(task.deadline, now);
  const isPrivate      = task.is_private || task.assignment_required;
  const activeStep     = modalStep !== null ? steps[modalStep] : null;
  const taskEmoji      = TASK_TYPE_EMOJI[task.task_type ?? ""] ?? "📋";

  return (
    <>
      <div className={`space-y-5 max-w-3xl ${hasSteps ? "pb-28" : ""}`}>

        {/* ── HERO HEADER CARD ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 p-6 shadow-lg">
          {/* Decorative circles */}
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -left-6 -bottom-8 h-28 w-28 rounded-full bg-white/5" />

          {/* Back link */}
          <Link
            href="/dashboard/opportunities"
            className="relative z-10 mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Opportunities
          </Link>

          {/* Task emoji + title */}
          <div className="relative z-10 flex items-start gap-3 mb-4">
            <span className="mt-0.5 flex-shrink-0 text-3xl">{taskEmoji}</span>
            <h1 className="text-xl font-extrabold leading-tight text-white">{task.title}</h1>
          </div>

          {/* Countdown pill */}
          {task.deadline && (
            <div className="relative z-10 mb-4">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${
                countdown === "Ended"
                  ? "border-red-300/40 bg-red-400/20 text-red-100"
                  : "border-white/25 bg-white/15 text-white"
              }`}>
                <Clock className="h-3.5 w-3.5" />
                {countdown === "Ended" ? "Task Ended" : `${countdown} remaining`}
              </span>
            </div>
          )}

          {/* Unified pills row */}
          <div className="relative z-10 flex flex-wrap gap-2">
            {contributorCoins != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-100">
                🪙 {contributorCoins} NexCoins
              </span>
            )}
            {task.task_type && (
              <span className="inline-flex items-center rounded-full border border-indigo-300/40 bg-indigo-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100">
                {task.task_type}
              </span>
            )}
            {task.validation_time && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/40 bg-blue-400/20 px-3 py-1 text-xs font-medium text-blue-100">
                ⏱ Review: {task.validation_time}
              </span>
            )}
            {task.payment_time && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/40 bg-orange-400/20 px-3 py-1 text-xs font-medium text-orange-100">
                💰 Payment: {task.payment_time}
              </span>
            )}
            {task.total_slots != null && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                <Users className="h-3 w-3" /> {task.filled_slots ?? 0}/{task.total_slots} slots
              </span>
            )}
            {isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-300/40 bg-purple-400/20 px-3 py-1 text-xs font-medium text-purple-100">
                <Lock className="h-3 w-3" /> Private
              </span>
            )}
          </div>
        </div>

        {/* ── STEPS MODE ───────────────────────────────────────────── */}
        {hasSteps && (
          <div className="space-y-4">

            {/* Progress card */}
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Your Progress</span>
                </div>
                <span className="text-sm font-bold text-indigo-600">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, #6366f1, #14b8a6)",
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">{completedCount}/{steps.length} stages completed</p>
            </div>

            {/* Step cards */}
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isCompleted = doneSet.has(idx);
                const isLocked    = !isCompleted && idx > 0 && !doneSet.has(idx - 1);
                const isOpen      = !collapsedSteps.has(idx);
                const stepSub     = stepSubs.find((s) => s.step_index === idx);

                function toggleCollapse() {
                  setCollapsedSteps((prev) => {
                    const next = new Set(prev);
                    if (next.has(idx)) next.delete(idx); else next.add(idx);
                    return next;
                  });
                }

                /* ── LOCKED ── */
                if (isLocked) {
                  return (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-sm"
                      style={{ borderLeft: "4px solid #e2e8f0" }}
                    >
                      <div className="flex cursor-not-allowed items-center gap-3 px-5 py-4 opacity-55">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <Lock className="h-4 w-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-500">Stage {idx + 1}: {step.title}</p>
                          <p className="mt-0.5 text-xs text-slate-400">Complete stage {idx} first</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                /* ── COMPLETED ── */
                if (isCompleted) {
                  return (
                    <div key={idx} className="overflow-hidden rounded-2xl border border-green-200/60 shadow-sm">
                      <div
                        onClick={toggleCollapse}
                        className="flex cursor-pointer items-center gap-3 bg-green-50 px-5 py-3 transition-colors hover:bg-green-100/60"
                      >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-700">Stage {idx + 1}: {step.title}</p>
                          {stepSub && (
                            <p className="mt-0.5 truncate text-xs text-green-600">
                              {stepSub.text_value
                                ? `"${stepSub.text_value.slice(0, 55)}${stepSub.text_value.length > 55 ? "…" : ""}"`
                                : stepSub.file_url ? "File uploaded ✓" : "Completed ✓"}
                            </p>
                          )}
                        </div>
                        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60" : "max-h-0"}`}>
                        <div className="space-y-3 border-t border-green-100 bg-white px-5 py-4">
                          {step.description && (
                            <p className="text-sm leading-relaxed text-slate-500">{step.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> Stage completed
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                /* ── ACTIVE (unlocked, not completed) ── */
                return (
                  <div
                    key={idx}
                    className={`overflow-hidden rounded-2xl ${isOpen ? "border border-indigo-200/40 shadow-md" : "border border-slate-200 shadow-sm"}`}
                  >
                    {/* Gradient header when open, plain white when collapsed */}
                    <div
                      onClick={toggleCollapse}
                      className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors"
                      style={isOpen
                        ? { background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }
                        : { background: "#ffffff" }
                      }
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
                        style={isOpen
                          ? { background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.3)", color: "#ffffff" }
                          : { background: "#eef2ff", border: "1.5px solid #c7d2fe", color: "#4f46e5" }
                        }
                      >
                        {idx + 1}
                      </div>
                      <p className={`flex-1 text-sm font-bold leading-snug transition-colors ${isOpen ? "text-white" : "text-slate-700"}`}>
                        Stage {idx + 1}: {step.title}
                      </p>
                      <ChevronDown
                        className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${isOpen ? "rotate-180 text-white/70" : "text-slate-400"}`}
                      />
                    </div>

                    {/* Expandable body */}
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[400px]" : "max-h-0"}`}>
                      <div className="space-y-4 border-t border-indigo-100 bg-white px-5 py-5">
                        {step.description && (
                          <p className="text-sm leading-relaxed text-slate-600">{step.description}</p>
                        )}
                        {step.url && (
                          <a
                            href={buildStepUrl(step.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open Link
                          </a>
                        )}
                        <button
                          onClick={() => openModal(idx)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-95"
                          style={{
                            background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)",
                            boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                          }}
                        >
                          <Send className="h-4 w-4" />
                          {step.submitType === "none" ? "Mark as Complete" : step.submitType === "proof_code" ? "Verify Code →" : "Submit Stage →"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CLASSIC MODE ─────────────────────────────────────────── */}
        {!hasSteps && (
          <div className="space-y-4">
            {(task.description || task.requirements) && (
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                {task.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
                )}
                {task.requirements && (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-bold text-slate-700">Instructions</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {task.requirements}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">Submit Your Work</h2>
              <form onSubmit={submitClassic} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Notes <span className="text-slate-400 font-normal">(optional if uploading files)</span>
                  </label>
                  <textarea
                    value={classicNotes}
                    onChange={(e) => setClassicNotes(e.target.value)}
                    rows={4}
                    placeholder="Describe what you did, include links, or add notes for the reviewer…"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Files <span className="text-slate-400 font-normal">(optional if adding notes)</span>
                  </label>
                  <label
                    htmlFor="classic-files"
                    className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-indigo-300 transition-colors text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files);
                      setClassicFiles((prev) => [
                        ...prev,
                        ...files.filter((f) => !prev.some((p) => p.name === f.name)),
                      ]);
                    }}
                  >
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm text-slate-500">Click to select files or drag & drop</span>
                    <input
                      id="classic-files"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setClassicFiles((prev) => [
                          ...prev,
                          ...files.filter((f) => !prev.some((p) => p.name === f.name)),
                        ]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {classicFiles.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {classicFiles.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="text-sm text-slate-700 truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setClassicFiles((prev) => prev.filter((_, j) => j !== i))}
                            className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {classicError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{classicError}</p>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Button type="submit" disabled={classicSubmitting}>
                    {classicSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Work →"}
                  </Button>
                  <Button type="button" variant="ghost" asChild>
                    <Link href="/dashboard/tasks">Cancel</Link>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ── SUBMIT STEP MODAL ────────────────────────────────────────── */}
      {modalStep !== null && activeStep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div
              className="flex items-start justify-between gap-3 px-6 py-4"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
            >
              <div>
                <h2 className="text-base font-bold text-white">Submit Stage {modalStep + 1}</h2>
                <p className="text-sm text-white/70 mt-0.5">{activeStep.title}</p>
              </div>
              <button
                onClick={closeModal}
                disabled={submittingModal}
                className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/15 border border-white/25 text-white/80 hover:text-white hover:bg-white/25 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {activeStep.submitType === "text" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Your Response</label>
                  <textarea
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    rows={5}
                    placeholder={activeStep.placeholder ?? "Enter your response here…"}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    autoFocus
                  />
                </div>
              )}

              {activeStep.submitType === "file" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Upload File</label>
                  <label
                    htmlFor="modal-file-input"
                    className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-indigo-300 transition-colors text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) setModalFile(file);
                    }}
                  >
                    {modalFile ? (
                      <>
                        <FileText className="h-8 w-8 text-indigo-500" />
                        <span className="text-sm font-semibold text-slate-700">{modalFile.name}</span>
                        <span className="text-xs text-slate-400">Click to change</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-400" />
                        <span className="text-sm text-slate-500">Click to select or drag & drop</span>
                        {activeStep.acceptedFiles && (
                          <span className="text-xs text-slate-400">Accepted: {activeStep.acceptedFiles}</span>
                        )}
                      </>
                    )}
                    <input
                      id="modal-file-input"
                      type="file"
                      accept={activeStep.acceptedFiles}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setModalFile(file);
                      }}
                    />
                  </label>
                </div>
              )}

              {activeStep.submitType === "none" && (
                <p className="text-sm text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  Confirm to mark this stage as complete.
                </p>
              )}

              {activeStep.submitType === "proof_code" && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Verification Code</label>
                  <input
                    type="text"
                    value={modalText}
                    onChange={(e) =>
                      setModalText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
                    }
                    placeholder="ABCD1234"
                    maxLength={8}
                    autoFocus
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono tracking-[.35em] text-center text-xl uppercase"
                  />
                  <p className="text-xs text-slate-400">
                    Enter the 8-character code shown in the NexGuild verification widget on the site you visited.
                  </p>
                </div>
              )}

              {modalError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{modalError}</p>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={closeModal} disabled={submittingModal}>Cancel</Button>
                <button
                  onClick={handleStepSubmit}
                  disabled={submittingModal}
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                >
                  {submittingModal
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    : <><Send className="h-3.5 w-3.5" /> {activeStep.submitType === "none" ? "Confirm" : activeStep.submitType === "proof_code" ? "Verify →" : "Submit"}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FIXED BOTTOM BAR ─────────────────────────────────────────── */}
      {hasSteps && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-[240px] z-30 border-t border-indigo-100/60 bg-white/85 backdrop-blur-md shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
            {/* Left: coin earn amount */}
            {contributorCoins != null && (
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="flex-shrink-0 text-base">🪙</span>
                <span className="whitespace-nowrap text-sm text-slate-500">
                  Earn up to:{" "}
                  <span className="font-bold text-amber-500">{contributorCoins} NexCoins</span>
                </span>
              </div>
            )}

            {/* Right: mini progress dots + stage count */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      doneSet.has(i) ? "h-2 w-4 bg-indigo-500" : "h-2 w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">
                {completedCount}/{steps.length} done
              </span>
            </div>

            {/* Submit button when all stages done */}
            {allDone && (
              <button
                onClick={finalSubmit}
                disabled={finalSubmitting}
                className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
              >
                {finalSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><Send className="h-4 w-4" /> Submit Task</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
