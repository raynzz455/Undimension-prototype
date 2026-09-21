"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { NavBar, type Page } from "@/components/undimension/nav-bar";
import { AboutPage } from "@/components/undimension/about-page";
import { MemoriesPage } from "@/components/undimension/memories-page";
import { GamesPage } from "@/components/undimension/games-page";
import { PortfolioPage } from "@/components/undimension/portfolio-page";
import { ChaosModePage } from "@/components/undimension/chaos-mode-page";
import { ScrollProgress } from "@/components/undimension/scroll-progress";
import { BackToTop } from "@/components/undimension/back-to-top";
import { KeyboardShortcutsOverlay } from "@/components/undimension/keyboard-shortcuts-overlay";
import { Soundboard } from "@/components/undimension/soundboard";
import { BackgroundMusic } from "@/components/undimension/background-music";
import { StarGraphic } from "@/components/undimension/primitives";
import { useSfx, useKonamiCode } from "@/hooks/use-sfx";
import { useChaos } from "@/components/undimension/chaos-provider";
import { Volume2, VolumeX, Ghost, Lock, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-load the OpeningScreen — it imports Three.js (600KB) + the WebGL
// blackhole shader. When the session cookie skips the opening page, this
// chunk is NEVER loaded → massive LCP + bundle-size improvement.
// ssr: false because Three.js requires the browser (window/canvas).
const OpeningScreen = dynamic(
  () => import("@/components/undimension/opening-screen").then((m) => m.OpeningScreen),
  { ssr: false, loading: () => <div className="min-h-screen bg-[#09090b]" /> },
);

const FOOTER_STATS = [
  { label: "MEMBERS", value: "07" },
  { label: "ESTABLISHED", value: "2020" },
  { label: "GAMES", value: "04" },
  { label: "PROJECTS", value: "09" },
];

const FOOTER_LINKS = [
  { label: "ABOUT", page: "about" as const },
  { label: "GALLERY", page: "memories" as const },
  { label: "GAMES", page: "games" as const },
  { label: "PORTFOLIO", page: "portfolio" as const },
];

function KonamiOverlay({ show, godUnlocked }: { show: boolean; godUnlocked?: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div className="bg-[#ff00ff] text-white font-bebas text-6xl md:text-9xl px-12 py-8 border-8 border-black dark:border-white shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#d4ff00] rotate-3 animate-pulse text-center">
        ↑↓←→←←↑
        <p className="font-mono-ud text-base mt-2">
          {godUnlocked
            ? "// GOD MODE UNLOCKED — CHAOS MODE BUTTON APPEARED //"
            : "// CHAOS MODE UNLOCKED //"}
        </p>
        {godUnlocked && (
          <p className="font-mono-ud text-xs mt-1 text-[#d4ff00]">
            ▸ Look for the CHAOS MODE button top-right
          </p>
        )}
      </div>
    </div>
  );
}

function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="fixed bottom-6 left-6 z-[55] w-12 h-12 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black border-4 border-white dark:border-black shadow-[6px_6px_0_#ff4d4d] dark:shadow-[6px_6px_0_#ff00ff] hover:-translate-y-1 transition-transform no-color-transition"
      aria-label={enabled ? "Mute sound effects" : "Enable sound effects"}
      title={enabled ? "SFX: ON" : "SFX: OFF"}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </button>
  );
}

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer className="bg-black text-white dark:bg-[#d4ff00] dark:text-black border-t-8 border-white dark:border-black mt-auto">
      {/* Top: marquee tagline */}
      <div className="border-b-4 border-white dark:border-black py-3 overflow-hidden">
        <div className="animate-marquee font-bebas text-3xl tracking-widest uppercase whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="px-4">
              ONE ORBIT · ONE GRAVITY · NO LIMITS · UNDIMENSION ·
            </span>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <StarGraphic className="w-10 h-10 text-[#d4ff00] dark:text-black animate-spin-slow" />
              <h3 className="font-bebas text-5xl tracking-widest">UNDIMENSION</h3>
            </div>
            <p className="font-mono-ud text-sm text-white/70 dark:text-black/70 max-w-md leading-relaxed">
              Sebuah circle teman lama yang tak terikat ruang maupun waktu.
              Datang dari mimpi yang berbeda, namun melangkah di orbit yang sama.
            </p>
            <div className="mt-4 inline-block bg-[#ff4d4d] text-white font-mono-ud text-xs px-3 py-1 border-2 border-white dark:border-black -rotate-1">
              EST. 2020 · COLLECTIVE OF 7
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-bebas text-2xl mb-3 border-b-4 border-white dark:border-black pb-2">
              NAVIGATE
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => setPage(link.page)}
                    className="font-mono-ud text-sm hover:text-[#00e5ff] dark:hover:text-black hover:translate-x-1 transition-all inline-block"
                  >
                    → {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div>
            <h4 className="font-bebas text-2xl mb-3 border-b-4 border-white dark:border-black pb-2">
              METRICS
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {FOOTER_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="border-2 border-white dark:border-black p-2 bg-white/5 dark:bg-black/5"
                >
                  <div className="font-bebas text-3xl leading-none text-[#d4ff00] dark:text-black">
                    {stat.value}
                  </div>
                  <div className="font-mono-ud text-[10px] text-white/60 dark:text-black/60 tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t-4 border-white dark:border-black flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-bebas text-2xl tracking-widest">
            UNDIMENSION © 2020–2026
          </p>
          <p className="font-mono-ud text-xs tracking-[0.2em] uppercase opacity-70 flex items-center gap-2">
            <Ghost className="w-4 h-4" />
            Built with chaos · Powered by bonds
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [hasEntered, setHasEntered] = useState(false);
  const [checking, setChecking] = useState(true); // avoid hydration mismatch
  const [page, setPage] = useState<Page>("about");
  const [soundOn, setSoundOn] = useState(true);
  const [konami, setKonami] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [soundboardOpen, setSoundboardOpen] = useState(false);

  const { play, ensureCtx } = useSfx(soundOn);
  const { chaos, godMode, unlockGodMode } = useChaos();

  // ── Opening page session cookie ──
  // When the user clicks ENTER, we set a cookie so that a quick refresh
  // (within OPENING_SESSION_TTL_MS) skips the opening page and goes
  // directly to the main app. After the TTL expires, the opening page
  // shows again (fresh visit).
  //
  // The `checking` state prevents hydration mismatch: the initial server
  // render shows the opening page (hasEntered=false). On the client, after
  // mount, we check the cookie — if recent, we set hasEntered=true. A brief
  // dark screen (matching the opening page bg) shows during this check to
  // avoid a flash of the opening page before skipping.
  const OPENING_COOKIE = "ud-opening-seen";
  const OPENING_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    // Defer setState to avoid cascading renders (react-hooks rule).
    Promise.resolve().then(() => {
      try {
        const match = document.cookie.match(new RegExp(`${OPENING_COOKIE}=(\\d+)`));
        if (match) {
          const ts = parseInt(match[1], 10);
          if (Number.isFinite(ts) && Date.now() - ts < OPENING_SESSION_TTL_MS) {
            setHasEntered(true); // skip opening page — user has seen it recently
          }
        }
      } catch {
        // cookie parse failed — show opening page (safe default)
      }
      setChecking(false);
    });
  }, [OPENING_COOKIE, OPENING_SESSION_TTL_MS]);

  useKonamiCode(() => {
    setKonami(true);
    play("submit");
    // If chaos mode is ON when konami is entered, unlock god mode
    if (chaos && !godMode) {
      unlockGodMode();
    }
    setTimeout(() => setKonami(false), 3500);
  });

  // Keyboard navigation: ? = shortcuts, G/S/A = gallery/games/about
  useEffect(() => {
    if (!hasEntered) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      } else if (e.key === "g" || e.key === "G") {
        setPage("memories");
        play("click");
      } else if (e.key === "s" || e.key === "S") {
        setPage("games");
        play("click");
      } else if (e.key === "p" || e.key === "P") {
        setPage("portfolio");
        play("click");
      } else if (e.key === "b" || e.key === "B") {
        if (!shortcutsOpen) {
          setSoundboardOpen((o) => !o);
          play("click");
        }
      } else if (e.key === "a" || e.key === "A") {
        setPage("about");
        play("click");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasEntered, play]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page, hasEntered]);

  const handleEnter = () => {
    ensureCtx();
    play("submit");
    // Set the session cookie — quick refresh within 30 min will skip the opening page
    const maxAge = Math.floor(OPENING_SESSION_TTL_MS / 1000);
    document.cookie = `${OPENING_COOKIE}=${Date.now()};path=/;max-age=${maxAge};SameSite=Lax`;
    setHasEntered(true);
  };

  // Brief dark screen while checking the cookie (avoids hydration mismatch +
  // prevents a flash of the opening page before skipping it)
  if (checking) {
    return <div className="min-h-screen bg-[#09090b]" aria-hidden />;
  }

  if (!hasEntered) {
    return <OpeningScreen onEnter={handleEnter} />;
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#ff4d4d] selection:text-white relative">
      {/* Film grain overlay — subtle texture across the whole app */}
      <div className="ud-grain" aria-hidden />
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[#d4ff00] focus:text-black focus:font-bebas focus:text-2xl focus:px-4 focus:py-2 focus:border-4 focus:border-black"
      >
        SKIP TO CONTENT →
      </a>
      {/* Hide NavBar, ScrollProgress, Footer, and floating buttons when in chaos mode */}
      {page !== "chaosmode" && <ScrollProgress />}
      {page !== "chaosmode" && <NavBar current={page} setPage={setPage} />}
      <main id="main" className="flex-1 relative z-10">
        {page === "about" && <AboutPage />}
        {page === "memories" && <MemoriesPage />}
        {page === "games" && <GamesPage />}
        {page === "portfolio" && <PortfolioPage />}
        {page === "chaosmode" && godMode && <ChaosModePage onExit={() => setPage("about")} />}
      </main>
      {page !== "chaosmode" && <Footer setPage={setPage} />}
      {page !== "chaosmode" && (
        <SoundToggle
          enabled={soundOn}
          onToggle={() => {
            setSoundOn((s) => !s);
            if (!soundOn) play("click");
          }}
        />
      )}
      {page !== "chaosmode" && <BackToTop />}
      {page !== "chaosmode" && (
        <button
          onClick={() => { play("click"); setShortcutsOpen(true); }}
          className="fixed bottom-6 right-6 z-[55] w-12 h-12 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black border-4 border-white dark:border-black shadow-[6px_6px_0_#d4ff00] dark:shadow-[6px_6px_0_#ff00ff] hover:-translate-y-1 transition-transform no-color-transition font-bebas text-2xl"
          aria-label="Show keyboard shortcuts (?)"
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      )}
      <Soundboard
        open={soundboardOpen}
        onOpen={() => setSoundboardOpen(true)}
        onClose={() => setSoundboardOpen(false)}
      />
      <BackgroundMusic />
      <KeyboardShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {/* God mode floating button — only visible when godMode is unlocked */}
      {godMode && page !== "chaosmode" && (
        <button
          onClick={() => { play("submit"); setPage("chaosmode"); }}
          className="fixed top-20 right-4 z-[55] flex items-center gap-2 bg-[#ff00ff] text-white border-4 border-black dark:border-white font-bebas text-lg px-4 py-2 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] hover:-translate-y-1 transition-transform no-color-transition animate-pulse"
          aria-label="Enter Chaos Mode (member area)"
          title="⚡ CHAOS MODE — Member Area"
        >
          <Upload className="w-4 h-4" /> CHAOS MODE
        </button>
      )}
      <KonamiOverlay show={konami} godUnlocked={godMode && chaos} />
    </div>
  );
}
