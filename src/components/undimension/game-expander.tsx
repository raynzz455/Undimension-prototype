"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Image as ImageIcon, Sword, Shield, Crown, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { GAME_DETAILS, MEMBER_DND_STATS, DND_STAT_LABELS, type DnDStats } from "@/lib/undimension/game-details";
import { useSfx } from "@/hooks/use-sfx";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";
import { UnavailablePhoto } from "./unavailable-photo";

function statModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : String(mod);
}

function DnDStatBlock({ stats, color }: { stats: DnDStats; color: string }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {(Object.keys(stats) as (keyof DnDStats)[]).map((key) => {
        const val = stats[key];
        const info = DND_STAT_LABELS[key];
        return (
          <div
            key={key}
            className="border-2 border-white bg-black text-center p-2 group relative"
            style={{ borderTopColor: color, borderTopWidth: "4px" }}
          >
            <div className="font-bebas text-2xl text-white leading-none">{key}</div>
            <div className="font-bebas text-4xl leading-none my-1" style={{ color }}>{val}</div>
            <div className="font-mono-ud text-sm text-white/50">{statModifier(val)}</div>
            <div className="absolute hidden group-hover:block z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-[9px] font-mono-ud p-2 border border-white whitespace-nowrap max-w-[200px]">
              <span className="font-bold" style={{ color }}>{info.full}</span><br />{info.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlayerChip({ p }: { p: any }) {
  return (
    <div className="border-2 border-white/20 bg-[#1a1a1a] p-3 flex items-center gap-4">
      <div className="w-20 h-20 flex-shrink-0 overflow-hidden border-2 border-white/40">
        {p.img ? (
          <img src={p.img} alt={p.nick} className="w-full h-full object-cover grayscale" loading="lazy" />
        ) : (
          <UnavailablePhoto
            label="NO PHOTO"
            nick={p.nick}
            color={p.color || "#ff8c00"}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bebas text-2xl leading-none" style={{ color: p.color }}>{p.nick}</div>
        {p.role && <div className="font-mono-ud text-sm text-white/60 mt-1">{p.role} · {p.favHero}</div>}
        {p.dndCharacter && <div className="font-mono-ud text-sm text-white/60 mt-1">{p.dndCharacter}</div>}
      </div>
      {p.rank && <div className="font-mono-ud text-xs font-black text-right"><div className="text-[#d4ff00]">{p.rank}</div><div className="text-white/50">WR: {p.winRate}</div></div>}
      {p.dndLevel && <div className="font-bebas text-4xl" style={{ color: p.color }}>LVL {p.dndLevel}</div>}
    </div>
  );
}

export function GameDetailModal({
  gameId,
  gameTitle,
  accent,
  open,
  onClose,
}: {
  gameId: string;
  gameTitle: string;
  accent: string;
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);
  const { play } = useSfx();
  const detail = GAME_DETAILS[gameId];

  useEffect(() => {
    if (open) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => { document.body.classList.remove("modal-open"); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        document.body.classList.remove("modal-open");
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!detail) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-start justify-center p-2 md:p-4 pt-4 md:pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

          {/* Relative wrapper */}
          <div className="relative w-full max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw]">
            {/* X Close */}
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 z-30 w-10 h-10 flex items-center justify-center bg-[#ff4d4d] text-white border-4 border-white shadow-[4px_4px_0_#000] hover:rotate-90 transition-transform no-color-transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

          {/* Modal */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ud-game-detail-title"
            tabIndex={-1}
            className="relative w-full max-h-[90vh] overflow-y-auto border-8 border-white bg-[#09090b] shadow-[8px_8px_0_#000] md:shadow-[16px_16px_0_#000] outline-none"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onAnimationComplete={() => {
              if (panelRef.current) panelRef.current.scrollTop = 0;
            }}
          >

            {/* Header banner */}
            <div className="p-6 border-b-4 border-white" style={{ backgroundColor: accent }}>
              <div className="font-mono-ud text-xs font-black tracking-[0.3em] uppercase text-black/60 mb-1">
                ▸ GAME DETAILS
              </div>
              <h3 id="ud-game-detail-title" className="font-bebas text-4xl md:text-6xl text-black leading-none">
                {gameTitle}
              </h3>
            </div>

            {/* Body */}
            <div className="p-4 md:p-8 space-y-8">
              {/* Players */}
              <div>
                <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-2">
                  <Users className="w-6 h-6" style={{ color: accent }} /> PLAYERS ({detail.players.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detail.players.map((p, i) => (
                    <PlayerChip key={i} p={p} />
                  ))}
                </div>
              </div>

              {/* ML Pro Player Stats */}
              {gameId === "ml" && detail.teamStats && (
                <div>
                  <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-1">
                    <Sword className="w-5 h-5" style={{ color: accent }} /> TEAM STATS
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="border-2 border-white/30 p-2 text-center">
                      <div className="font-bebas text-3xl" style={{ color: accent }}>{detail.teamStats.rank}</div>
                      <div className="font-mono-ud text-sm text-white/50">RANK</div>
                    </div>
                    <div className="border-2 border-white/30 p-2 text-center">
                      <div className="font-bebas text-3xl" style={{ color: accent }}>{detail.teamStats.winRate}</div>
                      <div className="font-mono-ud text-sm text-white/50">WIN RATE</div>
                    </div>
                    <div className="border-2 border-white/30 p-2 text-center">
                      <div className="font-bebas text-3xl" style={{ color: accent }}>{detail.teamStats.totalMatches}</div>
                      <div className="font-mono-ud text-sm text-white/50">MATCHES</div>
                    </div>
                    <div className="border-2 border-white/30 p-2 text-center">
                      <div className="font-bebas text-xl" style={{ color: accent }}>{detail.teamStats.favoriteComp}</div>
                      <div className="font-mono-ud text-sm text-white/50">FAV COMP</div>
                    </div>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full font-mono-ud text-sm text-white border-collapse">
                      <thead>
                        <tr className="border-b-2 border-white/30">
                          <th className="text-left py-1 px-2">PLAYER</th>
                          <th className="text-center py-1 px-2">ROLE</th>
                          <th className="text-center py-1 px-2">HERO</th>
                          <th className="text-center py-1 px-2">RANK</th>
                          <th className="text-center py-1 px-2">KDA</th>
                          <th className="text-center py-1 px-2">WR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.players.map((p, i) => (
                          <tr key={i} className="border-b border-white/10">
                            <td className="py-1 px-2 font-bold" style={{ color: p.color }}>{p.nick}</td>
                            <td className="text-center py-1 px-2">{p.role}</td>
                            <td className="text-center py-1 px-2">{p.favHero}</td>
                            <td className="text-center py-1 px-2 text-[#d4ff00]">{p.rank}</td>
                            <td className="text-center py-1 px-2">{p.kda}</td>
                            <td className="text-center py-1 px-2">{p.winRate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Moments / Gallery */}
              {detail.moments && detail.moments.length > 0 && (
                <div>
                  <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-1">
                    <ImageIcon className="w-5 h-5" style={{ color: accent }} /> MOMENTS ({detail.moments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {detail.moments.map((m, i) => (
                      <div key={i} className="border-2 border-white/20 overflow-hidden">
                        <div className="relative aspect-video">
                          <img src={m.img} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 ud-scanlines opacity-20" />
                        </div>
                        <div className="p-2">
                          <div className="font-bebas text-xl" style={{ color: accent }}>{m.title}</div>
                          <div className="font-mono-ud text-sm text-white/50">{m.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* D&D: Characters + Campaigns + Story + Locations */}
              {gameId === "dnd" && (
                <>
                  <div>
                    <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-1">
                      <Crown className="w-5 h-5" style={{ color: accent }} /> CHARACTERS
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {detail.players.map((p, i) => (
                        <div key={i} className="border-2 border-white/20 overflow-hidden">
                          {p.dndCharacterImg && (
                            <div className="relative aspect-square">
                              <img src={p.dndCharacterImg} alt={p.dndCharacter} className="w-full h-full object-cover grayscale" loading="lazy" />
                              <div className="absolute inset-0 ud-scanlines opacity-30" />
                            </div>
                          )}
                          <div className="p-3 bg-black">
                            <div className="font-bebas text-3xl" style={{ color: p.color }}>{p.dndCharacter}</div>
                            <div className="font-mono-ud text-sm text-white/60">{p.dndRace} · {p.dndClass}</div>
                            <div className="font-bebas text-3xl mt-1" style={{ color: p.color }}>LVL {p.dndLevel}</div>
                            {p.memberId && MEMBER_DND_STATS[p.memberId] && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <DnDStatBlock stats={MEMBER_DND_STATS[p.memberId]} color={p.color} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {detail.campaigns && (
                    <div>
                      <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-1">
                        <Shield className="w-5 h-5" style={{ color: accent }} /> CAMPAIGNS ({detail.campaigns.length})
                      </h4>
                      <div className="space-y-3">
                        {detail.campaigns.map((c) => (
                          <div key={c.id} className="border-2 border-white/20 p-3">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                              <span className="font-bebas text-xl text-white">{c.name}</span>
                              <span className={cn(
                                "font-mono-ud text-sm font-black px-2 py-0.5 border",
                                c.status === "ONGOING" ? "text-[#00ff00] border-[#00ff00]" :
                                c.status === "COMPLETED" ? "text-[#00e5ff] border-[#00e5ff]" :
                                "text-[#ff8c00] border-[#ff8c00]",
                              )}>{c.status}</span>
                            </div>
                            <div className="font-mono-ud text-sm text-white/50 mb-1">DM: {c.dm} · {c.sessions} sessions</div>
                            <p className="font-mono-ud text-sm text-white/70 leading-relaxed mb-2">{c.description}</p>
                            {c.locationImages && c.locationImages.length > 0 && (
                              <div className="flex gap-1">
                                {c.locationImages.map((img, i) => (
                                  <img key={i} src={img} alt={`Location ${i+1}`} className="w-24 h-24 object-cover border border-white/20" loading="lazy" />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detail.storyOutline && (
                    <div>
                      <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-1">
                        <MapPin className="w-5 h-5" style={{ color: accent }} /> STORY OUTLINE
                      </h4>
                      <div className="border-2 border-white/20 bg-black p-3">
                        <p className="font-mono-ud text-sm text-white/70 leading-relaxed">{detail.storyOutline}</p>
                      </div>
                    </div>
                  )}

                  {detail.locationImages && detail.locationImages.length > 0 && (
                    <div>
                      <h4 className="font-bebas text-4xl text-white mb-3 flex items-center gap-2 border-b-2 border-white/20 pb-1">
                        <ImageIcon className="w-5 h-5" style={{ color: accent }} /> LOCATION PHOTOS
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {detail.locationImages.map((img, i) => (
                          <div key={i} className="border-2 border-white/20 overflow-hidden">
                            <img src={img} alt={`Location ${i+1}`} className="w-full aspect-square object-cover" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
