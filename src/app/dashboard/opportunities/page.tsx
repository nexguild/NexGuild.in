"use client";

import { useEffect, useState } from "react";
import { Search, ClipboardList } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  pay_per_task: number | null;
  total_slots: number | null;
  filled_slots: number | null;
  deadline: string | null;
}

const FILTERS = ["All", "Survey", "Micro Task", "Data Labeling", "Content", "Project"];

export default function OpportunitiesPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    async function fetchTasks() {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, description, task_type, pay_per_task, total_slots, filled_slots, deadline")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setTasks(data ?? []);
      setLoading(false);
    }
    fetchTasks();
  }, []);

  const filtered =
    activeFilter === "All"
      ? tasks
      : tasks.filter(
          (t) => t.task_type?.toLowerCase() === activeFilter.toLowerCase()
        );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Opportunities</h1>
        <p className="text-sm text-[var(--text-secondary)]">Browse all tasks available to you right now.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeFilter === f
                ? "bg-[var(--brand-500)] text-white"
                : "bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] py-16 flex flex-col items-center gap-3 text-center px-6">
          <Search className="h-8 w-8 text-[var(--text-muted)]" />
          <p className="font-semibold text-[var(--text-primary)]">No opportunities available yet.</p>
          <p className="text-sm text-[var(--text-secondary)]">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => {
            const slotsLeft =
              task.total_slots != null && task.filled_slots != null
                ? task.total_slots - task.filled_slots
                : null;

            return (
              <div
                key={task.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--brand-500)] uppercase tracking-wider">
                    {task.task_type ?? "Task"}
                  </span>
                  {slotsLeft != null && (
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                      {slotsLeft} slots left
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1 line-clamp-1">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-sm font-bold text-green-400">
                    {task.pay_per_task != null
                      ? `${task.pay_per_task} coins / task`
                      : "—"}
                  </span>
                  <Link
                    href={`/dashboard/tasks`}
                    className="text-xs font-medium text-[var(--brand-500)] hover:underline flex-shrink-0"
                  >
                    View task →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
