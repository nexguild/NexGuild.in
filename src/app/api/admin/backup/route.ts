import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { writeAdminAudit } from "@/lib/admin-audit";

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
  return { admin, userId: user.id };
}

export async function POST(req: NextRequest) {
  const ctx = await verifyOwner(req);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  await writeAdminAudit(ctx.admin, {
    actorId: ctx.userId,
    action: "backup_triggered",
    targetType: "database_backup",
    summary: "Triggered the database backup workflow.",
    metadata: { repository: ghRepo },
  });

  // GitHub returns 204 No Content on success
  return NextResponse.json({ ok: true, message: "Backup workflow triggered. You'll receive an email when it completes." });
}

export async function GET(req: NextRequest) {
  const ctx = await verifyOwner(req);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ghRepo = process.env.GH_REPO;
  const ghPat = process.env.GH_PAT;
  if (!ghRepo || !ghPat) {
    return NextResponse.json({ configured: false, lastRun: null });
  }

  const [owner, repository, ...extra] = ghRepo.split("/");
  if (!owner || !repository || extra.length > 0) {
    return NextResponse.json({ error: "GH_REPO must use owner/repository format." }, { status: 500 });
  }

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/actions/workflows/db-backup.yml/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${ghPat}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    }
  );
  if (!response.ok) {
    console.error("[admin/backup] GitHub run lookup failed:", response.status);
    return NextResponse.json({ error: "Unable to load backup status. Check that the GitHub token has Actions read access." }, { status: 502 });
  }

  const result = await response.json() as {
    workflow_runs?: Array<{
      id: number;
      run_number: number;
      status: string;
      conclusion: string | null;
      created_at: string;
      updated_at: string;
      html_url: string;
    }>;
  };
  const [lastRun] = result.workflow_runs ?? [];
  return NextResponse.json({
    configured: true,
    lastRun: lastRun ? {
      id: lastRun.id,
      runNumber: lastRun.run_number,
      status: lastRun.status,
      conclusion: lastRun.conclusion,
      createdAt: lastRun.created_at,
      updatedAt: lastRun.updated_at,
      url: lastRun.html_url,
    } : null,
  });
}
