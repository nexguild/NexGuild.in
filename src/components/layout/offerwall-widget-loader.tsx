"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface WidgetConfig {
  slug: string;
  name: string;
  scriptUrl: string | null;
  appIdEnv: string | null;
  windowConfigKey: string | null;
  useGeneralConfig: boolean;
  widgetArrayKey: string;
  widgetConfigs: unknown[];
  styleConfig: Record<string, unknown>;
  useIframe: boolean;
  iframePosition: number;
  debug: boolean;
  userId: string;
  secureHash: string | null;
}

declare global {
  interface Window {
    [key: string]: unknown;
  }
}

// NexGuild fallback — overridden by DB custom_config.style_config values
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

function injectScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src   = src;
  s.async = true;
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

        const appIdKey = w.appIdEnv ?? null;
        const appId: string | null = appIdKey
          ? (process.env[appIdKey] as string | null) ?? null
          : null;

        const configKey    = w.windowConfigKey ?? `${w.slug.replace(/_/g, "")}Config`;
        const styleConfig  = mergeStyleConfig(w.styleConfig ?? {});
        const widgetArray  = w.widgetConfigs ?? [];

        let cfg: Record<string, unknown>;

        if (w.useGeneralConfig) {
          // CPX Research (and similar): user identity nested in general_config;
          // widget array key is "script_config" (set via custom_config.widget_array_key)
          cfg = {
            general_config: {
              app_id:       appId ?? "",
              ext_user_id:  w.userId,
              secure_hash:  w.secureHash ?? "",
              email:        "",
              username:     "",
            },
            style_config:       styleConfig,
            [w.widgetArrayKey]: widgetArray,
            debug:              w.debug,
            use_iframe:         w.useIframe,
            iframe_position:    w.iframePosition,
          };
        } else {
          // Generic flat structure for other providers
          cfg = {
            ...(appId ? { app_id: appId } : {}),
            user_id:            w.userId,
            secure_hash:        w.secureHash ?? undefined,
            style_config:       styleConfig,
            [w.widgetArrayKey]: widgetArray,
            debug:              w.debug,
            use_iframe:         w.useIframe,
            iframe_position:    w.iframePosition,
          };
        }

        // Config MUST be on window before the script tag is appended
        window[configKey] = cfg;

        // Temporary debug log — remove after CPX widget confirmed working
        console.log(`[OfferwallWidgetLoader] window.${configKey}:`, JSON.stringify(window[configKey]));

        injectScript(w.scriptUrl);
      }
    }

    load().catch(console.error);
  }, []);

  return null;
}
