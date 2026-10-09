"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

const DEFAULT_PALETTE = {
  "--ud-red": "#ff4d4d",
  "--ud-cyan": "#00e5ff",
  "--ud-lime": "#d4ff00",
  "--ud-magenta": "#ff00ff",
  "--ud-orange": "#ff8c00",
  "--ud-green": "#00ff00",
  "--ud-purple": "#8a2be2",
};

const CHAOS_POOL = [
  "#ff4d4d", "#00e5ff", "#d4ff00", "#ff00ff", "#ff8c00",
  "#00ff00", "#8a2be2", "#ff006e", "#fb5607", "#ffbe0b",
  "#06ffa5", "#ff5400", "#ff0a54", "#ff477e", "#f15bb5",
];

// God mode expires after 10 minutes of inactivity.
// After expiry, user must re-enter the Konami code to access /chaosmode.
const GOD_MODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type ChaosContextValue = {
  chaos: boolean;
  godMode: boolean;
  naylaRevealed: boolean;
  toggle: () => void;
  reroll: () => void;
  unlockGodMode: () => void;
};

const ChaosContext = createContext<ChaosContextValue>({
  chaos: false,
  godMode: false,
  naylaRevealed: false,
  toggle: () => {},
  reroll: () => {},
  unlockGodMode: () => {},
});

export function useChaos() {
  return useContext(ChaosContext);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPalette(): Record<string, string> {
  const used = new Set<string>();
  const palette: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_PALETTE)) {
    let color = pickRandom(CHAOS_POOL);
    let tries = 0;
    while (used.has(color) && tries < 5) {
      color = pickRandom(CHAOS_POOL);
      tries++;
    }
    used.add(color);
    palette[key] = color;
  }
  return palette;
}

export function ChaosProvider({ children }: { children: ReactNode }) {
  // chaos (shuffle toggle) is SESSION-ONLY — no localStorage persistence.
  // Refresh → chaos = false (shuffle button OFF). User must click again.
  const [chaos, setChaos] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [palette, setPalette] = useState<Record<string, string>>(DEFAULT_PALETTE);
  // naylaRevealed is SESSION-ONLY with 5-min TTL.
  // When chaos is toggled ON → naylaRevealed = true + 5-min timer starts.
  // Nayla stays visible EVEN IF chaos is toggled OFF (within the 5-min window).
  // After 5 min → naylaRevealed = false → Nayla hidden.
  // Refresh → session cleared → naylaRevealed = false → Nayla hidden.
  const [naylaRevealed, setNaylaRevealed] = useState(false);

  // Tracks whether the "Secret member appeared!" notification has fired
  // in this session. Fires ONCE per session (first time Nayla appears).
  const hasNotifiedSecretRef = useRef(false);

  // 5-min TTL timer for naylaRevealed (session-only).
  const NAYLA_SESSION_MS = 5 * 60 * 1000;

  // Load persisted state — only god mode + palette (NOT chaos, NOT naylaRevealed).
  // chaos + naylaRevealed are session-only → refresh clears them.
  useEffect(() => {
    const savedGod = localStorage.getItem("ud-godmode");
    const godExpiresAt = Number(localStorage.getItem("ud-godmode-expires") || "0");
    Promise.resolve().then(() => {
      // Restore palette from localStorage (color scheme persists, toggle state doesn't)
      const savedPalette = localStorage.getItem("ud-chaos-palette");
      if (savedPalette) {
        try { setPalette(JSON.parse(savedPalette)); } catch { setPalette(randomPalette()); }
      }
      // Only restore god mode if NOT expired (10 min TTL)
      if (savedGod === "1" && godExpiresAt > Date.now()) {
        setGodMode(true);
      } else if (savedGod === "1" && godExpiresAt <= Date.now()) {
        // God mode expired — clear everything
        localStorage.removeItem("ud-godmode");
        localStorage.removeItem("ud-godmode-expires");
        localStorage.removeItem("ud-chaos-token");
      }
    });
  }, []);

  // Apply palette to :root when chaos is on
  useEffect(() => {
    const root = document.documentElement;
    if (chaos) {
      root.classList.add("chaos");
      for (const [k, v] of Object.entries(palette)) {
        root.style.setProperty(k, v);
      }
    } else {
      root.classList.remove("chaos");
      for (const k of Object.keys(DEFAULT_PALETTE)) {
        root.style.removeProperty(k);
      }
    }
  }, [chaos, palette]);

  // Refresh god mode expiry on any user activity (keyboard/mouse/touch)
  // so the 10 min timer resets while the user is actively using the site.
  useEffect(() => {
    if (!godMode) return;
    const refreshExpiry = () => {
      const expiresAt = Date.now() + GOD_MODE_TTL_MS;
      localStorage.setItem("ud-godmode-expires", String(expiresAt));
    };
    const events = ["keydown", "mousedown", "touchstart", "wheel"] as const;
    let throttle = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - throttle < 60000) return; // throttle: max 1 refresh per minute
      throttle = now;
      refreshExpiry();
    };
    for (const ev of events) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    // Also set a timer to auto-clear when expired
    const expiryTimer = setInterval(() => {
      const expiresAt = Number(localStorage.getItem("ud-godmode-expires") || "0");
      if (expiresAt <= Date.now()) {
        localStorage.removeItem("ud-godmode");
        localStorage.removeItem("ud-godmode-expires");
        localStorage.removeItem("ud-chaos-token");
        localStorage.removeItem("ud-chaos");
        localStorage.removeItem("ud-chaos-palette");
        setChaos(false);
        setGodMode(false);
      }
    }, 30000); // check every 30 seconds

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, onActivity);
      }
      clearInterval(expiryTimer);
    };
  }, [godMode]);

  const reroll = useCallback(() => {
    const p = randomPalette();
    setPalette(p);
    localStorage.setItem("ud-chaos-palette", JSON.stringify(p));
  }, []);

  // Ref to hold the 5-min Nayla session timer (so we can clear + restart on re-toggle)
  const naylaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = useCallback(() => {
    setChaos((prev) => {
      const next = !prev;
      // chaos is session-only — NO localStorage persistence.
      // Refresh → chaos = false (user must click shuffle again).
      if (next && Object.keys(palette).every((k) => palette[k] === DEFAULT_PALETTE[k as keyof typeof DEFAULT_PALETTE])) {
        const p = randomPalette();
        setPalette(p);
        localStorage.setItem("ud-chaos-palette", JSON.stringify(p));
      }
      // When chaos is toggled ON, reveal Nayla + start 5-min session timer.
      // Nayla stays visible EVEN IF chaos is toggled OFF (within 5-min window).
      // Session-only — refresh clears it.
      if (next) {
        setNaylaRevealed(true);
        // (Re)start the 5-min timer — clears any existing timer first
        if (naylaTimerRef.current) {
          clearTimeout(naylaTimerRef.current);
        }
        naylaTimerRef.current = setTimeout(() => {
          setNaylaRevealed(false);
          naylaTimerRef.current = null;
        }, NAYLA_SESSION_MS);
      }
      // When chaos is toggled OFF, do NOT clear naylaRevealed — let the
      // 5-min timer expire naturally (so Nayla stays visible per user request)
      return next;
    });
  }, [palette, NAYLA_SESSION_MS]);

  // Clean up the timer on unmount
  useEffect(() => {
    return () => {
      if (naylaTimerRef.current) {
        clearTimeout(naylaTimerRef.current);
      }
    };
  }, []);

  // Fire the 'secret member' notification ONCE per session when Nayla first
  // appears (when shuffle is toggled ON → naylaRevealed goes true).
  // Uses useEffect (not inside the state updater) because React 18+
  // state updaters should be pure — no side effects like dispatchEvent.
  useEffect(() => {
    if (naylaRevealed && !hasNotifiedSecretRef.current) {
      hasNotifiedSecretRef.current = true;
      window.dispatchEvent(new CustomEvent("ud-notify-secret", {
        detail: { message: "Secret member appeared! Naye telah muncul." },
      }));
    }
  }, [naylaRevealed]);

  const unlockGodMode = useCallback(() => {
    setGodMode(true);
    localStorage.setItem("ud-godmode", "1");
    // Set expiry timestamp — 10 min from now
    const expiresAt = Date.now() + GOD_MODE_TTL_MS;
    localStorage.setItem("ud-godmode-expires", String(expiresAt));
    // Fetch chaos-mode token from server — REQUIRED for CRUD operations
    fetch("/api/chaos-token")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.token) {
          localStorage.setItem("ud-chaos-token", d.token);
        }
      })
      .catch(() => {
        // Non-blocking — token fetch failure means CRUD won't work
      });
  }, []);

  return (
    <ChaosContext.Provider value={{ chaos, godMode, naylaRevealed, toggle, reroll, unlockGodMode }}>
      {children}
    </ChaosContext.Provider>
  );
}
