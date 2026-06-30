/**
 * Client for the Google Apps Script Web App deployed by Somen.
 * All Drive/Sheet operations run as Somen's Google account (Execute as: Me),
 * so they use his 5TB Google One storage instead of the quota-less service account.
 */

export function isAppsScriptConfigured(): boolean {
  return !!(
    process.env.APPS_SCRIPT_WEB_APP_URL &&
    process.env.APPS_SCRIPT_SHARED_SECRET
  );
}

export async function callAppsScript<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const url    = process.env.APPS_SCRIPT_WEB_APP_URL;
  const secret = process.env.APPS_SCRIPT_SHARED_SECRET;

  if (!url || !secret) {
    throw new Error("Apps Script not configured (APPS_SCRIPT_WEB_APP_URL / APPS_SCRIPT_SHARED_SECRET missing)");
  }

  // Apps Script doPost cannot read custom HTTP headers — secret goes in the JSON body.
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, _secret: secret, ...payload }),
    // Apps Script can be slow on cold start; give it 30 s
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Apps Script ${action} failed (${res.status}): ${text}`);
  }

  const data = await res.json() as { success?: boolean; error?: string } & T;
  if (data.error) throw new Error(`Apps Script ${action} error: ${data.error}`);
  return data;
}
