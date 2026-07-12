"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Loader2, Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { PayoutBreakdown } from "@/components/admin/PayoutBreakdown";
import { EligibilityRulesPicker } from "@/components/admin/EligibilityRulesPicker";

const TASK_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "App Testing",
  "Game Testing", "Survey", "Social Media Task", "Web Research",
  "Data Collection", "Content Task", "Micro-task", "External Tool Task",
];

const LANGUAGES = [
  "Any", "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu",
  "Arabic", "French", "German", "Spanish", "Portuguese",
  "Japanese", "Korean", "Chinese (Simplified)", "Filipino",
];


interface TaskStep {
  title: string;
  description: string;
  submitType: "text" | "file" | "none";
  placeholder: string;
  acceptedFiles: string;
  url: string;
}

interface QuizQuestion {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: "a" | "b" | "c" | "d";
}

function newStep(): TaskStep {
  return { title: "", description: "", submitType: "text", placeholder: "", acceptedFiles: "", url: "" };
}

function newQuestion(): QuizQuestion {
  return { question: "", a: "", b: "", c: "", d: "", correct: "a" };
}

function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        style={{ backgroundColor: value ? "#14b8a6" : "#374151", transition: "background-color 0.2s ease" }}
        className="h-6 w-11 rounded-full relative flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:ring-offset-2"
      >
        <span
          style={{ transform: value ? "translateX(22px)" : "translateX(2px)", transition: "transform 0.2s ease" }}
          className="absolute top-[2px] left-0 h-5 w-5 rounded-full bg-white shadow-md"
        />
      </button>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

const inputClass = "w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors";
const labelClass = "block text-sm font-semibold text-[var(--text-primary)] mb-1.5";
const textareaClass = "w-full px-3 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent resize-y";

interface ProjectOption { id: string; name: string; }

export default function PostNewTaskPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Basic info
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  // Project linking
  const [projectId, setProjectId]     = useState(searchParams.get("project_id") ?? "");
  const [projects, setProjects]       = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [title, setTitle]               = useState("");
  const [taskType, setTaskType]         = useState("");
  const [description, setDescription]   = useState("");
  const [requirements, setRequirements] = useState("");

  // Pay & capacity
  const [payInr, setPayInr]             = useState("");
  const [nexcoinPerInr, setNexcoinPerInr] = useState(12.5);
  const [totalSlots, setTotalSlots]     = useState("");
  const [deadline, setDeadline]         = useState("");

  // Assignment gate
  const [assignmentReq, setAssignmentReq]           = useState(false);
  const [assignmentType, setAssignmentType]         = useState<"text" | "file" | "quiz">("text");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [quizQuestions, setQuizQuestions]           = useState<QuizQuestion[]>([newQuestion()]);
  const [passingScore, setPassingScore]             = useState("70");

  // Targeting
  const [requiredLanguage, setRequiredLanguage] = useState("Any");
  const [skillInput, setSkillInput]             = useState("");
  const [requiredSkills, setRequiredSkills]     = useState<string[]>([]);

  // Campaign settings
  const [isPrivate, setIsPrivate]   = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [validationTime, setValidationTime] = useState("");
  const [paymentTime, setPaymentTime]       = useState("");

  // Gamification
  const [requiredLevel, setRequiredLevel] = useState("1");
  const [xpReward, setXpReward]           = useState("0");

  // T&C
  const [terms, setTerms] = useState("");

  // Steps builder
  const [steps, setSteps] = useState<TaskStep[]>([]);

  // Partial payment
  const [allowsPartial, setAllowsPartial]           = useState(false);
  const [unitName, setUnitName]                     = useState("");
  const [totalUnits, setTotalUnits]                 = useState("");
  const [payPerUnitInr, setPayPerUnitInr]           = useState("");

  // External tool config
  const [extToolUrl, setExtToolUrl]                   = useState("");
  const [extToolName, setExtToolName]                 = useState("");
  const [extToolInstructions, setExtToolInstructions] = useState("");
  const [extProofType, setExtProofType]               = useState<"screenshot" | "code" | "both">("screenshot");

  // Eligibility rules
  const [requiredTaskIds, setRequiredTaskIds] = useState<string[]>([]);
  const [excludedTaskIds, setExcludedTaskIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Load active projects for linking
  useEffect(() => {
    setProjectsLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      fetch("/api/admin/projects", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: { projects?: ProjectOption[] }) => { setProjects(d.projects ?? []); })
        .finally(() => setProjectsLoading(false));
    });
  }, []);

  // Load platform settings (SLA defaults + nexcoin rate)
  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["submission_review_sla", "payment_after_approval_sla", "nexcoin_per_inr"])
      .then(({ data }) => {
        if (!data) return;
        const rows = data as { key: string; value: string }[];
        const reviewSLA  = rows.find((r) => r.key === "submission_review_sla")?.value;
        const paymentSLA = rows.find((r) => r.key === "payment_after_approval_sla")?.value;
        const ncRate     = rows.find((r) => r.key === "nexcoin_per_inr")?.value;
        if (reviewSLA)  setValidationTime(reviewSLA);
        if (paymentSLA) setPaymentTime(paymentSLA);
        if (ncRate)     setNexcoinPerInr(parseFloat(ncRate));
      });
  }, []);

  // ── Skills ────────────────────────────────────────────────────────────────
  function addSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const s = skillInput.trim();
    if (s && !requiredSkills.includes(s)) setRequiredSkills((prev) => [...prev, s]);
    setSkillInput("");
  }
  function removeSkill(skill: string) {
    setRequiredSkills((prev) => prev.filter((s) => s !== skill));
  }

  // ── Steps ─────────────────────────────────────────────────────────────────
  function addStep() { setSteps((prev) => [...prev, newStep()]); }
  function removeStep(i: number) { setSteps((prev) => prev.filter((_, j) => j !== i)); }
  function updateStep(i: number, key: keyof TaskStep, val: string) {
    setSteps((prev) => prev.map((s, j) => j === i ? { ...s, [key]: val } : s));
  }
  function moveStep(i: number, dir: "up" | "down") {
    const next = [...steps];
    const target = dir === "up" ? i - 1 : i + 1;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    setSteps(next);
  }

  // ── Quiz questions ────────────────────────────────────────────────────────
  function addQuestion() { setQuizQuestions((prev) => [...prev, newQuestion()]); }
  function removeQuestion(i: number) { setQuizQuestions((prev) => prev.filter((_, j) => j !== i)); }
  function updateQuestion(i: number, key: keyof QuizQuestion, val: string) {
    setQuizQuestions((prev) => prev.map((q, j) => j === i ? { ...q, [key]: val } : q));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit(status: "active" | "draft") {
    if (!title.trim() || !taskType || !description.trim()) {
      setError("Title, type, and description are required.");
      return;
    }
    if (taskType === "External Tool Task" && !extToolUrl.trim()) {
      setError("External tool URL is required for this task type.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) { setError("Not authenticated."); setSaving(false); return; }

    const stepsPayload = steps
      .filter((s) => s.title.trim())
      .map((s) => ({
        title:         s.title.trim(),
        description:   s.description.trim(),
        submitType:    s.submitType,
        placeholder:   s.placeholder.trim() || undefined,
        acceptedFiles: s.acceptedFiles.trim() || undefined,
        url:           s.url.trim() || undefined,
      }));

    const questionsPayload = assignmentType === "quiz"
      ? quizQuestions.filter((q) => q.question.trim() && q.a.trim() && q.b.trim())
      : [];

    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        title:                       title.trim(),
        task_type:                   taskType,
        description:                 description.trim(),
        requirements:                requirements.trim() || null,
        pay_per_task:                (() => {
          if (allowsPartial && totalUnits && payPerUnitInr) {
            const unitNc = Math.round(parseFloat(payPerUnitInr) * nexcoinPerInr);
            return parseInt(totalUnits) * unitNc;
          }
          return payInr ? Math.round(parseFloat(payInr) * nexcoinPerInr) : null;
        })(),
        pay_per_task_inr:            (() => {
          if (allowsPartial && totalUnits && payPerUnitInr) {
            return parseInt(totalUnits) * parseFloat(payPerUnitInr);
          }
          return payInr ? parseFloat(payInr) : null;
        })(),
        total_slots:                 totalSlots ? parseInt(totalSlots) : null,
        deadline:                    deadline || null,
        assignment_required:         assignmentReq,
        assignment_type:             assignmentReq ? assignmentType : null,
        assignment_instructions:     assignmentReq ? assignmentInstructions.trim() || null : null,
        assignment_questions:        assignmentReq && assignmentType === "quiz" ? questionsPayload : [],
        assignment_passing_score:    assignmentReq && assignmentType === "quiz" ? parseInt(passingScore) || 70 : 70,
        required_language:           requiredLanguage,
        required_skills:             requiredSkills,
        is_private:                  isPrivate,
        is_featured:                 isFeatured,
        validation_time:             validationTime,
        payment_time:                paymentTime,
        terms:                       terms.trim() || null,
        steps:                       stepsPayload.length > 0 ? stepsPayload : [],
        required_level:              requiredLevel ? parseInt(requiredLevel) : 1,
        xp_reward:                   xpReward ? parseInt(xpReward) : 0,
        status,
        project_id:                  projectId || null,
        allows_partial_payment:      allowsPartial,
        unit_name:                   allowsPartial ? unitName.trim() || null : null,
        total_units:                 allowsPartial && totalUnits ? parseInt(totalUnits) : null,
        pay_per_unit_inr:            allowsPartial && payPerUnitInr ? parseFloat(payPerUnitInr) : null,
        pay_per_unit_nc:             allowsPartial && payPerUnitInr ? Math.round(parseFloat(payPerUnitInr) * nexcoinPerInr) : null,
        required_task_ids:           requiredTaskIds,
        excluded_task_ids:           excludedTaskIds,
        external_tool_url:           taskType === "External Tool Task" ? extToolUrl.trim() || null : null,
        external_tool_name:          taskType === "External Tool Task" ? extToolName.trim() || null : null,
        external_tool_instructions:  taskType === "External Tool Task" ? extToolInstructions.trim() || null : null,
        external_proof_type:         taskType === "External Tool Task" ? extProofType : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create task."); setSaving(false); return; }
    router.push("/admin/tasks");
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Post New Task</h1>
        <p className="text-sm text-[var(--text-secondary)]">Create a task for contributors to complete.</p>
      </div>

      <div className="space-y-5">
        {/* ── Project link (optional) ────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-3">
          <h2 className="font-bold text-[var(--text-primary)]">Link to Project <span className="text-xs font-normal text-[var(--text-muted)]">optional</span></h2>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={projectsLoading}
            className={inputClass}>
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="text-xs text-[var(--text-muted)]">Attach this task to an existing client project for tracking.</p>
        </section>

        {/* ── Basic Info ─────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Task Details</h2>

          <div>
            <label className={labelClass}>Task Title <span className="text-[var(--danger-text)]">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Audio Recording — English Prompts" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Task Type <span className="text-[var(--danger-text)]">*</span></label>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={inputClass}>
              <option value="">Select task type</option>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-[var(--danger-text)]">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="Describe the task clearly — what contributors need to do, quality standards..."
              className={textareaClass} />
          </div>

          <div>
            <label className={labelClass}>
              Instructions for Contributors
              <span className="text-[var(--text-muted)] font-normal ml-1">(shown on task page)</span>
            </label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3}
              placeholder="Step-by-step instructions contributors will see when they start the task..."
              className={textareaClass} />
          </div>
        </section>

        {/* ── External Tool Config (conditional) ────────────────────────── */}
        {taskType === "External Tool Task" && (
          <section className="rounded-xl border border-amber-500/30 bg-[var(--surface-card)] p-6 space-y-5">
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">External Tool Configuration</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                The actual work happens in an external platform. NexGuild collects proof of completion.
              </p>
            </div>

            <div>
              <label className={labelClass}>Tool URL <span className="text-[var(--danger-text)]">*</span></label>
              <input type="url" value={extToolUrl} onChange={(e) => setExtToolUrl(e.target.value)}
                placeholder="https://client-platform.com/task/123" className={inputClass} />
              <p className="text-xs text-[var(--text-muted)] mt-1">Contributors will be sent here to complete the work.</p>
            </div>

            <div>
              <label className={labelClass}>Tool / Platform Name</label>
              <input type="text" value={extToolName} onChange={(e) => setExtToolName(e.target.value)}
                placeholder="e.g. Client Annotation Platform, Survey Tool" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Login / Access Instructions</label>
              <textarea value={extToolInstructions} onChange={(e) => setExtToolInstructions(e.target.value)} rows={4}
                placeholder={"e.g.\n1. Open the tool link below.\n2. Log in with your registered email.\n3. Complete all tasks in the queue.\n4. Download your completion certificate."}
                className={textareaClass} />
            </div>

            <div>
              <label className={labelClass}>Proof of Completion</label>
              <p className="text-xs text-[var(--text-muted)] mb-3">What do contributors submit to prove they completed the work?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: "screenshot", label: "Screenshot",       desc: "Upload a screenshot of the completed work" },
                  { value: "code",       label: "Completion Code",   desc: "Enter a code from the external tool" },
                  { value: "both",       label: "Both",              desc: "Screenshot AND completion code required" },
                ] as const).map(({ value, label, desc }) => (
                  <label key={value} className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                    extProofType === value
                      ? "border-amber-500 bg-amber-500/5"
                      : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                  }`}>
                    <input type="radio" name="ext_proof_type" value={value}
                      checked={extProofType === value} onChange={() => setExtProofType(value)} className="sr-only" />
                    <span className={`text-sm font-semibold ${extProofType === value ? "text-amber-500" : "text-[var(--text-primary)]"}`}>{label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Pay & Capacity ─────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Pay & Capacity</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Pay per task (₹ INR)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] pointer-events-none select-none">₹</span>
                <input type="number" value={payInr} onChange={(e) => setPayInr(e.target.value)}
                  min={1} step="0.01" placeholder="e.g. 100"
                  className={`${inputClass} pl-7`} />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Rate: 1 ₹ = {nexcoinPerInr} NC</p>
            </div>
            <div>
              <label className={labelClass}>Total Slots</label>
              <input type="number" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)}
                min={1} placeholder="Blank = unlimited" className={inputClass} />
            </div>
          </div>

          {!allowsPartial && <PayoutBreakdown inrAmount={parseFloat(payInr) || 0} nexcoinPerInr={nexcoinPerInr} />}

          <div>
            <label className={labelClass}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </div>

          {/* ── Partial Payment ──────────────────────────────────────── */}
          <div className="border-t border-[var(--border-default)] pt-5 space-y-4">
            <Toggle
              value={allowsPartial}
              onChange={setAllowsPartial}
              label="Allow partial payment"
              description="For tasks with multiple units (e.g. recordings). Admin sets how many units are valid at review time."
            />
            {allowsPartial && (() => {
              const unitNc   = payPerUnitInr ? Math.round(parseFloat(payPerUnitInr) * nexcoinPerInr) : 0;
              const totalNc  = unitNc * (parseInt(totalUnits) || 0);
              const totalInr = parseFloat(payPerUnitInr || "0") * (parseInt(totalUnits) || 0);
              return (
                <div className="space-y-4 pl-4 border-l-2 border-[var(--brand-500)]/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Unit name</label>
                      <input type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)}
                        placeholder="e.g. recording" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Total units / submission</label>
                      <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)}
                        min={1} placeholder="e.g. 60" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Pay per unit (₹ INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] pointer-events-none">₹</span>
                        <input type="number" value={payPerUnitInr} onChange={(e) => setPayPerUnitInr(e.target.value)}
                          min={0} step="0.01" placeholder="e.g. 5" className={`${inputClass} pl-7`} />
                      </div>
                    </div>
                  </div>
                  {totalNc > 0 && (
                    <div className="rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-default)] px-4 py-3 text-sm">
                      <p className="text-[var(--text-muted)] text-xs mb-1">Full completion payout (stored as pay_per_task)</p>
                      <p className="font-semibold text-[var(--text-primary)]">
                        {parseInt(totalUnits)} {unitName || "units"} × {unitNc} NC = <span className="text-[var(--brand-500)]">{totalNc} NC</span>
                        <span className="text-[var(--text-muted)] font-normal ml-2">(≈ ₹{totalInr.toFixed(2)})</span>
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Contributor receives 66% = {Math.floor(totalNc * 0.66)} NC on full approval</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </section>

        {/* ── Gamification ──────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">Gamification</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Set the contributor level required to unlock this task and how much XP is awarded on approval.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Required Level</label>
              <input type="number" value={requiredLevel} onChange={(e) => setRequiredLevel(e.target.value)}
                min={1} max={100} placeholder="1" className={inputClass} />
              <p className="text-xs text-[var(--text-muted)] mt-1">Minimum contributor level (1 = open to all)</p>
            </div>
            <div>
              <label className={labelClass}>XP Reward</label>
              <input type="number" value={xpReward} onChange={(e) => setXpReward(e.target.value)}
                min={0} placeholder="0" className={inputClass} />
              <p className="text-xs text-[var(--text-muted)] mt-1">XP awarded when submission is approved</p>
            </div>
          </div>
        </section>

        {/* ── Assignment Gate ────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">Assignment Gate</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Require contributors to pass a screening assignment before they can start working.
            </p>
          </div>

          <Toggle
            value={assignmentReq}
            onChange={setAssignmentReq}
            label="Require assignment to unlock this task"
          />

          {assignmentReq && (
            <div className="space-y-5 pt-1">
              {/* Assignment Type */}
              <div>
                <label className={labelClass}>Assignment Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: "text",  label: "Text Response",        desc: "Contributor writes an answer" },
                    { value: "file",  label: "File Upload",          desc: "Contributor uploads a sample" },
                    { value: "quiz",  label: "Quiz (Multiple Choice)", desc: "Contributor answers questions" },
                  ] as const).map(({ value, label, desc }) => (
                    <label
                      key={value}
                      className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                        assignmentType === value
                          ? "border-[var(--brand-500)] bg-[rgba(20,184,166,0.05)]"
                          : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignment_type"
                        value={value}
                        checked={assignmentType === value}
                        onChange={() => setAssignmentType(value)}
                        className="sr-only"
                      />
                      <span className={`text-sm font-semibold ${assignmentType === value ? "text-[var(--brand-500)]" : "text-[var(--text-primary)]"}`}>
                        {label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assignment Instructions */}
              <div>
                <label className={labelClass}>Assignment Instructions</label>
                <textarea
                  value={assignmentInstructions}
                  onChange={(e) => setAssignmentInstructions(e.target.value)}
                  rows={3}
                  placeholder={
                    assignmentType === "file"
                      ? "e.g. Record a 30-second audio sample in Bengali and upload it as an MP3 file."
                      : assignmentType === "quiz"
                      ? "e.g. Answer the following questions to demonstrate your transcription knowledge."
                      : "e.g. In 2-3 sentences, describe your experience with audio transcription."
                  }
                  className={textareaClass}
                />
              </div>

              {/* Quiz question builder */}
              {assignmentType === "quiz" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Quiz Questions</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">Add up to 10 multiple-choice questions.</p>
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={addQuestion}
                      disabled={quizQuestions.length >= 10}>
                      <Plus className="h-4 w-4" /> Add Question
                    </Button>
                  </div>

                  {quizQuestions.map((q, i) => (
                    <div key={i} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Question {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuestion(i)}
                          disabled={quizQuestions.length <= 1}
                          className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Question</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(i, "question", e.target.value)}
                          placeholder="e.g. Which audio format has the best quality-to-size ratio?"
                          className={inputClass}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(["a", "b", "c", "d"] as const).map((opt) => (
                          <div key={opt}>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">
                              Option {opt.toUpperCase()}
                            </label>
                            <input
                              type="text"
                              value={q[opt]}
                              onChange={(e) => updateQuestion(i, opt, e.target.value)}
                              placeholder={`Option ${opt.toUpperCase()}…`}
                              className={inputClass}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Correct Answer</label>
                        <div className="flex gap-3">
                          {(["a", "b", "c", "d"] as const).map((opt) => (
                            <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`correct-${i}`}
                                value={opt}
                                checked={q.correct === opt}
                                onChange={() => updateQuestion(i, "correct", opt)}
                                className="accent-[var(--brand-500)]"
                              />
                              <span className={`text-sm font-bold ${q.correct === opt ? "text-[var(--brand-500)]" : "text-[var(--text-muted)]"}`}>
                                {opt.toUpperCase()}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Passing score */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-[180px]">
                      <label className={labelClass}>Passing Score (%)</label>
                      <input
                        type="number"
                        value={passingScore}
                        onChange={(e) => setPassingScore(e.target.value)}
                        min={0}
                        max={100}
                        placeholder="70"
                        className={inputClass}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-5 flex-1">
                      Contributors must score at least {passingScore || "70"}% to be eligible for approval.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Targeting ──────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">Targeting</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Restrict this task to contributors with specific language or skills.</p>
          </div>

          <div>
            <label className={labelClass}>Required Language</label>
            <select value={requiredLanguage} onChange={(e) => setRequiredLanguage(e.target.value)} className={inputClass}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Required Skills
              <span className="text-[var(--text-muted)] font-normal ml-1">(type and press Enter)</span>
            </label>
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={addSkill}
              placeholder="e.g. Audio Editing, Transcription…"
              className={inputClass}
            />
            {requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {requiredSkills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(20,184,166,0.1)] text-[var(--brand-500)] text-xs font-semibold">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Campaign Settings ──────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">Campaign Settings</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Control visibility and boost settings for this task.</p>
          </div>

          <Toggle
            value={isPrivate}
            onChange={setIsPrivate}
            label="Private Task"
            description="Show a PRIVATE badge. Works with Assignment Gate to require approval before access."
          />

          <Toggle
            value={isFeatured}
            onChange={setIsFeatured}
            label="Featured Task"
            description="Pin this task at the top of the opportunities list with a Featured badge."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Review Time (shown to contributors)</label>
              <input type="text" value={validationTime} onChange={(e) => setValidationTime(e.target.value)}
                placeholder="e.g. 7 days, 30 days" className={inputClass} />
              <p className="text-xs text-[var(--text-muted)] mt-1">How long to review a submission</p>
            </div>
            <div>
              <label className={labelClass}>Payment Time (when NexCoins are credited)</label>
              <input type="text" value={paymentTime} onChange={(e) => setPaymentTime(e.target.value)}
                placeholder="e.g. 7 days, 14 days" className={inputClass} />
              <p className="text-xs text-[var(--text-muted)] mt-1">Time after approval until coins are credited</p>
            </div>
          </div>
        </section>

        {/* ── Terms & Conditions ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-4">
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">Terms & Conditions</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Task-specific rules shown in the T&C popup. One rule per line.
            </p>
          </div>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={4}
            placeholder={"e.g.\nRecording must be 5–10 seconds long.\nNo background noise allowed.\nSubmit only WAV or MP3 format."}
            className={textareaClass}
          />
          <p className="text-xs text-[var(--text-muted)]">
            These appear alongside NexGuild's default rules. Leave blank if no special conditions apply.
          </p>
        </section>

        {/* ── Eligibility Rules ─────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">Eligibility Rules</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Gate this task based on a contributor&apos;s history with other tasks.
              Leave both lists empty to allow all contributors.
            </p>
          </div>
          <EligibilityRulesPicker
            required={requiredTaskIds}
            excluded={excludedTaskIds}
            onChange={(req, excl) => { setRequiredTaskIds(req); setExcludedTaskIds(excl); }}
          />
        </section>

        {/* ── Steps Builder ──────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Task Steps</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Break the task into guided steps. Leave empty for a classic submit form.
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={addStep}>
              <Plus className="h-4 w-4" /> Add Step
            </Button>
          </div>

          {steps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border-default)] py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">No steps — contributors submit notes + files in one form.</p>
            </div>
          ) : (
            steps.map((step, i) => (
              <div key={i} className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-bold text-[var(--text-primary)]">Step {i + 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveStep(i, "up")} disabled={i === 0}
                      className="p-1.5 rounded hover:bg-[var(--border-default)] text-[var(--text-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveStep(i, "down")} disabled={i === steps.length - 1}
                      className="p-1.5 rounded hover:bg-[var(--border-default)] text-[var(--text-muted)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => removeStep(i)}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Step Title <span className="text-[var(--danger-text)]">*</span>
                  </label>
                  <input type="text" value={step.title}
                    onChange={(e) => updateStep(i, "title", e.target.value)}
                    placeholder="e.g. Record your audio" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                  <textarea value={step.description}
                    onChange={(e) => updateStep(i, "description", e.target.value)}
                    rows={2}
                    placeholder="Explain what the contributor needs to do in this step…"
                    className={textareaClass} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Submit Type</label>
                  <div className="flex gap-4">
                    {(["text", "file", "none"] as const).map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name={`step-type-${i}`} value={t}
                          checked={step.submitType === t}
                          onChange={() => updateStep(i, "submitType", t)}
                          className="accent-[var(--brand-500)]" />
                        <span className="text-sm text-[var(--text-secondary)] capitalize">
                          {t === "none" ? "Mark Complete" : t}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {step.submitType === "text" && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Placeholder text</label>
                    <input type="text" value={step.placeholder}
                      onChange={(e) => updateStep(i, "placeholder", e.target.value)}
                      placeholder="e.g. Paste the link to your recording here…"
                      className={inputClass} />
                  </div>
                )}
                {step.submitType === "file" && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Accepted file types</label>
                    <input type="text" value={step.acceptedFiles}
                      onChange={(e) => updateStep(i, "acceptedFiles", e.target.value)}
                      placeholder="e.g. .mp3,.wav,.ogg (blank = any)"
                      className={inputClass} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    External Link <span className="text-[var(--text-muted)] font-normal">(optional — shown as a button on the step card)</span>
                  </label>
                  <input type="url" value={step.url}
                    onChange={(e) => updateStep(i, "url", e.target.value)}
                    placeholder="https://discord.gg/… or https://example.com/download"
                    className={inputClass} />
                </div>
              </div>
            ))
          )}

          {steps.length > 0 && (
            <button type="button" onClick={addStep}
              className="w-full py-2.5 rounded-lg border border-dashed border-[var(--border-default)] text-sm text-[var(--text-muted)] hover:text-[var(--brand-500)] hover:border-[var(--brand-500)] transition-colors flex items-center justify-center gap-1.5">
              <Plus className="h-4 w-4" /> Add Another Step
            </button>
          )}
        </section>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">{error}</p>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button size="lg" disabled={saving} onClick={() => submit("active")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Publish Task
          </Button>
          <Button variant="secondary" size="lg" disabled={saving} onClick={() => submit("draft")}>
            Save as Draft
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href="/admin/tasks">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
