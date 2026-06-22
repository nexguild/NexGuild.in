"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { applyWidgetConfig, injectScript, type WidgetInitConfig } from "@/lib/offerwall-widget-inject";

export function OfferwallWidgetLoader() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/offerwall/widget-config", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const { widgets } = await res.json() as { widgets: WidgetInitConfig[] };
      if (!widgets?.length) return;

      for (const w of widgets) {
        if (!w.scriptUrl) continue;
        const configKey = applyWidgetConfig(w);
        // Don't force-inject here: the offerwalls page owns injection timing
        // for fullscreen widgets so the #fullscreen div exists first.
        // This call handles notification/floating widgets that need no specific div.
        injectScript(w.scriptUrl, false);
      }
    }

    load().catch(console.error);
  }, []);

  return null;
}
