import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");
  // Token passed as query param because iframe src cannot set Authorization headers
  const token  = url.searchParams.get("token") ?? "";

  if (!userId || !token) {
    return new NextResponse("Missing params", { status: 400 });
  }

  const admin = createServerClient();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user || user.id !== userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Fetch script URL from DB
  const { data: provider } = await admin
    .from("offerwall_providers")
    .select("custom_config")
    .eq("slug", "cpagrip")
    .single();

  const cfg = (provider?.custom_config ?? {}) as Record<string, unknown>;
  const scriptUrlTemplate = (cfg.script_url as string | null) ?? null;
  if (!scriptUrlTemplate) {
    return new NextResponse("Not configured", { status: 404 });
  }

  const scriptUrl = scriptUrlTemplate.replace(/\{user_id\}/g, encodeURIComponent(userId));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; }
    img { max-width: 100%; height: auto; display: block; }
    table { max-width: 100%; width: 100%; word-break: break-word; }
    a { word-break: break-all; }
  </style>
</head>
<body>
  <script type="text/javascript" src="${scriptUrl}"></script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
