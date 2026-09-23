"use client";

import { useState, useRef, memo } from "react";
import dynamic from "next/dynamic";
import { StarField } from "./star-field";
import { StarGraphic, Marquee, BioText } from "./primitives";
import { UnavailablePhoto } from "./unavailable-photo";
import { MEMBERS, HARAPAN, type Member } from "@/lib/undimension/data";
import { useChaos } from "./chaos-provider";
import { useFetch } from "@/hooks/use-fetch";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useSfx } from "@/hooks/use-sfx";
import { useHashMember } from "@/hooks/use-hash-member";
import { UserRound, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy-load below-the-fold sections — they're NOT in the initial JS
// bundle. They load on-demand when the browser is near rendering them.
// This significantly reduces initial load time + improves LCP/INP.
const MemberDetailModal = dynamic(() => import("./member-detail-modal").then(m => m.MemberDetailModal), { ssr: false });
const GuestbookSection = dynamic(() => import("./guestbook-section").then(m => m.GuestbookSection), { ssr: false });
const TimelineSection = dynamic(() => import("./timeline-section").then(m => m.TimelineSection), { ssr: false });
const QuoteWidget = dynamic(() => import("./quote-widget").then(m => m.QuoteWidget), { ssr: false });
const StatsRadarSection = dynamic(() => import("./stats-radar-section").then(m => m.StatsRadarSection), { ssr: false });
const ManifestoSection = dynamic(() => import("./manifesto-section").then(m => m.ManifestoSection), { ssr: false });
const CompatibilityMatrix = dynamic(() => import("./compatibility-matrix").then(m => m.CompatibilityMatrix), { ssr: false });
const MissionControl = dynamic(() => import("./mission-control").then(m => m.MissionControl), { ssr: false });
const CosmicStarMap = dynamic(() => import("./cosmic-star-map").then(m => m.CosmicStarMap), { ssr: false });
const ChaosDice = dynamic(() => import("./chaos-dice").then(m => m.ChaosDice), { ssr: false });
const NewsPortal = dynamic(() => import("./news-portal").then(m => m.NewsPortal), { ssr: false });

function HeroSection() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="flex-1 flex flex-col justify-center">
          <div className="inline-block border-4 border-black dark:border-white bg-[#ff4d4d] text-white font-mono text-sm px-4 py-2 uppercase mb-8 w-max shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#fff] -rotate-2 no-color-transition">
            [ ESTABLISHED 2020 ]
          </div>
          <h1
            className="font-bebas text-6xl md:text-[140px] leading-[0.8] mb-8 uppercase text-black dark:text-white"
            style={{ textShadow: "8px 8px 0px #00e5ff" }}
          >
            WE ARE
            <br />
            <span
              className="text-black dark:text-white ud-glitch-hover cursor-pointer"
              data-text="UNDIMENSION"
              style={{
                textShadow:
                  "-4px -4px 0 #ff4d4d, 4px -4px 0 #ff4d4d, -4px 4px 0 #ff4d4d, 4px 4px 0 #ff4d4d, 12px 12px 0px #d4ff00",
              }}
            >
              UNDIMENSION
            </span>
          </h1>
          <p className="font-outfit text-lg md:text-2xl font-bold border-l-8 border-black dark:border-white pl-6 max-w-2xl bg-white dark:bg-[#1a1a1a] text-black dark:text-white p-6 shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#d4ff00] border-r-4 border-y-4 no-color-transition">
            Sebuah circle teman lama yang tak terikat ruang maupun waktu.
            Datang dari mimpi yang berbeda, namun melangkah di orbit yang sama.
          </p>
        </div>
        <div className="flex-1 w-full relative">
          <div className="border-4 border-black dark:border-white bg-black dark:bg-[#111] p-8 shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#ff4d4d] rotate-2 text-white no-color-transition hover:rotate-0 hover:scale-[1.02] transition-transform duration-300 ease-out ud-glow ud-grad-border ud-corners text-[#d4ff00]">
            <StarGraphic className="w-12 h-12 text-[#d4ff00] mb-6 animate-spin-slow" />
            <h2 className="font-bebas text-6xl mb-4">THE MISSION</h2>
            <p className="font-mono-ud text-lg mb-6 leading-relaxed">
              Menjadi konstanta di tengah variabel kehidupan. Gravitasi yang
              terus menarik kita kembali, sejauh apapun kita pergi.
            </p>
            <div className="border-t-4 border-white pt-6 flex flex-wrap gap-4">
              <span className="bg-[#00e5ff] text-black font-bold px-4 py-2 border-4 border-white shadow-[4px_4px_0_#fff]">
                SPACE
              </span>
              <span className="bg-[#d4ff00] text-black font-bold px-4 py-2 border-4 border-white shadow-[4px_4px_0_#fff]">
                TIME
              </span>
              <span className="bg-[#ff4d4d] text-white font-bold px-4 py-2 border-4 border-white shadow-[4px_4px_0_#fff]">
                BOND
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeBar() {
  return (
    <div className="border-y-8 border-black dark:border-white bg-[#d4ff00] py-6 mt-16 overflow-hidden flex -rotate-1 shadow-[0_10px_0_#000]">
      <Marquee
        text="ONE ORBIT • SEVEN STARS • BUILT WITH CHAOS • POWERED BY BONDS • UNDIMENSION • "
        className="text-black font-bebas text-7xl tracking-widest"
      />
    </div>
  );
}

const MemberCard = memo(function MemberCard({ m, i, onOpenMember }: { m: Member; i: number; onOpenMember: (m: Member) => void }) {
  const isEven = i % 2 === 0;
  return (
    <div
      className={cn(
        "relative w-full border-8 border-black dark:border-white p-6 md:p-12 z-10 group",
        m.color,
      )}
      data-reveal-delay={String((i % 3) * 80)}
    >
      {/* Giant Background Nickname */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 flex items-center justify-center opacity-30 mix-blend-color-burn pointer-events-none">
        <h2
          className={cn(
            "font-bebas text-[180px] md:text-[350px] leading-none text-black select-none",
            isEven ? "-rotate-6" : "rotate-6",
          )}
        >
          {m.nick}
        </h2>
      </div>

      <div
        className={cn(
          "relative z-10 flex flex-col gap-12 md:gap-0 items-center",
          isEven ? "md:flex-row" : "md:flex-row-reverse",
        )}
      >
        {/* Image Container */}
        <div
          className={cn(
            "w-full md:w-[60%] lg:w-[62%] relative transition-transform duration-300 ease-out z-30 group-hover:rotate-0 px-2 md:px-6 pt-16 md:pt-14 pb-10",
            isEven
              ? "rotate-6 md:-translate-x-4 md:-translate-y-8"
              : "-rotate-6 md:translate-x-4 md:-translate-y-8",
          )}
        >
          <div className="border-8 border-black dark:border-white bg-black p-3 shadow-[16px_16px_0_#000] dark:shadow-[16px_16px_0_#fff] relative">
            <div className="relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300 ease-out cursor-pointer" onClick={() => onOpenMember(m)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onOpenMember(m); }}>
              {m.img ? (
                <img
                  src={m.img}
                  alt={m.nick}
                  className="w-full aspect-[4/5] md:aspect-[9/16] object-cover grayscale contrast-[1.4] group-hover:grayscale-0 transition-all duration-300 ud-wobble-hover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[4/5] md:aspect-[9/16]">
                  <UnavailablePhoto
                    label={`NO PHOTO — ${m.nick.toUpperCase()}`}
                    nick={m.nick}
                    color={(m.color.match(/#[0-9a-fA-F]{6}/) || ["#ff8c00"])[0]}
                  />
                </div>
              )}
              <div className="absolute inset-0 ud-scanlines pointer-events-none" />
            </div>
            {/* Tape Sticker */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#ffea00] border-4 border-black px-6 py-2 md:px-10 md:py-3 font-mono-ud font-black text-black text-xl md:text-4xl shadow-[6px_6px_0_#000] -rotate-3 z-40 whitespace-nowrap">
              &ldquo;{m.nick.toUpperCase()}&rdquo;
            </div>
            <div className="absolute -bottom-6 right-0 bg-white border-4 border-black px-4 py-2 font-bebas text-3xl shadow-[4px_4px_0_#000] rotate-6 z-40">
              ID_00{i + 1}
            </div>
          </div>
        </div>

        {/* Info Container */}
        <div
          className={cn(
            "w-full md:w-[40%] lg:w-[38%] flex flex-col z-20",
            isEven ? "md:pl-12" : "md:pr-12",
          )}
        >
          {/* Full Name Barcode Tag — pushed up slightly for more gap with bio */}
          <div className="bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white p-6 shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#fff] -rotate-1 no-color-transition md:-mt-6 mb-16">
            <h3 className="font-bebas text-6xl md:text-8xl leading-[0.8] mb-2">
              {m.name}
            </h3>
            <div className="w-full h-4 ud-barcode mt-4" />
          </div>

          {/* Role & Bio Sheet */}
          <div className="bg-white dark:bg-black border-4 border-black dark:border-white p-8 shadow-[12px_12px_0_#000] dark:shadow-[12px_12px_0_#fff] rotate-2 relative no-color-transition">
            <div className="absolute -top-5 -right-5 w-10 h-10 rounded-full bg-red-600 border-4 border-black shadow-[4px_4px_0_#000]" />
            <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-black dark:bg-white" />

            <h4 className="font-mono-ud font-black text-3xl mb-6 bg-black text-white dark:bg-white dark:text-black inline-block px-4 py-2">
              {m.role}
            </h4>
            <p className="font-outfit font-bold text-xl text-black dark:text-white leading-relaxed">
              <BioText highlightClass={m.highlight}>{m.bio}</BioText>
            </p>

            {/* D&D Stats Blocks */}
            <div className="mt-8 flex flex-wrap gap-2 border-t-8 border-black dark:border-white pt-6">
              {m.stats.map((stat, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "border-4 border-black dark:border-white px-3 py-1 font-bebas text-xl md:text-2xl",
                    idx % 2 === 1
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-white text-black dark:bg-black dark:text-white",
                  )}
                >
                  {stat.label}: {stat.value}
                </span>
              ))}
            </div>
          </div>

          {/* View Profile Button */}
          <div className="mt-10 -rotate-1">
            <button
              onClick={() => onOpenMember(m)}
              className={cn(
                "w-full md:w-auto bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white py-4 px-8 font-bebas text-2xl md:text-3xl shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#fff] hover:translate-y-1 hover:translate-x-1 hover:shadow-[0_0_0_#000] transition-all no-color-transition flex items-center justify-center gap-3",
              )}
            >
              <UserRound className="w-6 h-6" />
              VIEW FULL DOSSIER
              <span className="font-mono-ud text-sm opacity-60">[+]</span>
            </button>
          </div>

          {/* Social Buttons */}
          <div className="mt-6 flex gap-4 md:gap-6 -rotate-1">
            {m.socials.map((social) => (
              <a
                href={social.href}
                key={social.label}
                className="flex-1 bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white py-4 text-center font-bebas text-2xl md:text-3xl shadow-[8px_8px_0_#000] dark:shadow-[8px_8px_0_#fff] hover:translate-y-2 hover:translate-x-2 hover:shadow-[0_0_0_#000] transition-all no-color-transition"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const TheCollective = memo(function TheCollective({ members, onOpenMember, lastOpenedIdRef }: { members: Member[]; onOpenMember: (m: Member) => void; lastOpenedIdRef: React.RefObject<string | null> }) {
  const randomMember = () => {
    const lastId = lastOpenedIdRef.current;
    const pool = members.filter((m) => m.id !== lastId);
    const pick = pool.length > 0 ? pool : members;
    const m = pick[Math.floor(Math.random() * pick.length)];
    onOpenMember(m);
  };
  return (
    <div className="bg-white dark:bg-[#1a1a1a] py-32 px-6 md:px-12 border-b-8 border-black dark:border-white relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-40 relative">
          <h2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bebas text-[150px] md:text-[300px] text-black/5 dark:text-white/5 pointer-events-none w-[150%] select-none">
            WHO WE ARE
          </h2>
          <h2
            className="font-bebas text-8xl md:text-[150px] uppercase text-black dark:text-white relative z-10 ud-reveal ud-glitch-hover cursor-pointer"
            data-text="THE COLLECTIVE"
            style={{ textShadow: "10px 10px 0px #00e5ff" }}
          >
            THE COLLECTIVE
          </h2>
          <p className="font-mono-ud font-black text-2xl mt-4 bg-black text-[#d4ff00] dark:bg-[#d4ff00] dark:text-black inline-block px-8 py-3 border-4 border-black dark:border-white shadow-[8px_8px_0_#ff4d4d] rotate-2 relative z-10">
            Mengenal Entitas di Balik Anomali Ini
          </p>
          <p className="font-mono-ud text-sm text-black/50 dark:text-white/50 mt-4 max-w-md mx-auto">
            Klik foto atau tombol <span className="font-bold">VIEW FULL DOSSIER</span> untuk membuka profil lengkap tiap entitas.
          </p>
          <button
            onClick={randomMember}
            className="mt-6 inline-flex items-center gap-2 bg-[#ff00ff] text-white border-4 border-black dark:border-white font-bebas text-2xl px-6 py-3 shadow-[6px_6px_0_#000] dark:shadow-[6px_6px_0_#fff] hover:-translate-y-1 hover:shadow-[8px_8px_0_#d4ff00] transition-all no-color-transition"
          >
            <Shuffle className="w-5 h-5" /> RANDOM ENTITY
          </button>
        </div>

        <div className="flex flex-col gap-32 md:gap-48 mt-20">
          {members.map((m, i) => (
            <MemberCard key={m.id} m={m} i={i} onOpenMember={onOpenMember} />
          ))}
        </div>
      </div>
    </div>
  );
});

function HarapanCardItem({ card }: { card: (typeof HARAPAN)[number] }) {
  return (
    <div className={cn("relative transform hover:rotate-0 hover:scale-[1.02] hover:z-50 transition-transform duration-300 ease-out group ud-tilt ud-reveal ud-tape", card.rotate)}>
      <div className={cn("border-8 border-black relative", card.bg, card.shadow)}>
        {/* Circular stamp decoration */}
        <div className="ud-stamp-circle absolute -top-3 -left-3 z-20 text-[#ff4d4d] hidden md:flex">
          <span className="font-bebas text-[10px] text-center leading-tight">
            {card.stamp.split("_")[0]}<br/>{card.stamp.split("_")[1]}
          </span>
        </div>
        <div className="border-b-8 border-black overflow-hidden relative">
          <img
            src={card.img}
            alt={card.title}
            className="w-full aspect-[4/3] object-cover grayscale group-hover:grayscale-0 contrast-125 transition-all duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 ud-scanlines opacity-60" />
          <div className="absolute top-3 left-3 bg-[#ff4d4d] border-4 border-black px-3 py-1 font-mono-ud font-black text-white text-xs shadow-[4px_4px_0_#000] -rotate-6">
            {card.stamp}
          </div>
        </div>
        <div className="p-6">
          <h3
            className="font-bebas text-5xl text-black leading-none mb-3"
            style={{ textShadow: "3px 3px 0 #fff" }}
          >
            {card.title}
          </h3>
          <div className="border-4 border-black bg-black p-4 shadow-[6px_6px_0_#ff4d4d] mb-4">
            <p className="font-mono-ud font-black text-white text-sm leading-relaxed">
              {card.quote}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <div className="w-24 h-1 bg-black" />
            <span className="font-mono-ud font-black text-black text-xs tracking-[0.3em]">
              {card.author}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HarapanSection() {
  return (
    <div className="relative bg-[#09090b] py-32 px-6 md:px-12 border-t-8 border-black dark:border-white overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-bebas text-[200px] md:text-[400px] text-white/[0.03] whitespace-nowrap leading-none">
          HARAPAN
        </span>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20 relative">
          <div className="inline-block relative">
            <span className="absolute -top-4 -left-4 font-mono-ud text-[#d4ff00] text-sm font-black tracking-[0.3em] uppercase">
              § 03 —
            </span>
            <h2
              className="font-bebas text-7xl md:text-[180px] leading-none uppercase text-white"
              style={{ textShadow: "8px 8px 0px #ff4d4d, 16px 16px 0px #00e5ff" }}
            >
              HARAPAN
              <br />
              KAMI
            </h2>
          </div>
          <div className="absolute top-8 right-0 hidden md:flex flex-col items-end gap-2">
            <div className="w-32 h-2 bg-[#d4ff00]" />
            <div className="w-20 h-2 bg-[#ff4d4d]" />
            <div className="w-12 h-2 bg-[#00e5ff]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 relative">
          {HARAPAN.map((card) => (
            <HarapanCardItem key={card.id} card={card} />
          ))}
        </div>

        <div className="mt-24 border-t-8 border-white pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p
            className="font-bebas text-5xl md:text-7xl text-white uppercase"
            style={{ textShadow: "4px 4px 0 #ff4d4d" }}
          >
            Satu orbit.
            <br className="md:hidden" /> Satu gravitasi.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-[#d4ff00] border-4 border-white" />
            <div className="w-8 h-8 bg-[#ff4d4d] border-4 border-white" />
            <div className="w-8 h-8 bg-[#00e5ff] border-4 border-white" />
            <div className="w-8 h-8 bg-[#ff00ff] border-4 border-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutPage() {
  // Fetch members from API (DB-backed) with static fallback
  const { data: membersData } = useFetch<{ members: Member[] }>("/api/members");
  // Hidden members (like Nayla) only show when the user has toggled the
  // navbar shuffle (chaos) at least once in this session. NOT godMode/Konami.
  const { naylaRevealed } = useChaos();
  const allMembers = membersData?.members ?? MEMBERS;
  const members = allMembers.filter((m) => !m.hidden || naylaRevealed);

  const [selected, setSelected] = useState<Member | null>(null);
  const lastOpenedIdRef = useRef<string | null>(null);
  useScrollReveal();
  const { play } = useSfx();

  const openMember = (m: Member) => {
    play("open");
    lastOpenedIdRef.current = m.id;
    setSelected(m);
  };
  const closeModal = () => {
    play("close");
    setSelected(null);
    document.body.classList.remove("modal-open");
  };

  useHashMember((id) => {
    const m = members.find((x) => x.id === id);
    if (m) openMember(m);
  });

  return (
    <div className="page-enter bg-[#f4f4f0] dark:bg-[#09090b] pt-28 md:pt-36 min-h-screen relative overflow-hidden">
      <StarField variant="adaptive" className="fixed z-[1]" />
      <HeroSection />
      <MarqueeBar />
      <TheCollective members={members} onOpenMember={openMember} lastOpenedIdRef={lastOpenedIdRef} />
      <div className="ud-cv-auto"><StatsRadarSection /></div>
      <div className="ud-cv-auto"><TimelineSection /></div>
      <div className="ud-cv-auto"><CompatibilityMatrix /></div>
      <HarapanSection />
      <div className="ud-cv-auto"><ManifestoSection /></div>
      <div className="ud-cv-auto"><CosmicStarMap /></div>
      {/* Two-up: QuoteWidget (always dark) + ChaosDice (always dark). */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t-8 border-black dark:border-white ud-cv-auto">
        <div className="border-b-4 lg:border-b-0 lg:border-r-4 border-black dark:border-white">
          <QuoteWidget />
        </div>
        <div className="bg-[#09090b] p-6 md:p-12 flex items-center justify-center">
          <ChaosDice />
        </div>
      </div>
      <div className="ud-cv-auto"><MissionControl /></div>
      <div className="ud-cv-auto"><NewsPortal /></div>
      <div className="ud-cv-auto"><GuestbookSection /></div>
      <MemberDetailModal member={selected} onClose={closeModal} />
    </div>
  );
}
