"use client";

import { useState, useEffect } from "react";
import { StarField } from "./star-field";
import { Blackhole, Planets } from "./cosmic";
import { Tesseract } from "./tesseract";

const BOOT_LINES = [
  "> INITIALIZING UNDIMENSION KERNEL...",
  "> LOADING 7 ENTITIES.............. OK",
  "> CALIBRATING GRAVITATIONAL FIELD. OK",
  "> ESTABLISHING ORBITAL LOCK....... OK",
  "> CHAOS ENGINE: ONLINE",
  "> WELCOME, TRAVELER.",
];

function BootSequence() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed top-2 left-2 md:top-4 md:left-4 z-20 max-w-[200px] md:max-w-xs font-mono-ud text-[9px] md:text-xs text-[#00ff00] bg-black/70 border border-[#00ff00]/40 p-2 md:p-3 pointer-events-none"
      aria-hidden
    >
      <div className="flex items-center gap-1 mb-2 pb-1 border-b border-[#00ff00]/30">
        <span className="w-2 h-2 bg-[#ff4d4d] rounded-full" />
        <span className="w-2 h-2 bg-[#d4ff00] rounded-full" />
        <span className="w-2 h-2 bg-[#00ff00] rounded-full" />
        <span className="ml-2 text-[#00ff00]/60 tracking-widest">SYS:BOOT</span>
      </div>
      {lines.map((line, i) => (
        <div key={i} className="leading-tight text-[#00ff00]">
          {line}
        </div>
      ))}
      {lines.length < BOOT_LINES.length && (
        <span className="inline-block w-2 h-3 bg-[#00ff00] ud-blink ml-1" />
      )}
    </div>
  );
}

export function OpeningScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#09090b] overflow-hidden selection:bg-[#ff4d4d] selection:text-white">
      <StarField variant="dark" />
      <div className="ud-grain" aria-hidden />
      <Blackhole />
      <Planets />
      <BootSequence />
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-4">
        <h1
          className="font-bebas text-[72px] sm:text-[110px] md:text-[180px] lg:text-[240px] leading-[0.8] uppercase text-white drop-shadow-md relative z-10 animate-intro-text ud-glitch"
          data-text="UNDIMENSION"
          style={{ textShadow: "10px 10px 0px #00e5ff" }}
        >
          UNDIMENSION
        </h1>
        <Tesseract image="/assets/Astronout.png" onEnter={onEnter} />
        <p className="font-outfit text-lg md:text-2xl font-black border-4 border-white bg-[#ff4d4d] text-white px-8 py-4 shadow-[8px_8px_0_#fff] max-w-xl -rotate-2 uppercase relative z-10 hover:rotate-0 hover:scale-105 transition-all no-color-transition animate-intro-fade">
          Initiate launch sequence to the collective.
        </p>
      </div>
    </div>
  );
}
