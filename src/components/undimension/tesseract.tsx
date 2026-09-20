"use client";

import { cn } from "@/lib/utils";

/**
 * Realistic 3D Tesseract (4D hypercube projection).
 *
 * Built with CSS 3D transforms (transform-style: preserve-3d) — no Three.js
 * needed, keeps the bundle light. Two counter-rotating wireframe cubes
 * (outer + inner) + 16 glowing vertex nodes (8 outer + 8 inner) produce the
 * classic "cube-within-a-cube" hypercube look.
 *
 * The astronaut image sits at the very center with NO shadow, NO border, NO
 * circle, NO glow — it is a plain floating image, as if the astronaut is
 * genuinely drifting, trapped inside the tesseract.
 *
 * Research sources:
 *   - https://3dtransforms.desandro.com  (CSS 3D cube technique)
 *   - https://developer.mozilla.org (transform-style: preserve-3d)
 *   - https://css-tricks.com  (thinking in cubes, not boxes)
 */
export function Tesseract({
  image,
  onEnter,
}: {
  image: string;
  onEnter: () => void;
}) {
  return (
    <div
      className={cn(
        "relative w-[260px] h-[260px] md:w-[400px] md:h-[400px]",
        "flex items-center justify-center cursor-pointer z-20 mt-4 mb-28 md:mb-20",
        "no-color-transition animate-intro-zoom group",
      )}
      onClick={onEnter}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEnter();
        }
      }}
      aria-label="Enter Undimension"
    >
      {/* 3D scene — provides perspective for the cubes inside */}
      <div className="tesseract-scene">
        {/* Outer wireframe cube — rotates one way */}
        <div className="tesseract-cube tesseract-cube--outer animate-tes-spin">
          {/* 6 transparent faces with glowing borders = wireframe edges */}
          <div className="tes-face tes-front" />
          <div className="tes-face tes-back" />
          <div className="tes-face tes-right" />
          <div className="tes-face tes-left" />
          <div className="tes-face tes-top" />
          <div className="tes-face tes-bottom" />
          {/* 8 glowing vertex nodes on the outer cube corners */}
          <div className="tes-vertex tes-v-ppp" />
          <div className="tes-vertex tes-v-ppn" />
          <div className="tes-vertex tes-v-pnp" />
          <div className="tes-vertex tes-v-pnn" />
          <div className="tes-vertex tes-v-npp" />
          <div className="tes-vertex tes-v-npn" />
          <div className="tes-vertex tes-v-nnp" />
          <div className="tes-vertex tes-v-nnn" />
        </div>

        {/* Inner wireframe cube — counter-rotates (gives the hypercube feel) */}
        <div className="tesseract-cube tesseract-cube--inner animate-tes-spin-rev">
          <div className="tes-face tes-front" />
          <div className="tes-face tes-back" />
          <div className="tes-face tes-right" />
          <div className="tes-face tes-left" />
          <div className="tes-face tes-top" />
          <div className="tes-face tes-bottom" />
          {/* 8 smaller glowing vertex nodes on the inner cube corners */}
          <div className="tes-vertex tes-v-ppp" />
          <div className="tes-vertex tes-v-ppn" />
          <div className="tes-vertex tes-v-pnp" />
          <div className="tes-vertex tes-v-pnn" />
          <div className="tes-vertex tes-v-npp" />
          <div className="tes-vertex tes-v-npn" />
          <div className="tes-vertex tes-v-nnp" />
          <div className="tes-vertex tes-v-nnn" />
        </div>

        {/* Astronaut — plain image, no shadow, no border, no circle.
            Just floating gently in the middle of the tesseract, as if
            genuinely drifting, trapped inside the hypercube. */}
        <img
          src={image}
          alt="Astronaut adrift inside the tesseract"
          className="tesseract-astronaut animate-tes-float"
          loading="eager"
          draggable={false}
        />
      </div>

      {/* ENTER button */}
      <button
        className="absolute -bottom-12 -right-2 md:-right-10 bg-[#d4ff00] text-black font-bebas text-3xl md:text-5xl px-8 py-3 border-4 border-white shadow-[6px_6px_0_#fff] rotate-3 flex items-center gap-2 group-hover:bg-white group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[12px_12px_0_#ff4d4d] transition-all no-color-transition z-30"
        onClick={(e) => {
          e.stopPropagation();
          onEnter();
        }}
      >
        <span>ENTER</span>
        <span className="text-xl md:text-3xl">➔</span>
      </button>
    </div>
  );
}
