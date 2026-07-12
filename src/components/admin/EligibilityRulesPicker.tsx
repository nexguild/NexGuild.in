"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface TaskOption {
  id: string;
  title: string;
  task_type: string | null;
}

interface Props {
  currentTaskId?: string;
  required: string[];
  excluded: string[];
  onChange: (required: string[], excluded: string[]) => void;
}

export function EligibilityRulesPicker({ currentTaskId, required, excluded, onChange }: Props) {
  const [names, setNames]           = useState<Record<string, string>>({});
  const [reqSearch, setReqSearch]   = useState("");
  const [exclSearch, setExclSearch] = useState("");
  const [reqResults, setReqResults] = useState<TaskOption[]>([]);
  const [exclResults, setExclResults] = useState<TaskOption[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [exclLoading, setExclLoading] = useState(false);
  const [reqOpen, setReqOpen]   = useState(false);
  const [exclOpen, setExclOpen] = useState(false);

  const reqRef  = useRef<HTMLDivElement>(null);
  const exclRef = useRef<HTMLDivElement>(null);

  // Resolve names for pre-selected IDs on mount
  useEffect(() => {
    const all = [...new Set([...required, ...excluded])];
    if (all.length === 0) return;
    const missing = all.filter((id) => !names[id]);
    if (missing.length === 0) return;
    supabase
      .from("tasks")
      .select("id, title")
      .in("id", missing)
      .then(({ data }) => {
        if (!data) return;
        const update: Record<string, string> = {};
        for (const t of data as { id: string; title: string }[]) update[t.id] = t.title;
        setNames((prev) => ({ ...prev, ...update }));
      });
  }, [required, excluded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (reqRef.current && !reqRef.current.contains(e.target as Node)) setReqOpen(false);
      if (exclRef.current && !exclRef.current.contains(e.target as Node)) setExclOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function search(query: string, exclude: string[], setResults: (r: TaskOption[]) => void, setLoading: (v: boolean) => void) {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const q = supabase
      .from("tasks")
      .select("id, title, task_type")
      .ilike("title", `%${query}%`)
      .is("deleted_at", null)
      .limit(8);
    if (currentTaskId) q.neq("id", currentTaskId);
    const { data } = await q;
    const options = (data ?? []) as TaskOption[];
    setResults(options.filter((t) => !exclude.includes(t.id)));
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => search(reqSearch, [...required, ...excluded], setReqResults, setReqLoading), 250);
    return () => clearTimeout(timer);
  }, [reqSearch, required, excluded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => search(exclSearch, [...required, ...excluded], setExclResults, setExclLoading), 250);
    return () => clearTimeout(timer);
  }, [exclSearch, required, excluded]); // eslint-disable-line react-hooks/exhaustive-deps

  function addRequired(t: TaskOption) {
    setNames((prev) => ({ ...prev, [t.id]: t.title }));
    onChange([...required, t.id], excluded);
    setReqSearch("");
    setReqResults([]);
    setReqOpen(false);
  }

  function addExcluded(t: TaskOption) {
    setNames((prev) => ({ ...prev, [t.id]: t.title }));
    onChange(required, [...excluded, t.id]);
    setExclSearch("");
    setExclResults([]);
    setExclOpen(false);
  }

  function removeRequired(id: string) { onChange(required.filter((x) => x !== id), excluded); }
  function removeExcluded(id: string) { onChange(required, excluded.filter((x) => x !== id)); }

  return (
    <div className="space-y-5">
      {/* Required tasks */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
          Contributor must have completed this task first:
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-2">Only contributors with an approved submission for ALL listed tasks can see this task.</p>

        {required.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {required.map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                ✅ {names[id] ?? id.slice(0, 8) + "…"}
                <button type="button" onClick={() => removeRequired(id)} className="hover:text-red-400 transition-colors leading-none">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div ref={reqRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
            {reqLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--text-muted)]" />}
            <input
              type="text"
              value={reqSearch}
              onChange={(e) => { setReqSearch(e.target.value); setReqOpen(true); }}
              onFocus={() => { if (reqSearch.length >= 2) setReqOpen(true); }}
              placeholder="Search tasks by title…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            />
          </div>
          {reqOpen && reqResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-lg overflow-hidden">
              {reqResults.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addRequired(t)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--surface-subtle)] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-[var(--brand-500)] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.title}</p>
                    {t.task_type && <p className="text-xs text-[var(--text-muted)]">{t.task_type}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {reqOpen && reqSearch.length >= 2 && !reqLoading && reqResults.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2.5 shadow-lg">
              <p className="text-xs text-[var(--text-muted)]">No matching tasks found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Excluded tasks */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
          Contributor must NOT have completed this task:
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-2">Contributors with an approved submission for ANY listed task will be excluded.</p>

        {excluded.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {excluded.map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20">
                🚫 {names[id] ?? id.slice(0, 8) + "…"}
                <button type="button" onClick={() => removeExcluded(id)} className="hover:text-red-300 transition-colors leading-none">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div ref={exclRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
            {exclLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--text-muted)]" />}
            <input
              type="text"
              value={exclSearch}
              onChange={(e) => { setExclSearch(e.target.value); setExclOpen(true); }}
              onFocus={() => { if (exclSearch.length >= 2) setExclOpen(true); }}
              placeholder="Search tasks by title…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-colors"
            />
          </div>
          {exclOpen && exclResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] shadow-lg overflow-hidden">
              {exclResults.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addExcluded(t)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--surface-subtle)] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.title}</p>
                    {t.task_type && <p className="text-xs text-[var(--text-muted)]">{t.task_type}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {exclOpen && exclSearch.length >= 2 && !exclLoading && exclResults.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2.5 shadow-lg">
              <p className="text-xs text-[var(--text-muted)]">No matching tasks found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
