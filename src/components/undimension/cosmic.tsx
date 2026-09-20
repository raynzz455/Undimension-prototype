"use client";

import { memo } from "react";

/**
 * Realistic Blackhole — Interstellar "Gargantua" inspired.
 *
 * Built with SVG + radial/linear gradients + Gaussian blur filters + CSS
 * rotation. No external library, no Three.js — keeps the bundle light while
 * delivering the iconic look:
 *
 *   1. Faint background nebula glow (gravitational halo around the whole hole)
 *   2. Bottom lensing arc — light from the BACK of the disk bent UNDER the hole
 *   3. Black event-horizon sphere with a subtle purple gravitational-edge tint
 *   4. Bright photon ring just outside the horizon (light orbiting the hole)
 *   5. Top lensing arc — light from the back of the disk bent OVER the top
 *   6. Edge-on accretion disk extending left + right of the horizon, with
 *      Doppler beaming (one side brighter/bluer, the other dimmer/redder)
 *
 * The whole SVG slowly counter-rotates so the disk + halo feel alive.
 *
 * Research sources:
 *   - https://cerncourier.com (Building Gargantua — Interstellar VFX)
 *   - https://svs.gsfc.nasa.gov (Black Hole with Accretion Disk Visualization)
 *   - https://eventhorizontelescope.org (real M87 black hole morphology)
 */
function BlackholeBase() {
  return (
    <div
      aria-hidden
      className="absolute -right-32 md:right-0 top-1/2 -translate-y-1/2 w-[450px] h-[450px] md:w-[700px] md:h-[700px] z-0 pointer-events-none -rotate-12"
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full animate-bh-rotate"
        style={{ willChange: "transform" }}
      >
        <defs>
          {/* Hot accretion-disk gradient: white-hot center → yellow → orange → red → transparent */}
          <radialGradient id="bh-disk-hot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#fff4c2" stopOpacity="1" />
            <stop offset="55%" stopColor="#ffaa00" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#ff4d4d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3a0000" stopOpacity="0" />
          </radialGradient>

          {/* Doppler asymmetry gradient — approaching side brighter, receding dimmer */}
          <linearGradient id="bh-doppler" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#fff4c2" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ffaa00" stopOpacity="0.75" />
            <stop offset="75%" stopColor="#ff4d4d" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3a0000" stopOpacity="0.25" />
          </linearGradient>

          {/* Event horizon — pure black with a faint purple gravitational edge */}
          <radialGradient id="bh-event-horizon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="1" />
            <stop offset="82%" stopColor="#000000" stopOpacity="1" />
            <stop offset="96%" stopColor="#0a0014" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1a0033" stopOpacity="0.5" />
          </radialGradient>

          {/* Soft glow filter for disk edges */}
          <filter id="bh-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong blur for the background nebula halo */}
          <filter id="bh-strong-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="14" />
          </filter>

          {/* Subtle motion blur on the disk to imply orbital speed */}
          <filter id="bh-motion" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="1.5 0.4" />
          </filter>
        </defs>

        {/* 1. Faint background nebula halo (the whole black hole's gravity well glow) */}
        <circle
          cx="250" cy="250" r="245"
          fill="url(#bh-disk-hot)"
          opacity="0.12"
          filter="url(#bh-strong-blur)"
        />

        {/* 2. Bottom lensing arc — back of the disk bent UNDER the hole (dimmer) */}
        <path
          d="M 55 250 Q 250 460 445 250"
          fill="none"
          stroke="url(#bh-disk-hot)"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.6"
          filter="url(#bh-soft-glow)"
        />
        <path
          d="M 95 250 Q 250 425 405 250"
          fill="none"
          stroke="#ffaa00"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* 3. Black event-horizon sphere */}
        <circle cx="250" cy="250" r="105" fill="url(#bh-event-horizon)" />

        {/* 4. Bright photon ring just outside the horizon */}
        <circle
          cx="250" cy="250" r="108"
          fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.95"
        />
        <circle
          cx="250" cy="250" r="113"
          fill="none" stroke="#fff4c2" strokeWidth="1" opacity="0.55"
          filter="url(#bh-soft-glow)"
        />

        {/* 5. Top lensing arc — back of the disk bent OVER the top (brightest, in front of sphere top) */}
        <path
          d="M 55 250 Q 250 40 445 250"
          fill="none"
          stroke="url(#bh-disk-hot)"
          strokeWidth="30"
          strokeLinecap="round"
          opacity="0.95"
          filter="url(#bh-soft-glow)"
        />
        {/* Brighter inner edge of the top arc */}
        <path
          d="M 95 250 Q 250 75 405 250"
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
          filter="url(#bh-soft-glow)"
        />

        {/* 6. Edge-on accretion disk in FRONT of the hole, extending left + right.
              Doppler beaming: LEFT side brighter (approaching), RIGHT side dimmer (receding). */}
        <g filter="url(#bh-motion)">
          {/* Left half — approaching, blueshifted, very bright */}
          <ellipse
            cx="150" cy="250" rx="100" ry="13"
            fill="url(#bh-doppler)"
            opacity="0.95"
            filter="url(#bh-soft-glow)"
          />
          {/* Right half — receding, redshifted, dimmer */}
          <ellipse
            cx="350" cy="250" rx="100" ry="13"
            fill="url(#bh-doppler)"
            opacity="0.55"
            filter="url(#bh-soft-glow)"
          />
          {/* Bright hot spot on the approaching (left) side */}
          <ellipse
            cx="115" cy="250" rx="22" ry="6"
            fill="#ffffff"
            opacity="0.9"
            filter="url(#bh-soft-glow)"
          />
        </g>
      </svg>
    </div>
  );
}

export const Blackhole = memo(BlackholeBase);

/**
 * Orbiting planets. Optimized: each orbit is a single rotating container
 * with will-change on transform only.
 */
function PlanetsBase() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
    >
      {/* Orbit 1 */}
      <div
        className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border-4 border-white border-dashed animate-spin-slow"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-white shadow-[8px_8px_0_#fff] overflow-hidden animate-spin-rev"
          style={{
            background: "radial-gradient(circle at 35% 35%, #4facfe, #00f2fe)",
            willChange: "transform",
          }}
        >
          <div className="w-10 h-10 bg-[#38b000] rounded-sm absolute -top-2 -left-2 rotate-12 border-2 border-black" />
          <div className="w-12 h-6 bg-[#38b000] rounded-sm absolute bottom-1 right-[-4px] -rotate-12 border-2 border-black" />
        </div>
      </div>

      {/* Orbit 2 */}
      <div
        className="absolute w-[550px] h-[550px] md:w-[800px] md:h-[800px] rounded-full border-4 border-white animate-spin-rev"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-[8px_8px_0_#fff] overflow-hidden animate-spin-slow"
          style={{ background: "#e07a5f", willChange: "transform" }}
        >
          <div className="w-6 h-6 bg-[#9b2226] border-2 border-black rounded-full absolute top-1 right-1" />
          <div className="w-4 h-4 bg-[#9b2226] border-2 border-black rounded-full absolute bottom-2 left-2" />
        </div>
      </div>

      {/* Orbit 3 (Saturn-like) */}
      <div
        className="absolute w-[700px] h-[700px] md:w-[1050px] md:h-[1050px] rounded-full border-4 border-white border-dotted animate-spin-slow"
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute top-1/2 -left-10 -translate-y-1/2 w-28 h-28 rounded-full border-4 border-white shadow-[8px_8px_0_#fff] overflow-hidden animate-spin-rev"
          style={{ background: "#f4a261", willChange: "transform" }}
        >
          <div className="absolute w-full h-2 bg-[#e76f51] top-1/4 border-y-2 border-black" />
          <div className="absolute w-full h-4 bg-[#e76f51] bottom-1/3 border-y-2 border-black" />
          <div className="absolute w-[200%] h-[200%] border-y-[16px] border-x-8 border-white rounded-[50%] rotate-[25deg] scale-y-[0.3]" />
          <div className="absolute w-[180%] h-[180%] border-y-[8px] border-[#2a9d8f] rounded-[50%] rotate-[25deg] scale-y-[0.3] opacity-90" />
        </div>
      </div>
    </div>
  );
}

export const Planets = memo(PlanetsBase);
