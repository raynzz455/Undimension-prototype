"use client";

import { cn } from "@/lib/utils";

export function Tesseract({
  image,
  onEnter,
}: {
  image: string;
  onEnter: () => void;
}) {
  return (
    <div
      className="relative w-[200px] h-[200px] md:w-[350px] md:h-[350px] flex items-center justify-center group cursor-pointer z-20 mt-8 mb-12 no-color-transition animate-intro-zoom"
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
      {/* Outer rotating square — wireframe tesseract */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin-slow"
        viewBox="0 0 200 200"
        style={{ willChange: "transform" }}
      >
        {/* Outer square */}
        <rect
          x="15" y="15" width="170" height="170"
          fill="none" stroke="#ffffff" strokeWidth="4"
          className="group-hover:stroke-[#ff4d4d] transition-colors duration-500"
        />
        {/* Inner square */}
        <rect
          x="50" y="50" width="100" height="100"
          fill="none" stroke="#ffffff" strokeWidth="4"
          className="group-hover:stroke-[#00e5ff] transition-colors duration-500"
        />
        {/* Connecting lines — tesseract edges */}
        <line x1="15" y1="15" x2="50" y2="50" stroke="#ffffff" strokeWidth="4" className="group-hover:stroke-[#d4ff00] transition-colors duration-500" />
        <line x1="185" y1="15" x2="150" y2="50" stroke="#ffffff" strokeWidth="4" className="group-hover:stroke-[#d4ff00] transition-colors duration-500" />
        <line x1="15" y1="185" x2="50" y2="150" stroke="#ffffff" strokeWidth="4" className="group-hover:stroke-[#d4ff00] transition-colors duration-500" />
        <line x1="185" y1="185" x2="150" y2="150" stroke="#ffffff" strokeWidth="4" className="group-hover:stroke-[#d4ff00] transition-colors duration-500" />
        {/* Corner dots */}
        <circle cx="15" cy="15" r="5" fill="#ff4d4d" />
        <circle cx="185" cy="15" r="5" fill="#00e5ff" />
        <circle cx="15" cy="185" r="5" fill="#d4ff00" />
        <circle cx="185" cy="185" r="5" fill="#ff00ff" />
      </svg>

      {/* Center image container — counter-rotating */}
      <div
        className="absolute w-[100px] h-[100px] md:w-[160px] md:h-[160px] flex items-center justify-center bg-[#09090b] border-4 border-white shadow-[6px_6px_0_#fff] overflow-hidden animate-spin-rev group-hover:scale-110 transition-transform rounded-full"
        style={{ willChange: "transform" }}
      >
        <img
          src={image}
          alt="Astronaut"
          className="w-full h-full object-cover rounded-full"
          loading="eager"
        />
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: "inset 0 0 20px rgba(0, 229, 255, 0.3)" }} />
      </div>

      {/* ENTER button */}
      <button
        className="absolute -bottom-14 -right-2 md:-right-10 bg-[#d4ff00] text-black font-bebas text-3xl md:text-5xl px-8 py-3 border-4 border-white shadow-[6px_6px_0_#fff] rotate-3 flex items-center gap-2 group-hover:bg-white group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[12px_12px_0_#ff4d4d] transition-all no-color-transition"
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
