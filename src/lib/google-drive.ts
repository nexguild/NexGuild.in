import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
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

export async function createFolder(name: string, parentId: string): Promise<string | null> {
  const drive = driveClient();
  if (!drive) return null;
  const res = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  return res.data.id ?? null;
}

export async function setFilePublic(fileId: string): Promise<void> {
  const drive = driveClient();
  if (!drive) return;
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });
}

export async function createSheet(name: string, parentId: string): Promise<string | null> {
  const drive  = driveClient();
  const sheets = sheetsClient();
  if (!drive || !sheets) return null;

  // Create the spreadsheet via the Drive API so it lands directly inside the
  // shared parent folder. Using sheets.spreadsheets.create() creates it in
  // the service account's personal Drive root (zero-quota) and then requires
  // a separate move — that move fails with 403 because the service account
  // only has writer access on the shared folder, not on its own root.
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [parentId],
    },
    fields: "id",
  });
  const fileId = res.data.id!;

  // Share so admins can open the link directly
  await setFilePublic(fileId);

  // Add header row via Sheets API (modifying an existing file is allowed
  // once it's inside the shared folder we have access to)
  await sheets.spreadsheets.values.update({
    spreadsheetId: fileId,
    range: "Sheet1!A1:I1",
    valueInputOption: "RAW",
    requestBody: {
      values: [["Contributor ID", "Submission ID", "Stage", "Filename", "Drive URL", "Status", "Submitted At", "Reviewed At", "Notes"]],
    },
  });

  return fileId;
}

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

export async function appendSheetRow(spreadsheetId: string, values: (string | number)[]): Promise<void> {
  const sheets = sheetsClient();
  if (!sheets) return;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:I",
    valueInputOption: "RAW",
    requestBody: { values: [values.map(String)] },
  });
}

export async function syncSheetStatus(
  spreadsheetId: string,
  submissionId: string,
  status: string,
  reviewedAt: string,
): Promise<void> {
  const sheets = sheetsClient();
  if (!sheets) return;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A:I",
  });

  const rows = res.data.values ?? [];
  const data: { range: string; values: string[][] }[] = [];

  for (let i = 1; i < rows.length; i++) {
    // Column B (index 1) = Submission ID
    if (rows[i]?.[1] === submissionId) {
      // Column F (index 5) = Status, Column H (index 7) = Reviewed At
      data.push({ range: `Submissions!F${i + 1}`, values: [[status]] });
      data.push({ range: `Submissions!H${i + 1}`, values: [[reviewedAt]] });
    }
  }

  if (data.length === 0) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "RAW", data },
  });
}

export async function createDriveResourcesForTask(
  taskId: string,
  taskTitle: string,
): Promise<{ folderId: string; imagesFolderId: string; sheetId: string } | null> {
  const rootFolderId = process.env.GOOGLE_DRIVE_NEXGUILD_FOLDER_ID;
  if (!rootFolderId || !isDriveConfigured()) return null;

  const safeTitle = taskTitle.replace(/[/\\:*?"<>|]/g, "-").slice(0, 80);
  const folderName = `${safeTitle} [${taskId.slice(0, 8)}]`;

  const folderId = await createFolder(folderName, rootFolderId);
  if (!folderId) return null;

  const [imagesFolderId, sheetId] = await Promise.all([
    createFolder("Images", folderId),
    createSheet(`${safeTitle} — Submissions`, folderId),
  ]);

  if (!imagesFolderId || !sheetId) return null;
  return { folderId, imagesFolderId, sheetId };
}
