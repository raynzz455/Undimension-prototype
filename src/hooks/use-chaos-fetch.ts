"use client";

/**
 * useChaosFetch — a fetch wrapper that auto-attaches the chaos-mode token.
 *
 * BUG FIX (Task 37 → Task 38 hardened): previously the token race condition
 * fix worked on desktop but still failed on mobile because:
 *   1. The on-demand token fetch could fail transiently on mobile (network
 *      hiccup, slow connection, server hiccup) → token = null → request
 *      sent without token → 403 → and the 403-retry only triggered if
 *      `token` was non-null (so it never retried).
 *   2. There was no retry on the token fetch itself — a single transient
 *      failure meant no token for the session.
 *
 * This version:
 *   - Retries the token fetch up to 3 times with 250ms delay (handles
 *     transient mobile network failures).
 *   - Retries the CRUD request on 403 REGARDLESS of whether the initial
 *     token was null (so a null-token 403 also triggers a fresh fetch).
 *   - Module-level tokenFetchPromise prevents duplicate concurrent fetches.
 */

// Module-level token-fetch promise — prevents duplicate concurrent fetches.
let tokenFetchPromise: Promise<string | null> | null = null;

async function fetchTokenWithRetry(retries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch("/api/chaos-token", { cache: "no-store" });
      if (!res.ok) {
        // Non-OK (e.g. 500 if CHAOS_SECRET missing in prod) — retry on
        // transient errors (5xx, 429), give up on 4xx (config issue).
        if (res.status >= 500 || res.status === 429) {
          if (attempt < retries - 1) { await new Promise((r) => setTimeout(r, 250)); continue; }
        }
        return null;
      }
      const d = await res.json();
      if (d?.token) {
        localStorage.setItem("ud-chaos-token", d.token);
        return d.token as string;
      }
      return null;
    } catch {
      // Network error — retry with delay
      if (attempt < retries - 1) { await new Promise((r) => setTimeout(r, 250)); continue; }
      return null;
    }
  }
  return null;
}

async function getOrFetchToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const existing = localStorage.getItem("ud-chaos-token");
  if (existing) return existing;

  // Token not yet present (race condition: unlockGodMode's async fetch
  // hasn't completed, or the previous fetch failed). Fetch on-demand.
  // Module-level promise so concurrent requests share the same fetch.
  if (!tokenFetchPromise) {
    tokenFetchPromise = fetchTokenWithRetry().finally(() => {
      tokenFetchPromise = null; // clear so future refreshes can fetch again
    });
  }
  return tokenFetchPromise;
}

export function useChaosFetch() {
  const chaosFetch = async (url: string, options: RequestInit = {}) => {
    let token = await getOrFetchToken();

    const buildHeaders = (tok: string | null) => {
      const headers = new Headers(options.headers);
      if (tok) headers.set("x-chaos-token", tok);
      if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    };

    let res = await fetch(url, { ...options, headers: buildHeaders(token) });

    // If 403 (token missing/expired), refresh the token and retry ONCE.
    // NOTE: retry REGARDLESS of whether `token` was null — a null token
    // (on-demand fetch failed transiently) also produces 403, and we
    // should retry with a fresh fetch in case the transient failure
    // has resolved.
    if (res.status === 403) {
      // Clear any stale cached token
      if (token) localStorage.removeItem("ud-chaos-token");
      // Force a fresh fetch (the module-level promise was cleared after
      // the first fetch completed, so this starts a new one)
      tokenFetchPromise = null;
      token = await getOrFetchToken();
      if (token) {
        res = await fetch(url, { ...options, headers: buildHeaders(token) });
      }
    }

    return res;
  };
  return { chaosFetch };
}
