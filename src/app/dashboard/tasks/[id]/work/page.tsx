"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Lock, CheckCircle2, ChevronDown,
  Upload, X, Loader2, Clock, Users, AlertCircle,
  FileText, ExternalLink, Send, CreditCard, ListChecks, Eye, Trophy,
  Calendar, Music, Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexCoinIcon } from "@/components/ui/nexcoin-icon";
import { supabase } from "@/lib/supabase";

interface TaskStep {
  title: string;
  description: string;
  submitType: "text" | "file" | "none" | "proof_code" | "telegram_join" | "telegram_bot" | "youtube_subscribe" | "twitter_follow" | "twitter_retweet" | "twitter_like";
  placeholder?: string;
  acceptedFiles?: string;
  url?: string;
  site_slug?: string;
  telegram_channel?: string;
  youtube_channel?: string;
  twitter_handle?: string;
  twitter_post_url?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  requirements: string | null;
  pay_per_task: number | null;
  pay_per_unit_nc: number | null;
  total_slots: number | null;
  filled_slots: number | null;
  deadline: string | null;
  status: string;
  assignment_required: boolean;
  is_private: boolean | null;
  validation_time: string | null;
  payment_time: string | null;
  steps: TaskStep[] | null;
  required_task_ids: string[] | null;
  excluded_task_ids: string[] | null;
  external_tool_url: string | null;
  external_tool_name: string | null;
  external_tool_instructions: string | null;
  external_proof_type: string | null;
  project_id: string | null;
}

interface DailyWorkItem {
  id: string;
  file_url: string | null;
  file_name: string | null;
  status: string;
  submission_content: string | null;
  submitted_at: string | null;
  coins_awarded: number | null;
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

  // Telegram verification state
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);

  // External tool proof state
  const [extCode, setExtCode]           = useState("");
  const [extFile, setExtFile]           = useState<File | null>(null);
  const [extSubmitting, setExtSubmitting] = useState(false);
  const [extError, setExtError]         = useState<string | null>(null);

  // Daily work state
  const [isDailyTarget, setIsDailyTarget]         = useState(false);
  const [dailyQuota, setDailyQuota]               = useState(10);
  const [dailyUnitName, setDailyUnitName]         = useState("item");
  const [dailyItems, setDailyItems]               = useState<DailyWorkItem[]>([]);
  const [dailyLoading, setDailyLoading]           = useState(false);
  const [activeItemId, setActiveItemId]           = useState<string | null>(null);
  const [itemContent, setItemContent]             = useState<Record<string, string>>({});
  const [submittingItem, setSubmittingItem]       = useState<string | null>(null);
  const [itemError, setItemError]                 = useState<Record<string, string>>({});

  const [done, setDone] = useState(false);
  const [stageSuccessModal, setStageSuccessModal] = useState(false);
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

      // Check if Telegram account is already linked
      const { data: tgAcc } = await supabase
        .from("telegram_accounts")
        .select("telegram_id")
        .eq("contributor_id", user.id)
        .maybeSingle();
      setTelegramLinked(!!tgAcc);

      const [taskRes, subRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("id", id).single(),
        // .limit(1) prevents maybeSingle() from erroring if duplicate rows exist
        supabase.from("submissions")
          .select("id, status")
          .eq("task_id", id)
          .eq("contributor_id", user.id)
          .limit(1)
          .maybeSingle(),
      ]);

      if (!taskRes.data) { setPageError("Task not found."); setLoading(false); return; }
      const t = taskRes.data as Task;
      setTask(t);

      // Eligibility gate
      const hasRequired = (t.required_task_ids ?? []).length > 0;
      const hasExcluded = (t.excluded_task_ids ?? []).length > 0;
      if (hasRequired || hasExcluded) {
        const allRuleIds = [...(t.required_task_ids ?? []), ...(t.excluded_task_ids ?? [])];
        const { data: eligSubs } = await supabase
          .from("submissions")
          .select("task_id")
          .eq("contributor_id", user.id)
          .eq("status", "approved")
          .in("task_id", allRuleIds);
        const approvedSet = new Set((eligSubs ?? []).map((s: { task_id: string }) => s.task_id));
        if (hasRequired) {
          const missingRequired = (t.required_task_ids ?? []).filter((rid) => !approvedSet.has(rid));
          if (missingRequired.length > 0) {
            // Resolve task titles for the message
            const { data: missingTasks } = await supabase
              .from("tasks").select("id, title").in("id", missingRequired);
            const names = (missingTasks ?? []) as { id: string; title: string }[];
            const label = names.length > 0 ? names.map((n) => `"${n.title}"`).join(", ") : "a required task";
            setPageError(`not_eligible:required:${label}`);
            setLoading(false); return;
          }
        }
        if (hasExcluded) {
          const matchedExcluded = (t.excluded_task_ids ?? []).filter((eid) => approvedSet.has(eid));
          if (matchedExcluded.length > 0) {
            const { data: exclTasks } = await supabase
              .from("tasks").select("id, title").in("id", matchedExcluded);
            const names = (exclTasks ?? []) as { id: string; title: string }[];
            const label = names.length > 0 ? names.map((n) => `"${n.title}"`).join(", ") : "a related task";
            setPageError(`not_eligible:excluded:${label}`);
            setLoading(false); return;
          }
        }
      }

      // Check if this is a daily target project
      if (t.project_id) {
        const { data: { session: sess } } = await supabase.auth.getSession();
        const dwRes = await fetch(`/api/daily-work?taskId=${id}`, {
          headers: { Authorization: `Bearer ${sess?.access_token ?? ""}` },
        });
        if (dwRes.ok) {
          const dw = await dwRes.json() as {
            isDailyTarget?: boolean; quota?: number; unitName?: string;
            items?: DailyWorkItem[]; completedCount?: number;
          };
          if (dw.isDailyTarget) {
            setIsDailyTarget(true);
            setDailyQuota(dw.quota ?? 10);
            setDailyUnitName(dw.unitName ?? "item");
            setDailyItems(dw.items ?? []);
            setDailyLoading(false);
          }
        }
      }

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
    } else if (step.submitType === "telegram_join") {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/tasks/telegram/verify-join", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          task_id:          id,
          step_index:       modalStep,
          telegram_channel: step.telegram_channel ?? "",
        }),
      });
      const json: { verified: boolean; reason?: string } = await res.json();
      if (!json.verified) {
        setModalError(
          json.reason === "not_linked"
            ? "Link your Telegram account first using the button above."
            : json.reason === "not_member"
            ? "You haven't joined the channel yet. Please join and try again."
            : "Verification failed. Please try again."
        );
        setSubmittingModal(false);
        return;
      }
      textValue = "telegram_verified";
    } else if (step.submitType === "telegram_bot") {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/tasks/telegram/verify-bot", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ task_id: id, step_index: modalStep }),
      });
      const json: { verified: boolean; reason?: string } = await res.json();
      if (!json.verified) {
        setModalError(
          json.reason === "not_started"
            ? "Please open @NexGuildBot and press Start first."
            : "Verification failed. Please try again."
        );
        setSubmittingModal(false);
        return;
      }
      textValue = "bot_started";
    } else if (step.submitType === "youtube_subscribe") {
      if (!modalFile) {
        setModalError("Please upload a screenshot showing your subscription.");
        setSubmittingModal(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", modalFile);
      formData.append("stepIndex", String(modalStep));
      const upRes = await fetch(`/api/tasks/${id}/upload-to-drive`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body:    formData,
      });
      if (!upRes.ok) {
        const errJson = await upRes.json().catch(() => ({})) as { error?: string };
        setModalError(errJson.error ?? "Upload failed — please try again.");
        setSubmittingModal(false);
        return;
      }
      const upJson = await upRes.json();
      fileUrl = upJson.url;
    } else if (step.submitType === "twitter_follow" || step.submitType === "twitter_retweet" || step.submitType === "twitter_like") {
      if (!modalFile) {
        setModalError("Please upload a screenshot as proof.");
        setSubmittingModal(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("file", modalFile);
      formData.append("stepIndex", String(modalStep));
      const upRes = await fetch(`/api/tasks/${id}/upload-to-drive`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body:    formData,
      });
      if (!upRes.ok) {
        const errJson = await upRes.json().catch(() => ({})) as { error?: string };
        setModalError(errJson.error ?? "Upload failed — please try again.");
        setSubmittingModal(false);
        return;
      }
      const upJson2 = await upRes.json();
      fileUrl = upJson2.url;
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
    setFinalSubmitting(false);
    setStageSuccessModal(true);

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

  async function submitExternalTool(e: React.FormEvent) {
    e.preventDefault();
    if (!submissionId || !task) return;
    const proofType = task.external_proof_type ?? "screenshot";
    if ((proofType === "code" || proofType === "both") && !extCode.trim()) {
      setExtError("Please enter your completion code."); return;
    }
    if ((proofType === "screenshot" || proofType === "both") && !extFile) {
      setExtError("Please upload a screenshot of your completed work."); return;
    }
    setExtSubmitting(true);
    setExtError(null);

    const { data: { session: extSession } } = await supabase.auth.getSession();
    let uploadedFile: FileItem | null = null;

    if (extFile) {
      const fd = new FormData();
      fd.append("file", extFile);
      const upRes = await fetch(`/api/tasks/${id}/upload-to-drive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${extSession?.access_token ?? ""}` },
        body: fd,
      });
      if (!upRes.ok) {
        const errJson = await upRes.json().catch(() => ({})) as { error?: string };
        setExtError(errJson.error ?? "Screenshot upload failed — please try again.");
        setExtSubmitting(false); return;
      }
      const upJson = await upRes.json();
      uploadedFile = { name: upJson.name ?? extFile.name, url: upJson.url, size: upJson.size ?? extFile.size };
    }

    const { error: updateErr } = await supabase.from("submissions").update({
      notes: extCode.trim() || null,
      files: uploadedFile ? [uploadedFile] : null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }).eq("id", submissionId);

    if (updateErr) { setExtError(updateErr.message); setExtSubmitting(false); return; }
    setDone(true);
    setExtSubmitting(false);

    if (extSession?.access_token) {
      fetch("/api/submissions/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${extSession.access_token}` },
        body: JSON.stringify({ taskId: id }),
      }).catch(() => {});
    }
  }

  async function submitDailyItem(itemId: string) {
    const content = (itemContent[itemId] ?? "").trim();
    if (!content) { setItemError((prev) => ({ ...prev, [itemId]: "Please enter your work output." })); return; }
    setItemError((prev) => ({ ...prev, [itemId]: "" }));
    setSubmittingItem(itemId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/daily-work/${itemId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setDailyItems((prev) => prev.map((i) => i.id === itemId
        ? { ...i, status: "submitted", submission_content: content, submitted_at: new Date().toISOString() }
        : i));
      setActiveItemId(null);
    } else {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setItemError((prev) => ({ ...prev, [itemId]: d.error ?? "Submission failed." }));
    }
    setSubmittingItem(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (pageError || !task) {
    const isEligError = pageError?.startsWith("not_eligible:");
    let eligTitle = "You are not eligible for this task.";
    let eligBody  = "";
    if (pageError?.startsWith("not_eligible:required:")) {
      eligBody = `Required: Complete ${pageError.replace("not_eligible:required:", "")} first.`;
    } else if (pageError?.startsWith("not_eligible:excluded:")) {
      eligBody = `You already completed a related task that excludes you from this one: ${pageError.replace("not_eligible:excluded:", "")}.`;
    }
    return (
      <div className="space-y-4 max-w-2xl">
        <Link
          href="/dashboard/opportunities"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          {isEligError ? (
            <>
              <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-7 w-7 text-amber-500" />
              </div>
              <p className="text-lg font-bold text-slate-800 mb-2">{eligTitle}</p>
              {eligBody && <p className="text-sm text-slate-500 max-w-xs mx-auto">{eligBody}</p>}
              <Link
                href="/dashboard/opportunities"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Browse other tasks →
              </Link>
            </>
          ) : (
            <>
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">{pageError ?? "Task not found"}</p>
            </>
          )}
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
            <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Review: {task.validation_time}</p>
          )}
          {task.payment_time && submissionStatus !== "approved" && (
            <p className="text-xs text-slate-400 mt-0.5 inline-flex items-center gap-1"><CreditCard className="h-3 w-3" /> Payment: within {task.payment_time} of approval</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link href="/dashboard/tasks">My Tasks</Link></Button>
          <Button variant="secondary" asChild><Link href="/dashboard/opportunities">Browse More</Link></Button>
        </div>
      </div>
    );
  }

  const steps            = task.steps ?? [];
  const hasSteps         = steps.length > 0;
  const isExternalTool   = task.task_type === "External Tool Task";

  const dailyCompletedCount = dailyItems.filter((i) => ["submitted", "approved"].includes(i.status)).length;
  const quotaReached        = isDailyTarget && dailyCompletedCount >= dailyQuota;
  const dailyProgressPct    = isDailyTarget && dailyQuota > 0 ? Math.min(100, Math.round((dailyCompletedCount / dailyQuota) * 100)) : 0;
  const doneSet             = new Set(stepSubs.map((s) => s.step_index));
  const completedCount      = doneSet.size;
  const allDone        = hasSteps && completedCount >= steps.length;
  const progressPct    = hasSteps ? (completedCount / steps.length) * 100 : 0;
  const countdown      = formatCountdown(task.deadline, now);
  const isPrivate      = task.is_private || task.assignment_required;
  const activeStep     = modalStep !== null ? steps[modalStep] : null;
  const taskEmoji      = TASK_TYPE_EMOJI[task.task_type ?? ""] ?? "📋";

  return (
    <>
      <div className={`lg:flex lg:gap-6 lg:items-start ${hasSteps ? "pb-28 lg:pb-28" : ""}`}>
      {/* ── LEFT: main content ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">

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

          {/* Task title */}
          <div className="relative z-10 mb-4">
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
                <NexCoinIcon size={12} /> {contributorCoins} NexCoins
              </span>
            )}
            {task.task_type && (
              <span className="inline-flex items-center rounded-full border border-indigo-300/40 bg-indigo-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100">
                {task.task_type}
              </span>
            )}
            {task.validation_time && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/40 bg-blue-400/20 px-3 py-1 text-xs font-medium text-blue-100">
                <Clock className="h-3 w-3" /> Review: {task.validation_time}
              </span>
            )}
            {task.payment_time && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/40 bg-orange-400/20 px-3 py-1 text-xs font-medium text-orange-100">
                <CreditCard className="h-3 w-3" /> Payment: {task.payment_time}
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
                const isOpen      = collapsedSteps.has(idx);
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
                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                    style={{ border: isOpen ? "1.5px solid rgba(99,102,241,0.4)" : "1px solid #e2e8f0" }}
                  >
                    {/* Indigo→teal gradient header — always visible */}
                    <div
                      onClick={toggleCollapse}
                      className="flex cursor-pointer items-center gap-3 px-5 py-4"
                      style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                        style={{ background: "rgba(255,255,255,0.2)", border: "1.5px solid rgba(255,255,255,0.35)", color: "#ffffff" }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug text-white">Stage {idx + 1}: {step.title}</p>
                        {!isOpen && (step.description || step.url) && (
                          <p className="mt-0.5 text-xs text-white/55">Tap to view instructions</p>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 flex-shrink-0 text-white/80 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>

                    {/* Collapsible middle — description + Open Link */}
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-64" : "max-h-0"}`}>
                      {(step.description || step.url) && (
                        <div className="flex items-start justify-between gap-4 bg-white px-5 py-4" style={{ borderTop: "1px solid rgba(99,102,241,0.1)" }}>
                          {step.description && (
                            <p className="flex-1 text-sm leading-relaxed text-slate-600 pt-0.5">{step.description}</p>
                          )}
                          {step.url && (
                            <div className="flex-shrink-0">
                              <a
                                href={buildStepUrl(step.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap"
                                style={{ border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)", color: "#6366f1" }}
                              >
                                <ExternalLink className="h-3 w-3" /> Open Link
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Fixed bottom — gradient strip with button inside */}
                    <div className="px-5 py-3.5" style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}>
                      <button
                        onClick={() => openModal(idx)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/25"
                      >
                        <Send className="h-4 w-4" />
                        {step.submitType === "none"               ? "Mark as Complete"
                          : step.submitType === "proof_code"       ? "Verify Code →"
                          : step.submitType === "telegram_join"    ? "Verify Join →"
                          : step.submitType === "telegram_bot"     ? "Verify Bot Start →"
                          : step.submitType === "youtube_subscribe" ? "Upload Screenshot →"
                          : step.submitType === "twitter_follow"   ? "Upload Screenshot →"
                          : step.submitType === "twitter_retweet"  ? "Upload Screenshot →"
                          : step.submitType === "twitter_like"     ? "Upload Screenshot →"
                          : "Submit Stage →"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EXTERNAL TOOL MODE ───────────────────────────────────── */}
        {!hasSteps && isExternalTool && (
          <div className="space-y-4">
            {/* Info + open tool card */}
            <div className="rounded-2xl border border-amber-200/60 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">External Tool Task</p>
                  <p className="text-xs text-slate-500">
                    Complete the work in{task.external_tool_name ? ` ${task.external_tool_name}` : " the external tool"}, then submit proof below.
                  </p>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
              )}

              {task.external_tool_instructions && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold text-slate-700">How to access the tool</span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {task.external_tool_instructions}
                  </p>
                </div>
              )}

              {task.requirements && (
                <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">Additional Instructions</span>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{task.requirements}</p>
                </div>
              )}

              {task.external_tool_url && (
                <a
                  href={task.external_tool_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-colors text-white"
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open {task.external_tool_name || "External Tool"} →
                </a>
              )}
            </div>

            {/* Proof submission card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-1">Submit Proof of Completion</h2>
              <p className="text-sm text-slate-400 mb-4">
                {task.external_proof_type === "code"       ? "Enter the completion code you received from the tool." :
                 task.external_proof_type === "both"       ? "Upload a screenshot AND enter your completion code." :
                                                             "Upload a screenshot showing your completed work."}
              </p>
              <form onSubmit={submitExternalTool} className="space-y-4">
                {/* Screenshot upload */}
                {(task.external_proof_type === "screenshot" || task.external_proof_type === "both" || !task.external_proof_type) && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Screenshot{task.external_proof_type === "both" ? " (required)" : ""}
                    </label>
                    {extFile ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <Eye className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{extFile.name}</span>
                          <span className="text-xs text-slate-400 flex-shrink-0">({(extFile.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button type="button" onClick={() => setExtFile(null)} className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="ext-screenshot"
                        className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-amber-400 transition-colors text-center"
                      >
                        <Upload className="h-6 w-6 text-slate-400" />
                        <span className="text-sm text-slate-500">Click to upload screenshot</span>
                        <span className="text-xs text-slate-400">PNG, JPG, WebP — max 10 MB</span>
                        <input
                          id="ext-screenshot"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) setExtFile(f); e.target.value = ""; }}
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* Completion code */}
                {(task.external_proof_type === "code" || task.external_proof_type === "both") && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Completion Code{task.external_proof_type === "both" ? " (required)" : ""}
                    </label>
                    <input
                      type="text"
                      value={extCode}
                      onChange={(e) => setExtCode(e.target.value)}
                      placeholder="Paste your completion code here…"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition-colors font-mono"
                    />
                  </div>
                )}

                {extError && (
                  <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{extError}</p>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Button type="submit" disabled={extSubmitting}
                    style={{ background: extSubmitting ? undefined : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}>
                    {extSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Proof →"}
                  </Button>
                  <Button type="button" variant="ghost" asChild>
                    <Link href="/dashboard/tasks">Cancel</Link>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── DAILY TARGET MODE ────────────────────────────────────── */}
        {isDailyTarget && (
          <div className="space-y-4">
            {/* Progress card */}
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Today&apos;s Work</span>
                </div>
                <span className="text-sm font-bold text-indigo-600">{dailyCompletedCount}/{dailyQuota} {dailyUnitName}s</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${dailyProgressPct}%`, background: "linear-gradient(90deg, #6366f1, #14b8a6)" }} />
              </div>
              {quotaReached && (
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-teal-600">
                  <CheckCircle2 className="h-4 w-4" /> You&apos;ve completed today&apos;s quota! Come back tomorrow for more work.
                </div>
              )}
            </div>

            {/* No items yet */}
            {dailyItems.length === 0 && !dailyLoading && (
              <div className="rounded-2xl border border-slate-100 bg-white py-12 text-center shadow-sm">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 mb-1">No files assigned yet for today</p>
                <p className="text-xs text-slate-400">Check back later — admin uploads files daily.</p>
              </div>
            )}

            {/* Work items */}
            {dailyItems.map((item, idx) => {
              const isSubmitted = ["submitted", "approved"].includes(item.status);
              const isActive    = activeItemId === item.id;
              const isAudio     = !!(item.file_url && /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(item.file_url));

              return (
                <div key={item.id} className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${
                  isSubmitted ? "border-green-200/60" : "border-slate-100"
                }`}>
                  {/* Item header */}
                  <div className={`flex items-center gap-3 px-5 py-3 ${isSubmitted ? "bg-green-50" : "bg-slate-50"}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isSubmitted ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-600"
                    }`}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {item.file_name ?? `${dailyUnitName} ${idx + 1}`}
                      </p>
                      {isSubmitted && (
                        <p className="text-xs text-green-600 font-medium">
                          {item.status === "approved" ? "✓ Approved" : "✓ Submitted for review"}
                        </p>
                      )}
                    </div>
                    {item.status === "approved" && item.coins_awarded != null && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <NexCoinIcon size={11} /> +{item.coins_awarded}
                      </span>
                    )}
                    {!isSubmitted && (
                      <button
                        onClick={() => setActiveItemId(isActive ? null : item.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        {isActive ? "Collapse ▲" : "Work on this ▼"}
                      </button>
                    )}
                  </div>

                  {/* Expanded work area */}
                  {isActive && !isSubmitted && (
                    <div className="px-5 py-4 space-y-3 border-t border-slate-100">
                      {/* File viewer */}
                      {item.file_url && (
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          {isAudio ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <Music className="h-3.5 w-3.5" /> Audio file
                              </div>
                              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                              <audio controls className="w-full h-10" src={item.file_url}>
                                Your browser does not support audio playback.
                              </audio>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:underline truncate flex-1">
                                {item.file_name ?? item.file_url}
                              </a>
                              <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Submission text area */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Your work output <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          rows={4}
                          value={itemContent[item.id] ?? ""}
                          onChange={(e) => setItemContent((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder={`Enter your ${dailyUnitName} output here…`}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y"
                        />
                        {itemError[item.id] && (
                          <p className="text-xs text-red-500 mt-1">{itemError[item.id]}</p>
                        )}
                      </div>

                      <Button
                        disabled={submittingItem === item.id}
                        onClick={() => submitDailyItem(item.id)}
                        className="w-full"
                      >
                        {submittingItem === item.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <><Send className="h-3.5 w-3.5" /> Submit this {dailyUnitName}</>}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CLASSIC MODE ─────────────────────────────────────────── */}
        {!hasSteps && !isExternalTool && !isDailyTarget && (
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

              {activeStep.submitType === "telegram_bot" && (
                <div className="space-y-3">
                  <div className={`rounded-xl border p-4 ${telegramLinked ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {telegramLinked
                        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                        : <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                      }
                      <span className="text-sm font-semibold text-slate-700">
                        {telegramLinked ? "Bot started — account linked ✓" : "Start @NexGuildBot"}
                      </span>
                    </div>
                    {!telegramLinked && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Open the bot and press Start. Your account will be linked automatically.</p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://t.me/NexGuildBot?start=nexguild_${userId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#2AABEE,#229ED9)" }}
                          >
                            Open @NexGuildBot →
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              const { data } = await supabase.from("telegram_accounts").select("telegram_id").eq("contributor_id", userId!).maybeSingle();
                              setTelegramLinked(!!data);
                            }}
                            className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            I&apos;ve started it — refresh ↺
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">Once started, click <b>Verify Bot Start</b> below.</p>
                </div>
              )}

              {activeStep.submitType === "youtube_subscribe" && (
                <div className="space-y-3">
                  {activeStep.youtube_channel && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-500">1</span>
                        <span className="text-sm font-semibold text-slate-700">Subscribe to the channel</span>
                      </div>
                      <a
                        href={activeStep.youtube_channel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: "#FF0000" }}
                      >
                        Open YouTube Channel →
                      </a>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-500">2</span>
                      <span className="text-sm font-semibold text-slate-700">Upload screenshot showing subscribed</span>
                    </div>
                    <label
                      htmlFor="yt-screenshot"
                      className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-red-300 transition-colors text-center"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setModalFile(f); }}
                    >
                      {modalFile ? (
                        <><FileText className="h-6 w-6 text-red-400" /><span className="text-sm font-semibold text-slate-700">{modalFile.name}</span><span className="text-xs text-slate-400">Click to change</span></>
                      ) : (
                        <><Upload className="h-6 w-6 text-slate-400" /><span className="text-sm text-slate-500">Click to upload screenshot</span><span className="text-xs text-slate-400">PNG, JPG — clearly shows the Subscribe button is active</span></>
                      )}
                      <input id="yt-screenshot" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setModalFile(f); }} />
                    </label>
                  </div>
                </div>
              )}

              {(activeStep.submitType === "twitter_follow" || activeStep.submitType === "twitter_retweet" || activeStep.submitType === "twitter_like") && (
                <div className="space-y-3">
                  {/* Step 1: Go to the URL */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600">1</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {activeStep.submitType === "twitter_follow"
                          ? "Follow the X/Twitter account"
                          : activeStep.submitType === "twitter_retweet"
                          ? "Repost/Retweet the post"
                          : "Like the post"}
                      </span>
                    </div>
                    {(activeStep.twitter_handle || activeStep.twitter_post_url) && (
                      <a
                        href={activeStep.twitter_handle
                          ? `https://x.com/${activeStep.twitter_handle.replace(/^@/, "")}`
                          : activeStep.twitter_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: "#000000" }}
                      >
                        Open on X →
                      </a>
                    )}
                  </div>

                  {/* Step 2: Upload screenshot */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600">2</span>
                      <span className="text-sm font-semibold text-slate-700">Upload screenshot as proof</span>
                    </div>
                    <label
                      htmlFor="twitter-screenshot"
                      className="flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-sky-300 transition-colors text-center"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setModalFile(f); }}
                    >
                      {modalFile ? (
                        <><FileText className="h-6 w-6 text-sky-400" /><span className="text-sm font-semibold text-slate-700">{modalFile.name}</span><span className="text-xs text-slate-400">Click to change</span></>
                      ) : (
                        <><Upload className="h-6 w-6 text-slate-400" /><span className="text-sm text-slate-500">Click to upload screenshot</span><span className="text-xs text-slate-400">PNG, JPG — must clearly show the action completed</span></>
                      )}
                      <input id="twitter-screenshot" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setModalFile(f); }} />
                    </label>
                  </div>
                </div>
              )}

              {activeStep.submitType === "telegram_join" && (
                <div className="space-y-3">
                  {/* Step 1: Link Telegram */}
                  <div className={`rounded-xl border p-4 ${telegramLinked ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {telegramLinked
                        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                        : <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">1</span>
                      }
                      <span className="text-sm font-semibold text-slate-700">
                        {telegramLinked ? "Telegram account linked ✓" : "Link your Telegram account"}
                      </span>
                    </div>
                    {!telegramLinked && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">Open NexGuildBot and press Start to connect your account.</p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://t.me/NexGuildBot?start=nexguild_${userId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#2AABEE,#229ED9)" }}
                          >
                            Open @NexGuildBot →
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              const { data } = await supabase.from("telegram_accounts").select("telegram_id").eq("contributor_id", userId!).maybeSingle();
                              setTelegramLinked(!!data);
                            }}
                            className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
                          >
                            I&apos;ve linked — refresh ↺
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Join channel */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">2</span>
                      <span className="text-sm font-semibold text-slate-700">Join the Telegram channel</span>
                    </div>
                    {activeStep.telegram_channel && (
                      <a
                        href={`https://t.me/${activeStep.telegram_channel.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
                        style={{ background: "rgba(42,171,238,0.1)", color: "#229ED9", border: "1px solid rgba(42,171,238,0.3)" }}
                      >
                        Join {activeStep.telegram_channel} →
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">Complete both steps, then click <b>Verify Join</b> below.</p>
                </div>
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
                  disabled={
                    submittingModal
                    || ((activeStep.submitType === "telegram_join" || activeStep.submitType === "telegram_bot") && !telegramLinked)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                >
                  {submittingModal
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    : <><Send className="h-3.5 w-3.5" /> {
                        activeStep.submitType === "none"               ? "Confirm"
                      : activeStep.submitType === "proof_code"         ? "Verify →"
                      : activeStep.submitType === "telegram_join"      ? "Verify Join →"
                      : activeStep.submitType === "telegram_bot"       ? "Verify Bot Start →"
                      : activeStep.submitType === "youtube_subscribe"  ? "Submit Screenshot →"
                      : "Submit"
                    }</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE SUCCESS MODAL ──────────────────────────────────────── */}
      {stageSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => router.push("/dashboard/tasks")}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent bar */}
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #14b8a6)" }} />

            <div className="p-5 sm:p-8 space-y-5 text-center">
              {/* Check icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>

              {/* Title + body */}
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Submission Received!</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Our admin team will review your work and get back to you.
                </p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-3">
                {contributorCoins != null && (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                      <NexCoinIcon size={18} />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Reward</p>
                    <p className="text-xs font-bold text-slate-700 text-center leading-tight">{contributorCoins} NexCoins</p>
                  </div>
                )}
                {task.validation_time && (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-100 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                      <Clock className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Review</p>
                    <p className="text-xs font-bold text-slate-700 text-center leading-tight">{task.validation_time}</p>
                  </div>
                )}
                {task.payment_time && (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-100 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                      <CreditCard className="h-4 w-4 text-teal-500" />
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Payment</p>
                    <p className="text-xs font-bold text-slate-700 text-center leading-tight">{task.payment_time}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/dashboard/tasks")}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                >
                  My Tasks
                </button>
                <button
                  onClick={() => router.push("/dashboard/opportunities")}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Browse More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RIGHT: sticky task-info panel (desktop only) ─────────────── */}
      <div className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 flex-shrink-0 sticky top-20">

        {/* Reward card */}
        {contributorCoins != null && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Your Reward</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 flex-shrink-0">
                <NexCoinIcon size={22} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800">{contributorCoins}</p>
                <p className="text-xs text-slate-400">NexCoins</p>
              </div>
            </div>
          </div>
        )}

        {/* Task details card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Task Details</p>
          <div className="space-y-3">
            {task.deadline && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Deadline</p>
                  <p className={`text-xs font-semibold truncate ${countdown === "Ended" ? "text-red-500" : "text-slate-700"}`}>{countdown === "Ended" ? "Ended" : `${countdown} left`}</p>
                </div>
              </div>
            )}
            {task.total_slots != null && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 flex-shrink-0">
                  <Users className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Slots</p>
                  <p className="text-xs font-semibold text-slate-700">{task.filled_slots ?? 0} / {task.total_slots} filled</p>
                </div>
              </div>
            )}
            {task.validation_time && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 flex-shrink-0">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Review Time</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{task.validation_time}</p>
                </div>
              </div>
            )}
            {task.payment_time && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 flex-shrink-0">
                  <CreditCard className="h-3.5 w-3.5 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Payment</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{task.payment_time}</p>
                </div>
              </div>
            )}
            {task.task_type && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 flex-shrink-0">
                  <FileText className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Task Type</p>
                  <p className="text-xs font-semibold text-slate-700 capitalize">{task.task_type}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How-to guide card */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}>
              <ListChecks className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">How to Complete</p>
          </div>
          <ol className="space-y-3.5">
            {[
              { icon: <Eye className="h-3.5 w-3.5 text-indigo-500" />, bg: "bg-indigo-50", title: "Read the task", desc: "Review all instructions and requirements carefully before starting." },
              { icon: <ListChecks className="h-3.5 w-3.5 text-teal-500" />, bg: "bg-teal-50", title: hasSteps ? "Complete each stage" : "Do the work", desc: hasSteps ? "Unlock stages one by one — complete each in order." : "Follow the instructions and submit your notes or files." },
              { icon: <Send className="h-3.5 w-3.5 text-amber-500" />, bg: "bg-amber-50", title: "Submit your work", desc: hasSteps ? "Once all stages are done, hit Submit Task in the footer." : "Use the form below to upload your work for review." },
              { icon: <Trophy className="h-3.5 w-3.5 text-emerald-500" />, bg: "bg-emerald-50", title: "Earn NexCoins", desc: "After admin approval your NexCoins are credited instantly." },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0 mt-0.5 ${step.bg}`}>
                  {step.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">{step.title}</p>
                  <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>{/* end right panel */}
      </div>{/* end outer flex wrapper */}

      {/* ── FIXED BOTTOM BAR ─────────────────────────────────────────── */}
      {hasSteps && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-[240px] z-30 bg-white/95 backdrop-blur-md shadow-[0_-1px_0_0_rgba(99,102,241,0.12),0_-4px_16px_0_rgba(0,0,0,0.06)]">
          {/* Gradient accent line at top */}
          <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg, #6366f1, #14b8a6)" }} />
          <div className="px-4 sm:px-6 py-3 lg:pr-[280px] xl:pr-[312px]">
            {allDone ? (
              /* All stages complete — single row: reward pill + submit button */
              <div className="flex items-center gap-3">
                {contributorCoins != null && (
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 flex-shrink-0">
                      <NexCoinIcon size={14} />
                      <span className="text-xs font-bold text-amber-600 whitespace-nowrap">{contributorCoins} NexCoins</span>
                    </div>
                    <span className="hidden sm:block text-xs text-slate-400 truncate">Ready to submit all stages</span>
                  </div>
                )}
                <button
                  onClick={finalSubmit}
                  disabled={finalSubmitting}
                  className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)" }}
                >
                  {finalSubmitting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                    : <><Send className="h-4 w-4" /> Submit Task</>}
                </button>
              </div>
            ) : (
              /* In progress — reward pill + step progress */
              <div className="flex items-center gap-3">
                {contributorCoins != null && (
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 flex-shrink-0">
                    <NexCoinIcon size={14} />
                    <span className="text-xs font-bold text-amber-600 whitespace-nowrap">{contributorCoins} NexCoins</span>
                  </div>
                )}
                <div className="flex flex-1 items-center justify-end gap-2.5">
                  <div className="flex items-center gap-1">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          doneSet.has(i) ? "h-2 w-5 bg-indigo-500" : "h-2 w-2 bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="whitespace-nowrap text-xs font-medium text-slate-400">
                    {completedCount}/{steps.length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
