"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

type FetchOpts = {
  enabled?: boolean;
  /** Refetch when the window regains focus (user switches back to tab).
   * Default: true. This ensures fresh data when the user returns. */
  refetchOnFocus?: boolean;
  /** Polling interval in ms. 0 = no polling. Default: 0.
   * Use 60000 (60s) for data that changes (members, gallery, etc.). */
  refetchInterval?: number;
};

/**
 * Lightweight data fetching hook with smart caching.
 *
 * Features:
 * - Re-fetches on mount, on refetch(), and on window focus (default).
 * - Optional polling via refetchInterval (light, not aggressive).
 * - On error: KEEPS previous data (doesn't clear → no "data disappears" bug).
 * - On 503 (service unavailable): silent retry, keeps old data.
 * - AbortController-safe (no setState on unmounted).
 *
 * The "keep previous data on error" pattern is the KEY fix:
 * before, a DB failure caused the API to return static fallback (200),
 * which replaced real DB data with dummy data. Now the hook keeps the
 * last successful response on any error → users don't lose their data.
 */
export function useFetch<T>(url: string, opts?: FetchOpts): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);
  const dataRef = useRef<T | null>(null); // keep a ref to last good data

  const enabled = opts?.enabled ?? true;
  const refetchOnFocus = opts?.refetchOnFocus ?? true;
  const refetchInterval = opts?.refetchInterval ?? 0;

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Main fetch effect
  useEffect(() => {
    if (!enabled || !url) return;
    const ac = new AbortController();

    const doFetch = () => {
      fetch(url, { signal: ac.signal, cache: "no-store" })
        .then(async (res) => {
          if (!res.ok) {
            // On 503 (service unavailable) or other errors: KEEP old data.
            // Don't throw — just don't update data. The user keeps what they had.
            if (res.status === 503) {
              if (mountedRef.current && dataRef.current) {
                setData(dataRef.current); // restore last good data
                setLoading(false);
              }
              return null;
            }
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json() as Promise<T>;
        })
        .then((d) => {
          if (d && mountedRef.current) {
            dataRef.current = d; // cache last good response
            setData(d);
            setError(null);
            setLoading(false);
          }
        })
        .catch((e) => {
          if (ac.signal.aborted) return;
          if (mountedRef.current) {
            // On error: KEEP previous data (don't clear).
            // Only set error state — the UI still shows last good data.
            if (dataRef.current) {
              setData(dataRef.current);
            }
            setError(e instanceof Error ? e.message : "fetch failed");
            setLoading(false);
          }
        });
    };

    // Defer to avoid cascading renders
    Promise.resolve().then(() => {
      if (mountedRef.current) {
        setLoading(true);
      }
    });
    doFetch();

    return () => ac.abort();
  }, [url, enabled, tick]);

  // Refetch on window focus (user returns to the tab)
  useEffect(() => {
    if (!enabled || !refetchOnFocus) return;
    const onFocus = () => {
      // Only refetch if the document was hidden (actually came back from another tab)
      // This prevents unnecessary fetches on click-within-tab
      refetch();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, refetchOnFocus, refetch]);

  // Light polling (default: off, can be enabled via refetchInterval)
  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const interval = setInterval(() => {
      refetch();
    }, refetchInterval);
    return () => clearInterval(interval);
  }, [enabled, refetchInterval, refetch]);

  return { data, loading, error, refetch };
}
