"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "./star-field";
import { StarGraphic } from "./primitives";
import { PhotoLightbox } from "./photo-lightbox";
import { type GalleryPhoto } from "@/lib/undimension/data";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useSfx } from "@/hooks/use-sfx";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { UnavailablePhoto } from "./unavailable-photo";
import {
  Maximize2, RefreshCw, ImageOff, Dices,
  ChevronLeft, ChevronRight, Play, Pause,
} from "lucide-react";

const PHOTOS_PER_PAGE = 12;
const AUTO_ADVANCE_MS = 6000;

function GalleryCard({ p, onOpen }: { p: GalleryPhoto; onOpen: () => void }) {
  return (
    <div
      className={cn(
        "border-4 border-black dark:border-white shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#fff] bg-white dark:bg-[#1a1a1a] p-3 w-full break-inside-avoid transform hover:rotate-0 hover:z-50 hover:scale-105 transition-transform z-10 relative no-color-transition cursor-pointer",
        p.rotate,
      )}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
    >
      <div className="border-4 border-black dark:border-white bg-black overflow-hidden mb-3 relative">
        {p.img ? (
          <img
            src={p.img}
            alt={p.title}
            className="w-full h-auto grayscale hover:grayscale-0 contrast-125 transition-all duration-300 opacity-90 hover:opacity-100"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[4/3]">
            <UnavailablePhoto
              label={`NO PHOTO — ${p.author}`}
              nick={p.author}
              color="#ff8c00"
            />
          </div>
        )}
        <div className="absolute inset-0 ud-scanlines opacity-30 pointer-events-none" />
        <div className="absolute top-2 right-2 bg-[#d4ff00] border-2 border-black p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-4 h-4 text-black" />
        </div>
      </div>
      <div className="flex justify-between items-end border-t-4 border-black dark:border-white pt-2">
        <span className="font-bebas text-3xl text-black dark:text-white leading-none">
          {p.title}
        </span>
        <span className="font-mono-ud font-bold bg-black dark:bg-[#d4ff00] text-white dark:text-black border-2 border-transparent dark:border-black px-2 py-0.5 text-xs">
          {p.date}
        </span>
      </div>
      <div className="mt-1 font-mono-ud text-xs text-black/60 dark:text-white/60 tracking-[0.2em]">
        BY {p.author}
      </div>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-3 shadow-[8px_8px_0_#000]">
          <div className="border-4 border-black dark:border-white bg-black/20 dark:bg-white/10 mb-3 aspect-[4/3] animate-pulse" />
          <div className="h-6 w-2/3 bg-black/10 dark:bg-white/10 animate-pulse mb-2" />
          <div className="h-3 w-1/3 bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function PaginatedCarousel({
  photos,
  onOpenPhoto,
}: {
  photos: GalleryPhoto[];
  onOpenPhoto: (i: number) => void;
}) {
  const [page, setPage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const { play } = useSfx();

  const totalPages = Math.max(1, Math.ceil(photos.length / PHOTOS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);

  const pagePhotos = useMemo(() => {
    const start = currentPage * PHOTOS_PER_PAGE;
    return photos.slice(start, start + PHOTOS_PER_PAGE);
  }, [photos, currentPage]);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)));
  }, [totalPages]);

  const next = useCallback(() => {
    play("click");
    setPage((p) => (p + 1) % totalPages);
  }, [totalPages, play]);

  const prev = useCallback(() => {
    play("click");
    setPage((p) => (p - 1 + totalPages) % totalPages);
  }, [totalPages, play]);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || totalPages <= 1) return;
    const timer = setInterval(() => {
      setPage((p) => (p + 1) % totalPages);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [autoPlay, totalPages]);

  if (photos.length === 0) return null;

  return (
    <div className="relative">
      {/* Carousel viewport */}
      <div className="relative border-8 border-black dark:border-white bg-[#09090b] shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#d4ff00] p-4 overflow-hidden">
        {/* Corner readouts */}
        <div className="flex items-center justify-between mb-3 font-mono-ud text-[10px] text-[#d4ff00] tracking-widest">
          <span>▸ PAGE {String(currentPage + 1).padStart(2, "0")}/{String(totalPages).padStart(2, "0")}</span>
          <span className="flex items-center gap-1">
            {autoPlay ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {autoPlay ? "AUTO" : "PAUSED"}
          </span>
        </div>

        {/* Photo grid for this page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4"
          >
            {pagePhotos.map((p, i) => {
              const globalIdx = currentPage * PHOTOS_PER_PAGE + i;
              return (
                <GalleryCard key={p.id} p={p} onOpen={() => onOpenPhoto(globalIdx)} />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar for auto-advance */}
        {autoPlay && totalPages > 1 && (
          <div className="mt-3 h-1 bg-black border border-[#d4ff00]/30 overflow-hidden">
            <motion.div
              key={currentPage + String(autoPlay)}
              className="h-full bg-[#d4ff00]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: AUTO_ADVANCE_MS / 1000, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        {/* Prev button */}
        <button
          onClick={prev}
          disabled={totalPages <= 1}
          className="flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black font-bebas text-xl px-4 py-2 border-4 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] hover:-translate-y-0.5 transition-transform no-color-transition disabled:opacity-40"
        >
          <ChevronLeft className="w-5 h-5" /> PREV
        </button>

        {/* Pagination dots/numbers */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => { play("click"); goToPage(i); }}
              className={cn(
                "w-8 h-8 border-2 border-black dark:border-white font-bebas text-sm transition-all no-color-transition",
                i === currentPage
                  ? "bg-[#ff4d4d] text-white scale-110 shadow-[2px_2px_0_#000]"
                  : "bg-white dark:bg-black text-black dark:text-white hover:bg-[#d4ff00] hover:text-black",
              )}
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === currentPage}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Next + Auto-play toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPlay((a) => !a)}
            className="flex items-center gap-1 bg-[#ff00ff] text-white font-mono-ud text-xs font-black px-3 py-2 border-2 border-black dark:border-white hover:-translate-y-0.5 transition-transform no-color-transition"
            aria-label={autoPlay ? "Pause auto-advance" : "Play auto-advance"}
          >
            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoPlay ? "PAUSE" : "PLAY"}
          </button>
          <button
            onClick={next}
            disabled={totalPages <= 1}
            className="flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black font-bebas text-xl px-4 py-2 border-4 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] hover:-translate-y-0.5 transition-transform no-color-transition disabled:opacity-40"
          >
            NEXT <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MemoriesPage() {
  const { data, loading, refetch } = useFetch<{ photos: GalleryPhoto[]; count: number }>("/api/gallery");
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [authorFilter, setAuthorFilter] = useState<string | null>(null);
  useScrollReveal();
  const { play } = useSfx();

  const allPhotos = data?.photos ?? [];
  const authors = useMemo(() => {
    const set = new Set(allPhotos.map((p) => p.author));
    return Array.from(set).sort();
  }, [allPhotos]);
  const photos = authorFilter
    ? allPhotos.filter((p) => p.author === authorFilter)
    : allPhotos;

  const openLightbox = (i: number) => {
    play("open");
    setLightboxIndex(i);
  };
  const closeLightbox = () => {
    play("close");
    setLightboxIndex(-1);
  };

  return (
    <div className="page-enter bg-[#00e5ff] dark:bg-[#004d56] pt-28 md:pt-36 pb-24 min-h-screen relative overflow-hidden">
      <StarField variant="dark" className="fixed z-[1]" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Hero */}
        <div className="bg-white dark:bg-[#09090b] border-4 border-black dark:border-white shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#d4ff00] p-8 md:p-12 mb-8 relative no-color-transition">
          <StarGraphic className="absolute top-4 right-4 w-16 h-16 text-[#ff4d4d] animate-spin-slow" />
          <h1
            className="font-bebas text-6xl md:text-[150px] leading-none uppercase text-black dark:text-white"
            style={{ textShadow: "8px 8px 0px #000" }}
          >
            <span
              className="text-white dark:text-[#ff4d4d] ud-glitch-hover cursor-pointer"
              data-text="GALLERY"
              style={{
                textShadow:
                  "-4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 10px 10px 0px #d4ff00",
              }}
            >
              GALLERY
            </span>
            <br />
            OF CHAOS
          </h1>
          <p className="font-mono-ud text-lg md:text-xl font-bold mt-8 max-w-2xl bg-[#d4ff00] text-black border-4 border-black p-4 inline-block shadow-[4px_4px_0_#000]">
            Momen mentah. Tanpa filter. Tanpa batas.
          </p>
          <div className="mt-6 font-mono-ud text-sm text-black/70 dark:text-white/70 border-l-4 border-black dark:border-white pl-4 max-w-2xl">
            <span className="font-bold">{loading ? "..." : `${photos.length} FRAMES`}</span> tersimpan.
            Carousel auto-advance tiap 5 detik · Klik foto untuk fullscreen · Upload untuk tambah.
          </div>

          {/* Action buttons */}
          {!loading && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => { play("click"); refetch(); }}
                className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black font-mono-ud text-xs font-black px-3 py-1.5 border-2 border-black dark:border-white hover:-translate-y-0.5 transition-transform no-color-transition"
              >
                <RefreshCw className="w-3 h-3" /> REFRESH
              </button>
              {allPhotos.length > 0 && (
                <button
                  onClick={() => {
                    play("submit");
                    const i = Math.floor(Math.random() * allPhotos.length);
                    setAuthorFilter(null);
                    openLightbox(i);
                  }}
                  className="inline-flex items-center gap-2 bg-[#ff00ff] text-white font-mono-ud text-xs font-black px-3 py-1.5 border-2 border-black dark:border-white hover:-translate-y-0.5 hover:bg-[#d4ff00] hover:text-black transition-all no-color-transition"
                >
                  <Dices className="w-3 h-3" /> I'M FEELING CHAOTIC
                </button>
              )}
            </div>
          )}

          {/* Author filter */}
          {!loading && authors.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono-ud text-[10px] font-black tracking-[0.2em] uppercase text-black/50 dark:text-white/50 mr-1">
                FILTER:
              </span>
              <button
                onClick={() => { play("click"); setAuthorFilter(null); }}
                className={cn(
                  "px-2 py-1 border-2 border-black dark:border-white font-mono-ud text-[10px] font-black uppercase tracking-wider transition-all no-color-transition",
                  authorFilter === null
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "bg-transparent text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10",
                )}
              >
                ALL ({allPhotos.length})
              </button>
              {authors.map((a) => (
                <button
                  key={a}
                  onClick={() => { play("click"); setAuthorFilter(a === authorFilter ? null : a); }}
                  className={cn(
                    "px-2 py-1 border-2 border-black dark:border-white font-mono-ud text-[10px] font-black uppercase tracking-wider transition-all no-color-transition",
                    authorFilter === a
                      ? "bg-[#ff4d4d] text-white"
                      : "bg-transparent text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paginated Carousel Gallery */}
        {loading ? (
          <GallerySkeleton />
        ) : photos.length === 0 ? (
          <div className="border-4 border-dashed border-black dark:border-white p-16 text-center bg-white/50 dark:bg-black/30">
            <ImageOff className="w-16 h-16 mx-auto mb-4 text-black/40 dark:text-white/40" />
            <p className="font-bebas text-5xl text-black dark:text-white mb-2">
              {authorFilter ? "NO FRAMES FROM THIS AUTHOR" : "THE VOID IS EMPTY"}
            </p>
            <p className="font-mono-ud text-sm text-black/60 dark:text-white/60 max-w-md mx-auto">
              {authorFilter
                ? `Belum ada foto dari ${authorFilter}. Coba filter lain atau upload sendiri.`
                : "Archive collective masih kosong. Upload kenangan pertamamu untuk mengisi chaos."}
            </p>
            {authorFilter && (
              <button
                onClick={() => { play("click"); setAuthorFilter(null); }}
                className="mt-4 bg-[#ff4d4d] text-white border-4 border-black dark:border-white font-bebas text-xl px-4 py-2 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] hover:-translate-y-0.5 transition-transform no-color-transition"
              >
                ← SHOW ALL
              </button>
            )}
          </div>
        ) : (
          <PaginatedCarousel photos={photos} onOpenPhoto={openLightbox} />
        )}
      </div>

      {/* Upload is now only available via /chaosmode (member-only).
          The Gallery page is view-only for visitors. */}
      <PhotoLightbox
        photos={photos}
        index={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={(i) => { play("click"); setLightboxIndex(i); }}
      />
    </div>
  );
}
