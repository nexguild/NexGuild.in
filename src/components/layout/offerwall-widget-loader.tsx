"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface WidgetConfig {
  slug: string;
  name: string;
  scriptUrl: string | null;
  appIdEnv: string | null;
  widgetConfigs: unknown[];
  styleConfig: Record<string, unknown>;
  useIframe: boolean;
  iframePosition: number;
  userId: string;
  secureHash: string | null;
}

declare global {
  interface Window {
    [key: string]: unknown;
  }
}

// NexGuild fallback — matches indigo/light theme; overridden by DB custom_config.style_config
const DEFAULT_STYLE_CONFIG = {
  text_color: "#0F172A",
  survey_box: {
    topbar_background_color: "#6366F1",
    box_background_color: "#FFFFFF",
    rounded_borders: true,
    stars_filled: "#0F172A",
  },
};

function mergeStyleConfig(fromDb: Record<string, unknown>): Record<string, unknown> {
  const surveyBoxDb = (fromDb.survey_box as Record<string, unknown> | null | undefined) ?? {};
  return {
    ...DEFAULT_STYLE_CONFIG,
    ...fromDb,
    survey_box: {
      ...DEFAULT_STYLE_CONFIG.survey_box,
      ...surveyBoxDb,
    },
  };
}

function injectScript(src: string, onLoad?: () => void) {
  if (document.querySelector(`script[src="${src}"]`)) {
    onLoad?.();
    return;
  }
  const s  = document.createElement("script");
  s.src    = src;
  s.async  = true;
  s.onload = () => onLoad?.();
  document.body.appendChild(s);
}

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
      const { widgets } = await res.json() as { widgets: WidgetConfig[] };
      if (!widgets?.length) return;

      for (const w of widgets) {
        if (!w.scriptUrl) continue;

        // Resolve app_id from NEXT_PUBLIC_ env var if configured
        const appIdKey = w.appIdEnv ?? null;
        const appId: string | null = appIdKey
          ? (process.env[appIdKey] as string | null) ?? null
          : null;

        // Use snake_case keys — CPX (and most script-tag providers) read snake_case
        // style_config is always a fully populated object even if DB has nothing set
        const configKey = `${w.slug.replace(/_/g, "")}Config`;
        window[configKey] = {
          ...(appId ? { app_id: appId } : {}),
          user_id:         w.userId,
          secure_hash:     w.secureHash ?? undefined,
          widget_configs:  w.widgetConfigs,
          style_config:    mergeStyleConfig(w.styleConfig ?? {}),
          use_iframe:      w.useIframe,
          iframe_position: w.iframePosition,
        };

        injectScript(w.scriptUrl);
      }
    }

    load().catch(console.error);
  }, []);

  return null;
}
