"use client";

import { motion } from "framer-motion";
import { TIMELINE } from "@/lib/undimension/data";
import { cn } from "@/lib/utils";

function TimelineCard({ m, align }: { m: (typeof TIMELINE)[number]; align: "left" | "right" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: align === "left" ? -30 : 30, y: 10 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-5 shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#fff]",
        align === "left" ? "md:rotate-1" : "md:-rotate-1",
      )}
    >
      <div
        className={cn(
          "absolute top-0 bottom-0 w-2 border-r-4 border-black dark:border-white",
          align === "left" ? "left-0" : "right-0",
        )}
        style={{ backgroundColor: m.color }}
      />
      <div className={cn("px-3", align === "left" ? "pl-3" : "pr-3")}>
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="font-bebas text-5xl md:text-6xl leading-none"
            style={{ color: m.color, WebkitTextStroke: "1.5px #000" }}
          >
            {m.year}
          </span>
          <span className="font-mono-ud text-xs font-black tracking-[0.3em] text-black/60 dark:text-white/60">
            {m.season}
          </span>
        </div>
        <h3 className="font-bebas text-3xl md:text-4xl text-black dark:text-white leading-none mb-2">
          {m.title}
        </h3>
        <p className="font-mono-ud text-sm text-black/80 dark:text-white/80 leading-relaxed">
          {m.description}
        </p>
      </div>
    </motion.div>
  );
}

function TimelineNode({ m, i }: { m: (typeof TIMELINE)[number]; i: number }) {
  const isEven = i % 2 === 0;
  const isLast = i === TIMELINE.length - 1;

  return (
    <div className="relative md:grid md:grid-cols-2 md:gap-0">
      {/* ── Mobile: icon on top, connector line going down through card ── */}
      <div className="md:hidden flex flex-col items-center">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-full border-4 border-black dark:border-white flex items-center justify-center font-bebas text-2xl shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] bg-white z-10"
          style={{ backgroundColor: m.color }}
        >
          <span className="text-black drop-shadow-[1px_1px_0_#fff]">{m.icon}</span>
        </div>
        {/* Connector line — goes down through the card center */}
        {!isLast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-1 bg-black dark:bg-white z-0" style={{ height: "calc(100% - 3.5rem)" }} />
        )}
        {/* Card below icon */}
        <div className="w-full pb-8 mt-3 relative z-10">
          <TimelineCard m={m} align="left" />
        </div>
      </div>

      {/* ── Desktop: alternating left/right with centered icon ── */}
      {/* Even index: card on LEFT, icon centered */}
      {isEven ? (
        <>
          {/* Card on left */}
          <div className="hidden md:block md:pr-16 md:pb-16 md:text-right">
            <div className="flex justify-end">
              <TimelineCard m={m} align="right" />
            </div>
          </div>
          {/* Icon centered on the grid line */}
          <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-0 md:bottom-0 md:flex-col md:items-center md:z-10">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black dark:border-white flex items-center justify-center font-bebas text-3xl md:text-4xl shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] bg-white flex-shrink-0"
              style={{ backgroundColor: m.color }}
            >
              <span className="text-black drop-shadow-[1px_1px_0_#fff]">{m.icon}</span>
            </div>
            {!isLast && (
              <div className="w-1 flex-1 bg-black dark:bg-white mt-1" />
            )}
          </div>
          {/* Empty right cell */}
          <div className="hidden md:block md:pb-16" />
        </>
      ) : (
        <>
          {/* Empty left cell */}
          <div className="hidden md:block md:pb-16" />
          {/* Icon centered */}
          <div className="hidden md:flex md:absolute md:left-1/2 md:-translate-x-1/2 md:top-0 md:bottom-0 md:flex-col md:items-center md:z-10">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-black dark:border-white flex items-center justify-center font-bebas text-3xl md:text-4xl shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] bg-white flex-shrink-0"
              style={{ backgroundColor: m.color }}
            >
              <span className="text-black drop-shadow-[1px_1px_0_#fff]">{m.icon}</span>
            </div>
            {!isLast && (
              <div className="w-1 flex-1 bg-black dark:bg-white mt-1" />
            )}
          </div>
          {/* Card on right */}
          <div className="hidden md:block md:pl-16 md:pb-16">
            <TimelineCard m={m} align="left" />
          </div>
        </>
      )}
    </div>
  );
}

export function TimelineSection() {
  return (
    <div className="relative bg-[#f4f4f0] dark:bg-[#09090b] py-24 px-6 md:px-12 border-t-8 border-black dark:border-white overflow-hidden">
      {/* Background giant text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-bebas text-[150px] md:text-[300px] text-black/[0.03] dark:text-white/[0.03] whitespace-nowrap leading-none">
          JOURNEY
        </span>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-16 text-center relative">
          <div className="inline-block bg-[#00ff00] text-black font-mono-ud text-xs font-black px-3 py-1 border-4 border-black dark:border-white mb-4 -rotate-1">
            § 02 — CHRONOLOGY
          </div>
          <h2
            className="font-bebas text-6xl md:text-[120px] leading-none uppercase text-black dark:text-white"
            style={{ textShadow: "6px 6px 0px #00ff00" }}
          >
            THE JOURNEY
          </h2>
          <p className="font-mono-ud font-black text-lg mt-4 bg-black text-[#d4ff00] dark:bg-[#d4ff00] dark:text-black inline-block px-6 py-2 border-4 border-black dark:border-white shadow-[6px_6px_0_#ff4d4d] rotate-1">
            Dari SMK Infokom Bogor ke konstanta digital.
          </p>
        </div>

        {/* Timeline */}
        <div className="flex flex-col">
          {TIMELINE.map((m, i) => (
            <TimelineNode key={m.id} m={m} i={i} />
          ))}
        </div>

        {/* End cap */}
        <div className="relative flex justify-center mt-4">
          <div className="font-bebas text-2xl md:text-3xl bg-[#ff4d4d] text-white px-6 py-2 border-4 border-black dark:border-white shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] -rotate-2">
            ... AND THE ORBIT CONTINUES
          </div>
        </div>
      </div>
    </div>
  );
}
