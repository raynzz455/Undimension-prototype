"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MEMBERS, type Member } from "@/lib/undimension/data";
import { useChaos } from "./chaos-provider";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { Radar as RadarIcon, Shuffle, Eye, EyeOff } from "lucide-react";

// Stats normalization: convert any stat value to 0-100 for the radar chart.
// Three tiers based on the value range:
//   1. D&D range (1-20): multiply by 5 → 5-100 (standard D&D scale)
//   2. Normal range (21-100): use directly → 21-100 (already on 0-100 scale)
//   3. Anomaly (>100, e.g. 99999): cap at 100 → shows as maxed on THAT stat only
//
// This prevents the bug where a value like 67 gets multiplied by 5 (=335)
// and capped at 100, making ALL stats look maxed. Instead:
//   STR=99999 → 100 (anomaly spike)
//   DEX=67    → 67  (moderate)
//   CON=67    → 67  (moderate)
// The chart shows a SPIKE on STR, not a full circle.
function statToNum(value: string): number {
  if (value === "MAX") return 100;
  if (value === "???" || value === "??") return 50;
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return 50;
  if (n <= 0) return 0;
  if (n <= 20) return n * 5;        // D&D scale: 1→5, 10→50, 20→100
  if (n <= 100) return n;           // Normal scale: 67→67, 80→80
  return 100;                        // Anomaly: 9999→100 (capped, spike on that stat)
}

// Build radar data from the given members (not hardcoded MEMBERS)
function buildRadarData(members: Member[], activeIds: Set<string>) {
  if (!members.length) return [];
  const statLabels = members[0].stats.map((s) => s.label);
  return statLabels.map((label) => {
    const row: Record<string, string | number> = { stat: label };
    members.forEach((m) => {
      const s = m.stats.find((x) => x.label === label);
      row[m.id] = activeIds.has(m.id) && s ? statToNum(s.value) : 0;
    });
    return row;
  });
}

const MEMBER_COLORS: Record<string, string> = {
  aldi: "#ff4d4d",
  razka: "#00e5ff",
  reza: "#d4ff00",
  abyan: "#ff00ff",
  rasya: "#ff8c00",
  rifqi: "#00ff00",
  dudit: "#8a2be2",
  nayla: "#ff006e",
};

function MemberToggle({
  m,
  active,
  onToggle,
}: {
  m: Member;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-4 border-black dark:border-white font-mono-ud text-xs font-black uppercase tracking-wider transition-all no-color-transition",
        active
          ? "text-white dark:text-black shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff]"
          : "bg-white/30 dark:bg-black/30 text-black/40 dark:text-white/40 hover:bg-white/60 dark:hover:bg-black/60",
      )}
      style={active ? { backgroundColor: MEMBER_COLORS[m.id] } : undefined}
      aria-pressed={active}
    >
      {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {m.nick}
    </button>
  );
}

export function StatsRadarSection() {
  // Fetch members from API (DB-backed) with static fallback.
  // This ensures the radar chart reflects updates made via chaos-mode.
  const { data: membersData } = useFetch<{ members: Member[] }>("/api/members");
  const { naylaRevealed } = useChaos();
  const allMembers = membersData?.members ?? MEMBERS;
  const members = allMembers.filter((m) => !m.hidden || naylaRevealed);

  // Default: show 3 members to avoid clutter, user can toggle others
  const [activeIds, setActiveIds] = useState<Set<string>>(
    () => new Set(["aldi", "razka", "reza"]),
  );

  const toggle = (id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // keep at least 1
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const randomize = () => {
    setActiveIds((prev) => {
      const pool = members.map((m) => m.id).filter((id) => !prev.has(id));
      if (pool.length === 0) return new Set([members[0]?.id || "aldi"]);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const next = new Set(prev);
      if (next.size >= 4) {
        const first = next.values().next().value;
        if (first) next.delete(first);
      }
      next.add(pick);
      return next;
    });
  };

  const data = useMemo(() => buildRadarData(members, activeIds), [members, activeIds]);

  return (
    <div className="relative bg-white dark:bg-[#09090b] py-24 px-6 md:px-12 border-t-8 border-black dark:border-white overflow-hidden">
      {/* Background giant text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-bebas text-[150px] md:text-[300px] text-black/[0.03] dark:text-white/[0.03] whitespace-nowrap leading-none">
          STATS
        </span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-block bg-[#8a2be2] text-white font-mono-ud text-xs font-black px-3 py-1 border-4 border-black dark:border-white mb-4 -rotate-1">
            § 05 — POWER MATRIX
          </div>
          <h2
            className="font-bebas text-6xl md:text-[100px] leading-none uppercase text-black dark:text-white ud-glitch-hover cursor-pointer"
            data-text="STATS MATRIX"
            style={{ textShadow: "6px 6px 0px #8a2be2" }}
          >
            STATS MATRIX
          </h2>
          <p className="font-mono-ud font-black text-lg mt-4 bg-black text-[#d4ff00] dark:bg-[#d4ff00] dark:text-black inline-block px-6 py-2 border-4 border-black dark:border-white shadow-[6px_6px_0_#ff00ff] rotate-1">
            Bandingkan kekuatan kolektif. Toggle entitas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Chart */}
          <div className="lg:col-span-3 border-4 border-black dark:border-white bg-[#f4f4f0] dark:bg-[#111] p-4 md:p-6 shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#fff]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-ud text-xs font-black tracking-[0.2em] uppercase text-black/60 dark:text-white/60">
                ▸ RADAR READOUT
              </span>
              <button
                onClick={randomize}
                className="flex items-center gap-1 bg-[#ff00ff] text-white px-2 py-1 border-2 border-black dark:border-white font-mono-ud text-[10px] font-black uppercase hover:rotate-3 transition-transform no-color-transition"
              >
                <Shuffle className="w-3 h-3" /> RANDOM
              </button>
            </div>
            <div className="w-full h-[320px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data} outerRadius="72%">
                  <PolarGrid
                    stroke="#000"
                    strokeOpacity={0.3}
                    strokeDasharray="2 4"
                  />
                  <PolarAngleAxis
                    dataKey="stat"
                    tick={{ fill: "currentColor", fontSize: 14, fontWeight: 700 }}
                    className="font-bebas"
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  {members.map((m) =>
                    activeIds.has(m.id) ? (
                      <Radar
                        key={m.id}
                        name={m.nick}
                        dataKey={m.id}
                        stroke={MEMBER_COLORS[m.id]}
                        fill={MEMBER_COLORS[m.id]}
                        fillOpacity={0.18}
                        strokeWidth={2.5}
                        isAnimationActive={false}
                      />
                    ) : null,
                  )}
                  <Legend
                    wrapperStyle={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono-ud text-[10px] text-black/50 dark:text-white/50 mt-2 text-center tracking-[0.15em] uppercase">
              ▸ MAX = 100 · ??? = 50 (CLASSIFIED) · values normalized for comparison
            </p>
          </div>

          {/* Toggles + leaderboard */}
          <div className="lg:col-span-2 space-y-4">
            <div className="border-4 border-black dark:border-white bg-[#d4ff00] dark:bg-black p-4 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] -rotate-1">
              <h3 className="font-bebas text-3xl text-black dark:text-white mb-3 flex items-center gap-2">
                <RadarIcon className="w-6 h-6" /> ENTITIES
              </h3>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <MemberToggle
                    key={m.id}
                    m={m}
                    active={activeIds.has(m.id)}
                    onToggle={() => toggle(m.id)}
                  />
                ))}
              </div>
              <p className="font-mono-ud text-[10px] text-black/60 dark:text-white/60 mt-3 tracking-[0.1em]">
                {activeIds.size} ACTIVE · min 1 · click to toggle
              </p>
            </div>

            {/* Top stat leaderboard */}
            <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-4 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] rotate-1">
              <h3 className="font-bebas text-2xl text-black dark:text-white mb-2">
                PEAK VALUES
              </h3>
              <div className="space-y-1.5">
                {members.map((m) => {
                  const peak = Math.max(
                    ...m.stats.map((s) => statToNum(s.value)),
                  );
                  const peakStat = m.stats.find(
                    (s) => statToNum(s.value) === peak,
                  );
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between font-mono-ud text-xs"
                    >
                      <span
                        className="font-bold uppercase"
                        style={{ color: MEMBER_COLORS[m.id] }}
                      >
                        {m.nick}
                      </span>
                      <span className="text-black/60 dark:text-white/60">
                        {peakStat?.label}: {peakStat?.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
