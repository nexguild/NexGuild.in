"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

export function ContributorActivityHeartbeat() {
  useEffect(() => {
    let pending = false;

    async function recordActivity() {
      if (pending || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.access_token) return;
        const response = await fetch("/api/activity/heartbeat", {
          method: "POST",
          headers: { Authorization: "Bearer " + session.access_token },
          cache: "no-store",
        });
        if (!response.ok) {
          const result = await response.json() as { error?: string };
          throw new Error(result.error ?? `Activity heartbeat failed (${response.status}).`);
        }
      } catch (error) {
        console.error("[activity/heartbeat] request failed:", error);
      } finally {
        pending = false;
      }
    }

    void recordActivity();
    const interval = window.setInterval(recordActivity, HEARTBEAT_INTERVAL_MS);
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void recordActivity();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
