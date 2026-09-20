"use client";

/**
 * useChaosFetch — a fetch wrapper that auto-attaches the chaos-mode token.
 *
 * BUG FIX (Task 37): previously this hook read the token from localStorage and
 * sent the request immediately. If the token wasn't there yet (because the
 * async token fetch in unlockGodMode hadn't completed), the request went out
 * WITHOUT the x-chaos-token header → backend returned 403 "CHAOS MODE REQUIRED".
 *
 * This race condition was especially bad on mobile (slower networks = the token
 * fetch takes longer, user clicks through faster). It also affected PC, just
 * less frequently.
 *
 * FIX: this hook now fetches the token ON-DEMAND if it's not in localStorage.
 * A module-level "token fetch in progress" promise prevents duplicate concurrent
 * fetches. Once the token is fetched, it's stored in localStorage and reused
 * for all subsequent requests.
 *
 * Also handles token REFRESH: if a request returns 403, the hook clears the
 * cached token and retries once with a fresh token (the old one may have expired
 * server-side past the 24h TTL while godMode is still active client-side).
 */

// Module-level token-fetch promise — prevents duplicate concurrent fetches.
let tokenFetchPromise: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/chaos-token");
    if (!res.ok) return null;
    const d = await res.json();
    if (d?.token) {
      localStorage.setItem("ud-chaos-token", d.token);
      return d.token as string;
    }
    return null;
  } catch {
    return null;
  }
}

async function getOrFetchToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const existing = localStorage.getItem("ud-chaos-token");
  if (existing) return existing;

  // Token not yet present (race condition: unlockGodMode's async fetch
  // hasn't completed). Fetch it on-demand. Use a module-level promise so
  // concurrent requests share the same fetch.
  if (!tokenFetchPromise) {
    tokenFetchPromise = fetchToken().finally(() => {
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
    if (res.status === 403 && token) {
      // The cached token is likely expired (server-side 24h TTL passed).
      // Clear it and fetch a fresh one, then retry.
      localStorage.removeItem("ud-chaos-token");
      token = await getOrFetchToken();
      if (token) {
        res = await fetch(url, { ...options, headers: buildHeaders(token) });
      }
    }

    return res;
  };
  return { chaosFetch };
}
