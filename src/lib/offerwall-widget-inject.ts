// Shared between OfferwallWidgetLoader (layout) and OfferwallsPage (page-level injection)

const DEFAULT_STYLE_CONFIG = {
  text_color: "#0F172A",
  survey_box: {
    topbar_background_color: "#6366F1",
    box_background_color: "#FFFFFF",
    rounded_borders: true,
    stars_filled: "#0F172A",
  },
};

export interface WidgetInitConfig {
  slug: string;
  scriptUrl: string | null;
  appId: string | null;
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

function mergeStyleConfig(fromDb: Record<string, unknown>): Record<string, unknown> {
  const surveyBoxDb = (fromDb.survey_box as Record<string, unknown> | undefined) ?? {};
  return {
    ...DEFAULT_STYLE_CONFIG,
    ...fromDb,
    survey_box: { ...DEFAULT_STYLE_CONFIG.survey_box, ...surveyBoxDb },
  };
}

export function buildWindowConfig(w: WidgetInitConfig): Record<string, unknown> {
  const styleConfig = mergeStyleConfig(w.styleConfig ?? {});

  if (w.useGeneralConfig) {
    return {
      general_config: {
        app_id:      w.appId ?? "",
        ext_user_id: w.userId,
        secure_hash: w.secureHash ?? "",
        email:       "",
        username:    "",
      },
      style_config:       styleConfig,
      [w.widgetArrayKey]: w.widgetConfigs,
      debug:              w.debug,
      use_iframe:         w.useIframe,
      iframe_position:    w.iframePosition,
    };
  }

  return {
    ...(w.appId ? { app_id: w.appId } : {}),
    user_id:            w.userId,
    secure_hash:        w.secureHash ?? undefined,
    style_config:       styleConfig,
    [w.widgetArrayKey]: w.widgetConfigs,
    debug:              w.debug,
    use_iframe:         w.useIframe,
    iframe_position:    w.iframePosition,
  };
}

export function applyWidgetConfig(w: WidgetInitConfig): string {
  const configKey = w.windowConfigKey ?? `${w.slug.replace(/_/g, "")}Config`;
  (window as Record<string, unknown>)[configKey] = buildWindowConfig(w);
  return configKey;
}

/**
 * Injects the provider script. Pass force=true to remove any existing script
 * tag first so the script re-executes — needed when navigating to a page that
 * has the required container div (e.g. #fullscreen) after the script already
 * ran without finding it.
 */
export function injectScript(scriptUrl: string, force = false): void {
  if (force) {
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    existing?.parentNode?.removeChild(existing);
  } else if (document.querySelector(`script[src="${scriptUrl}"]`)) {
    return;
  }
  const s = document.createElement("script");
  s.src   = scriptUrl;
  s.async = true;
  document.body.appendChild(s);
}
