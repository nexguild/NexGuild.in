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

function injectScript(src: string, onLoad?: () => void) {
  if (document.querySelector(`script[src="${src}"]`)) {
    onLoad?.();
    return;
  }
  const s     = document.createElement("script");
  s.src       = src;
  s.async     = true;
  s.onload    = () => onLoad?.();
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

        // Resolve appId env var (if present, read from window or process.env client side)
        const appIdKey = w.appIdEnv ?? null;
        const appId: string | null = appIdKey
          ? (window[appIdKey] as string | null) ?? (process.env[appIdKey] as string | null) ?? null
          : null;

        // Build window config object the provider's script reads
        const configKey = `${w.slug.replace(/_/g, "")}Config`;
        window[configKey] = {
          ...(appId ? { appId } : {}),
          userId:        w.userId,
          secureHash:    w.secureHash ?? undefined,
          widgetConfigs: w.widgetConfigs,
          styleConfig:   w.styleConfig,
          useIframe:     w.useIframe,
          iframePosition: w.iframePosition,
        };

        injectScript(w.scriptUrl);
      }
    }

    load().catch(console.error);
  }, []);

  return null;
}
