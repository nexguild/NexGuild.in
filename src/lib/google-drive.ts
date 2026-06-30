import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  const key = rawKey.replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

function driveClient() {
  const auth = getAuth();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

function sheetsClient() {
  const auth = getAuth();
  if (!auth) return null;
  return google.sheets({ version: "v4", auth });
}

export function isDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_NEXGUILD_FOLDER_ID
  );
}

// ── Folder creation ───────────────────────────────────────────────────────────

export async function createFolder(name: string, parentId: string): Promise<string | null> {
  const drive = driveClient();
  if (!drive) return null;
  const res = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  return res.data.id ?? null;
}

// ── File sharing ──────────────────────────────────────────────────────────────

export async function setFilePublic(fileId: string): Promise<void> {
  const drive = driveClient();
  if (!drive) return;
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });
}

// ── File upload ───────────────────────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  parentFolderId: string,
): Promise<{ id: string; viewUrl: string; previewUrl: string } | null> {
  const drive = driveClient();
  if (!drive) return null;

  const body = Readable.from(buffer);
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [parentFolderId] },
    media: { mimeType, body },
    fields: "id",
  });
  const id = res.data.id!;
  await setFilePublic(id);

  return {
    id,
    viewUrl:    `https://drive.google.com/file/d/${id}/view`,
    previewUrl: `https://drive.google.com/file/d/${id}/preview`,
  };
}

// ── Drive folder + Images subfolder auto-creation on new task ─────────────────
// Does NOT create a Sheet — service accounts on free Google accounts have zero
// storage quota, so creating a new file always fails. The Sheet is linked
// manually by Somen using his own Google account.

export async function createDriveResourcesForTask(
  taskId: string,
  taskTitle: string,
): Promise<{ folderId: string; imagesFolderId: string } | null> {
  const rootFolderId = process.env.GOOGLE_DRIVE_NEXGUILD_FOLDER_ID;
  if (!rootFolderId || !isDriveConfigured()) return null;

  const safeTitle  = taskTitle.replace(/[/\\:*?"<>|]/g, "-").slice(0, 80);
  const folderName = `${safeTitle} [${taskId.slice(0, 8)}]`;

  const folderId = await createFolder(folderName, rootFolderId);
  if (!folderId) return null;

  const imagesFolderId = await createFolder("Images", folderId);
  if (!imagesFolderId) return null;

  return { folderId, imagesFolderId };
}

// ── Sheet header ──────────────────────────────────────────────────────────────

export function buildHeaderRow(steps: { title: string; submitType: string }[]): string[] {
  if (steps.length === 0) {
    return ["Submission ID", "Contributor ID", "Contributor Name", "Submitted At", "Notes", "Files", "Status"];
  }
  const stepCols = steps.map((_, i) => `Step ${i + 1} Content`);
  return ["Submission ID", "Contributor ID", "Contributor Name", "Submitted At", ...stepCols, "Status"];
}

export async function writeSheetHeader(
  spreadsheetId: string,
  steps: { title: string; submitType: string }[],
): Promise<void> {
  const sheets = sheetsClient();
  if (!sheets) return;
  const headers = buildHeaderRow(steps);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Sheet1!A1:${colLetter(headers.length - 1)}1`,
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
}

// ── Sheet row write / update on submission completion ─────────────────────────

export interface SubmissionRowData {
  submissionId:    string;
  contributorId:   string;
  contributorName: string;
  submittedAt:     string;
  // One string per step (or notes/files for classic mode)
  stepContents: string[];
}

export async function writeSubmissionRow(
  spreadsheetId: string,
  rowData: SubmissionRowData,
): Promise<void> {
  const sheets = sheetsClient();
  if (!sheets) return;

  const values = [
    rowData.submissionId,
    rowData.contributorId,
    rowData.contributorName,
    rowData.submittedAt,
    ...rowData.stepContents,
    "Pending",
  ];

  // Check if a row with this Submission ID already exists (resubmissions)
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A:A",
  });
  const colA = existing.data.values ?? [];
  let existingRowIndex = -1;
  for (let i = 1; i < colA.length; i++) {
    if (colA[i]?.[0] === rowData.submissionId) {
      existingRowIndex = i + 1; // 1-based sheet row
      break;
    }
  }

  if (existingRowIndex > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${existingRowIndex}:${colLetter(values.length - 1)}${existingRowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [values.map(String)] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:A",
      valueInputOption: "RAW",
      requestBody: { values: [values.map(String)] },
    });
  }
}

// ── Sheet status sync on approve / reject ─────────────────────────────────────

export async function syncSheetStatus(
  spreadsheetId: string,
  submissionId: string,
  status: string,
  reviewedAt: string,
): Promise<void> {
  const sheets = sheetsClient();
  if (!sheets) return;

  // Read the whole sheet to find the header + the matching row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A:Z",
  });
  const rows = res.data.values ?? [];
  if (rows.length < 2) return;

  // Find "Status" column from header row (row 0)
  const header   = rows[0];
  const statusCol = header.findIndex((h) => h === "Status");
  if (statusCol < 0) return; // header not written yet

  const updates: { range: string; values: string[][] }[] = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i]?.[0] === submissionId) {
      updates.push({ range: `Sheet1!${colLetter(statusCol)}${i + 1}`, values: [[status]] });
    }
  }
  if (updates.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data: updates },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function colLetter(index: number): string {
  // 0=A, 1=B, ... 25=Z, 26=AA, etc.
  let s = "";
  let n = index;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function extractSheetId(urlOrId: string): string {
  // Full URL: https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return urlOrId.trim();
}

export function getServiceAccountEmail(): string {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "(not configured)";
}
