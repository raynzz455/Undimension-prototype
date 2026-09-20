"use client";

import { cn } from "@/lib/utils";

/**
 * UnavailablePhoto — custom placeholder for members who haven't uploaded a photo.
 *
 * Instead of a generic Lucide icon, this draws a fully custom neo-brutalist
 * warning sign: a hand-built triangle with a stamped exclamation, a banned-
 * aperture ring, "NO PHOTO" + "SIGNAL LOST" microcopy, and a thin scanline
 * texture — all themed by the member's brand color so each member's
 * unavailable card still feels uniquely theirs.
 *
 * Used by:
 *   - about-page.tsx (member cards grid)
 *   - portfolio-page.tsx (portfolio author block)
 *   - member-detail-modal.tsx (member detail modal)
 *   - game-expander.tsx PlayerChip (game player avatar)
 */
export function UnavailablePhoto({
  className,
  label = "NO PHOTO",
  color = "#ff8c00",
  nick,
}: {
  className?: string;
  label?: string;
  /** Member brand color (hex). The whole warning sign is themed by this. */
  color?: string;
  /** Optional member nick — rendered as a stamped ID. */
  nick?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col items-center justify-center",
        "bg-[#0d0d0d] border-2 overflow-hidden",
        className
      )}
      style={{ borderColor: color, color }}
      role="img"
      aria-label={`${label}${nick ? ` — ${nick}` : ""}`}
    >
      {/* Scanline texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.06) 3px 4px)",
        }}
      />

      {/* Diagonal "NO SIGNAL" stripes in the background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${color} 0 8px, transparent 8px 18px)`,
        }}
      />

      {/* Custom warning sign — hand-drawn SVG triangle with stamped exclamation */}
      <svg
        viewBox="0 0 100 100"
        className="w-12 h-12 md:w-16 md:h-16 relative z-10 mb-2"
        fill="none"
        aria-hidden
      >
        {/* Outer triangle */}
        <path
          d="M50 6 L94 86 L6 86 Z"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinejoin="round"
        />
        {/* Inner accent triangle (double-line brutalist look) */}
        <path
          d="M50 22 L82 80 L18 80 Z"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.5"
        />
        {/* Exclamation bar */}
        <rect x="46" y="38" width="8" height="22" fill={color} />
        {/* Exclamation dot */}
        <rect x="46" y="66" width="8" height="8" fill={color} />
      </svg>

      {/* Main label */}
      <span
        className="relative z-10 font-mono-ud text-[10px] md:text-xs font-black tracking-[0.25em] text-center px-2"
        style={{ color }}
      >
        {label}
      </span>

      {/* Sub-microcopy */}
      <span className="relative z-10 font-mono-ud text-[8px] md:text-[9px] tracking-[0.2em] text-white/40 mt-1 text-center px-2">
        SIGNAL LOST
      </span>

      {/* Nick stamp (if provided) */}
      {nick && (
        <span
          className="relative z-10 mt-2 font-bebas text-sm md:text-base tracking-widest border px-2 py-0.5"
          style={{ borderColor: color, color }}
        >
          {nick.toUpperCase()}
        </span>
      )}

      {/* Corner registration marks (viewfinder aesthetic) */}
      <span className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color }} />
      <span className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: color }} />
      <span className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: color }} />
      <span className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color }} />
    </div>
  );
}
