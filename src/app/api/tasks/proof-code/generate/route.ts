import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function makeCode(userId: string, siteSlug: string, hourWindow: number, secret: string): string {
  const input = `${userId}:${siteSlug}:${hourWindow}:${secret}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 8).toUpperCase();
}

// Public endpoint — called from external sites via the nexguild-verify.js widget.
// No auth required; the user_id is passed as a query param from the task link.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId   = searchParams.get("user_id")   ?? "";
  const siteSlug = searchParams.get("site_slug") ?? "";

  if (!userId || !siteSlug) {
    return NextResponse.json({ error: "Missing user_id or site_slug" }, { status: 400 });
  }

  const secret = process.env.PROOF_CODE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const nowMs      = Date.now();
  const hourWindow = Math.floor(nowMs / (1000 * 60 * 60));
  const code       = makeCode(userId, siteSlug, hourWindow, secret);

  // Seconds until the next hour boundary
  const expiresInSeconds = 3600 - (Math.floor(nowMs / 1000) % 3600);

  return NextResponse.json(
    { code, expires_in_seconds: expiresInSeconds },
    {
      headers: {
        // Allow the external site to call this endpoint
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    }
  );
}

// Preflight for CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
