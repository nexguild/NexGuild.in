"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, CheckCircle2, Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";

const TASK_TYPES = [
  "Audio Recording", "Transcription", "Data Annotation", "App Testing",
  "Game Testing", "Survey", "Social Media Task", "Web Research",
  "Data Collection", "Content Task", "Micro-task",
];

const LANGUAGES = [
  "Any", "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil",
  "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu",
  "Arabic", "French", "German", "Spanish", "Portuguese",
  "Japanese", "Korean", "Chinese (Simplified)", "Filipino",
];

const TIME_OPTIONS = ["48 hours", "7 days", "14 days", "30 days", "45 days", "60 days"];

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

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();

  const allowed = usePageGuard(ADMIN_ROLES.UPPER);

  const [loading, setLoading] = useState(true);

  // Basic info
  const [title, setTitle]               = useState("");
  const [taskType, setTaskType]         = useState("");
  const [taskStatus, setTaskStatus]     = useState("active");
  const [description, setDescription]   = useState("");
  const [requirements, setRequirements] = useState("");

  // Pay & capacity
  const [payPerTask, setPayPerTask] = useState("");
  const [totalSlots, setTotalSlots] = useState("");
  const [deadline, setDeadline]     = useState("");

  // Assignment gate
  const [assignmentReq, setAssignmentReq]                   = useState(false);
  const [assignmentType, setAssignmentType]                 = useState<"text" | "file" | "quiz">("text");
  const [assignmentInstructions, setAssignmentInstructions] = useState("");
  const [quizQuestions, setQuizQuestions]                   = useState<QuizQuestion[]>([newQuestion()]);
  const [passingScore, setPassingScore]                     = useState("70");

  // Targeting
  const [requiredLanguage, setRequiredLanguage] = useState("Any");
  const [skillInput, setSkillInput]             = useState("");
  const [requiredSkills, setRequiredSkills]     = useState<string[]>([]);

  // Campaign settings
  const [isPrivate, setIsPrivate]         = useState(false);
  const [isFeatured, setIsFeatured]       = useState(false);
  const [validationTime, setValidationTime] = useState("48 hours");
  const [paymentTime, setPaymentTime]     = useState("7 days");

  // Gamification
  const [requiredLevel, setRequiredLevel] = useState("1");
  const [xpReward, setXpReward]           = useState("0");

  // T&C
  const [terms, setTerms] = useState("");

  // Steps builder
  const [steps, setSteps] = useState<TaskStep[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [saved, setSaved]   = useState(false);

  // ── Skills ──────────────────────────────────────────────────────────────────
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

  // ── Steps ───────────────────────────────────────────────────────────────────
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

  // ── Quiz questions ───────────────────────────────────────────────────────────
  function addQuestion() { setQuizQuestions((prev) => [...prev, newQuestion()]); }
  function removeQuestion(i: number) { setQuizQuestions((prev) => prev.filter((_, j) => j !== i)); }
  function updateQuestion(i: number, key: keyof QuizQuestion, val: string) {
    setQuizQuestions((prev) => prev.map((q, j) => j === i ? { ...q, [key]: val } : q));
  }

  // ── Load ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error: fetchErr } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchErr || !data) { setLoading(false); return; }

      setTitle(data.title ?? "");
      setTaskType(data.task_type ?? "");
      setTaskStatus(data.status ?? "active");
      setDescription(data.description ?? "");
      setRequirements(data.requirements ?? "");
      setPayPerTask(data.pay_per_task != null ? String(data.pay_per_task) : "");
      setTotalSlots(data.total_slots != null ? String(data.total_slots) : "");
      setDeadline(data.deadline ? data.deadline.split("T")[0] : "");
      setAssignmentReq(data.assignment_required ?? false);
      setAssignmentType((data.assignment_type ?? "text") as "text" | "file" | "quiz");
      setAssignmentInstructions(data.assignment_instructions ?? "");
      if (Array.isArray(data.assignment_questions) && data.assignment_questions.length > 0) {
        setQuizQuestions(data.assignment_questions as QuizQuestion[]);
      }
      setPassingScore(data.assignment_passing_score != null ? String(data.assignment_passing_score) : "70");
      setRequiredLanguage(data.required_language ?? "Any");
      setRequiredSkills(Array.isArray(data.required_skills) ? (data.required_skills as string[]) : []);
      setIsPrivate(data.is_private ?? false);
      setIsFeatured(data.is_featured ?? false);
      setValidationTime(data.validation_time ?? "48 hours");
      setPaymentTime(data.payment_time ?? "7 days");
      setRequiredLevel(data.required_level != null ? String(data.required_level) : "1");
      setXpReward(data.xp_reward != null ? String(data.xp_reward) : "0");
      setTerms(data.terms ?? "");
      if (Array.isArray(data.steps) && data.steps.length > 0) {
        setSteps((data.steps as TaskStep[]).map((s) => ({
          title:         s.title ?? "",
          description:   s.description ?? "",
          submitType:    (s.submitType ?? "text") as "text" | "file" | "none",
          placeholder:   s.placeholder ?? "",
          acceptedFiles: s.acceptedFiles ?? "",
          url:           s.url ?? "",
        })));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function save() {
    if (!title.trim() || !taskType || !description.trim()) {
      setError("Title, type, and description are required.");
      return;
    }
    setSaving(true);
    setError(null);

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

    const { error: updateErr } = await supabase.from("tasks").update({
      title:                    title.trim(),
      task_type:                taskType,
      status:                   taskStatus,
      description:              description.trim(),
      requirements:             requirements.trim() || null,
      pay_per_task:             payPerTask ? parseFloat(payPerTask) : null,
      total_slots:              totalSlots ? parseInt(totalSlots) : null,
      deadline:                 deadline || null,
      assignment_required:      assignmentReq,
      assignment_type:          assignmentReq ? assignmentType : null,
      assignment_instructions:  assignmentReq ? assignmentInstructions.trim() || null : null,
      assignment_questions:     assignmentReq && assignmentType === "quiz" ? questionsPayload : [],
      assignment_passing_score: assignmentReq && assignmentType === "quiz" ? parseInt(passingScore) || 70 : 70,
      required_language:        requiredLanguage,
      required_skills:          requiredSkills,
      is_private:               isPrivate,
      is_featured:              isFeatured,
      validation_time:          validationTime,
      payment_time:             paymentTime,
      terms:                    terms.trim() || null,
      steps:                    stepsPayload.length > 0 ? stepsPayload : [],
      required_level:           requiredLevel ? parseInt(requiredLevel) : 1,
      xp_reward:                xpReward ? parseInt(xpReward) : 0,
    }).eq("id", id);

    if (updateErr) { setError(updateErr.message); setSaving(false); return; }
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)]" />
      </div>
    );
  }

  if (!allowed) return null;
  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/admin/tasks/${id}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Task
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Task</h1>
        <p className="text-sm text-[var(--text-secondary)]">Changes are saved immediately to Supabase.</p>
      </div>

      <div className="space-y-5">
        {/* ── Task Details ──────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Task Details</h2>

          <div>
            <label className={labelClass}>Task Title <span className="text-[var(--danger-text)]">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Task Type <span className="text-[var(--danger-text)]">*</span></label>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)} className={inputClass}>
              <option value="">Select task type</option>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className={inputClass}>
              {["active", "paused", "draft", "archived"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-[var(--danger-text)]">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={textareaClass} />
          </div>

          <div>
            <label className={labelClass}>
              Instructions for Contributors
              <span className="text-[var(--text-muted)] font-normal ml-1">(shown on task page)</span>
            </label>
            <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} className={textareaClass} />
          </div>
        </section>

        {/* ── Pay & Capacity ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 space-y-5">
          <h2 className="font-bold text-[var(--text-primary)]">Pay & Capacity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Coins Per Task</label>
              <input type="number" value={payPerTask} onChange={(e) => setPayPerTask(e.target.value)}
                min={1} placeholder="e.g. 50" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Slots</label>
              <input type="number" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)}
                min={1} placeholder="Blank = unlimited" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </div>
        </section>

        {/* ── Gamification ──────────────────────────────────────────────────── */}
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

        {/* ── Assignment Gate ────────────────────────────────────────────────── */}
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
              <div>
                <label className={labelClass}>Assignment Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: "text",  label: "Text Response",          desc: "Contributor writes an answer" },
                    { value: "file",  label: "File Upload",            desc: "Contributor uploads a sample" },
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

        {/* ── Targeting ─────────────────────────────────────────────────────── */}
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

        {/* ── Campaign Settings ──────────────────────────────────────────────── */}
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
              <label className={labelClass}>Review Time</label>
              <select value={validationTime} onChange={(e) => setValidationTime(e.target.value)} className={inputClass}>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Payment After Approval</label>
              <select value={paymentTime} onChange={(e) => setPaymentTime(e.target.value)} className={inputClass}>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ── Terms & Conditions ─────────────────────────────────────────────── */}
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
            These appear alongside NexGuild&apos;s default rules. Leave blank if no special conditions apply.
          </p>
        </section>

        {/* ── Steps Builder ──────────────────────────────────────────────────── */}
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
        {saved && (
          <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/20">
            <CheckCircle2 className="h-4 w-4" /> Changes saved successfully.
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button size="lg" disabled={saving} onClick={save}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
          <Button variant="ghost" size="lg" asChild>
            <Link href={`/admin/tasks/${id}`}>Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}