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
   * Default: false (was true — caused too many DB pings on mobile). */
  refetchOnFocus?: boolean;
  /** Polling interval in ms. 0 = no polling. Default: 0. */
  refetchInterval?: number;
  /** Max age (ms) a cached response is considered fresh. Default: 30_000 (30s).
   * Within this window, no refetch happens on mount/focus — instant data.
   * Outside it, SWR: show stale cache immediately, refetch in background.
   * Reduced from 60s → 30s so stale data ages faster (less waiting for fresh). */
  maxAge?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Cache layer: in-memory Map + localStorage persistence + cross-tab sync.
// ─────────────────────────────────────────────────────────────────────────────

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  promise: Promise<T> | null; // in-flight dedup (not persisted)
};

const responseCache = new Map<string, CacheEntry<unknown>>();
const dataListeners = new Map<string, Set<() => void>>(); // url → on-data-changed
const invalidateListeners = new Map<string, Set<() => void>>(); // url → on-invalidate

const STORAGE_PREFIX = "ud-fetch:";
const isBrowser = typeof window !== "undefined";
const hasLocalStorage = isBrowser && typeof localStorage !== "undefined";
const hasBroadcastChannel = isBrowser && typeof BroadcastChannel !== "undefined";

// Single BroadcastChannel for cross-tab cache events.
// Messages: { type: "invalidate" | "update", url }
let broadcastChannel: BroadcastChannel | null = null;
if (hasBroadcastChannel) {
  try {
    broadcastChannel = new BroadcastChannel("ud-fetch-cache");
    broadcastChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || typeof msg.url !== "string") return;
      if (msg.type === "invalidate") {
        // Other tab invalidated this URL → mark stale + notify mounted hooks
        const entry = responseCache.get(msg.url);
        if (entry) entry.timestamp = 0;
        // Also invalidate prefix matches (e.g., /api/achievements?memberId=xxx)
        for (const key of responseCache.keys()) {
          if (key.startsWith(msg.url)) {
            const e = responseCache.get(key);
            if (e) e.timestamp = 0;
          }
        }
        invalidateListeners.get(msg.url)?.forEach((fn) => fn());
      } else if (msg.type === "update") {
        // Other tab fetched fresh data → load from localStorage + notify
        const stored = loadFromStorage(msg.url);
        if (stored) {
          const existing = responseCache.get(msg.url);
          responseCache.set(msg.url, {
            data: stored.data,
            timestamp: stored.timestamp,
            promise: existing?.promise ?? null,
          });
          dataListeners.get(msg.url)?.forEach((fn) => fn());
        }
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

function loadFromStorage(url: string): { data: unknown; timestamp: number } | undefined {
  if (!hasLocalStorage) return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + url);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (typeof parsed.timestamp !== "number") return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function saveToStorage(url: string, data: unknown, timestamp: number) {
  if (!hasLocalStorage) return;
  try {
    localStorage.setItem(STORAGE_PREFIX + url, JSON.stringify({ data, timestamp }));
  } catch {
    // localStorage full or blocked — silently skip (in-memory cache still works)
  }
}

function notifyDataListeners(url: string) {
  dataListeners.get(url)?.forEach((fn) => fn());
}

function notifyInvalidateListeners(url: string) {
  invalidateListeners.get(url)?.forEach((fn) => fn());
  // Also notify prefix-matched listeners (e.g., /api/achievements?memberId=xxx
  // should fire when /api/achievements is invalidated)
  for (const [key, set] of invalidateListeners.entries()) {
    if (key.startsWith(url) && key !== url) {
      set.forEach((fn) => fn());
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lightweight data fetching hook with:
 * - In-memory + localStorage cache (survives page refresh + browser restart)
 * - Cross-tab sync via BroadcastChannel (admin edits propagate to other tabs)
 * - In-flight dedup (2 components same URL → 1 fetch via shared promise)
 * - Stale-While-Revalidate (fresh < 30s → no fetch; stale → SWR)
 * - On error: KEEPS previous data (no "data disappears" bug)
 * - On 503: silent, keeps old data + popup
 * - `refetch()` ALWAYS triggers a real fetch (bypasses cache freshness)
 */
export function useFetch<T>(url: string, opts?: FetchOpts): State<T> {
  // Hydrate initial state from cache (memory first, then localStorage)
  const [data, setData] = useState<T | null>(() => {
    const cached = responseCache.get(url) as CacheEntry<T> | undefined;
    if (cached) return cached.data;
    const stored = loadFromStorage(url);
    if (stored) {
      // Promote to in-memory cache for future reads
      responseCache.set(url, { data: stored.data, timestamp: stored.timestamp, promise: null });
      return stored.data as T;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const cached = responseCache.get(url) as CacheEntry<T> | undefined;
    if (!cached) return true;
    const maxAge = opts?.maxAge ?? 30_000;
    return Date.now() - cached.timestamp > maxAge;
  });
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  // forceRef: when true, doFetch bypasses cache freshness check (always fetches).
  // Set to true by refetch() so mutations always trigger a real fetch.
  const forceRef = useRef(false);
  const mountedRef = useRef(true);
  const dataRef = useRef<T | null>(null);

  const enabled = opts?.enabled ?? true;
  const refetchOnFocus = opts?.refetchOnFocus ?? false;
  const refetchInterval = opts?.refetchInterval ?? 0;
  const maxAge = opts?.maxAge ?? 30_000;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // refetch: mark cache stale + bump tick + set force flag.
  // The force flag ensures doFetch ACTUALLY fetches (was previously a no-op
  // when cache was still "fresh" — major bug).
  const refetch = useCallback(() => {
    forceRef.current = true;
    const cached = responseCache.get(url);
    if (cached) cached.timestamp = 0;
    setTick((t) => t + 1);
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Subscribe to data updates + invalidations from other components/tabs
  useEffect(() => {
    if (!enabled || !url) return;
    const onDataUpdate = () => {
      const cached = responseCache.get(url) as CacheEntry<T> | undefined;
      if (cached && mountedRef.current) {
        dataRef.current = cached.data;
        setData(cached.data);
        setError(null);
        setLoading(false);
      }
    };
    const onInvalidate = () => {
      if (mountedRef.current) {
        // Cache was invalidated — force refetch
        forceRef.current = true;
        setTick((t) => t + 1);
      }
    };
    const dset = dataListeners.get(url) ?? new Set();
    dset.add(onDataUpdate);
    dataListeners.set(url, dset);
    const iset = invalidateListeners.get(url) ?? new Set();
    iset.add(onInvalidate);
    invalidateListeners.set(url, iset);
    return () => {
      dset.delete(onDataUpdate);
      if (dset.size === 0) dataListeners.delete(url);
      iset.delete(onInvalidate);
      if (iset.size === 0) invalidateListeners.delete(url);
    };
  }, [url, enabled]);

  // Main fetch effect (SWR pattern + force flag)
  useEffect(() => {
    if (!enabled || !url) return;
    const ac = new AbortController();
    const force = forceRef.current;
    forceRef.current = false; // consume the flag

    const doFetch = async () => {
      const cached = responseCache.get(url) as CacheEntry<T> | undefined;
      const now = Date.now();

      // Cache freshness check (skipped if force=true)
      if (!force && cached) {
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
      } else if (cached) {
        // Force refetch — show cached data immediately, fetch in BG
        if (mountedRef.current) {
          dataRef.current = cached.data;
          setData(cached.data);
          // Keep loading=false so user sees data immediately (SWR-style)
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
        } catch {
          if (mountedRef.current) setLoading(false);
        }
        return;
      }

      const fetchPromise = (async () => {
        try {
          const res = await fetch(url, {
            signal: ac.signal,
            cache: "default",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            if (res.status === 503) {
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
          // Update in-memory cache
          responseCache.set(url, {
            data: d as unknown,
            timestamp: Date.now(),
            promise: null,
          });
          // Persist to localStorage (survives page refresh)
          saveToStorage(url, d, Date.now());
          // Notify other components + tabs
          notifyDataListeners(url);
          if (broadcastChannel) {
            broadcastChannel.postMessage({ type: "update", url });
          }
          return d;
        } catch (e) {
          const c = responseCache.get(url);
          if (c) c.promise = null;
          throw e;
        }
      })();

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
        if (e instanceof Error && e.message === "503") return;
        if (mountedRef.current) {
          if (dataRef.current) setData(dataRef.current);
          setError(e instanceof Error ? e.message : "fetch failed");
          setLoading(false);
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

  // Refetch on window focus (OFF by default)
  useEffect(() => {
    if (!enabled || !refetchOnFocus) return;
    let lastFocus = Date.now();
    const jitteredRefetch = () => {
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
 * Invalidate cache for a URL (and all URLs with this prefix — e.g.,
 * invalidating "/api/achievements" also invalidates "/api/achievements?memberId=aldi").
 * Marks as stale → next read triggers SWR refetch. Also propagates to other tabs.
 */
export function invalidateFetchCache(url: string) {
  // Invalidate exact + prefix matches in this tab
  for (const key of responseCache.keys()) {
    if (key === url || key.startsWith(url)) {
      const entry = responseCache.get(key);
      if (entry) entry.timestamp = 0;
    }
  }
  notifyInvalidateListeners(url);
  // Broadcast to other tabs
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "invalidate", url });
  }
}

/**
 * Imperatively write to cache (e.g., after a mutation, optimistic update).
 */
export function setFetchCache<T>(url: string, data: T) {
  const ts = Date.now();
  responseCache.set(url, { data: data as unknown, timestamp: ts, promise: null });
  saveToStorage(url, data, ts);
  notifyDataListeners(url);
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "update", url });
  }
}
