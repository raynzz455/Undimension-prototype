"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "./star-field";
import { StarGraphic, BioText } from "./primitives";
import { MEMBERS, type Member, type PortfolioProject } from "@/lib/undimension/data";
import { useChaos } from "./chaos-provider";
import { MEMBER_CV } from "@/lib/undimension/cv-data";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useSfx } from "@/hooks/use-sfx";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import {
  Github, ExternalLink, Code2, Gamepad2, Smartphone, Wrench, Bot, Package,
  Briefcase, GraduationCap, Award, MapPin, Clock, ChevronLeft, ChevronRight,
  X, Trophy,
} from "lucide-react";
import { UnavailablePhoto } from "./unavailable-photo";
import type { Achievement } from "@/lib/undimension/data";
import { useFocusTrap } from "@/hooks/use-focus-trap";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WEB: Code2,
  GAME: Gamepad2,
  MOBILE: Smartphone,
  TOOL: Wrench,
  BOT: Bot,
  OTHER: Package,
};

const STATUS_COLORS: Record<string, string> = {
  LIVE: "#00ff00",
  WIP: "#ff8c00",
  ARCHIVED: "#666666",
};

const AVAILABILITY_COLORS: Record<string, string> = {
  "EMPLOYED": "#00e5ff",
  "OPEN TO WORK": "#00ff00",
  "FREELANCE": "#ff00ff",
};

const SKILL_CATEGORY_COLORS: Record<string, string> = {
  LANGUAGE: "#ff4d4d",
  FRAMEWORK: "#00e5ff",
  TOOL: "#d4ff00",
  SOFT: "#ff00ff",
};

function MemberSelector({
  members,
  selectedId,
  onSelect,
}: {
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { play } = useSfx();
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {members.map((m) => {
        const active = m.id === selectedId;
        return (
          <button
            key={m.id}
            onClick={() => { play("click"); onSelect(m.id); }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border-4 border-black dark:border-white font-bebas text-lg tracking-wider transition-all no-color-transition",
              active ? "text-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] scale-105" : "bg-white dark:bg-black text-black dark:text-white hover:-translate-y-0.5",
            )}
            style={active ? { backgroundColor: m.color.replace("bg-[", "").replace("]", "") } : undefined}
          >
            <span
              className="w-3 h-3 border-2 border-black dark:border-white flex-shrink-0"
              style={{ backgroundColor: m.color.replace("bg-[", "").replace("]", "") }}
            />
            {m.nick.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

function SkillBar({ name, level, category }: { name: string; level: number; category: string }) {
  const color = SKILL_CATEGORY_COLORS[category] || "#fff";
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono-ud text-xs font-bold text-black/60 dark:text-white/60 min-w-[80px] tracking-wider flex-shrink-0">
        {category}
      </span>
      <span className="font-mono-ud text-sm font-bold text-black dark:text-white min-w-[100px] truncate flex-shrink-0">
        {name}
      </span>
      <div className="flex-1 min-w-[60px] h-3 border-2 border-black dark:border-white bg-white dark:bg-black overflow-hidden">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="font-mono-ud text-sm font-black w-8 text-right" style={{ color }}>
        {level}
      </span>
    </div>
  );
}

function ProjectMini({ p }: { p: PortfolioProject }) {
  const Icon = CATEGORY_ICONS[p.category] || Package;
  const statusColor = STATUS_COLORS[p.status];
  return (
    <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-4 shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] hover:-translate-y-1 transition-transform group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white flex-shrink-0"
          style={{ backgroundColor: p.color }}
        >
          <Icon className="w-5 h-5 text-black" />
        </div>
        <span
          className="font-mono-ud text-xs font-black px-1.5 py-0.5 border"
          style={{ color: statusColor, borderColor: statusColor }}
        >
          {p.status}
        </span>
      </div>
      <h4 className="font-bebas text-xl text-black dark:text-white leading-none mb-1">{p.title}</h4>
      <p className="font-mono-ud text-sm text-black/60 dark:text-white/60 mb-2 line-clamp-2">{p.description}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {p.tech.map((t) => (
          <span key={t} className="font-mono-ud text-xs font-bold px-1 py-0.5 border border-black dark:border-white bg-black/5 dark:bg-white/5 text-black dark:text-white">
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-t-2 border-black dark:border-white pt-2">
        <span className="font-mono-ud text-sm text-black/50 dark:text-white/50">{p.year}</span>
        <div className="flex gap-1">
          {p.repo && (
            <a href={p.repo} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white hover:bg-[#d4ff00] hover:text-black transition-colors">
              <Github className="w-3 h-3" />
            </a>
          )}
          {p.link && (
            <a href={p.link} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center bg-[#00e5ff] text-black border border-black dark:border-white hover:bg-[#ff4d4d] hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementImageCarousel({ images, color }: { images: string[]; color: string }) {
  const [idx, setIdx] = useState(0);

  const next = () => setIdx((p) => (p + 1) % images.length);
  const prev = () => setIdx((p) => (p - 1 + images.length) % images.length);

  return (
    <div className="mb-4 border-4 border-black dark:border-white bg-black overflow-hidden relative">
      <div className="font-mono-ud text-sm font-black tracking-[0.2em] uppercase text-white/60 px-3 py-1 border-b-2 border-white/20 flex items-center justify-between">
        <span>▸ EVIDENCE / CERTIFICATE</span>
        <span>{idx + 1}/{images.length}</span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={images[idx]}
          alt={`Achievement evidence ${idx + 1}`}
          className="w-full h-full object-cover"
          key={idx}
        />
        <div className="absolute inset-0 ud-scanlines opacity-20 pointer-events-none" />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/70 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/70 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {/* Dots */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1 py-1.5 bg-black">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={cn(
                "w-2 h-2 border border-white transition-colors",
                i === idx ? "bg-white" : "bg-transparent",
              )}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementModal({
  achievement,
  memberColor,
  onClose,
}: {
  achievement: Achievement | null;
  memberColor: string;
  onClose: () => void;
}) {
  const open = achievement !== null;
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

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

  // Hide navbar when modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => { document.body.classList.remove("modal-open"); };
  }, [open]);

  return (
    <AnimatePresence>
      {open && achievement && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          {/* Relative wrapper */}
          <div className="relative w-full max-w-md">
            {/* X Close */}
            <button
              onClick={onClose}
              className="absolute -top-4 -right-4 z-30 w-10 h-10 flex items-center justify-center bg-[#ff4d4d] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_#000] dark:shadow-[4px_4px_0_#fff] hover:rotate-90 transition-transform no-color-transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ud-achievement-title"
            tabIndex={-1}
            className="relative w-full max-h-[90vh] overflow-y-auto border-8 border-black dark:border-white bg-white dark:bg-[#09090b] shadow-[8px_8px_0_#000] md:shadow-[16px_16px_0_#000] dark:md:shadow-[16px_16px_0_#d4ff00] outline-none"
            initial={{ scale: 0.85, y: 30, rotate: -2 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.85, y: 30, rotate: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onAnimationComplete={() => {
              if (panelRef.current) panelRef.current.scrollTop = 0;
            }}
          >

            {/* Colored header banner */}
            <div className="p-6 border-b-8 border-black dark:border-white" style={{ backgroundColor: memberColor }}>
              <div className="flex items-center justify-center mb-2">
                <div className="w-16 h-16 flex items-center justify-center bg-black border-4 border-black">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="font-mono-ud text-sm font-black tracking-[0.3em] uppercase text-black/60 text-center">
                ▸ ACHIEVEMENT UNLOCKED
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <h3
                id="ud-achievement-title"
                className="font-bebas text-4xl md:text-5xl text-black dark:text-white leading-none mb-2 text-center"
              >
                {achievement.title}
              </h3>
              <div className="font-mono-ud text-xs font-black text-black/50 dark:text-white/50 tracking-widest mb-4 text-center">
                ◆ {achievement.year} ◆
              </div>
              <div className="border-4 border-black dark:border-white bg-black dark:bg-white p-4 mb-4">
                <p className="font-mono-ud text-sm text-white dark:text-black leading-relaxed text-center">
                  {achievement.description}
                </p>
              </div>
              {/* Achievement photo carousel (sertifikat, medali, foto kemenangan) */}
              {achievement.images && achievement.images.length > 0 && (
                <AchievementImageCarousel images={achievement.images} color={memberColor} />
              )}
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MemberPortfolio({ member }: { member: Member }) {
  const staticCv = MEMBER_CV[member.id];
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const { play } = useSfx();

  // Fetch DB achievements for this member (with images)
  const { data: achievementsData } = useFetch<{ achievements: { id: string; memberId: string; title: string; year: string; description: string; images: { id: string; img: string }[] }[] }>(`/api/achievements?memberId=${member.id}`);

  const workHistory = member.workHistory?.length ? member.workHistory : (staticCv?.workHistory || []);
  const education = member.education?.length ? member.education : (staticCv?.education || []);
  const skills = member.skills?.length ? member.skills : (staticCv?.skills || []);
  const taglineCareer = member.taglineCareer || staticCv?.taglineCareer || "";
  const location = member.location || staticCv?.location || "";
  const availability = member.availability || staticCv?.availability || "EMPLOYED";
  const projects = staticCv?.projects || [];

  if (!staticCv && !member.workHistory && !member.education) return null;

  // Merge: DB achievements (with photos) + static CV achievements.
  // DB returns { id, img }[] for images; flatten to URL strings for the
  // Achievement type (which expects string[] for carousel display).
  const dbAchievements: Achievement[] = (achievementsData?.achievements ?? []).map((a) => ({
    title: a.title,
    year: a.year,
    description: a.description,
    images: a.images.map((img) => img.img),
  }));
  const allAchievements = [...dbAchievements, ...(staticCv?.achievements || [])];

  const memberColor = member.color.replace("bg-[", "").replace("]", "");
  const availColor = AVAILABILITY_COLORS[availability] || "#00e5ff";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={member.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header card */}
        <div className="border-8 border-black dark:border-white bg-white dark:bg-[#09090b] shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#fff] overflow-hidden">
          <div className={cn("p-6 md:p-8 border-b-8 border-black dark:border-white", member.color)}>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Big Photo */}
              <div className="border-8 border-black bg-black p-2 shadow-[12px_12px_0_#000] flex-shrink-0 w-full md:w-64 lg:w-72 relative">
                {member.img ? (
                  <img
                    src={member.img}
                    alt={member.nick}
                    className="w-full aspect-[4/5] object-cover"
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
                <div className="absolute inset-2 ud-scanlines opacity-30 pointer-events-none" />
                {/* Nick sticker */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#ffea00] border-4 border-black px-6 py-1.5 font-mono-ud font-black text-black text-2xl shadow-[4px_4px_0_#000] -rotate-2 whitespace-nowrap">
                  &ldquo;{member.nick.toUpperCase()}&rdquo;
                </div>
              </div>
              {/* Info */}
              <div className="flex-1 text-black pt-4 md:pt-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono-ud text-xs font-black bg-black text-white px-2 py-1 border-2 border-black">
                    ID_{member.id.toUpperCase()}
                  </span>
                  <span
                    className="font-mono-ud text-xs font-black px-2 py-1 border-2 border-black"
                    style={{ backgroundColor: availColor, color: "#000" }}
                  >
                    ● {availability}
                  </span>
                </div>
                <h2 className="font-bebas text-5xl md:text-7xl leading-none">{member.name}</h2>
                <p className="font-mono-ud text-base md:text-lg font-bold mt-1">{taglineCareer}</p>
                <div className="flex items-center gap-4 mt-3 font-mono-ud text-sm md:text-base">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />EST. {member.joinYear}</span>
                </div>
                {/* If bioPortfolio is set, show it INSTEAD of the about-page bio (plain text, no markdown).
                    Otherwise, show the about-page bio (with member's highlight color via **bold**). */}
                {member.bioPortfolio ? (
                  <p className="font-outfit text-base md:text-xl mt-4 max-w-xl leading-relaxed">{member.bioPortfolio}</p>
                ) : (
                  <p className="font-outfit text-base md:text-xl mt-4 max-w-xl leading-relaxed"><BioText highlightClass={member.highlight}>{member.bio}</BioText></p>
                )}
                {/* Socials */}
                {member.socials && member.socials.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {member.socials.map((s, i) => (
                      <a
                        key={i}
                        href={s.href && s.href !== "#" ? s.href : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white font-mono-ud text-xs md:text-sm font-bold transition-all no-color-transition",
                          s.href && s.href !== "#"
                            ? "bg-black text-white dark:bg-white dark:text-black hover:bg-[#ff4d4d] hover:text-white hover:border-[#ff4d4d]"
                            : "bg-black/5 dark:bg-white/5 text-black/30 dark:text-white/30 cursor-default"
                        )}
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-col: Experience + Education */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Work History */}
          <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-5 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff]">
            <h3 className="font-bebas text-4xl text-black dark:text-white mb-4 flex items-center gap-2 border-b-4 border-black dark:border-white pb-2">
              <Briefcase className="w-6 h-6" style={{ color: memberColor }} />
              WORK EXPERIENCE
            </h3>
            <div className="space-y-4">
              {workHistory.map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-4 border-l-2 border-black dark:border-white"
                >
                  {w.current && (
                    <span className="absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-black dark:border-white animate-pulse" style={{ backgroundColor: memberColor }} />
                  )}
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="font-bebas text-xl text-black dark:text-white leading-none">{w.role}</span>
                    <span className="font-mono-ud text-sm text-black/50 dark:text-white/50">{w.period}</span>
                  </div>
                  <p className="font-mono-ud text-xs font-bold" style={{ color: memberColor }}>{w.company}</p>
                  <p className="font-mono-ud text-sm text-black/70 dark:text-white/70 mt-1">{w.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-5 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff]">
            <h3 className="font-bebas text-4xl text-black dark:text-white mb-4 flex items-center gap-2 border-b-4 border-black dark:border-white pb-2">
              <GraduationCap className="w-6 h-6" style={{ color: memberColor }} />
              EDUCATION
            </h3>
            <div className="space-y-4">
              {education.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-4 border-l-2 border-black dark:border-white"
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="font-bebas text-xl text-black dark:text-white leading-none">{e.degree}</span>
                    <span className="font-mono-ud text-sm text-black/50 dark:text-white/50">{e.period}</span>
                  </div>
                  <p className="font-mono-ud text-xs font-bold" style={{ color: memberColor }}>{e.school}</p>
                  {e.description && <p className="font-mono-ud text-sm text-black/70 dark:text-white/70 mt-1">{e.description}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-5 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff]">
          <h3 className="font-bebas text-4xl text-black dark:text-white mb-4 flex items-center gap-2 border-b-4 border-black dark:border-white pb-2">
            <Code2 className="w-6 h-6" style={{ color: memberColor }} />
            SKILLS MATRIX
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {skills.map((s, i) => (
              <SkillBar key={i} name={s.name} level={s.level} category={s.category} />
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t-2 border-black dark:border-white">
            {Object.entries(SKILL_CATEGORY_COLORS).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-black dark:border-white" style={{ backgroundColor: color }} />
                <span className="font-mono-ud text-sm font-bold text-black/60 dark:text-white/60 tracking-wider">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-5 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff]">
          <h3 className="font-bebas text-4xl text-black dark:text-white mb-4 flex items-center gap-2 border-b-4 border-black dark:border-white pb-2">
            <Award className="w-6 h-6" style={{ color: memberColor }} />
            ACHIEVEMENTS
            <span className="ml-auto font-mono-ud text-sm text-black/40 dark:text-white/40">▸ CLICK TO EXPAND</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {allAchievements.map((a, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => { play("open"); setSelectedAchievement(a); }}
                className="border-2 border-black dark:border-white p-3 bg-black/5 dark:bg-white/5 text-left cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors relative group"
                style={{ borderLeftWidth: "4px", borderLeftColor: memberColor }}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <div className="font-bebas text-3xl text-black dark:text-white leading-none">{a.title}</div>
                  <div className="flex items-center gap-1">
                    {a.images && a.images.length > 0 && (
                      <span className="font-mono-ud text-xs font-black px-1 border border-black dark:border-white bg-[#d4ff00] text-black" title="Has photos">
                        📷 {a.images.length}
                      </span>
                    )}
                    <Trophy className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: memberColor }} />
                  </div>
                </div>
                <div className="font-mono-ud text-sm text-black/50 dark:text-white/50 mb-1">{a.year}</div>
                <p className="font-mono-ud text-sm text-black/70 dark:text-white/70 leading-relaxed line-clamp-2">{a.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1a1a1a] p-5 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff]">
          <h3 className="font-bebas text-4xl text-black dark:text-white mb-4 flex items-center gap-2 border-b-4 border-black dark:border-white pb-2">
            <Package className="w-6 h-6" style={{ color: memberColor }} />
            PROJECTS ({projects.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectMini key={p.id} p={p} />
            ))}
          </div>
        </div>

        {/* Achievement popup modal */}
        <AchievementModal
          achievement={selectedAchievement}
          memberColor={memberColor}
          onClose={() => { play("close"); document.body.classList.remove("modal-open"); setSelectedAchievement(null); }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export function PortfolioPage() {
  // Fetch members from API (DB-backed) with static fallback
  const { data: membersData } = useFetch<{ members: Member[] }>("/api/members");
  // Hidden members show when the user has toggled navbar shuffle (chaos)
  // at least once in this session. NOT godMode/Konami.
  const { naylaRevealed } = useChaos();
  const allMembers = membersData?.members ?? MEMBERS;
  const members = allMembers.filter((m) => !m.hidden || naylaRevealed);
  const [selectedId, setSelectedId] = useState("aldi");
  useScrollReveal();

  const selected = useMemo(() => members.find((m) => m.id === selectedId) ?? members[0] ?? MEMBERS[0]!, [selectedId, members]);

  const goPrev = () => {
    const idx = members.findIndex((m) => m.id === selectedId);
    setSelectedId(members[(idx - 1 + members.length) % members.length].id);
  };
  const goNext = () => {
    const idx = members.findIndex((m) => m.id === selectedId);
    setSelectedId(members[(idx + 1) % members.length].id);
  };

  return (
    <div className="page-enter bg-[#8a2be2]/10 dark:bg-[#09090b] pt-28 md:pt-36 pb-24 min-h-screen relative overflow-hidden">
      <StarField variant="adaptive" className="fixed z-[1]" />

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        {/* Hero */}
        <div className="bg-white dark:bg-[#09090b] border-4 border-black dark:border-white shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#8a2be2] p-6 md:p-10 mb-6 relative no-color-transition">
          <StarGraphic className="absolute top-4 right-4 w-12 h-12 text-[#8a2be2] animate-spin-slow" />
          <h1
            className="font-bebas text-5xl md:text-[100px] leading-none uppercase text-black dark:text-white"
            style={{ textShadow: "6px 6px 0px #8a2be2" }}
          >
            <span className="text-[#8a2be2] ud-glitch-hover cursor-pointer" data-text="PORTFOLIO">
              PORTFOLIO
            </span>
          </h1>
          <p className="font-mono-ud text-base md:text-lg font-bold mt-4 max-w-2xl bg-[#8a2be2] text-white border-4 border-black p-3 inline-block shadow-[4px_4px_0_#000]">
            Bukan cuma player. Kami juga builder. Pilih entitas untuk lihat profil lengkapnya.
          </p>
          <div className="mt-4 font-mono-ud text-sm text-black/60 dark:text-white/60">
            ▸ {members.length} ENTITIES · CV + PROJECTS + ACHIEVEMENTS
          </div>
        </div>

        {/* Member selector */}
        <div className="bg-white dark:bg-[#09090b] border-4 border-black dark:border-white shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#8a2be2] p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-ud text-sm font-black tracking-[0.2em] uppercase text-black/50 dark:text-white/50">
              ▸ SELECT ENTITY
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="w-8 h-8 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-[#8a2be2] hover:text-white transition-colors no-color-transition"
                aria-label="Previous member"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goNext}
                className="w-8 h-8 flex items-center justify-center bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white hover:bg-[#8a2be2] hover:text-white transition-colors no-color-transition"
                aria-label="Next member"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <MemberSelector members={members} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* Member portfolio */}
        <MemberPortfolio member={selected} />
      </div>
    </div>
  );
}
