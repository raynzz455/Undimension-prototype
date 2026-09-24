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
   * Default: false (was true — caused too many DB pings on mobile).
   * Enable per-hook only for data that REALLY needs to be fresh (guestbook, news). */
  refetchOnFocus?: boolean;
  /** Polling interval in ms. 0 = no polling. Default: 0. */
  refetchInterval?: number;
  /** Max age (ms) a cached response is considered fresh. Default: 60_000 (60s).
   * Within this window, no refetch happens on mount/focus — instant data.
   * Outside it, SWR: show stale cache immediately, refetch in background. */
  maxAge?: number;
  /** Dedup window (ms). Multiple useFetch(url) within this window share 1 fetch.
   * Default: 2_000 (2s) — handles React strict-mode double-mount + parallel
   * components using same URL. */
  dedupWindow?: number;
};

/**
 * In-memory response cache + in-flight request dedup.
 *
 * Keyed by URL. Survives across hook instances (module-level Map) so:
 * - Two components using useFetch("/api/members") share 1 fetch + 1 cache entry
 * - Page navigation (tab switch) shows cached data instantly, refetches in BG
 * - Cache has TTL (default 60s) — after that, SWR refetch on next access
 *
 * This is a poor-man's React Query. For a 7-member profile site, this is enough.
 */
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  promise: Promise<T> | null; // in-flight dedup
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<() => void>>(); // url → subscribers (for cross-component refetch)

function notifyListeners(url: string) {
  listeners.get(url)?.forEach((fn) => fn());
}

/**
 * Lightweight data fetching hook with smart caching + dedup + SWR.
 *
 * Features:
 * - In-memory response cache (module-level Map, survives unmount/remount)
 * - In-flight dedup: 2 components using same URL → 1 fetch (shared promise)
 * - Stale-While-Revalidate: show cached data instantly, refetch in background
 * - On error: KEEPS previous data (no "data disappears" bug)
 * - On 503: silent retry, keeps old data + popup
 * - On mount: if cache fresh (< maxAge) → no fetch (instant). If stale → SWR.
 * - refetchOnFocus default: false (was true — caused mobile refresh issues)
 *
 * The "keep previous data on error" pattern is the KEY fix:
 * a DB failure no longer causes data to disappear.
 */
export function useFetch<T>(url: string, opts?: FetchOpts): State<T> {
  const [data, setData] = useState<T | null>(() => {
    // Hydrate from cache instantly on first render — no loading flash.
    const cached = responseCache.get(url) as CacheEntry<T> | undefined;
    return cached?.data ?? null;
  });
  const [loading, setLoading] = useState(() => {
    const cached = responseCache.get(url) as CacheEntry<T> | undefined;
    if (!cached) return true;
    // If cache is fresh, don't even show loading.
    const maxAge = opts?.maxAge ?? 60_000;
    return Date.now() - cached.timestamp > maxAge;
  });
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mountedRef = useRef(true);
  const dataRef = useRef<T | null>(null); // keep a ref to last good data

  const enabled = opts?.enabled ?? true;
  const refetchOnFocus = opts?.refetchOnFocus ?? false;
  const refetchInterval = opts?.refetchInterval ?? 0;
  const maxAge = opts?.maxAge ?? 60_000;
  const dedupWindow = opts?.dedupWindow ?? 2_000;

  // Sync dataRef with data state
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Subscribe to cache updates from other components (cross-component refetch)
  useEffect(() => {
    if (!enabled || !url) return;
    const onUpdate = () => {
      const cached = responseCache.get(url) as CacheEntry<T> | undefined;
      if (cached && mountedRef.current) {
        dataRef.current = cached.data;
        setData(cached.data);
        setError(null);
        setLoading(false);
      }
    };
    const set = listeners.get(url) ?? new Set();
    set.add(onUpdate);
    listeners.set(url, set);
    return () => {
      set.delete(onUpdate);
      if (set.size === 0) listeners.delete(url);
    };
  }, [url, enabled]);

  // Main fetch effect (SWR pattern)
  useEffect(() => {
    if (!enabled || !url) return;
    const ac = new AbortController();

    const doFetch = async () => {
      // Check cache freshness first
      const cached = responseCache.get(url) as CacheEntry<T> | undefined;
      const now = Date.now();

      if (cached) {
        const age = now - cached.timestamp;
        if (age < maxAge) {
          // Fresh — show + done (no fetch)
          if (mountedRef.current) {
            dataRef.current = cached.data;
            setData(cached.data);
            setError(null);
            setLoading(false);
          }
          return;
        }
        // Stale — show immediately, refetch in background (SWR)
        if (mountedRef.current) {
          dataRef.current = cached.data;
          setData(cached.data);
          setLoading(false);
        }
      } else {
        // No cache — show loading
        Promise.resolve().then(() => {
          if (mountedRef.current) setLoading(true);
        });
      }

      // Check for in-flight dedup
      if (cached?.promise) {
        try {
          const d = (await cached.promise) as T;
          if (mountedRef.current) {
            dataRef.current = d;
            setData(d);
            setError(null);
            setLoading(false);
          }
        } catch (e) {
          // In-flight failed — keep showing whatever we have
          if (mountedRef.current) setLoading(false);
        }
        return;
      }

      // Make the fetch + register in-flight promise for dedup
      const fetchPromise = (async () => {
        try {
          const res = await fetch(url, {
            signal: ac.signal,
            // Let HTTP cache assist (browser + edge). We add Cache-Control
            // headers server-side too. This used to be "no-store" which
            // bypassed ALL caching → every page reload hit the DB.
            cache: "default",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            if (res.status === 503) {
              // Server busy — keep old data + popup
              if (mountedRef.current && dataRef.current) {
                setData(dataRef.current);
                setLoading(false);
              }
              window.dispatchEvent(new CustomEvent("ud-notify-error", {
                detail: { message: "Server sedang sibuk. Menampilkan data terakhir yang berhasil dimuat." },
              }));
              throw new Error("503");
            }
            throw new Error(`HTTP ${res.status}`);
          }
          const d = (await res.json()) as T;
          // Update cache
          responseCache.set(url, {
            data: d as unknown,
            timestamp: Date.now(),
            promise: null,
          });
          // Notify other components subscribed to this URL
          notifyListeners(url);
          return d;
        } catch (e) {
          // Clear in-flight promise (allow retry next time)
          const c = responseCache.get(url);
          if (c) c.promise = null;
          throw e;
        }
      })();

      // Register in-flight promise for dedup
      const c = responseCache.get(url) ?? { data: null, timestamp: 0, promise: null };
      c.promise = fetchPromise as Promise<unknown>;
      responseCache.set(url, c);

      try {
        const d = await fetchPromise;
        if (mountedRef.current) {
          dataRef.current = d;
          setData(d);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (ac.signal.aborted) return;
        if (e instanceof Error && e.message === "503") return; // already handled above
        if (mountedRef.current) {
          // Network error — keep previous data (don't clear)
          if (dataRef.current) setData(dataRef.current);
          setError(e instanceof Error ? e.message : "fetch failed");
          setLoading(false);
          // Only show popup if user has no data at all
          if (!dataRef.current) {
            window.dispatchEvent(new CustomEvent("ud-notify-error", {
              detail: { message: "Internetmu sedang lambat. Beberapa data mungkin belum terbaru." },
            }));
          }
        }
      }
    };

    doFetch();

    return () => ac.abort();
  }, [url, enabled, tick, maxAge]);

  // Refetch on window focus (OFF by default now — was causing mobile issues)
  useEffect(() => {
    if (!enabled || !refetchOnFocus) return;
    let lastFocus = Date.now();
    const jitteredRefetch = () => {
      // Throttle: ignore focus events < 5s apart (mobile users tap a lot)
      const now = Date.now();
      if (now - lastFocus < 5000) return;
      lastFocus = now;
      const delay = Math.floor(Math.random() * 300);
      setTimeout(() => refetch(), delay);
    };
    const onFocus = () => jitteredRefetch();
    const onVisibility = () => {
      if (document.visibilityState === "visible") jitteredRefetch();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, refetchOnFocus, refetch]);

  // Light polling (default: off)
  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const interval = setInterval(() => {
      refetch();
    }, refetchInterval);
    return () => clearInterval(interval);
  }, [enabled, refetchInterval, refetch]);

  return { data, loading, error, refetch };
}

/**
 * Imperatively invalidate cache entries (e.g., after a mutation succeeds).
 * Call invalidate("/api/members") after a member update to force next read to refetch.
 */
export function invalidateFetchCache(url: string) {
  const entry = responseCache.get(url);
  if (entry) {
    entry.timestamp = 0; // mark as stale → next read triggers SWR
    notifyListeners(url);
  }
}

/**
 * Imperatively write to cache (e.g., after a mutation, optimistic update).
 */
export function setFetchCache<T>(url: string, data: T) {
  responseCache.set(url, { data: data as unknown, timestamp: Date.now(), promise: null });
  notifyListeners(url);
}
