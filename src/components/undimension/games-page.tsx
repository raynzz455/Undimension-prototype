"use client";

import { useState, useEffect } from "react";
import { StarField } from "./star-field";
import { StarGraphic } from "./primitives";
import { GameDetailModal } from "./game-expander";
import { GAMES, type GameSection } from "@/lib/undimension/data";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

function GameCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const DURATION = 4500;
    const TICK = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += TICK;
      setProgress(Math.min(100, (elapsed / DURATION) * 100));
      if (elapsed >= DURATION) {
        setIdx((prev) => (prev + 1) % images.length);
        elapsed = 0;
        setProgress(0);
      }
    }, TICK);
    return () => clearInterval(timer);
  }, [images.length]);

  const goTo = (i: number) => {
    setIdx(i);
    setProgress(0);
  };

  return (
    <div className="relative border-4 md:border-8 border-black shadow-[8px_8px_0_#000] md:shadow-[16px_16px_0_#000] w-full bg-[#8b8b8b] p-2 md:p-4 rotate-1 md:rotate-2 hover:rotate-0 transition-transform">
      <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 bg-[#ff4d4d] text-white font-mono-ud font-black border-2 md:border-4 border-black px-3 py-1 md:px-4 md:py-2 text-lg md:text-2xl shadow-[2px_2px_0_#000] md:shadow-[4px_4px_0_#000] -rotate-3 md:-rotate-6 z-20">
        {title}
      </div>
      <div className="border-2 md:border-4 border-black overflow-hidden relative aspect-video bg-black ud-crt">
        <img
          src={images[idx]}
          alt={`${title} moment ${idx + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
          key={idx}
        />
        {/* REC indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 border border-white/30">
          <span className="w-2 h-2 bg-[#ff4d4d] rounded-full ud-blink" />
          <span className="font-mono-ud text-[9px] font-black text-white tracking-widest">REC</span>
        </div>
        {/* Tape-deck counter (bottom-left) */}
        <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 border border-white/30 font-mono-ud text-[9px] font-black text-[#d4ff00] tracking-widest">
          ▶ {String(idx + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")}
        </div>
      </div>
      {/* Tape-deck progress bar */}
      <div className="mt-2 h-1.5 bg-black border border-black overflow-hidden">
        <div
          className="h-full bg-[#d4ff00] transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-2 md:mt-3">
        <div className="flex gap-1 md:gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "w-3 h-3 md:w-4 md:h-4 border-2 border-black transition-colors",
                i === idx ? "bg-[#d4ff00]" : "bg-white",
              )}
              aria-label={`Show image ${i + 1}`}
            />
          ))}
        </div>
        <div className="font-mono-ud font-black text-black text-xs md:text-base">
          IMG_0{idx + 1}
        </div>
      </div>
    </div>
  );
}

function GameSeparator() {
  return (
    <div className="relative h-40 md:h-64 w-full bg-black overflow-hidden border-y-4 md:border-y-8 border-black">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#09090b] to-transparent z-10" />
      <StarField variant="dark" className="z-0" sparkles={false} />
      <div className="relative z-20 flex items-center justify-center h-full">
        <StarGraphic className="w-12 h-12 md:w-16 md:h-16 text-[#d4ff00] animate-spin-slow" />
      </div>
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#09090b] to-transparent z-10" />
    </div>
  );
}

function GameSectionView({ game }: { game: GameSection }) {
  const isCinzel = game.fontClass === "font-cinzel";
  const [detailOpen, setDetailOpen] = useState(false);
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center p-6 pt-32 overflow-hidden bg-black">
      <img
        src={game.bg}
        alt={`${game.title} Background`}
        className="absolute inset-0 w-full h-full object-cover opacity-90"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/60" />
      <StarField variant="dark" className="z-[2]" sparkles={false} />

      <div
        className={cn(
          "max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-12 relative z-10",
          game.reverse && "lg:flex-row-reverse",
        )}
      >
        <div
          className={cn(
            "w-full lg:w-[35%] flex flex-col relative z-20",
            game.reverse && "lg:items-end lg:text-right",
          )}
        >
          <div
            className={cn(
              "inline-block border-4 border-black dark:border-white font-mono-ud font-black px-4 py-2 md:px-6 md:py-2 mb-6 shadow-[6px_6px_0_#000] w-max text-sm md:text-base bg-white dark:bg-black",
              game.reverse ? "rotate-3" : "-rotate-2",
              game.id === "roblox" && "bg-[#ffea00] text-black border-black",
              game.id === "ml" && "bg-[#00e5ff] border-white text-black shadow-[6px_6px_0_#fff]",
              game.id === "dnd" && "bg-black text-white border-white shadow-[6px_6px_0_#000]",
            )}
          >
            {game.sector}
          </div>
          <h2
            className={cn(
              "font-outfit font-black text-4xl sm:text-5xl md:text-[60px] lg:text-[72px] xl:text-[82px] mb-6 uppercase leading-[0.9] relative z-20",
              isCinzel && "font-cinzel",
              game.title.includes(" ") && "break-words",
              !game.title.includes(" ") && "whitespace-nowrap",
            )}
            style={{
              color: game.accent,
              textShadow:
                game.reverse
                  ? "-3px 3px 0px #fff, -5px 5px 0px #fff"
                  : "3px 3px 0px #fff, 5px 5px 0px #fff",
            }}
          >
            {game.title}
          </h2>
          <div
            className={cn(
              "border-4 p-6 md:p-8 mb-6",
              game.reverse ? "rotate-1" : "-rotate-2",
            )}
            style={{
              background: game.id === "minecraft" ? "#d4ff00" : game.id === "roblox" ? "#000" : game.id === "ml" ? "#000" : "#ffebd2",
              color: game.id === "minecraft" ? "#000" : game.id === "roblox" ? "#ffea00" : game.id === "ml" ? "#fff" : "#000",
              borderColor: game.id === "ml" ? "#00e5ff" : game.id === "dnd" ? "#000" : "#000",
            }}
          >
            <p className={cn("font-bebas text-3xl md:text-4xl mb-4 leading-none", game.id === "ml" && "text-[#ff4d4d] animate-pulse", game.id === "dnd" && "text-red-800")}>
              {game.subtitle}
            </p>
            <p className="font-mono-ud font-bold text-base md:text-lg leading-relaxed">
              {game.description}
            </p>
          </div>
          {/* MORE DETAIL button — below text, doesn't affect layout */}
          <button
            onClick={() => setDetailOpen(true)}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 border-4 border-white/40 font-bebas text-lg md:text-xl tracking-widest text-white hover:border-white hover:bg-white/10 transition-all no-color-transparent"
          >
            MORE DETAIL →
          </button>
        </div>
        <div className="w-full lg:w-[65%] flex justify-center mt-12 lg:mt-0 relative z-20">
          <GameCarousel images={game.images} title={game.carouselTitle} />
        </div>
      </div>

      {/* Game Detail Modal */}
      <GameDetailModal
        gameId={game.id}
        gameTitle={game.title}
        accent={game.accent}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </section>
  );
}

export function GamesPage() {
  // Fetch games from DB (includes uploaded moment photos as `images`).
  // Falls back to static GAMES if DB unconfigured/empty — so the carousel
  // shows DB-uploaded photos when available, static photos otherwise.
  // Per-game: if DB game has 0 moments, fall back to that game's static images.
  const { data } = useFetch<{ games: GameSection[] }>("/api/games");
  const games = (data?.games?.length ? data.games : GAMES).map((g) => {
    const staticGame = GAMES.find((s) => s.id === g.id);
    if (staticGame && (!g.images || g.images.length === 0)) {
      return { ...g, images: staticGame.images };
    }
    return g;
  });

  return (
    // Page bg is always dark (cinematic game carousel look). Text must be
    // white in BOTH themes — `text-black dark:text-white` would render black
    // text on dark bg in light mode = unreadable. Hardcode to `text-white`.
    <div className="page-enter flex flex-col bg-[#09090b] text-white relative">
      {/* Fixed background StarField removed — was overlapping with per-section
          StarFields (each GameSectionView already has its own at z-[2] over
          the background image). The fixed one at z-[1] was hidden behind the
          background images but still rendered, causing visual clutter. */}
      {games.map((game, i) => (
        <div key={game.id}>
          <GameSectionView game={game} />
          {i < games.length - 1 && <GameSeparator />}
        </div>
      ))}
    </div>
  );
}
