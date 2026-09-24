/**
 * Simple in-memory rate limiter (per server instance).
 *
 * For production with multiple serverless instances (e.g. Vercel), this is
 * approximate — each instance tracks its own Map. To get exact rate-limiting,
 * switch to Upstash Redis (@upstash/ ratelimit) or Supabase edge function.
 *
 * For our purposes (single Render web service, SQLite/Supabase backend),
 * in-memory is fine and avoids extra infra.
 *
 * Limits:
 *  - 5 requests per 60s per IP for public POST endpoints (guestbook, news)
 */

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per IP

// Map of IP -> array of request timestamps (ms since epoch)
const ipRequests = new Map<string, number[]>();

// Periodically purge stale entries so the Map doesn't grow forever.
// (Every 5 minutes, drop IPs whose most recent request is older than the window.)
const PURGE_INTERVAL_MS = 5 * 60 * 1000;
let lastPurge = Date.now();

function purgeStale() {
  const now = Date.now();
  if (now - lastPurge < PURGE_INTERVAL_MS) return;
  lastPurge = now;
  for (const [ip, times] of ipRequests.entries()) {
    const recent = times.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, recent);
    }
  }
}

export type RateLimitResult = { allowed: boolean; retryAfter: number };

/**
 * Returns whether the given IP is allowed to make another request.
 * Records the request timestamp if allowed.
 */
export function rateLimit(ip: string): RateLimitResult {
  purgeStale();
  const now = Date.now();
  const requests = ipRequests.get(ip) || [];
  const recentRequests = requests.filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestRequest = recentRequests[0];
    const retryAfter = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - (now - oldestRequest)) / 1000,
    );
    return { allowed: false, retryAfter: Math.max(1, retryAfter) };
  }

  recentRequests.push(now);
  ipRequests.set(ip, recentRequests);
  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort client IP extraction.
 *
 * On Vercel/Render behind a CDN, `x-forwarded-for` is the original client IP
 * (comma-separated list, first entry is the client). `x-real-ip` is set by
 * some proxies. Falls back to "unknown" if neither is present, in which case
 * all unknown clients share a single bucket — acceptable for a low-traffic
 * friend-circle site.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  return "unknown";
}

/**
 * Strip HTML tags and dangerous characters from user-supplied text.
 *
 * This is a defense-in-depth layer — the frontend also escapes content via
 * React's default text rendering, but stripping on the server prevents
 * accidentally storing raw HTML that could be re-rendered elsewhere (e.g.
 * in admin tools, RSS feeds, or future Markdown renderers).
 *
 * Also strips null bytes (0x00) which cause `22021: invalid byte sequence
 * for encoding "UTF8"` Postgres errors when pasted into text columns.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/\0/g, "") // strip null bytes (causes 22021 Postgres error)
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/javascript:/gi, "") // strip javascript: URIs
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "") // strip inline event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]+/gi, "")
    .trim();
}

/**
 * Light-weight text cleaner for fields that don't need HTML stripping
 * (URLs, IDs, slugs, years, enums). Strips null bytes + trims + slices.
 *
 * Use this for routes that bypass `sanitizeText` to avoid the inline
 * `String(x).trim().slice(N)` pattern that misses null-byte sanitization.
 */
export function cleanText(input: unknown, maxLen?: number): string {
  let out = String(input ?? "");
  out = out.replace(/\0/g, "").trim();
  if (typeof maxLen === "number" && maxLen > 0) out = out.slice(0, maxLen);
  return out;
}
