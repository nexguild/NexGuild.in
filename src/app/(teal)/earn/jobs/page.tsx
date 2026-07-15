"use client";

import { useEffect, useState, useCallback } from "react";
import { FadeIn } from "@/components/ui/fade-in";
import { AdSlot } from "@/components/ui/ad-slot";
import { Search, MapPin, Briefcase, ExternalLink, ChevronDown, Star, RefreshCw } from "lucide-react";

const CATEGORIES = [
  "All",
  "Customer Service",
  "Data Entry",
  "Content",
  "Marketing",
  "QA / Testing",
  "Translation",
];

const WORK_TYPES = [
  { value: "", label: "All Types" },
  { value: "remote", label: "Remote" },
  { value: "wfh", label: "WFH" },
  { value: "wfo", label: "WFO / Office" },
  { value: "hybrid", label: "Hybrid" },
];

const WORK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  remote:  { label: "Remote",      color: "bg-teal-100 text-teal-700" },
  wfh:     { label: "WFH",         color: "bg-blue-100 text-blue-700" },
  wfo:     { label: "WFO / Office", color: "bg-amber-100 text-amber-700" },
  hybrid:  { label: "Hybrid",      color: "bg-purple-100 text-purple-700" },
};

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo_url: string | null;
  location: string;
  work_type: string;
  job_type: string;
  category: string;
  description: string;
  salary_range: string | null;
  apply_url: string | null;
  apply_via_nexguild: boolean;
  tags: string[];
  source: string;
  is_featured: boolean;
  posted_at: string;
}

interface ApplyForm {
  full_name: string;
  email: string;
  phone: string;
  applicant_role: string;
  experience_years: string;
  linkedin_url: string;
  resume_url: string;
  notice_period: string;
  current_ctc: string;
  expected_ctc: string;
  message: string;
}

function CompanyAvatar({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className="h-12 w-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 text-[#0D9488] font-bold text-lg">
        {name[0]}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      className="h-12 w-12 rounded-lg object-contain border border-slate-100 flex-shrink-0 bg-white p-1"
    />
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  const m = Math.floor(d / 30);
  return `${m}mo ago`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [workType, setWorkType] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState<ApplyForm>({
    full_name: "", email: "", phone: "", applicant_role: "", experience_years: "",
    linkedin_url: "", resume_url: "", notice_period: "", current_ctc: "", expected_ctc: "", message: "",
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (workType) params.set("work_type", workType);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [category, workType, search]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchJobs, search]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJob) return;
    setApplyLoading(true);
    setApplyError(null);
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: selectedJob.id, ...applyForm }),
      });
      if (!res.ok) {
        const d = await res.json();
        setApplyError(d.error ?? "Something went wrong");
      } else {
        setApplySuccess(true);
      }
    } catch {
      setApplyError("Network error. Please try again.");
    } finally {
      setApplyLoading(false);
    }
  }

  function openApply(job: Job) {
    setSelectedJob(job);
    setApplyOpen(true);
    setApplySuccess(false);
    setApplyError(null);
    setApplyForm({ full_name: "", email: "", phone: "", applicant_role: "", experience_years: "",
      linkedin_url: "", resume_url: "", notice_period: "", current_ctc: "", expected_ctc: "", message: "" });
  }

  const wt = selectedJob ? WORK_TYPE_LABELS[selectedJob.work_type] : null;

  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }}>
      <AdSlot placement="jobs-top" />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 px-6 text-center">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 65% 45% at 50% 0%, rgba(45,212,191,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <FadeIn>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid rgba(13,148,136,0.18)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
              <span className="text-xs font-bold text-[#115E59] uppercase tracking-wider">Job Board</span>
            </div>
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-[#0F3D36]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Remote &amp; WFH Jobs
            </h1>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
              Curated remote &amp; work-from-home positions from top companies — plus exclusive leads from our HR network.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <section className="sticky top-0 z-20 px-6 py-3 border-b border-teal-100"
        style={{ background: "rgba(235,251,250,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs or companies…"
              className="w-full pl-9 pr-4 h-10 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-lg border border-teal-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>

          {/* Work type */}
          <div className="relative">
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-lg border border-teal-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            >
              {WORK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>

          <button
            onClick={fetchJobs}
            className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-teal-200 bg-white text-[#0D9488] hover:bg-teal-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── Job list ───────────────────────────────────────────────── */}
      <section className="py-8 px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 rounded-full border-2 border-[#0D9488] border-t-transparent animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24 text-stone-500">
              <Briefcase className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No jobs found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-500 mb-4">{jobs.length} jobs found</p>
              <div className="space-y-3">
                {jobs.map((job) => {
                  const wtMeta = WORK_TYPE_LABELS[job.work_type];
                  return (
                    <div
                      key={job.id}
                      className="group relative rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                      style={{
                        border: job.is_featured
                          ? "1.5px solid rgba(13,148,136,0.4)"
                          : "1.5px solid rgba(13,148,136,0.1)",
                      }}
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    >
                      {job.is_featured && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          Featured
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Logo */}
                        <CompanyAvatar url={job.company_logo_url} name={job.company} />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#0D9488] transition-colors">
                              {job.title}
                            </h3>
                            {wtMeta && (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${wtMeta.color}`}>
                                {wtMeta.label}
                              </span>
                            )}
                            {job.source === "hr_lead" && (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                                HR Lead
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 mb-2">{job.company}</p>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />{job.job_type}
                            </span>
                            {job.salary_range && (
                              <span className="font-medium text-teal-700">{job.salary_range}</span>
                            )}
                            <span>{timeAgo(job.posted_at)}</span>
                          </div>

                          {job.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {job.tags.slice(0, 5).map((tag) => (
                                <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Apply CTA */}
                        <div className="flex-shrink-0 hidden sm:flex">
                          {job.apply_via_nexguild ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); openApply(job); }}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0D9488] text-white hover:bg-[#0F7069] transition-colors"
                            >
                              Apply
                            </button>
                          ) : job.apply_url ? (
                            <a
                              href={job.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold border border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors"
                            >
                              Apply <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {/* Expanded description */}
                      {selectedJob?.id === job.id && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-6">
                            {stripHtml(job.description)}
                          </p>
                          <div className="mt-4 flex gap-3 sm:hidden">
                            {job.apply_via_nexguild ? (
                              <button
                                onClick={() => openApply(job)}
                                className="flex-1 py-2 rounded-lg text-sm font-bold bg-[#0D9488] text-white hover:bg-[#0F7069] transition-colors"
                              >
                                Apply via NexGuild
                              </button>
                            ) : job.apply_url ? (
                              <a
                                href={job.apply_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold border border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors"
                              >
                                Apply <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <div className="px-6 pb-10">
        <div className="mx-auto max-w-5xl rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Disclaimer:</span> NexGuild is a job listing and aggregator platform. Job postings are sourced from third-party companies and HR partners. NexGuild does not verify the accuracy of any listing, guarantee employment, or participate in any hiring decision. We are not responsible for any loss or inconvenience arising from applying to or accepting any listed position. Apply at your own discretion.
          </p>
        </div>
      </div>

      {/* ── Apply Modal ────────────────────────────────────────────── */}
      {applyOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedJob.title}</h2>
                <p className="text-sm text-stone-500">{selectedJob.company}</p>
              </div>
              {wt && (
                <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${wt.color}`}>{wt.label}</span>
              )}
            </div>

            {applySuccess ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-base font-semibold text-slate-800 mb-1">Application submitted!</p>
                <p className="text-sm text-stone-500">We'll be in touch soon.</p>
                <button
                  onClick={() => setApplyOpen(false)}
                  className="mt-6 px-6 py-2 rounded-lg bg-[#0D9488] text-white text-sm font-bold hover:bg-[#0F7069] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">

                {/* Personal Info */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personal Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                    <input required value={applyForm.full_name}
                      onChange={(e) => setApplyForm(f => ({ ...f, full_name: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                    <input required type="email" value={applyForm.email}
                      onChange={(e) => setApplyForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone *</label>
                    <input required type="tel" value={applyForm.phone}
                      onChange={(e) => setApplyForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Current Role</label>
                    <input value={applyForm.applicant_role}
                      onChange={(e) => setApplyForm(f => ({ ...f, applicant_role: e.target.value }))}
                      placeholder="e.g. CSA, Team Lead, Fresher"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                  </div>
                </div>

                {/* Experience */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">Experience & Availability</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Total Experience *</label>
                    <select required value={applyForm.experience_years}
                      onChange={(e) => setApplyForm(f => ({ ...f, experience_years: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]">
                      <option value="">Select</option>
                      <option>Fresher</option>
                      <option>Less than 1 year</option>
                      <option>1–2 years</option>
                      <option>3–5 years</option>
                      <option>5–8 years</option>
                      <option>8+ years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Notice Period</label>
                    <select value={applyForm.notice_period}
                      onChange={(e) => setApplyForm(f => ({ ...f, notice_period: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]">
                      <option value="">Select</option>
                      <option>Immediate</option>
                      <option>15 days</option>
                      <option>30 days</option>
                      <option>60 days</option>
                      <option>90 days</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Current CTC</label>
                    <input value={applyForm.current_ctc}
                      onChange={(e) => setApplyForm(f => ({ ...f, current_ctc: e.target.value }))}
                      placeholder="e.g. ₹3 LPA or ₹25,000/mo"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Expected CTC</label>
                    <input value={applyForm.expected_ctc}
                      onChange={(e) => setApplyForm(f => ({ ...f, expected_ctc: e.target.value }))}
                      placeholder="e.g. ₹4 LPA or ₹35,000/mo"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                  </div>
                </div>

                {/* CV & Links */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">CV & Profile</p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Resume / CV Link *
                    <span className="ml-1 font-normal text-slate-400">(Google Drive, Dropbox, or any link)</span>
                  </label>
                  <input required value={applyForm.resume_url}
                    onChange={(e) => setApplyForm(f => ({ ...f, resume_url: e.target.value }))}
                    placeholder="https://drive.google.com/…"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn Profile</label>
                  <input value={applyForm.linkedin_url}
                    onChange={(e) => setApplyForm(f => ({ ...f, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/your-name"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                </div>

                {/* Cover note */}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">Cover Note</p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Why are you a good fit? (optional)</label>
                  <textarea rows={3} value={applyForm.message}
                    onChange={(e) => setApplyForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Briefly tell us why you're interested and what makes you a strong candidate…"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                </div>

                {applyError && <p className="text-xs text-red-500">{applyError}</p>}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setApplyOpen(false)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={applyLoading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-[#0D9488] text-white hover:bg-[#0F7069] disabled:opacity-60 transition-colors">
                    {applyLoading ? "Submitting…" : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
