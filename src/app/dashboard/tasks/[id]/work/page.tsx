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
  site_slug?: string;  // used when submitType === "proof_code"
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

  // Step card expand state (none expanded by default to show chevrons)
  const [collapsedSteps, setCollapsedSteps] = useState<Set<number>>(new Set());
  // Submit modal
  const [modalStep, setModalStep]       = useState<number | null>(null);
  const [modalText, setModalText]       = useState("");
  const [modalFile, setModalFile]       = useState<File | null>(null);
  const [modalError, setModalError]     = useState<string | null>(null);
  const [submittingModal, setSubmittingModal] = useState(false);
  // Final task submit
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  // Classic mode
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

  // Replace {user_id} placeholder in step URLs so external sites receive the contributor's ID
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
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (pageError || !task) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link
          href="/dashboard/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-10 text-center">
          <AlertCircle className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--text-primary)]">{pageError ?? "Task not found"}</p>
        </div>
      </div>
    );
  }

  if (done || submissionStatus === "submitted" || submissionStatus === "approved") {
    return (
      <div className="max-w-md mx-auto space-y-6 py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {submissionStatus === "approved" ? "Task Approved! 🎉" : "Submission Received!"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {submissionStatus === "approved"
              ? "Your submission has been approved and NexCoins have been credited to your account."
              : "Our admin team will review your work and get back to you."}
          </p>
          {task.pay_per_task && (
            <p className="text-sm font-bold text-[var(--brand-500)] mt-3">
              Reward: {task.pay_per_task} NexCoins
            </p>
          )}
          {task.validation_time && submissionStatus !== "approved" && (
            <p className="text-xs text-[var(--text-muted)] mt-1">⏱ Review: {task.validation_time}</p>
          )}
          {task.payment_time && submissionStatus !== "approved" && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">💰 Payment: within {task.payment_time} of approval</p>
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

  return (
    <>
      <div className={`space-y-5 max-w-3xl ${hasSteps ? "pb-24" : ""}`}>
        {/* ── TOP SECTION ── */}
        <div className="space-y-3 relative z-10">
          <Link
            href="/dashboard/opportunities"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Opportunities
          </Link>

          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] leading-tight relative z-20">
            {task.title}
          </h1>

          {task.deadline && (
            <p className={`flex items-center gap-2 text-sm font-semibold relative z-20 ${
              countdown === "Ended" ? "text-red-400" : "text-[var(--text-secondary)]"
            }`}>
              <Clock className="h-4 w-4 text-[var(--brand-500)] flex-shrink-0" />
              {countdown === "Ended" ? "Task Ended" : `${countdown} remaining`}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap relative z-20">
            {task.pay_per_task && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-500)] bg-[rgba(2,180,145,0.12)] border border-[rgba(2,180,145,0.2)] px-3 py-1.5 rounded-full">
                <NexCoinIcon size={14} /> {task.pay_per_task} NexCoins
              </span>
            )}
            {task.total_slots != null && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-subtle)] border border-[var(--border-default)] px-3 py-1.5 rounded-full">
                <Users className="h-3.5 w-3.5" /> {task.filled_slots ?? 0}/{task.total_slots} slots
              </span>
            )}
            {isPrivate && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                <Lock className="h-3.5 w-3.5" /> Private
              </span>
            )}
            {task.task_type && (
              <span className="inline-flex items-center text-xs font-bold text-[var(--brand-500)] bg-[rgba(2,180,145,0.08)] border border-[rgba(2,180,145,0.15)] px-3 py-1.5 rounded-full uppercase tracking-wide">
                {task.task_type}
              </span>
            )}
            {task.validation_time && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                ⏱ Review: {task.validation_time}
              </span>
            )}
            {task.payment_time && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-subtle)] border border-[var(--border-default)] px-3 py-1.5 rounded-full">
                💰 Payment: {task.payment_time}
              </span>
            )}
          </div>
        </div>

        {/* ── STEPS MODE ── */}
        {hasSteps && (
          <div className="space-y-4 relative z-10">
            {/* Progress bar card */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Stages: {completedCount}/{steps.length} completed
                </span>
                <span className="text-xs font-semibold text-[var(--brand-500)]">
                  {Math.round(progressPct)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, var(--brand-600), var(--brand-400))",
                  }}
                />
              </div>
            </div>

            {/* Step cards Loop */}
            <div className="space-y-3 relative z-10">
              {steps.map((step, idx) => {
                const isCompleted = doneSet.has(idx);
                const isLocked    = !isCompleted && idx > 0 && !doneSet.has(idx - 1);
                // Invert collapse logic so chevrons show by default
                const isOpen      = !collapsedSteps.has(idx);
                const stepSub     = stepSubs.find((s) => s.step_index === idx);

                function toggleCollapse() {
                  setCollapsedSteps((prev) => {
                    const next = new Set(prev);
                    if (next.has(idx)) next.delete(idx); else next.add(idx);
                    return next;
                  });
                }

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all duration-300 ease-in-out overflow-hidden shadow-sm relative z-20 ${
                      isCompleted
                        ? "border-green-500/25"
                        : isLocked
                        ? "border-[var(--border-default)] opacity-55"
                        : isOpen
                        ? "border-[#02b491]/30" // Subtle border color when open
                        : "border-[var(--border-default)]"
                    }`}
                  >
                    {/* LAYER 1: CARD HEADER ROW (Colors based on open/closed state) */}
                    <div
                      className={`flex items-center gap-3 px-5 py-3 transition-colors duration-300 ease-in-out ${
                        isLocked ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                      style={{
                        // Header background becomes brand blue when open
                        backgroundColor: isOpen && !isLocked ? '#02b491' : 'var(--surface-card)',
                        // Title text becomes white when open
                        color: isOpen && !isLocked ? '#ffffff' : 'var(--text-primary)'
                      }}
                      onClick={() => !isLocked && toggleCollapse()}
                    >
                      {/* Step icon */}
                      <div 
                        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors duration-300 ease-in-out"
                        style={{
                          // Icon background becomes white when open
                          backgroundColor: isOpen && !isLocked ? '#ffffff' : isCompleted ? 'rgba(34, 197, 94, 0.15)' : isLocked ? 'var(--surface-subtle)' : 'rgba(2, 180, 145, 0.15)',
                          // Icon text becomes dark slate grey when open
                          color: isOpen && !isLocked ? '#1e293b' : isCompleted ? '#4ade80' : isLocked ? 'var(--text-muted)' : '#02b491'
                        }}
                      >
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-4 w-4" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug">
                          Stage {idx + 1}: {step.title}
                        </p>
                        {isLocked ? (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Complete stage {idx} first
                          </p>
                        ) : isCompleted && stepSub ? (
                          <p className={`text-xs mt-0.5 truncate transition-colors duration-300 ease-in-out ${isOpen ? 'text-[#ffffff]/80' : 'text-green-400/80'}`}>
                            {stepSub.text_value
                              ? `"${stepSub.text_value.slice(0, 60)}${stepSub.text_value.length > 60 ? "…" : ""}"`
                              : stepSub.file_url ? "File uploaded ✓" : "Completed ✓"}
                          </p>
                        ) : null}
                      </div>

                      {!isLocked && (
                        <div
                          className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200"
                          style={{
                            backgroundColor: isOpen ? 'rgba(255,255,255,0.2)' : 'rgba(2,180,145,0.12)',
                            border: isOpen ? '1.5px solid rgba(255,255,255,0.35)' : '1.5px solid rgba(2,180,145,0.35)',
                          }}
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
                            style={{ color: isOpen ? '#ffffff' : '#02b491' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* LAYER 2: EXPANDABLE BODY (Content Zone remains white) */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && !isLocked ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      {!isLocked && (
                        <div className="px-5 pb-5 pt-5 border-t bg-[var(--surface-card)]" style={{ borderColor: 'rgba(2, 180, 145, 0.2)' }}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {step.description && (
                              <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 pt-0.5">
                                {step.description}
                              </p>
                            )}
                            {step.url && (
                              <div className="flex-shrink-0">
                                <a
                                  href={buildStepUrl(step.url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap"
                                  style={{
                                    borderColor: 'rgba(2, 180, 145, 0.4)',
                                    backgroundColor: 'rgba(2, 180, 145, 0.08)',
                                    color: '#02b491'
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open Link
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* LAYER 3: FIXED BOTTOM BAR (Colors based on open state) */}
                    <div 
                      className={`px-5 py-3 border-t flex items-center justify-end transition-all duration-300 ease-in-out relative z-30 ${isOpen && !isLocked ? 'border-[#02b491]/30' : 'border-[var(--border-default)]'}`}
                      style={{ 
                        // Bottom bar matches header color when open
                        backgroundColor: isOpen && !isLocked ? '#02b491' : 'rgba(var(--surface-subtle), 0.1)',
                      }}
                    >
                      {!isLocked ? (
                        isCompleted ? (
                          <div className={`flex items-center gap-2 text-sm font-semibold py-1 transition-colors duration-300 ease-in-out ${isOpen ? 'text-[#ffffff]' : 'text-green-400'}`}>
                            <CheckCircle2 className="h-4 w-4" /> Stage completed
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => openModal(idx)}
                            // Hover effect tweak
                            className="hover:opacity-95 transition-all text-xs h-8 px-4 font-bold tracking-wide shadow-sm my-1 relative z-40"
                            style={{ 
                              // Button becomes white with dark slate grey text when open
                              backgroundColor: isOpen ? '#ffffff' : '#02b491', 
                              color: isOpen ? '#1e293b' : '#ffffff' 
                            }}
                          >
                            <Send className="h-3.5 w-3.5" />
                            {step.submitType === "none" ? "Mark as Complete" : step.submitType === "proof_code" ? "Verify Code →" : "Submit Stage →"}
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CLASSIC MODE ── */}
        {!hasSteps && (
          <div className="space-y-4">
            {(task.description || task.requirements) && (
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 space-y-4">
                {task.description && (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{task.description}</p>
                )}
                {task.requirements && (
                  <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-[var(--brand-500)]" />
                      <span className="text-sm font-bold text-[var(--text-primary)]">Instructions</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                      {task.requirements}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5">
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Submit Your Work</h2>
              <form onSubmit={submitClassic} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Notes <span className="text-[var(--text-muted)] font-normal">(optional if uploading files)</span>
                  </label>
                  <textarea
                    value={classicNotes}
                    onChange={(e) => setClassicNotes(e.target.value)}
                    rows={4}
                    placeholder="Describe what you did, include links, or add notes for the reviewer…"
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
                    Files <span className="text-[var(--text-muted)] font-normal">(optional if adding notes)</span>
                  </label>
                  <label
                    htmlFor="classic-files"
                    className="flex flex-col items-center gap-2 border-2 border-dashed border-[var(--border-default)] rounded-lg p-6 cursor-pointer hover:border-[var(--brand-500)] transition-colors text-center"
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
                    <Upload className="h-6 w-6 text-[var(--text-muted)]" />
                    <span className="text-sm text-[var(--text-secondary)]">Click to select files or drag & drop</span>
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
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)]"
                        >
                          <span className="text-sm text-[var(--text-primary)] truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setClassicFiles((prev) => prev.filter((_, j) => j !== i))}
                            className="text-[var(--text-muted)] hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {classicError && (
                  <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{classicError}</p>
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

      {/* ── SUBMIT STEP MODAL ── */}
      {modalStep !== null && activeStep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Submit Stage {modalStep + 1}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{activeStep.title}</p>
              </div>
              <button
                onClick={closeModal}
                disabled={submittingModal}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeStep.submitType === "text" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">Your Response</label>
                <textarea
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  rows={5}
                  placeholder={activeStep.placeholder ?? "Enter your response here…"}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] resize-none"
                  autoFocus
                />
              </div>
            )}

            {activeStep.submitType === "file" && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[var(--text-primary)]">Upload File</label>
                <label
                  htmlFor="modal-file-input"
                  className="flex flex-col items-center gap-3 border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 cursor-pointer hover:border-[var(--brand-500)] transition-colors text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) setModalFile(file);
                  }}
                >
                  {modalFile ? (
                    <>
                      <FileText className="h-8 w-8 text-[var(--brand-500)]" />
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{modalFile.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">Click to change</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-[var(--text-muted)]" />
                      <span className="text-sm text-[var(--text-secondary)]">Click to select or drag & drop</span>
                      {activeStep.acceptedFiles && (
                        <span className="text-xs text-[var(--text-muted)]">Accepted: {activeStep.acceptedFiles}</span>
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
              <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-subtle)] rounded-lg px-4 py-3">
                Confirm to mark this stage as complete.
              </p>
            )}

            {activeStep.submitType === "proof_code" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={modalText}
                  onChange={(e) =>
                    setModalText(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
                  }
                  placeholder="ABCD1234"
                  maxLength={8}
                  autoFocus
                  className="w-full px-3 py-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] font-mono tracking-[.35em] text-center text-xl uppercase"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Enter the 8-character code shown in the NexGuild verification widget on the site you visited.
                </p>
              </div>
            )}

            {modalError && (
              <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{modalError}</p>
            )}

            <div className="flex gap-2 justify-end relative z-50">
              <Button variant="ghost" onClick={closeModal} disabled={submittingModal}>Cancel</Button>
              <Button onClick={handleStepSubmit} disabled={submittingModal}>
                {submittingModal
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  : <><Send className="h-3.5 w-3.5" /> {activeStep.submitType === "none" ? "Confirm" : activeStep.submitType === "proof_code" ? "Verify →" : "Submit"}</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── FIXED BOTTOM BAR ── */}
      {hasSteps && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-[240px] z-30 border-t border-[var(--border-default)] bg-[var(--surface-card)]/95 backdrop-blur-sm shadow-inner">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 flex-wrap min-w-0">
              {task.pay_per_task && (
                <div className="flex items-center gap-1.5 min-w-0 relative z-40">
                  <NexCoinIcon size={16} className="flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    Earn up to: <span className="font-bold text-[var(--brand-500)]">{task.pay_per_task} NexCoins</span>
                  </span>
                </div>
              )}
              {task.total_slots != null && (
                <div className="flex items-center gap-1.5 relative z-40">
                  <Users className="h-4 w-4 text-[var(--text-muted)] flex-shrink-0" />
                  <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    Slots: <span className="font-semibold text-[var(--text-primary)]">{task.filled_slots ?? 0}/{task.total_slots}</span>
                  </span>
                </div>
              )}
            </div>

            {allDone ? (
              <Button onClick={finalSubmit} disabled={finalSubmitting} className="flex-shrink-0 relative z-40">
                {finalSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><Send className="h-4 w-4" /> Submit Task</>}
              </Button>
            ) : (
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0 whitespace-nowrap relative z-40">
                {completedCount}/{steps.length} stages done
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}