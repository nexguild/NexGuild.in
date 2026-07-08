import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

async function verifyOwner(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = createServerClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== "owner") return null;
  return true;
}

export async function POST(req: NextRequest) {
  const ok = await verifyOwner(req);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ghRepo = process.env.GH_REPO;
  const ghPat  = process.env.GH_PAT;
  if (!ghRepo || !ghPat) {
    return NextResponse.json(
      { error: "Backup not configured — set GH_REPO and GH_PAT env vars." },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${ghRepo}/actions/workflows/db-backup.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization:        `Bearer ${ghPat}`,
        "Content-Type":       "application/json",
        Accept:               "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[admin/backup] GitHub dispatch failed:", res.status, text);
    return NextResponse.json({ error: "Failed to trigger backup workflow." }, { status: 502 });
  }

  // GitHub returns 204 No Content on success
  return NextResponse.json({ ok: true, message: "Backup workflow triggered. You'll receive an email when it completes." });
}
