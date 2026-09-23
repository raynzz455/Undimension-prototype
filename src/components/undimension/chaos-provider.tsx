"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
  const [chaos, setChaos] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [palette, setPalette] = useState<Record<string, string>>(DEFAULT_PALETTE);
  // Session-only flag — NOT persisted to localStorage. Set when the user
  // clicks the navbar shuffle (chaos toggle) ON. Stays true even when chaos
  // is toggled OFF. Resets to false on page refresh.
  // Used to show hidden members (like Nayla) — the condition is ONLY the
  // shuffle toggle, NOT the Konami code (godMode).
  const [naylaRevealed, setNaylaRevealed] = useState(false);

  // Load persisted state — check if god mode expired
  useEffect(() => {
    const saved = localStorage.getItem("ud-chaos");
    const savedGod = localStorage.getItem("ud-godmode");
    const godExpiresAt = Number(localStorage.getItem("ud-godmode-expires") || "0");
    Promise.resolve().then(() => {
      if (saved === "1") {
        const savedPalette = localStorage.getItem("ud-chaos-palette");
        let p: Record<string, string> | null = null;
        if (savedPalette) {
          try { p = JSON.parse(savedPalette); } catch { p = randomPalette(); }
        } else { p = randomPalette(); }
        setPalette(p);
        setChaos(true);
      }
      // Only restore god mode if NOT expired (10 min TTL)
      if (savedGod === "1" && godExpiresAt > Date.now()) {
        setGodMode(true);
      } else if (savedGod === "1" && godExpiresAt <= Date.now()) {
        // God mode expired — clear everything
        localStorage.removeItem("ud-godmode");
        localStorage.removeItem("ud-godmode-expires");
        localStorage.removeItem("ud-chaos-token");
        localStorage.removeItem("ud-chaos");
        localStorage.removeItem("ud-chaos-palette");
        setChaos(false);
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

  const toggle = useCallback(() => {
    setChaos((prev) => {
      const next = !prev;
      localStorage.setItem("ud-chaos", next ? "1" : "0");
      if (next && Object.keys(palette).every((k) => palette[k] === DEFAULT_PALETTE[k as keyof typeof DEFAULT_PALETTE])) {
        const p = randomPalette();
        setPalette(p);
        localStorage.setItem("ud-chaos-palette", JSON.stringify(p));
      }
      // When chaos is toggled ON, reveal hidden members (like Nayla).
      // This flag is session-only (not persisted) — stays true even when
      // chaos is toggled OFF. Resets on page refresh.
      if (next) setNaylaRevealed(true);
      return next;
    });
  }, [palette]);

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
