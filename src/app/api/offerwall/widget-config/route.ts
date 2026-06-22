import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase-server";

interface Provider {
  id: string;
  slug: string;
  name: string;
  postback_secret: string | null;
  custom_config: Record<string, unknown> | null;
  hash_format: string | null;
  is_active: boolean;
  integration_type: string;
}

function computeHash(hashFormat: string, secret: string, userId: string): string {
  const template = hashFormat.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key === "secret") return secret;
    if (key === "user_id") return userId;
    return "";
  });
  return createHash("md5").update(template).digest("hex");
}

export async function GET(req: NextRequest) {
  // Requires authenticated user — Bearer token from client
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all active script_tag providers
  const { data: providers, error } = await admin
    .from("offerwall_providers")
    .select("id, slug, name, postback_secret, custom_config, hash_format, is_active, integration_type")
    .eq("integration_type", "script_tag")
    .eq("is_active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!providers || providers.length === 0) return NextResponse.json({ widgets: [] });

  const widgets = (providers as Provider[]).map((p) => {
    const cfg        = p.custom_config ?? {};
    const scriptUrl       = (cfg.script_url as string | null) ?? null;
    const appIdEnv        = (cfg.app_id_env as string | null) ?? null;
    const widgetCfgs      = (cfg.widget_configs as unknown[] | null) ?? [];
    const styleCfg        = (cfg.style_config as Record<string, unknown> | null) ?? {};
    const useIframe       = cfg.use_iframe === true;
    const iframePos       = (cfg.iframe_position as number | null) ?? 1;
    // Which window property the provider's script reads (e.g. "config" for CPX)
    const windowConfigKey = (cfg.window_config_key as string | null) ?? null;
    // CPX expects { general_config: { app_id, ext_user_id, secure_hash } } at root
    const useGeneralConfig = cfg.use_general_config === true;
    // CPX calls the widget array "script_config" instead of "widget_configs"
    const widgetArrayKey  = (cfg.widget_array_key as string | null) ?? "widget_configs";
    const debug           = cfg.debug === true;

    let secureHash: string | null = null;
    if (p.hash_format && p.postback_secret) {
      secureHash = computeHash(p.hash_format, p.postback_secret, user.id);
    }

    return {
      slug:             p.slug,
      name:             p.name,
      scriptUrl,
      appIdEnv,
      windowConfigKey,
      useGeneralConfig,
      widgetArrayKey,
      widgetConfigs:    widgetCfgs,
      styleConfig:      styleCfg,
      useIframe,
      iframePosition:   iframePos,
      debug,
      userId:           user.id,
      secureHash,
    };
  });

  return NextResponse.json({ widgets });
}
