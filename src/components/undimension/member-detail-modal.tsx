"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Quote, Sparkles, Calendar, Flame, Share2, Check } from "lucide-react";
import type { Member } from "@/lib/undimension/data";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useSfx } from "@/hooks/use-sfx";
import { cn } from "@/lib/utils";
import { UnavailablePhoto } from "./unavailable-photo";

export function MemberDetailModal({
  member,
  onClose,
}: {
  member: Member | null;
  onClose: () => void;
}) {
  const open = member !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  // Reset scroll to top BEFORE PAINT when member changes
  // Uses double rAF to ensure DOM is fully rendered before resetting scroll
  useLayoutEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.scrollTop = 0;
      // Double rAF: first frame renders the new content, second frame resets scroll
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (panelRef.current) panelRef.current.scrollTop = 0;
        });
      });
    }
  }, [member, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        document.body.classList.remove("modal-open");
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Hide navbar when modal is open, restore when closed
  useEffect(() => {
    if (open) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    // Cleanup on unmount
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && member && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-start justify-center p-3 md:p-6 pt-4 md:pt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Relative wrapper — X button anchors to this */}
          <div className="relative w-full max-w-3xl">
            {/* X Close — absolute to wrapper, top-right corner of modal */}
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 z-30 w-10 h-10 flex items-center justify-center bg-[#ff4d4d] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] hover:rotate-90 transition-transform no-color-transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal panel */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ud-member-modal-title"
              tabIndex={-1}
              className={cn(
                "relative w-full max-h-[90vh] overflow-y-auto border-8 border-black dark:border-white shadow-[8px_8px_0_#000] md:shadow-[16px_16px_0_#000] dark:md:shadow-[16px_16px_0_#d4ff00] outline-none",
                member.color,
              )}
              initial={{ scale: 0.92, y: 20, rotate: -1 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.92, y: 20, rotate: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >

            {/* Header with image + identity */}
            <div className="relative bg-black dark:bg-[#111] text-white p-6 md:p-8 border-b-8 border-black dark:border-white overflow-hidden">
              {/* Giant background nick */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 overflow-hidden">
                <span className="font-bebas text-[120px] md:text-[200px] leading-none whitespace-nowrap select-none">
                  {member.nick.toUpperCase()}
                </span>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                {/* Image */}
                <div className="border-4 border-white bg-black p-2 shadow-[8px_8px_0_#000] flex-shrink-0 w-40 md:w-48">
                  {member.img ? (
                    <img
                      src={member.img}
                      alt={member.nick}
                      className="w-full aspect-[4/5] object-cover grayscale contrast-[1.4]"
                    />
                  ) : (
                    <div className="w-full aspect-[4/5]">
                      <UnavailablePhoto
                        label={`NO PHOTO — ${member.nick.toUpperCase()}`}
                        nick={member.nick}
                        color={(member.color.match(/#[0-9a-fA-F]{6}/) || ["#ff8c00"])[0]}
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 ud-scanlines pointer-events-none" />
                </div>

                {/* Identity */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-block bg-[#d4ff00] text-black font-mono-ud text-xs font-black px-3 py-1 border-2 border-white mb-3 -rotate-1">
                    ID_{member.id.toUpperCase()} · EST. {member.joinYear}
                  </div>
                  <h2 id="ud-member-modal-title" className="font-bebas text-5xl md:text-7xl leading-none uppercase">
                    {member.nick}
                  </h2>
                  <p className="font-mono-ud text-sm text-white/70 mb-2">
                    {member.name}
                  </p>
                  <div
                    className={cn(
                      "inline-block font-bebas text-2xl md:text-3xl px-4 py-1 border-4 border-white bg-black",
                    )}
                  >
                    {member.role}
                  </div>
                  <div className="mt-3 flex items-center justify-center md:justify-start gap-2 text-xs font-mono-ud">
                    <Flame className={cn("w-4 h-4", member.highlight)} />
                    <span className="text-white/80">
                      ELEMENT: <span className={member.highlight}>{member.element}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-[#09090b] text-black dark:text-white p-6 md:p-8 space-y-6">
              {/* Tagline */}
              <div className="bg-black text-[#d4ff00] dark:bg-[#d4ff00] dark:text-black px-4 py-3 border-4 border-black dark:border-white -rotate-1 inline-block">
                <p className="font-bebas text-2xl md:text-3xl tracking-wide">
                  &ldquo;{member.tagline}&rdquo;
                </p>
              </div>

              {/* Bio */}
              <p className="font-outfit text-base md:text-lg leading-relaxed font-medium">
                {member.bio}
              </p>

              {/* Quote */}
              <div className="relative border-4 border-black dark:border-white bg-[#09090b] dark:bg-white text-white dark:text-black p-5 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#d4ff00]">
                <Quote className="absolute -top-3 -left-3 w-8 h-8 p-1 bg-[#ff4d4d] text-white border-2 border-black" />
                <p className="font-mono-ud italic text-sm md:text-base pl-4">
                  {member.quote}
                </p>
              </div>

              {/* Fun Facts */}
              <div>
                <h3 className="font-bebas text-3xl mb-3 flex items-center gap-2">
                  <Sparkles className={cn("w-6 h-6", member.highlight)} />
                  FUN FACTS
                </h3>
                <ul className="space-y-2">
                  {member.funFacts.map((fact, i) => (
                    <li
                      key={i}
                      className="font-mono-ud text-sm flex gap-3 items-start border-l-4 border-black dark:border-white pl-3 py-1 bg-black/5 dark:bg-white/5"
                    >
                      <span className={cn("font-bebas text-xl leading-none", member.highlight)}>
                        0{i + 1}
                      </span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats — D&D 6-stat system */}
              <div>
                <h3 className="font-bebas text-3xl mb-3">D&D STATS</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {member.stats.map((stat, i) => (
                    <div
                      key={i}
                      className={cn(
                        "border-4 border-black dark:border-white p-3 text-center",
                        i === 1
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "bg-white text-black dark:bg-black dark:text-white",
                      )}
                    >
                      <div className="font-bebas text-2xl">{stat.label}</div>
                      <div className={cn("font-bebas text-4xl leading-none", i !== 1 && member.highlight)}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Socials */}
              <div className="flex flex-wrap gap-3 pt-2 border-t-4 border-black dark:border-white">
                {member.socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex-1 min-w-[120px] bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white py-3 text-center font-bebas text-xl shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#000] transition-all no-color-transition"
                  >
                    {social.label}
                  </a>
                ))}
                <ShareButton member={member} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs font-mono-ud opacity-60 pt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> JOINED {member.joinYear}
                </span>
                <span>{"// UNDIMENSION COLLECTIVE //"}</span>
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareButton({ member }: { member: Member }) {
  const [copied, setCopied] = useState(false);
  const { play } = useSfx();

  const handleShare = async () => {
    play("submit");
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/#member-${member.id}`
      : "";
    const shareData = {
      title: `UNDIMENSION — ${member.nick} (${member.role})`,
      text: `${member.tagline}\n\n${member.quote}`,
      url,
    };
    // Try Web Share API first (mobile / supported browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or failed — fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available — silent fail
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex-1 min-w-[120px] border-4 border-black dark:border-white py-3 text-center font-bebas text-xl shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#000] transition-all no-color-transition flex items-center justify-center gap-2",
        copied
          ? "bg-[#d4ff00] text-black"
          : "bg-[#ff00ff] text-white",
      )}
      aria-label={`Share ${member.nick}'s profile`}
    >
      {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
      {copied ? "COPIED!" : "SHARE"}
    </button>
  );
}
