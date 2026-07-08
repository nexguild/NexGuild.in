import type { NextRequest } from "next/server";

interface Entry {
  count:   number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Prune expired entries every 5 minutes to avoid unbounded memory growth
const pruner = setInterval(() => {
  const now = Date.now();
  for (const [k, e] of store) {
    if (now >= e.resetAt) store.delete(k);
  }
}, 300_000);
// Don't keep the Node process alive just for cleanup
if (typeof pruner === "object" && "unref" in pruner) (pruner as NodeJS.Timeout).unref();

/**
 * Check-and-increment atomically.
 * Use this for API routes where every request counts toward the limit.
 */
export function rateLimit(
  key:      string,
  max:      number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const e   = store.get(key);

  if (!e || now >= e.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (e.count >= max) return { allowed: false, retryAfterMs: e.resetAt - now };
  e.count++;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Check only — does not increment.
 * Use this at the top of login handlers before attempting auth.
 */
export function isRateLimited(
  key: string,
  max: number,
): { limited: boolean; retryAfterMs: number } {
  const now = Date.now();
  const e   = store.get(key);
  if (!e || now >= e.resetAt) return { limited: false, retryAfterMs: 0 };
  if (e.count >= max)          return { limited: true,  retryAfterMs: e.resetAt - now };
  return { limited: false, retryAfterMs: 0 };
}

/**
 * Record one failed login attempt.
 * Only increments up to max — once blocked, further failures don't extend the window.
 */
export function recordFailure(
  key:      string,
  max:      number,
  windowMs: number,
): void {
  const now = Date.now();
  const e   = store.get(key);
  if (!e || now >= e.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
  } else if (e.count < max) {
    e.count++;
  }
}

/** Reset the failure counter — call on successful login. */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/** Extract the real client IP from Vercel's x-forwarded-for header. */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
