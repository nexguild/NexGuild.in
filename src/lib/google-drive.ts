/**
 * Google Drive integration via Apps Script Web App.
 *
 * All operations execute as Somen's Google account through a deployed Apps Script
 * Web App, avoiding the zero-storage-quota limitation of service accounts on free
 * Google accounts.
 *
 * Required env vars:
 *   APPS_SCRIPT_WEB_APP_URL     – deployment URL from Apps Script → Deploy
 *   APPS_SCRIPT_SHARED_SECRET   – shared secret set in Apps Script Script Properties
 */

import { callAppsScript, isAppsScriptConfigured } from "./apps-script";

export { isAppsScriptConfigured as isDriveConfigured };

// ── Task structure creation ───────────────────────────────────────────────────
// Called once on task creation. Creates: NexGuild/<Task> folder, Images subfolder,
// and a Google Sheet with a header row. Returns Drive IDs for storage.

export async function createDriveResourcesForTask(
  taskId: string,
  taskTitle: string,
  steps: { title: string; submitType: string }[],
): Promise<{ folderId: string; imagesFolderId: string; sheetId: string } | null> {
  if (!isAppsScriptConfigured()) return null;
  try {
    const res = await callAppsScript<{
      folderId: string;
      imagesFolderId: string;
      sheetId: string;
    }>("create_task_structure", { taskId, taskTitle, steps });
    return res;
  } catch (err) {
    console.error("[google-drive] create_task_structure failed:", err);
    return null;
  }
}

// ── Single file upload ────────────────────────────────────────────────────────
// Called when a contributor uploads a file for a step.

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
): Promise<{ id: string; viewUrl: string; previewUrl: string } | null> {
  if (!isAppsScriptConfigured()) return null;
  try {
    const base64Data = buffer.toString("base64");
    const res = await callAppsScript<{
      fileId: string;
      viewUrl: string;
      previewUrl: string;
    }>("upload_file", { folderId: parentFolderId, fileName, mimeType, base64Data });
    return { id: res.fileId, viewUrl: res.viewUrl, previewUrl: res.previewUrl };
  } catch (err) {
    console.error("[google-drive] upload_file failed:", err);
    return null;
  }
}

// ── Submission row ────────────────────────────────────────────────────────────

export interface SubmissionRowData {
  submissionId:    string;
  contributorId:   string;
  contributorName: string;
  submittedAt:     string;
  stepContents:    string[];
}

export async function writeSubmissionRow(
  spreadsheetId: string,
  rowData: SubmissionRowData,
): Promise<void> {
  if (!isAppsScriptConfigured()) return;
  await callAppsScript("write_submission_row", { sheetId: spreadsheetId, ...rowData });
}

// ── Sheet status sync on approve / reject ─────────────────────────────────────

export async function syncSheetStatus(
  spreadsheetId: string,
  submissionId: string,
  status: string,
  _reviewedAt: string,
): Promise<void> {
  if (!isAppsScriptConfigured()) return;
  await callAppsScript("sync_submission_status", {
    sheetId:      spreadsheetId,
    submissionId,
    status,
  });
}

// ── Helpers (kept for any callers that reference them) ────────────────────────

export function extractSheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return urlOrId.trim();
}

export function buildHeaderRow(steps: { title: string; submitType: string }[]): string[] {
  const stepCols = [1, 2, 3, 4, 5].map((n) => `Step ${n}`);
  return ["Submission ID", "Contributor ID", "Contributor Name", "Submitted At", ...stepCols, "Status"];
}
