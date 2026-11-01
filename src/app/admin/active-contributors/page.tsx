"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageGuard } from "@/components/layout/admin-auth-guard";
import { ADMIN_ROLES } from "@/lib/admin-permissions";
import { supabase } from "@/lib/supabase";

interface ActivityContributor {
  contributor_id: string;
  activity_date: string;
  last_active_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    country: string | null;
    status: string | null;
  } | null;
}

interface ActivityDay {
  date: string;
  count: number;
  contributors: ActivityContributor[];
  truncated: boolean;
}

interface ActivityResponse {
  today: ActivityDay;
  yesterday: ActivityDay;
}

export default function ActiveContributorsPage() {
  const allowed = usePageGuard(ADMIN_ROLES.UPPER);
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<"today" | "yesterday">("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error("Your session has expired. Sign in again.");
      const response = await fetch("/api/admin/contributor-activity", {
        headers: { Authorization: "Bearer " + session.access_token },
        cache: "no-store",
      });
      const result = await response.json() as ActivityResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to load contributor activity.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load contributor activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) void loadActivity();
  }, [allowed, loadActivity]);

  if (!allowed) return null;

  const day = data?.[selectedDay];
  const contributors = day?.contributors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Contributor Activity</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Signed-in dashboard visits are recorded at login and while a dashboard tab stays visible. Days use India Standard Time.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void loadActivity()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {(["today", "yesterday"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedDay(key)}
            aria-pressed={selectedDay === key}
            className={`rounded-xl border p-5 text-left transition-colors ${
              selectedDay === key
                ? "border-[var(--brand-500)] bg-[var(--brand-500)]/5"
                : "border-[var(--border-default)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{key === "today" ? "Active Today" : "Active Yesterday"}</span>
              <Users className="h-4 w-4 text-[var(--brand-500)]" />
            </div>
            <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
              {loading ? "—" : (data?.[key].count ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {data?.[key].date ?? ""}
            </p>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-5 py-4">
          <Activity className="h-4 w-4 text-[var(--brand-500)]" />
          <h2 className="font-semibold text-[var(--text-primary)]">
            {selectedDay === "today" ? "Active Today" : "Active Yesterday"}
          </h2>
          <span className="ml-auto text-xs text-[var(--text-muted)]">{day?.date ?? ""} · IST</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[var(--text-muted)]">Loading contributor activity…</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-400">Activity could not be loaded.</div>
        ) : contributors.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">No contributor activity recorded for this day.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--surface-subtle)] text-left text-[var(--text-secondary)]">
                    {["Contributor", "Email", "Country", "Status", "Last active (IST)"].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {contributors.map((entry) => (
                    <tr key={entry.contributor_id} className="hover:bg-[var(--surface-subtle)]">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{entry.profiles?.full_name ?? "Unnamed contributor"}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{entry.profiles?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{entry.profiles?.country ?? "—"}</td>
                      <td className="px-4 py-3 capitalize text-[var(--text-secondary)]">{entry.profiles?.status ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">
                        {new Date(entry.last_active_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {day?.truncated && (
              <p className="border-t border-[var(--border-default)] px-5 py-3 text-xs text-[var(--text-muted)]">
                Showing the latest 500 active contributors for this day.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
