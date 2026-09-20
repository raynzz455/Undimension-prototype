"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload, Loader2, Image as ImageIcon, LogOut, Shield, Zap,
  FolderOpen, Award, Settings, Newspaper, MessageSquare,
  Trash2, Edit3, Pin, PinOff, CheckCircle, XCircle, X,
  Users, Plus, Quote as QuoteIcon, RefreshCw, History,
} from "lucide-react";
import { StarField } from "./star-field";
import { useFetch } from "@/hooks/use-fetch";
import { useChaosFetch } from "@/hooks/use-chaos-fetch";
import { useSfx } from "@/hooks/use-sfx";
import { cn } from "@/lib/utils";
import type { GalleryPhoto, Member } from "@/lib/undimension/data";

type Tab = "about" | "gallery" | "news" | "guestbook" | "portfolio" | "games" | "info";

// Actual member slugs (from data.ts `id` field — used as DB FK).
// NOTE: the old list used nicks (rembo, eja, byan, acong, tipki) which are NOT
// the slugs — that was a bug causing FK violations. Fixed to real slugs.
const MEMBER_SLUGS = ["aldi", "razka", "reza", "abyan", "rasya", "rifqi", "dudit"];
const PORTFOLIO_CATEGORIES = ["WEB", "GAME", "MOBILE", "TOOL", "BOT", "OTHER"];
const PORTFOLIO_STATUSES = ["LIVE", "WIP", "ARCHIVED"];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAOS MODE PAGE
// ═══════════════════════════════════════════════════════════════════════════
function ChaosModePage({ onExit }: { onExit: () => void }) {
  const [tab, setTab] = useState<Tab>("about");
  const { play } = useSfx();

  const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "about", label: "ABOUT", icon: Users },
    { key: "gallery", label: "GALLERY", icon: ImageIcon },
    { key: "news", label: "NEWS", icon: Newspaper },
    { key: "guestbook", label: "GUESTBOOK", icon: MessageSquare },
    { key: "portfolio", label: "PORTFOLIO", icon: FolderOpen },
    { key: "games", label: "GAMES", icon: Plus },
    { key: "info", label: "INFO", icon: Settings },
  ];

  return (
    <div className="page-enter bg-[#09090b] min-h-screen relative overflow-hidden pt-24 pb-12">
      <StarField variant="dark" className="fixed z-[1]" />
      <div className="ud-grain" aria-hidden />

      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#ff00ff] text-white border-b-4 border-black px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          <span className="font-bebas text-xl tracking-widest">⚡ CHAOS MODE — MEMBER AREA</span>
        </div>
        <button onClick={() => { play("close"); onExit(); }}
          className="flex items-center gap-1 bg-black text-white font-mono-ud text-xs font-black px-3 py-1.5 border-2 border-white hover:bg-[#ff4d4d] transition-colors no-color-transition">
          <LogOut className="w-3 h-3" /> EXIT
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#d4ff00] text-black font-mono-ud text-xs font-black px-3 py-1 border-4 border-black mb-3">
            <Zap className="w-4 h-4" /> GOD MODE ACTIVE
          </div>
          <h1 className="font-bebas text-5xl md:text-[80px] leading-none uppercase text-white" style={{ textShadow: "4px 4px 0px #ff00ff, 8px 8px 0px #00e5ff" }}>
            CHAOS MODE
          </h1>
          <p className="font-mono-ud text-xs text-white/60 mt-1 tracking-wider">
            ▸ MEMBER-ONLY · CRUD MANAGEMENT · ALL IN ONE
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-6 border-4 border-[#ff00ff] bg-black p-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { play("click"); setTab(t.key); }}
                className={cn("flex items-center gap-2 px-4 py-2 border-2 font-bebas text-lg tracking-wider transition-all no-color-transition",
                  tab === t.key ? "bg-[#ff00ff] text-white border-white" : "bg-transparent text-white/50 border-white/20 hover:text-white hover:border-white/50")}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "about" && (<><MembersTab /><QuotesSection /></>)}
        {tab === "gallery" && <GalleryTab />}
        {tab === "news" && <NewsTab />}
        {tab === "guestbook" && <GuestbookTab />}
        {tab === "portfolio" && (<><PortfolioTab /><AchievementsTab /></>)}
        {tab === "games" && <GamesTab />}
        {tab === "info" && <InfoTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMBERS TAB — Full member profile + CV editing
// ═══════════════════════════════════════════════════════════════════════════
function MembersTab() {
  const { data, refetch } = useFetch<{ members: Member[] }>("/api/members");
  const { chaosFetch } = useChaosFetch();
  const { play } = useSfx();
  const members = data?.members ?? [];

  const [selectedSlug, setSelectedSlug] = useState("");
  const [name, setName] = useState("");
  const [nick, setNick] = useState("");
  const [role, setRole] = useState("");
  const [img, setImg] = useState("");
  const [color, setColor] = useState("#ff4d4d");
  const [highlight, setHighlight] = useState("#ff4d4d");
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [quote, setQuote] = useState("");
  const [element, setElement] = useState("");
  const [joinYear, setJoinYear] = useState("2020");
  const [stats, setStats] = useState<{ label: string; value: string }[]>(
    Array.from({ length: 6 }, (_, i) => ({ label: ["STR","DEX","CON","INT","WIS","CHA"][i] ?? "", value: "10" }))
  );
  const [socials, setSocials] = useState<{ label: string; href: string }[]>(Array.from({ length: 3 }, () => ({ label: "", href: "" })));
  const [funFactsText, setFunFactsText] = useState("");
  const [taglineCareer, setTaglineCareer] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("EMPLOYED");
  const [workHistory, setWorkHistory] = useState<{ company: string; role: string; period: string; description: string; current: boolean }[]>([]);
  const [education, setEducation] = useState<{ school: string; degree: string; period: string; description: string }[]>([]);
  const [skills, setSkills] = useState<{ name: string; level: number; category: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Fetch profile history for selected member
  const { data: historyData, refetch: refetchHistory } = useFetch<{ history: { id: string; createdAt: string; name: string; nick: string; img: string; role: string }[]; count: number }>(
    selectedSlug ? `/api/members/${selectedSlug}/history` : ""
  );
  const history = historyData?.history ?? [];

  useEffect(() => {
    if (!selectedSlug && members[0]?.id) setSelectedSlug(members[0].id);
  }, [members, selectedSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    const m = members.find((x) => x.id === selectedSlug);
    if (!m) return;
    setName(m.name); setNick(m.nick); setRole(m.role); setImg(m.img);
    const extractHex = (cls: string) => { const match = cls.match(/#([0-9a-fA-F]{3,8})/); return match ? `#${match[1]}` : "#ff4d4d"; };
    setColor(extractHex(m.color)); setHighlight(extractHex(m.highlight));
    setBio(m.bio); setTagline(m.tagline || ""); setQuote(m.quote || "");
    setElement(m.element || ""); setJoinYear(m.joinYear || "2020");
    setStats(Array.from({ length: 6 }, (_, i) => ({ label: m.stats?.[i]?.label ?? ["STR","DEX","CON","INT","WIS","CHA"][i] ?? "", value: m.stats?.[i]?.value ?? "10" })));
    setSocials(Array.from({ length: 3 }, (_, i) => ({ label: m.socials?.[i]?.label ?? "", href: m.socials?.[i]?.href ?? "" })));
    setFunFactsText((m.funFacts || []).join("\n"));
    setTaglineCareer(m.taglineCareer || ""); setLocation(m.location || ""); setAvailability(m.availability || "EMPLOYED");
    setWorkHistory(m.workHistory || []); setEducation(m.education || []); setSkills(m.skills || []);
    setError(null); setSuccess(null);
  }, [selectedSlug, members]);

  const updateStat = (i: number, key: "label" | "value", v: string) => setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));
  const updateSocial = (i: number, key: "label" | "href", v: string) => setSocials((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: v } : s)));

  const handleSave = async () => {
    if (!selectedSlug) { setError("Pilih member dulu."); return; }
    if (!name.trim() || !nick.trim()) { setError("Name dan nick wajib diisi."); return; }
    setSaving(true); setError(null); setSuccess(null);
    try {
      const funFacts = funFactsText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 8);
      const payload = {
        name: name.trim(), nick: nick.trim(), role: role.trim(), img: img.trim(),
        color: `bg-[${color}]`, highlight: `text-[${highlight}]`,
        bio: bio.trim(), tagline: tagline.trim(), quote: quote.trim(),
        element: element.trim().toUpperCase(), joinYear: joinYear.trim(),
        stats: stats.filter((s) => s.label && s.value),
        socials: socials.filter((s) => s.label && s.href), funFacts,
        taglineCareer: taglineCareer.trim(), location: location.trim(), availability,
        workHistory, education, skills,
      };
      const res = await chaosFetch(`/api/members/${encodeURIComponent(selectedSlug)}`, { method: "PUT", body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || d.message || "Gagal update member");
      setSuccess(`✓ ${d.member?.nick ?? nick} updated!`);
      refetch(); play("submit");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal update member"); }
    finally { setSaving(false); }
  };

  const handleRestore = async (historyId: string, dateStr: string) => {
    if (!confirm(`Restore profile dari ${dateStr}? Profile saat ini akan disimpan sebagai history.`)) return;
    setRestoring(historyId);
    setError(null); setSuccess(null);
    try {
      const res = await chaosFetch(`/api/members/${encodeURIComponent(selectedSlug)}/history`, {
        method: "POST",
        body: JSON.stringify({ historyId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal restore");
      setSuccess(`✓ Profile restored dari ${dateStr}`);
      refetch(); refetchHistory(); play("submit");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal restore"); }
    finally { setRestoring(null); }
  };

  const STAT_LABELS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

  return (
    <div className="space-y-4">
      <div className="border-8 border-[#d4ff00] bg-black p-6 shadow-[12px_12px_0_#d4ff00]">
        <h2 className="font-bebas text-4xl text-[#d4ff00] mb-4 flex items-center gap-2">
          <Users className="w-8 h-8" /> EDIT MEMBER PROFILE
        </h2>

        {/* Member selector */}
        <label className="block mb-4">
          <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">SELECT MEMBER</span>
          <select value={selectedSlug} onChange={(e) => { play("click"); setSelectedSlug(e.target.value); }}
            className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]">
            {members.length === 0 && <option value="">Loading…</option>}
            {members.map((m) => (<option key={m.id} value={m.id}>{m.id.toUpperCase()} · {m.nick} ({m.role})</option>))}
          </select>
        </label>

        {/* Basic identity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">NAME</span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 100))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          </label>
          <label className="block">
            <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">NICK</span>
            <input value={nick} onChange={(e) => setNick(e.target.value.slice(0, 50))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          </label>
          <label className="block">
            <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">ROLE</span>
            <input value={role} onChange={(e) => setRole(e.target.value.slice(0, 80))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          </label>
          <label className="block">
            <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">PHOTO</span>
            <div className="mt-1 space-y-2">
              {img && (<div className="relative w-full max-w-[120px] aspect-[3/4] border-2 border-[#d4ff00]/40 overflow-hidden bg-black"><img src={img} alt="Preview" className="w-full h-full object-cover" /></div>)}
              <label className="block">
                <span className="font-mono-ud text-[10px] text-[#d4ff00]/60">▸ Upload photo (max 4MB):</span>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const f = e.target.files?.[0]; if (!f) return; setUploadingPhoto(true);
                  try {
                    const form = new FormData(); form.append("file", f);
                    const res = await chaosFetch("/api/members/upload", { method: "POST", body: form });
                    const d = await res.json(); if (!res.ok) throw new Error(d.error || "Upload gagal");
                    setImg(d.url); setSuccess(`✓ Photo uploaded (${d.sizeKb}KB)`); play("submit");
                    setTimeout(() => setSuccess(null), 3000);
                  } catch (err) { setError(err instanceof Error ? err.message : "Upload gagal"); }
                  finally { setUploadingPhoto(false); }
                }} className="block w-full text-xs font-mono-ud text-white file:mr-3 file:py-2 file:px-4 file:border-2 file:border-[#d4ff00] file:bg-[#d4ff00] file:text-black file:font-bold file:cursor-pointer file:hover:bg-[#ff00ff] file:hover:text-white" />
              </label>
              <input value={img} onChange={(e) => setImg(e.target.value.slice(0, 500))} placeholder="/members/member-xxx.webp (atau paste URL gambar)" className="block w-full px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
            </div>
          </label>
        </div>

        {/* Color + element + join year */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">COLOR</span><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="block w-full mt-1 h-10 border-2 border-[#d4ff00] bg-transparent cursor-pointer" /></label>
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">HIGHLIGHT</span><input type="color" value={highlight} onChange={(e) => setHighlight(e.target.value)} className="block w-full mt-1 h-10 border-2 border-[#d4ff00] bg-transparent cursor-pointer" /></label>
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">ELEMENT</span><input value={element} onChange={(e) => setElement(e.target.value.slice(0, 30))} placeholder="FIRE / ICE…" className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">JOIN YEAR</span><input value={joinYear} onChange={(e) => setJoinYear(e.target.value.slice(0, 10))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
        </div>

        {/* Bio */}
        <label className="block mb-3">
          <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">BIO</span>
          <span className="font-mono-ud text-[10px] text-[#d4ff00]/60 block mb-1">▸ Tip: Wrap teks dengan **double asterisk** untuk warna highlight.</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 2000))} rows={4} placeholder="Bio member. Gunakan **teks** untuk highlight." className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
        </label>
        <label className="block mb-3"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">TAGLINE</span><input value={tagline} onChange={(e) => setTagline(e.target.value.slice(0, 200))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
        <label className="block mb-3"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">QUOTE</span><textarea value={quote} onChange={(e) => setQuote(e.target.value.slice(0, 600))} rows={2} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" /></label>

        {/* Career Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">CAREER TAGLINE</span><input value={taglineCareer} onChange={(e) => setTaglineCareer(e.target.value.slice(0, 100))} placeholder="Full-Stack Developer" className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">LOCATION</span><input value={location} onChange={(e) => setLocation(e.target.value.slice(0, 100))} placeholder="Jakarta, ID" className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
          <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">AVAILABILITY</span>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]">
              <option value="EMPLOYED">EMPLOYED</option><option value="OPEN TO WORK">OPEN TO WORK</option><option value="FREELANCE">FREELANCE</option><option value="STUDENT">STUDENT</option><option value="UNEMPLOYED">UNEMPLOYED</option>
            </select>
          </label>
        </div>

        {/* Stats */}
        <div className="mb-3">
          <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider block mb-1">D&D STATS (6)</span>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="border-2 border-[#d4ff00]/40 p-2 bg-[#1a1a1a]">
                <input value={s.label} onChange={(e) => updateStat(i, "label", e.target.value.slice(0, 8))} placeholder={STAT_LABELS[i]} className="block w-full px-2 py-1 bg-black border border-[#d4ff00]/30 text-[#d4ff00] font-mono-ud text-xs text-center focus:outline-none focus:border-[#ff00ff]" />
                <input value={s.value} onChange={(e) => updateStat(i, "value", e.target.value.slice(0, 6))} type="number" min={0} max={99} className="block w-full mt-1 px-2 py-1 bg-black border border-[#d4ff00]/30 text-white font-bebas text-xl text-center focus:outline-none focus:border-[#ff00ff]" />
              </div>
            ))}
          </div>
        </div>

        {/* Socials */}
        <div className="mb-3">
          <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider block mb-1">SOCIALS (3 rows)</span>
          <span className="font-mono-ud text-[10px] text-[#d4ff00]/60 block mb-2">▸ Isi label + URL lengkap (mis. https://instagram.com/username)</span>
          <div className="space-y-2">
            {socials.map((s, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input value={s.label} onChange={(e) => updateSocial(i, "label", e.target.value.slice(0, 30))} placeholder="INSTAGRAM" className="px-2 py-1.5 border-2 border-[#d4ff00]/40 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
                <input value={s.href} onChange={(e) => updateSocial(i, "href", e.target.value.slice(0, 200))} placeholder="https://instagram.com/username" className="md:col-span-2 px-2 py-1.5 border-2 border-[#d4ff00]/40 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
              </div>
            ))}
          </div>
        </div>

        {/* Fun Facts */}
        <label className="block mb-3">
          <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">FUN FACTS</span>
          <span className="font-mono-ud text-[10px] text-[#d4ff00]/60 block mb-1">▸ Satu fact per baris — tekan Enter (max 8).</span>
          <textarea value={funFactsText} onChange={(e) => setFunFactsText(e.target.value)} rows={5} placeholder={"Selalu jadi orang pertama yang online\nPemilik rekor paling sering ngajak nongkrong"} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
        </label>

        {/* Work History */}
        <DynamicList title="WORK HISTORY" items={workHistory} setItems={setWorkHistory} fields={[
          { key: "company", placeholder: "Company", width: "md:col-span-2" },
          { key: "role", placeholder: "Role", width: "md:col-span-2" },
          { key: "period", placeholder: "2020-2024", width: "md:col-span-2" },
          { key: "description", placeholder: "Description", width: "md:col-span-5", textarea: true },
        ]} />

        {/* Education */}
        <DynamicList title="EDUCATION" items={education} setItems={setEducation} fields={[
          { key: "school", placeholder: "School", width: "md:col-span-3" },
          { key: "degree", placeholder: "Degree", width: "md:col-span-2" },
          { key: "period", placeholder: "2018-2021", width: "md:col-span-1" },
          { key: "description", placeholder: "Description", width: "md:col-span-5", textarea: true },
        ]} />

        {/* Skills */}
        <DynamicList title="SKILLS MATRIX" items={skills} setItems={setSkills} fields={[
          { key: "name", placeholder: "JavaScript", width: "md:col-span-3" },
          { key: "level", placeholder: "80", width: "md:col-span-1", type: "number" },
          { key: "category", placeholder: "FRONTEND", width: "md:col-span-2" },
        ]} />

        {error && (<div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold flex items-center gap-2 mb-3"><XCircle className="w-4 h-4" /> {error}</div>)}
        {success && (<div className="bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" /> {success}</div>)}

        <button onClick={handleSave} disabled={saving || !selectedSlug}
          className={cn("w-full font-bebas text-3xl py-4 border-4 border-[#d4ff00] flex items-center justify-center gap-2 transition-all no-color-transition",
            saving || uploadingPhoto ? "bg-[#1a1a1a] text-white/50 cursor-wait" : "bg-[#d4ff00] text-black hover:-translate-y-1 hover:bg-[#ff00ff] hover:text-white hover:border-white")}>
          {saving || uploadingPhoto ? <><Loader2 className="w-6 h-6 animate-spin" /> SAVING...</> : <><Users className="w-6 h-6" /> SAVE MEMBER PROFILE</>}
        </button>
      </div>

      {/* Profile History — restore previous profiles (max 4) */}
      {selectedSlug && history.length > 0 && (
        <div className="border-8 border-[#00e5ff] bg-black p-6 shadow-[12px_12px_0_#00e5ff]">
          <h2 className="font-bebas text-3xl text-[#00e5ff] mb-4 flex items-center gap-2">
            <History className="w-6 h-6" /> PROFILE HISTORY ({history.length}/4)
          </h2>
          <p className="font-mono-ud text-[10px] text-white/40 mb-3 tracking-wider">
            ▸ Snapshot profile sebelumnya. Klik RESTORE untuk kembalikan profile lama. Profile saat ini otomatis disimpan.
          </p>
          <div className="space-y-2">
            {history.map((h, i) => {
              const date = new Date(h.createdAt);
              const dateStr = date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
              return (
                <div key={h.id} className="border-2 border-[#00e5ff]/30 p-3 bg-black/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img src={h.img} alt={h.nick} className="w-10 h-10 object-cover border-2 border-[#00e5ff]/50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bebas text-lg text-white truncate">{h.name} · {h.role}</div>
                      <div className="font-mono-ud text-[10px] text-white/40">{dateStr}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(h.id, dateStr)}
                    disabled={restoring === h.id}
                    className="bg-[#00e5ff] text-black font-bebas text-sm px-4 py-2 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition disabled:opacity-50 min-w-[100px] min-h-[44px] flex items-center justify-center gap-1 flex-shrink-0"
                    title={`Restore profile dari ${dateStr}`}
                  >
                    {restoring === h.id ? <><Loader2 className="w-4 h-4 animate-spin" /> RESTORING...</> : <><History className="w-4 h-4" /> RESTORE</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC LIST — reusable for work history, education, skills
// ═══════════════════════════════════════════════════════════════════════════
function DynamicList<T extends Record<string, unknown>>({
  title, items, setItems, fields,
}: {
  title: string;
  items: T[];
  setItems: (items: T[]) => void;
  fields: { key: string; placeholder: string; width?: string; textarea?: boolean; type?: string }[];
}) {
  const update = (i: number, key: string, v: string | number | boolean) => setItems(items.map((item, idx) => (idx === i ? { ...item, [key]: v } : item)));
  const add = () => { const newItem = {} as T; fields.forEach((f) => { (newItem as Record<string, unknown>)[f.key] = f.type === "number" ? 0 : ""; }); setItems([...items, newItem]); };
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">{title} ({items.length})</span>
        <button onClick={add} className="flex items-center gap-1 bg-[#d4ff00] text-black font-mono-ud text-xs font-black px-2 py-1 border-2 border-[#d4ff00] hover:bg-transparent hover:text-[#d4ff00] transition-colors no-color-transition min-h-[36px]"><Plus className="w-3 h-3" /> ADD</button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border-2 border-[#d4ff00]/30 p-2 bg-[#1a1a1a] relative">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              {fields.map((f) => (
                <div key={f.key} className={f.width || ""}>
                  {f.textarea ? (
                    <textarea value={String(item[f.key] ?? "")} onChange={(e) => update(i, f.key, e.target.value)} placeholder={f.placeholder} rows={1} className="w-full px-2 py-1.5 bg-black border border-[#d4ff00]/30 text-white font-mono-ud text-xs resize-none focus:outline-none focus:border-[#ff00ff]" />
                  ) : (
                    <input value={String(item[f.key] ?? "")} onChange={(e) => update(i, f.key, f.type === "number" ? Number(e.target.value) : e.target.value)} placeholder={f.placeholder} type={f.type || "text"} className="w-full px-2 py-1.5 bg-black border border-[#d4ff00]/30 text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => remove(i)} className="absolute top-1 right-1 p-1.5 bg-[#ff4d4d]/80 hover:bg-[#ff4d4d] text-white border border-white/30 transition-colors no-color-transition" title="Remove"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTES SECTION — CRUD for "TRANSMISSION FROM THE COLLECTIVE"
// ═══════════════════════════════════════════════════════════════════════════
function QuotesSection() {
  const { data, refetch } = useFetch<{ quotes: { id: string; text: string; author: string }[] }>("/api/quotes");
  const { chaosFetch } = useChaosFetch();
  const { play } = useSfx();
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("THE COLLECTIVE");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const quotes = data?.quotes ?? [];

  const handleCreate = async () => {
    if (!text.trim()) { setError("Text wajib diisi."); return; }
    setError(null);
    try {
      const res = await chaosFetch("/api/quotes", { method: "POST", body: JSON.stringify({ text, author }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || "Gagal");
      setSuccess(`✓ Quote dibuat!`); setText(""); setAuthor("THE COLLECTIVE"); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  const handleDelete = async (id: string, text: string) => {
    if (!confirm(`Hapus quote "${text.slice(0, 40)}..."?`)) return;
    setDeletingId(id);
    try {
      const res = await chaosFetch(`/api/quotes?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSuccess(`✓ Quote dihapus.`); refetch(); play("close");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="border-8 border-[#00e5ff] bg-black p-6 shadow-[12px_12px_0_#00e5ff] mt-4">
      <h2 className="font-bebas text-4xl text-[#00e5ff] mb-4 flex items-center gap-2">
        <QuoteIcon className="w-8 h-8" /> TRANSMISSION QUOTES
      </h2>
      <div className="space-y-3 mb-4">
        <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} placeholder="Quote text..." rows={2} className="block w-full px-3 py-2 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
        <div className="flex gap-2">
          <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 50))} placeholder="AUTHOR" className="flex-1 px-3 py-2 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          <button onClick={handleCreate} className="bg-[#00e5ff] text-black font-bebas text-xl px-6 py-2 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition min-w-[100px]"><Plus className="w-4 h-4 inline mr-1" /> ADD</button>
        </div>
      </div>
      {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold mb-3">! {error}</div>}
      {success && <div className="bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold mb-3">{success}</div>}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {quotes.map((q) => {
          const isStatic = q.id.startsWith("static-");
          return (
            <div key={q.id} className="border-2 border-[#00e5ff]/30 p-3 bg-black/50 flex items-start justify-between gap-2 group">
              <div className="flex-1 min-w-0">
                <div className="font-bebas text-lg text-white">"{q.text}"</div>
                <div className="font-mono-ud text-[10px] text-[#00e5ff]">— {q.author}{isStatic && <span className="text-[#ff8c00] ml-2">[STATIC]</span>}</div>
              </div>
              {!isStatic && (
                <button onClick={() => handleDelete(q.id, q.text)} disabled={deletingId === q.id} className="p-2.5 border-2 border-white/30 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors no-color-transition disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0" title="Delete quote">
                  {deletingId === q.id ? <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" /> : <Trash2 className="w-5 h-5 text-[#ff4d4d]" />}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={() => { play("click"); refetch(); }} className="mt-3 font-mono-ud text-xs font-black bg-[#00e5ff] text-black px-3 py-1 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition"><RefreshCw className="w-3 h-3 inline mr-1" /> REFRESH</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GALLERY TAB — Upload + masonry + edit + delete
// ═══════════════════════════════════════════════════════════════════════════
function GalleryTab() {
  const { data, refetch } = useFetch<{ photos: GalleryPhoto[]; count: number }>("/api/gallery");
  const { chaosFetch } = useChaosFetch();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(String(new Date().getFullYear()));
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const { play } = useSfx();
  const photos = data?.photos ?? [];

  const handleUpload = async () => {
    if (!file || !title.trim()) { setError("Judul dan foto wajib diisi."); return; }
    setUploading(true); setError(null); setSuccess(null);
    try {
      const form = new FormData(); form.append("file", file); form.append("title", title); form.append("author", author || "ANON"); form.append("date", date);
      const res = await chaosFetch("/api/gallery/upload", { method: "POST", body: form });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || "Upload gagal");
      setSuccess(`✓ ${d.title} uploaded!`); setTitle(""); setAuthor(""); setFile(null); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload gagal"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus foto "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await chaosFetch(`/api/gallery?id=${id}`, { method: "DELETE" });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || "Gagal hapus");
      setSuccess(`✓ Foto dihapus.`); refetch(); play("close");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
    finally { setDeletingId(null); }
  };

  const isDbPhoto = (id: string) => !id.startsWith("g") || id.length > 3;

  return (
    <div className="space-y-4">
      <div className="border-8 border-[#ff00ff] bg-black p-6 shadow-[12px_12px_0_#ff00ff]">
        <h2 className="font-bebas text-4xl text-[#ff00ff] mb-4 flex items-center gap-2"><Upload className="w-8 h-8" /> UPLOAD GALLERY PHOTO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">FOTO * (max 4MB)</span><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full mt-1 text-xs font-mono-ud text-white file:mr-3 file:py-2 file:px-4 file:border-2 file:border-[#d4ff00] file:bg-[#d4ff00] file:text-black file:font-bold file:cursor-pointer file:hover:bg-[#ff00ff] file:hover:text-white" /></label>
            <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">JUDUL *</span><input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 40))} placeholder="VISI AWAL" className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
          </div>
          <div className="space-y-3">
            <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">OLEH</span><input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 30))} placeholder="ALDI" className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
            <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">TAHUN</span><input value={date} onChange={(e) => setDate(e.target.value)} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
          </div>
        </div>
        {error && <div className="mt-4 bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold">! {error}</div>}
        {success && <div className="mt-4 bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold">{success}</div>}
        <button onClick={handleUpload} disabled={uploading} className={cn("mt-4 w-full font-bebas text-3xl py-4 border-4 border-[#d4ff00] flex items-center justify-center gap-2 transition-all no-color-transition", uploading ? "bg-[#1a1a1a] text-white/50 cursor-wait" : "bg-[#d4ff00] text-black hover:-translate-y-1 hover:bg-[#ff00ff] hover:text-white hover:border-white")}>
          {uploading ? <><Loader2 className="w-6 h-6 animate-spin" /> UPLOADING...</> : <><Upload className="w-6 h-6" /> UPLOAD TO GALLERY</>}
        </button>
      </div>

      {/* Gallery archive — masonry */}
      <div className="border-4 border-[#00e5ff] bg-[#1a1a1a] p-4 shadow-[8px_8px_0_#00e5ff]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bebas text-2xl text-[#00e5ff] flex items-center gap-2"><ImageIcon className="w-5 h-5" /> ARCHIVE ({photos.length})</h3>
          <button onClick={() => { play("click"); refetch(); }} className="font-mono-ud text-xs font-black bg-[#00e5ff] text-black px-3 py-1 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition">↻ REFRESH</button>
        </div>
        <div className="columns-2 sm:columns-3 md:columns-4 gap-3 max-h-[600px] overflow-y-auto">
          {photos.map((p) => {
            const canEdit = isDbPhoto(p.id);
            return (
              <div key={p.id} className="break-inside-avoid mb-3 border-2 border-[#00e5ff]/30 p-2 bg-black/50 relative group">
                <img src={p.img} alt={p.title} className="w-full h-auto object-cover" loading="lazy" />
                <div className="mt-1.5"><div className="font-mono-ud text-[10px] text-[#00e5ff] truncate font-bold">{p.title}</div><div className="font-mono-ud text-[8px] text-white/40">{p.author} · {p.date}</div></div>
                {canEdit ? (
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingPhoto(p)} className="bg-[#00e5ff] text-black p-2 border-2 border-white hover:bg-[#00b8cc] transition-colors no-color-transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id, p.title)} disabled={deletingId === p.id} className="bg-[#ff4d4d] text-white p-2 border-2 border-white hover:bg-[#ff0000] disabled:opacity-50 transition-colors no-color-transition" title="Delete">{deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                  </div>
                ) : (<div className="absolute top-2 right-2 bg-black/70 text-white/60 px-2 py-1 font-mono-ud text-[9px] font-bold border border-white/30">SEED</div>)}
              </div>
            );
          })}
        </div>
      </div>

      {editingPhoto && (<EditPhotoModal photo={editingPhoto} onClose={() => setEditingPhoto(null)} onSaved={() => { setEditingPhoto(null); refetch(); }} />)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT PHOTO MODAL
// ═══════════════════════════════════════════════════════════════════════════
function EditPhotoModal({ photo, onClose, onSaved }: { photo: GalleryPhoto; onClose: () => void; onSaved: () => void }) {
  const { chaosFetch } = useChaosFetch();
  const { play } = useSfx();
  const [title, setTitle] = useState(photo.title);
  const [author, setAuthor] = useState(photo.author);
  const [date, setDate] = useState(photo.date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => { document.body.classList.remove("modal-open"); };
  }, []);

  const handleSave = async () => {
    if (!title.trim()) { setError("Judul wajib diisi."); return; }
    setSaving(true); setError(null);
    try {
      const res = await chaosFetch("/api/gallery", { method: "PUT", body: JSON.stringify({ id: photo.id, title, author, date }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error || "Gagal");
      play("submit"); onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-3 md:p-6 py-8">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        <div className="relative w-full max-w-md">
          <button onClick={onClose} className="absolute -top-4 -right-4 z-30 w-10 h-10 flex items-center justify-center bg-[#ff4d4d] text-white border-4 border-white shadow-[4px_4px_0_#000] hover:rotate-90 transition-transform no-color-transition" aria-label="Close"><X className="w-5 h-5" /></button>
          <div className="relative bg-[#1a1a1a] border-4 border-[#00e5ff] p-6 shadow-[8px_8px_0_#00e5ff] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bebas text-3xl text-[#00e5ff] mb-4 flex items-center gap-2"><Edit3 className="w-6 h-6" /> EDIT PHOTO</h3>
            <img src={photo.img} alt={photo.title} className="w-full max-h-48 object-contain mb-4 border-2 border-white/20" />
            <div className="space-y-3">
              <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">JUDUL</span><input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 40))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-black text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
              <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">OLEH</span><input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 30))} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-black text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
              <label className="block"><span className="font-mono-ud text-xs font-bold text-[#d4ff00] tracking-wider">TAHUN</span><input value={date} onChange={(e) => setDate(e.target.value)} className="block w-full mt-1 px-3 py-2 border-2 border-[#d4ff00] bg-black text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
              {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold">! {error}</div>}
              <div className="flex gap-2 pt-2">
                <button onClick={onClose} className="flex-1 bg-transparent text-white font-bebas text-xl py-3 border-2 border-white/30 hover:border-white hover:bg-white/5 transition-colors no-color-transition">CANCEL</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#00e5ff] text-black font-bebas text-xl py-3 border-2 border-[#00e5ff] hover:bg-[#00b8cc] disabled:opacity-50 transition-colors no-color-transition flex items-center justify-center gap-2">{saving ? <><Loader2 className="w-5 h-5 animate-spin" /> SAVING...</> : <>✓ SAVE</>}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS TAB — Create + delete + pin
// ═══════════════════════════════════════════════════════════════════════════
function NewsTab() {
  const { data, refetch } = useFetch<{ articles: { id: string; title: string; body: string; category: string; author: string; pinned: boolean }[]; count: number }>("/api/news");
  const { chaosFetch } = useChaosFetch();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("UPDATE");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { play } = useSfx();
  const articles = data?.articles ?? [];

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) { setError("Title dan body wajib diisi."); return; }
    setError(null);
    try {
      const res = await chaosFetch("/api/news", { method: "POST", body: JSON.stringify({ title, body, category, author: author || "THE COLLECTIVE" }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setSuccess(`✓ "${d.title}" dipublikasikan!`); setTitle(""); setBody(""); setAuthor(""); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus artikel "${title}"?`)) return;
    setDeletingId(id);
    try { const res = await chaosFetch(`/api/news?id=${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Gagal"); setSuccess("✓ Dihapus."); refetch(); play("close"); setTimeout(() => setSuccess(null), 3000); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal"); } finally { setDeletingId(null); }
  };

  const togglePin = async (a: { id: string; pinned: boolean }) => {
    try { const res = await chaosFetch("/api/news", { method: "PUT", body: JSON.stringify({ id: a.id, pinned: !a.pinned }) }); if (!res.ok) throw new Error("Gagal"); refetch(); play("click"); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  const CATEGORIES = ["UPDATE", "EVENT", "CHAOS", "MILESTONE", "NOTICE"];
  const CAT_COLORS: Record<string, string> = { UPDATE: "#00e5ff", EVENT: "#ff4d4d", CHAOS: "#ff00ff", MILESTONE: "#d4ff00", NOTICE: "#ff8c00" };

  return (
    <div className="space-y-4">
      <div className="border-8 border-[#00e5ff] bg-black p-6 shadow-[12px_12px_0_#00e5ff]">
        <h2 className="font-bebas text-4xl text-[#00e5ff] mb-4 flex items-center gap-2"><Newspaper className="w-8 h-8" /> PUBLISH NEWS</h2>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="TITLE *" className="block w-full px-3 py-2 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          <textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 500))} placeholder="BODY * (max 500)" rows={3} className="block w-full px-3 py-2 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <input value={author} onChange={(e) => setAuthor(e.target.value.slice(0, 30))} placeholder="AUTHOR" className="px-3 py-2 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          </div>
          {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold">! {error}</div>}
          {success && <div className="bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold">{success}</div>}
          <button onClick={handleCreate} className="w-full bg-[#00e5ff] text-black font-bebas text-2xl py-3 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition"><Newspaper className="w-5 h-5 inline mr-2" /> PUBLISH</button>
        </div>
      </div>
      <div className="border-4 border-[#ff00ff] bg-[#1a1a1a] p-4 shadow-[8px_8px_0_#ff00ff]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bebas text-2xl text-[#ff00ff] flex items-center gap-2"><Newspaper className="w-5 h-5" /> ARTICLES ({articles.length})</h3>
          <button onClick={() => { play("click"); refetch(); }} className="font-mono-ud text-xs font-black bg-[#ff00ff] text-black px-3 py-1 border-2 border-[#ff00ff] hover:bg-transparent hover:text-[#ff00ff] transition-colors no-color-transition">↻ REFRESH</button>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {articles.length === 0 && <div className="text-center py-8 font-mono-ud text-xs text-white/40">No articles yet.</div>}
          {articles.map((a) => (
            <div key={a.id} className="border-2 border-[#ff00ff]/30 p-3 bg-black/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono-ud text-[9px] font-black px-1.5 py-0.5 border" style={{ color: CAT_COLORS[a.category] || "#fff", borderColor: CAT_COLORS[a.category] || "#fff" }}>{a.category}</span>
                    {a.pinned && <span className="font-mono-ud text-[9px] text-[#d4ff00]">📌 PINNED</span>}
                    <span className="font-mono-ud text-[9px] text-white/40">{a.author}</span>
                  </div>
                  <div className="font-bebas text-lg text-white truncate">{a.title}</div>
                  <div className="font-mono-ud text-[10px] text-white/50 line-clamp-2">{a.body}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => togglePin(a)} className="p-2.5 border-2 border-white/30 hover:border-[#d4ff00] hover:bg-[#d4ff00]/10 transition-colors no-color-transition min-w-[44px] min-h-[44px] flex items-center justify-center" title={a.pinned ? "Unpin" : "Pin"}>{a.pinned ? <PinOff className="w-5 h-5 text-[#d4ff00]" /> : <Pin className="w-5 h-5 text-white/60" />}</button>
                  <button onClick={() => handleDelete(a.id, a.title)} disabled={deletingId === a.id} className="p-2.5 border-2 border-white/30 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors no-color-transition disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Delete">{deletingId === a.id ? <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" /> : <Trash2 className="w-5 h-5 text-[#ff4d4d]" />}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GUESTBOOK TAB — Create + delete
// ═══════════════════════════════════════════════════════════════════════════
function GuestbookTab() {
  const { data, refetch } = useFetch<{ entries: { id: string; name: string; message: string; color: string; createdAt: string }[]; count: number }>("/api/guestbook");
  const { chaosFetch } = useChaosFetch();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { play } = useSfx();
  const entries = data?.entries ?? [];

  const handleCreate = async () => {
    if (!name.trim() || !message.trim()) { setError("Nama dan pesan wajib diisi."); return; }
    setError(null);
    try {
      const res = await chaosFetch("/api/guestbook", { method: "POST", body: JSON.stringify({ name, message }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setSuccess(`✓ Pesan dari ${d.name} ditambahkan!`); setName(""); setMessage(""); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus pesan dari "${name}"?`)) return;
    setDeletingId(id);
    try { const res = await chaosFetch(`/api/guestbook?id=${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Gagal"); setSuccess("✓ Dihapus."); refetch(); play("close"); setTimeout(() => setSuccess(null), 3000); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal"); } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="border-8 border-[#d4ff00] bg-black p-6 shadow-[12px_12px_0_#d4ff00]">
        <h2 className="font-bebas text-4xl text-[#d4ff00] mb-4 flex items-center gap-2"><MessageSquare className="w-8 h-8" /> ADD GUESTBOOK</h2>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="NAME *" className="block w-full px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 280))} placeholder="MESSAGE * (max 280)" rows={3} className="block w-full px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
          {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold">! {error}</div>}
          {success && <div className="bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold">{success}</div>}
          <button onClick={handleCreate} className="w-full bg-[#d4ff00] text-black font-bebas text-2xl py-3 border-2 border-[#d4ff00] hover:bg-transparent hover:text-[#d4ff00] transition-colors no-color-transition"><MessageSquare className="w-5 h-5 inline mr-2" /> POST</button>
        </div>
      </div>
      <div className="border-4 border-[#00e5ff] bg-[#1a1a1a] p-4 shadow-[8px_8px_0_#00e5ff]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bebas text-2xl text-[#00e5ff] flex items-center gap-2"><MessageSquare className="w-5 h-5" /> ENTRIES ({entries.length})</h3>
          <button onClick={() => { play("click"); refetch(); }} className="font-mono-ud text-xs font-black bg-[#00e5ff] text-black px-3 py-1 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition">↻ REFRESH</button>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {entries.length === 0 && <div className="text-center py-8 font-mono-ud text-xs text-white/40">No entries.</div>}
          {entries.map((e) => (
            <div key={e.id} className="border-2 border-[#00e5ff]/30 p-3 bg-black/50 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: e.color }} /><span className="font-bebas text-lg text-white">{e.name}</span><span className="font-mono-ud text-[9px] text-white/40">{new Date(e.createdAt).toLocaleDateString("id-ID")}</span></div>
                <div className="font-mono-ud text-xs text-white/70">{e.message}</div>
              </div>
              <button onClick={() => handleDelete(e.id, e.name)} disabled={deletingId === e.id} className="p-2.5 border-2 border-white/30 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors no-color-transition disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0" title="Delete">{deletingId === e.id ? <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" /> : <Trash2 className="w-5 h-5 text-[#ff4d4d]" />}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PORTFOLIO TAB — Full project CRUD
// ═══════════════════════════════════════════════════════════════════════════
function PortfolioTab() {
  const { data, refetch } = useFetch<{ projects: { id: string; title: string; description: string; tech: string[]; category: string; status: string; year: string; memberId: string; link: string | null; repo: string | null; color: string }[]; count: number }>("/api/portfolio");
  const { chaosFetch } = useChaosFetch();
  const { play } = useSfx();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState("");
  const [category, setCategory] = useState("WEB");
  const [status, setStatus] = useState("WIP");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [memberId, setMemberId] = useState("aldi");
  const [link, setLink] = useState("");
  const [repo, setRepo] = useState("");
  const [color, setColor] = useState("#ff4d4d");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const projects = data?.projects ?? [];

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) { setError("Title dan description wajib diisi."); return; }
    setError(null);
    try {
      const res = await chaosFetch("/api/portfolio", { method: "POST", body: JSON.stringify({ title, description, tech: tech.split(",").map((t) => t.trim()).filter(Boolean), category, status, year, memberId, link: link || null, repo: repo || null, color }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setSuccess(`✓ Project dibuat!`); setTitle(""); setDescription(""); setTech(""); setLink(""); setRepo(""); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    setDeletingId(id);
    try { const res = await chaosFetch(`/api/portfolio?id=${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Gagal"); setSuccess("✓ Dihapus."); refetch(); play("close"); setTimeout(() => setSuccess(null), 3000); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal"); } finally { setDeletingId(null); }
  };

  const isDbProject = (id: string) => !id.startsWith("p") || id.length > 3;
  const CAT_COLORS: Record<string, string> = { WEB: "#00e5ff", GAME: "#ff4d4d", MOBILE: "#ff00ff", TOOL: "#d4ff00", BOT: "#8a2be2", OTHER: "#ff8c00" };

  return (
    <div className="space-y-4">
      <div className="border-8 border-[#8a2be2] bg-black p-6 shadow-[12px_12px_0_#8a2be2]">
        <h2 className="font-bebas text-4xl text-[#8a2be2] mb-4 flex items-center gap-2"><FolderOpen className="w-8 h-8" /> ADD PROJECT</h2>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="TITLE *" className="block w-full px-3 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="DESCRIPTION * (max 500)" rows={3} className="block w-full px-3 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
          <input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="TECH (comma: Next.js, TypeScript)" className="block w-full px-3 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]">{PORTFOLIO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]">{PORTFOLIO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="YEAR" className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]">{MEMBER_SLUGS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Live demo URL" className="px-3 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
            <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="GitHub URL" className="px-3 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
          </div>
          <div className="flex items-center gap-2"><span className="font-mono-ud text-xs text-[#d4ff00]">COLOR:</span><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-8 border-2 border-[#8a2be2] bg-transparent cursor-pointer" /></div>
          {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold">! {error}</div>}
          {success && <div className="bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold">{success}</div>}
          <button onClick={handleCreate} className="w-full bg-[#8a2be2] text-white font-bebas text-2xl py-3 border-2 border-[#8a2be2] hover:bg-transparent hover:text-[#8a2be2] transition-colors no-color-transition"><FolderOpen className="w-5 h-5 inline mr-2" /> + ADD</button>
        </div>
      </div>
      <div className="border-4 border-[#00e5ff] bg-[#1a1a1a] p-4 shadow-[8px_8px_0_#00e5ff]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bebas text-2xl text-[#00e5ff] flex items-center gap-2"><FolderOpen className="w-5 h-5" /> PROJECTS ({projects.length})</h3>
          <button onClick={() => { play("click"); refetch(); }} className="font-mono-ud text-xs font-black bg-[#00e5ff] text-black px-3 py-1 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition">↻</button>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {projects.map((p) => (
            <div key={p.id} className="border-2 border-[#00e5ff]/30 p-3 bg-black/50 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono-ud text-[9px] font-black px-1.5 py-0.5 border" style={{ color: CAT_COLORS[p.category] || "#fff", borderColor: CAT_COLORS[p.category] || "#fff" }}>{p.category}</span>
                  <span className="font-mono-ud text-[9px] font-black px-1.5 py-0.5 border border-white/30" style={{ color: p.status === "LIVE" ? "#00ff00" : p.status === "WIP" ? "#ff8c00" : "#666" }}>{p.status}</span>
                  <span className="font-mono-ud text-[9px] text-white/40">{p.year} · {(p.memberId || "").toUpperCase()}</span>
                </div>
                <div className="font-bebas text-lg text-white truncate">{p.title}</div>
                <div className="font-mono-ud text-[10px] text-white/50 line-clamp-2">{p.description}</div>
                {p.tech?.length > 0 && <div className="font-mono-ud text-[9px] text-[#00e5ff]/60 mt-1 truncate">{p.tech.join(" · ")}</div>}
              </div>
              {isDbProject(p.id) ? (
                <button onClick={() => handleDelete(p.id, p.title)} disabled={deletingId === p.id} className="p-2.5 border-2 border-white/30 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors no-color-transition disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0" title="Delete">{deletingId === p.id ? <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" /> : <Trash2 className="w-5 h-5 text-[#ff4d4d]" />}</button>
              ) : (<div className="bg-black/70 text-white/60 px-2 py-1 font-mono-ud text-[9px] font-bold border border-white/30 flex-shrink-0">SEED</div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS TAB — Full CRUD
// ═══════════════════════════════════════════════════════════════════════════
function AchievementsTab() {
  const { data, refetch } = useFetch<{ achievements: { id: string; memberId: string; title: string; year: string; description: string; images: { id: string; img: string }[] }[]; count: number }>("/api/achievements");
  const { chaosFetch } = useChaosFetch();
  const { play } = useSfx();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState("aldi");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const achievements = data?.achievements ?? [];

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) { setError("Title dan description wajib diisi."); return; }
    setError(null);
    try {
      const res = await chaosFetch("/api/achievements", { method: "POST", body: JSON.stringify({ title, year, description, memberId }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setSuccess(`✓ Achievement dibuat!`); setTitle(""); setDescription(""); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"? Semua foto juga akan dihapus.`)) return;
    setDeletingId(id);
    try { const res = await chaosFetch(`/api/achievements?id=${id}`, { method: "DELETE" }); if (!res.ok) throw new Error("Gagal"); setSuccess("✓ Dihapus."); refetch(); play("close"); setTimeout(() => setSuccess(null), 3000); }
    catch (e) { setError(e instanceof Error ? e.message : "Gagal"); } finally { setDeletingId(null); }
  };

  const handleUploadImage = async (achievementId: string, file: File) => {
    setUploadingFor(achievementId);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("achievementId", achievementId);
      const res = await chaosFetch("/api/achievements/upload", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Upload gagal");
      setSuccess(`✓ Foto uploaded!`); refetch(); play("submit");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload gagal"); }
    finally { setUploadingFor(null); }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Hapus foto ini?")) return;
    try {
      const res = await chaosFetch(`/api/achievements/upload?id=${imageId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      setSuccess("✓ Foto dihapus."); refetch(); play("close");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal"); }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="border-8 border-[#d4ff00] bg-black p-6 shadow-[12px_12px_0_#d4ff00]">
        <h2 className="font-bebas text-4xl text-[#d4ff00] mb-4 flex items-center gap-2"><Award className="w-8 h-8" /> ADD ACHIEVEMENT</h2>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} placeholder="TITLE *" className="block w-full px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} placeholder="DESCRIPTION * (max 500)" rows={3} className="block w-full px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" />
          <div className="grid grid-cols-2 gap-2">
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="YEAR" className="px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" />
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="px-3 py-2 border-2 border-[#d4ff00] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]">{MEMBER_SLUGS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select>
          </div>
          {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold">! {error}</div>}
          {success && <div className="bg-[#00ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold">{success}</div>}
          <button onClick={handleCreate} className="w-full bg-[#d4ff00] text-black font-bebas text-2xl py-3 border-2 border-[#d4ff00] hover:bg-transparent hover:text-[#d4ff00] transition-colors no-color-transition"><Award className="w-5 h-5 inline mr-2" /> + ADD</button>
          <p className="font-mono-ud text-[10px] text-white/50 text-center tracking-wider">
            ▸ Setelah dibuat, klik tombol <span className="text-[#d4ff00] font-bold">+ ADD PHOTO</span> di kartu achievement untuk upload sertifikat/medali (opsional).
          </p>
        </div>
      </div>
      <div className="border-4 border-[#00e5ff] bg-[#1a1a1a] p-4 shadow-[8px_8px_0_#00e5ff]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bebas text-2xl text-[#00e5ff] flex items-center gap-2"><Award className="w-5 h-5" /> ACHIEVEMENTS ({achievements.length})</h3>
          <button onClick={() => { play("click"); refetch(); }} className="font-mono-ud text-xs font-black bg-[#00e5ff] text-black px-3 py-1 border-2 border-[#00e5ff] hover:bg-transparent hover:text-[#00e5ff] transition-colors no-color-transition">↻</button>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {achievements.length === 0 && <div className="text-center py-8 font-mono-ud text-xs text-white/40">No achievements yet.</div>}
          {achievements.map((a) => {
            const imgCount = a.images?.length ?? 0;
            const isExpanded = expandedId === a.id;
            return (
              <div key={a.id} className="border-2 border-[#00e5ff]/30 p-3 bg-black/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono-ud text-[9px] text-[#d4ff00]">{a.year}</span>
                      <span className="font-mono-ud text-[9px] text-white/40">{a.memberId.toUpperCase()}</span>
                      {imgCount > 0 ? (
                        <span className="font-mono-ud text-[9px] text-[#00e5ff] bg-[#00e5ff]/10 px-1.5 py-0.5 border border-[#00e5ff]/30">📷 {imgCount} PHOTO{imgCount > 1 ? "S" : ""}</span>
                      ) : (
                        <span className="font-mono-ud text-[9px] text-[#ff8c00] bg-[#ff8c00]/10 px-1.5 py-0.5 border border-[#ff8c00]/30 animate-pulse">📷 NO PHOTOS — ADD BELOW</span>
                      )}
                      <span className="font-mono-ud text-[9px] text-white/30">{isExpanded ? "▼ COLLAPSE" : "▶ EXPAND"}</span>
                    </div>
                    <div className="font-bebas text-lg text-white truncate">{a.title}</div>
                    <div className="font-mono-ud text-[10px] text-white/50 line-clamp-2">{a.description}</div>
                  </div>
                  <button onClick={() => handleDelete(a.id, a.title)} disabled={deletingId === a.id} className="p-2.5 border-2 border-white/30 hover:border-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors no-color-transition disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0" title="Delete achievement">{deletingId === a.id ? <Loader2 className="w-5 h-5 animate-spin text-[#ff4d4d]" /> : <Trash2 className="w-5 h-5 text-[#ff4d4d]" />}</button>
                </div>

                {/* PROMINENT UPLOAD BUTTON — always visible (no expand required) */}
                <label
                  className={cn(
                    "mt-3 flex items-center justify-center gap-2 border-2 border-dashed py-2.5 px-3 font-mono-ud text-xs font-bold tracking-wider cursor-pointer transition-colors no-color-transition min-h-[44px]",
                    uploadingFor === a.id
                      ? "border-[#d4ff00] bg-[#d4ff00]/10 text-[#d4ff00] cursor-wait"
                      : "border-[#d4ff00] bg-[#d4ff00]/5 text-[#d4ff00] hover:bg-[#d4ff00] hover:text-black",
                  )}
                  title="Upload foto sertifikat, medali, dll (opsional, max 4MB)"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingFor === a.id ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> UPLOADING…</span>
                  ) : (
                    <span>+ ADD PHOTO {imgCount > 0 && `({imgCount} uploaded)`}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadImage(a.id, f);
                      // Reset so the same file can be re-selected later
                      e.target.value = "";
                    }}
                    disabled={uploadingFor === a.id}
                    className="sr-only"
                  />
                </label>

                {/* Expanded: image gallery (delete per photo) */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t-2 border-[#00e5ff]/20 space-y-3">
                    {imgCount > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {a.images.map((img, i) => (
                          <div key={img.id} className="relative group border-2 border-[#00e5ff]/30 overflow-hidden">
                            <img src={img.img} alt={`${a.title} ${i + 1}`} className="w-full aspect-square object-cover" loading="lazy" />
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute top-1 right-1 bg-[#ff4d4d] text-white p-1.5 border border-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ff0000] min-w-[24px] min-h-[24px] flex items-center justify-center"
                              title="Delete photo"
                              aria-label={`Delete photo ${i + 1}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-mono-ud text-[10px] text-white/30 text-center py-2">
                        Belum ada foto. Klik tombol <span className="text-[#d4ff00] font-bold">+ ADD PHOTO</span> di atas untuk upload sertifikat/medali.
                      </div>
                    )}
                    <p className="font-mono-ud text-[9px] text-white/40 tracking-wider">
                      ▸ Tip: hover foto lalu klik <Trash2 className="w-2.5 h-2.5 inline" /> untuk hapus. Foto disimpan di Supabase Storage.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GAMES TAB — Game metadata + ML player stats + compatibility + DnD characters
// ═══════════════════════════════════════════════════════════════════════════
function GamesTab() {
  const { data: gamesData, refetch: refetchGames } = useFetch<{ games: { id: string; title: string; subtitle: string; description: string; accent: string; carouselTitle: string; bg: string; reverse: boolean }[] }>("/api/games");
  const { data: statsData, refetch: refetchStats } = useFetch<{ stats: { id: string; memberId: string; gameId: string; role: string | null; favHero: string | null; rank: string | null; kda: string | null; winRate: string | null }[] }>("/api/games/player-stats");
  const { data: compatData, refetch: refetchCompat } = useFetch<{ compat: { id: string; memberId: string; gameId: string; level: number }[] }>("/api/games/compatibility");
  const { data: dndData, refetch: refetchDnd } = useFetch<{ characters: { id: string; memberId: string; characterName: string; race: string; charClass: string; level: number; img: string | null; str: number; dex: number; con: number; int: number; wis: number; cha: number }[] }>("/api/games/dnd-characters");
  const { chaosFetch } = useChaosFetch();
  const { play } = useSfx();
  const [selectedGame, setSelectedGame] = useState("ml");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const games = gamesData?.games ?? [];
  const stats = statsData?.stats ?? [];
  const compat = compatData?.compat ?? [];
  const dndChars = dndData?.characters ?? [];

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess(null); } else { setSuccess(msg); setError(null); play("submit"); }
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  // --- ML player stats (role/hero/KDA/WR/rank per member) ---
  const updateStat = async (memberId: string, field: string, value: string) => {
    const existing = stats.find((s) => s.memberId === memberId && s.gameId === selectedGame);
    try {
      if (existing) {
        // Update via a fresh PUT isn't available; we POST to upsert by memberId+gameId.
        // The POST route uses unique constraint, so delete + recreate.
        await chaosFetch(`/api/games/player-stats?id=${existing.id}`, { method: "DELETE" });
      }
      const payload: Record<string, string> = { memberId, gameId: selectedGame };
      if (field) payload[field] = value;
      // Carry over existing fields if we had a record
      if (existing) {
        if (field !== "role" && existing.role) payload.role = existing.role;
        if (field !== "favHero" && existing.favHero) payload.favHero = existing.favHero;
        if (field !== "rank" && existing.rank) payload.rank = existing.rank;
        if (field !== "kda" && existing.kda) payload.kda = existing.kda;
        if (field !== "winRate" && existing.winRate) payload.winRate = existing.winRate;
      }
      const res = await chaosFetch("/api/games/player-stats", { method: "POST", body: JSON.stringify(payload) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      refetchStats(); flash(`✓ ${memberId.toUpperCase()} stat disimpan.`);
    } catch (e) { flash(e instanceof Error ? e.message : "Gagal", true); }
  };

  // --- Compatibility (member × game level 0-3) ---
  const setCompat = async (memberId: string, level: number) => {
    try {
      const res = await chaosFetch("/api/games/compatibility", { method: "POST", body: JSON.stringify({ memberId, gameId: selectedGame, level }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      refetchCompat(); flash(`✓ ${memberId.toUpperCase()} = level ${level}.`);
    } catch (e) { flash(e instanceof Error ? e.message : "Gagal", true); }
  };

  // --- DnD character create/PUT ---
  const [dndMember, setDndMember] = useState("razka");
  const [dndName, setDndName] = useState("");
  const [dndRace, setDndRace] = useState("Human");
  const [dndClass, setDndClass] = useState("Fighter");
  const [dndLevel, setDndLevel] = useState("1");

  const createDnd = async () => {
    if (!dndName.trim()) { flash("Character name wajib diisi.", true); return; }
    try {
      const res = await chaosFetch("/api/games/dnd-characters", {
        method: "POST",
        body: JSON.stringify({ memberId: dndMember, characterName: dndName, race: dndRace, charClass: dndClass, level: Number(dndLevel) }),
      });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      setDndName(""); refetchDnd(); flash(`✓ ${dndName} dibuat!`);
    } catch (e) { flash(e instanceof Error ? e.message : "Gagal", true); }
  };

  const deleteDnd = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}"?`)) return;
    try {
      const res = await chaosFetch(`/api/games/dnd-characters?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal");
      refetchDnd(); flash(`✓ ${name} dihapus.`); play("close");
    } catch (e) { flash(e instanceof Error ? e.message : "Gagal", true); }
  };

  // --- Game metadata PUT ---
  const updateGameMeta = async (gameId: string, field: string, value: string) => {
    try {
      const res = await chaosFetch(`/api/games/${gameId}`, { method: "PUT", body: JSON.stringify({ [field]: value }) });
      const d = await res.json(); if (!res.ok) throw new Error(d.error);
      refetchGames(); flash(`✓ ${gameId.toUpperCase()} updated.`);
    } catch (e) { flash(e instanceof Error ? e.message : "Gagal", true); }
  };

  const selectedGameObj = games.find((g) => g.id === selectedGame);
  const gameStats = stats.filter((s) => s.gameId === selectedGame);
  const gameCompat = compat.filter((c) => c.gameId === selectedGame);
  const COMPAT_LABELS = ["—", "RARE", "CASUAL", "MAIN"];

  return (
    <div className="space-y-4">
      {/* Game selector */}
      <div className="border-8 border-[#00e5ff] bg-black p-6 shadow-[12px_12px_0_#00e5ff]">
        <h2 className="font-bebas text-4xl text-[#00e5ff] mb-4 flex items-center gap-2"><Plus className="w-8 h-8" /> GAMES MANAGER</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {games.map((g) => (
            <button key={g.id} onClick={() => { play("click"); setSelectedGame(g.id); }}
              className={cn("px-4 py-2 border-2 font-bebas text-lg tracking-wider transition-all no-color-transition",
                selectedGame === g.id ? "bg-[#00e5ff] text-black border-white" : "bg-transparent text-white/50 border-white/20 hover:text-white hover:border-white/50")}>
              {g.title}
            </button>
          ))}
        </div>

        {error && <div className="bg-[#ff4d4d] text-white px-3 py-2 border-2 border-white font-mono-ud text-xs font-bold mb-3">! {error}</div>}
        {success && <div className="bg-[#d4ff00] text-black px-3 py-2 border-2 border-black font-mono-ud text-xs font-bold mb-3">{success}</div>}

        {/* Game metadata editor */}
        {selectedGameObj && (
          <div className="space-y-2 border-2 border-[#00e5ff]/30 p-3">
            <div className="font-mono-ud text-xs text-[#00e5ff] tracking-widest mb-1">▸ GAME METADATA</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block"><span className="font-mono-ud text-[10px] text-white/60">TITLE</span><input defaultValue={selectedGameObj.title} onBlur={(e) => updateGameMeta(selectedGame, "title", e.target.value)} className="block w-full px-2 py-1.5 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
              <label className="block"><span className="font-mono-ud text-[10px] text-white/60">SUBTITLE</span><input defaultValue={selectedGameObj.subtitle} onBlur={(e) => updateGameMeta(selectedGame, "subtitle", e.target.value)} className="block w-full px-2 py-1.5 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
            </div>
            <label className="block"><span className="font-mono-ud text-[10px] text-white/60">DESCRIPTION</span><textarea defaultValue={selectedGameObj.description} onBlur={(e) => updateGameMeta(selectedGame, "description", e.target.value)} rows={2} className="block w-full px-2 py-1.5 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm resize-none focus:outline-none focus:border-[#ff00ff]" /></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block"><span className="font-mono-ud text-[10px] text-white/60">ACCENT COLOR</span><input type="color" defaultValue={selectedGameObj.accent} onBlur={(e) => updateGameMeta(selectedGame, "accent", e.target.value)} className="w-full h-8 border-2 border-[#00e5ff] bg-transparent cursor-pointer" /></label>
              <label className="block"><span className="font-mono-ud text-[10px] text-white/60">CAROUSEL TITLE</span><input defaultValue={selectedGameObj.carouselTitle} onBlur={(e) => updateGameMeta(selectedGame, "carouselTitle", e.target.value)} className="block w-full px-2 py-1.5 border-2 border-[#00e5ff] bg-[#1a1a1a] text-white font-mono-ud text-sm focus:outline-none focus:border-[#ff00ff]" /></label>
            </div>
          </div>
        )}
      </div>

      {/* ML player stats editor (most relevant for the ml game) */}
      <div className="border-8 border-[#ff8c00] bg-black p-6 shadow-[12px_12px_0_#ff8c00]">
        <h3 className="font-bebas text-3xl text-[#ff8c00] mb-3 flex items-center gap-2"><Users className="w-6 h-6" /> PLAYER STATS — {selectedGame.toUpperCase()}</h3>
        <div className="space-y-2">
          {MEMBER_SLUGS.map((slug) => {
            const s = gameStats.find((st) => st.memberId === slug);
            return (
              <div key={slug} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center border-2 border-[#ff8c00]/30 p-2">
                <span className="font-bebas text-lg text-[#ff8c00]">{slug.toUpperCase()}</span>
                <input defaultValue={s?.role || ""} onBlur={(e) => e.target.value !== (s?.role || "") && updateStat(slug, "role", e.target.value)} placeholder="ROLE" className="px-2 py-1 border border-[#ff8c00]/50 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
                <input defaultValue={s?.favHero || ""} onBlur={(e) => e.target.value !== (s?.favHero || "") && updateStat(slug, "favHero", e.target.value)} placeholder="FAV HERO" className="px-2 py-1 border border-[#ff8c00]/50 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
                <input defaultValue={s?.rank || ""} onBlur={(e) => e.target.value !== (s?.rank || "") && updateStat(slug, "rank", e.target.value)} placeholder="RANK" className="px-2 py-1 border border-[#ff8c00]/50 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
                <input defaultValue={s?.kda || ""} onBlur={(e) => e.target.value !== (s?.kda || "") && updateStat(slug, "kda", e.target.value)} placeholder="KDA" className="px-2 py-1 border border-[#ff8c00]/50 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
                <input defaultValue={s?.winRate || ""} onBlur={(e) => e.target.value !== (s?.winRate || "") && updateStat(slug, "winRate", e.target.value)} placeholder="WR" className="px-2 py-1 border border-[#ff8c00]/50 bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Compatibility matrix editor */}
      <div className="border-8 border-[#d4ff00] bg-black p-6 shadow-[12px_12px_0_#d4ff00]">
        <h3 className="font-bebas text-3xl text-[#d4ff00] mb-3 flex items-center gap-2"><Shield className="w-6 h-6" /> COMPATIBILITY — {selectedGame.toUpperCase()}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MEMBER_SLUGS.map((slug) => {
            const c = gameCompat.find((co) => co.memberId === slug);
            const level = c?.level ?? 0;
            return (
              <div key={slug} className="border-2 border-[#d4ff00]/30 p-2">
                <div className="font-bebas text-lg text-[#d4ff00] mb-1">{slug.toUpperCase()}</div>
                <div className="flex gap-1">
                  {COMPAT_LABELS.map((label, i) => (
                    <button key={label} onClick={() => setCompat(slug, i)}
                      className={cn("flex-1 px-1 py-1 border font-mono-ud text-[10px] font-bold transition-all no-color-transition",
                        level === i ? "bg-[#d4ff00] text-black border-white" : "bg-transparent text-white/40 border-white/20 hover:text-white")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DnD characters editor */}
      <div className="border-8 border-[#8a2be2] bg-black p-6 shadow-[12px_12px_0_#8a2be2]">
        <h3 className="font-bebas text-3xl text-[#8a2be2] mb-3 flex items-center gap-2"><Award className="w-6 h-6" /> D&D CHARACTERS</h3>
        {/* Create form */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3 border-2 border-[#8a2be2]/30 p-3">
          <select value={dndMember} onChange={(e) => setDndMember(e.target.value)} className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs">{MEMBER_SLUGS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select>
          <input value={dndName} onChange={(e) => setDndName(e.target.value.slice(0, 60))} placeholder="CHARACTER NAME *" className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
          <input value={dndRace} onChange={(e) => setDndRace(e.target.value.slice(0, 40))} placeholder="RACE" className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
          <input value={dndClass} onChange={(e) => setDndClass(e.target.value.slice(0, 40))} placeholder="CLASS" className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
          <input value={dndLevel} onChange={(e) => setDndLevel(e.target.value.slice(0, 2))} placeholder="LVL 1-20" className="px-2 py-2 border-2 border-[#8a2be2] bg-[#1a1a1a] text-white font-mono-ud text-xs focus:outline-none focus:border-[#ff00ff]" />
        </div>
        <button onClick={createDnd} className="w-full bg-[#8a2be2] text-white font-bebas text-2xl py-2 border-2 border-white hover:bg-[#ff00ff] transition-colors no-color-transition mb-3">+ ADD CHARACTER</button>
        {/* Existing characters */}
        <div className="space-y-2">
          {dndChars.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-2 border-[#8a2be2]/30 p-2">
              <div className="flex-1">
                <span className="font-bebas text-lg text-[#8a2be2]">{c.characterName}</span>
                <span className="font-mono-ud text-xs text-white/60 ml-2">{c.memberId.toUpperCase()} · {c.race} · {c.charClass} · LVL {c.level}</span>
              </div>
              <button onClick={() => deleteDnd(c.id, c.characterName)} className="bg-[#ff4d4d] text-white px-2 py-1 border-2 border-white font-mono-ud text-[10px] font-bold hover:bg-[#ff8c00] transition-colors no-color-transition"><Trash2 className="w-3 h-3 inline" /> DEL</button>
            </div>
          ))}
          {dndChars.length === 0 && <div className="font-mono-ud text-xs text-white/40 text-center py-4">No D&D characters yet. Add one above.</div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INFO TAB — Documentation
// ═══════════════════════════════════════════════════════════════════════════
function InfoTab() {
  return (
    <div className="border-8 border-[#00e5ff] bg-black p-6 shadow-[12px_12px_0_#00e5ff]">
      <h2 className="font-bebas text-4xl text-[#00e5ff] mb-4 flex items-center gap-2"><Settings className="w-8 h-8" /> SYSTEM INFO</h2>
      <div className="space-y-4 font-mono-ud text-xs text-white/80">
        <div>
          <h3 className="font-bebas text-2xl text-[#00e5ff] mb-2 border-b-2 border-[#00e5ff]/30 pb-1">▸ TABS BY PAGE</h3>
          <div className="space-y-1 text-[11px]">
            <div>▸ <span className="text-[#d4ff00]">ABOUT:</span> Members (profile + CV) + Quotes</div>
            <div>▸ <span className="text-[#d4ff00]">GALLERY:</span> Photo upload + masonry + edit + delete</div>
            <div>▸ <span className="text-[#d4ff00]">NEWS:</span> Article CRUD + pin/unpin</div>
            <div>▸ <span className="text-[#d4ff00]">GUESTBOOK:</span> Entry CRUD</div>
            <div>▸ <span className="text-[#d4ff00]">PORTFOLIO:</span> Projects + Achievements CRUD</div>
          </div>
        </div>
        <div>
          <h3 className="font-bebas text-2xl text-[#00e5ff] mb-2 border-b-2 border-[#00e5ff]/30 pb-1">▸ API ENDPOINTS</h3>
          <div className="space-y-1 text-[11px]">
            <div className="text-[#d4ff00]">MEMBERS:</div>
            <div>  GET /api/members · GET /api/members/[slug]</div>
            <div>  PUT /api/members/[slug] · POST /api/members/upload</div>
            <div className="text-[#d4ff00] mt-1">GALLERY:</div>
            <div>  GET/POST/PUT/DELETE /api/gallery · POST /api/gallery/upload</div>
            <div className="text-[#d4ff00] mt-1">NEWS:</div>
            <div>  GET/POST/PUT/DELETE /api/news</div>
            <div className="text-[#d4ff00] mt-1">GUESTBOOK:</div>
            <div>  GET/POST/PUT/DELETE /api/guestbook</div>
            <div className="text-[#d4ff00] mt-1">PORTFOLIO:</div>
            <div>  GET/POST/DELETE /api/portfolio</div>
            <div className="text-[#d4ff00] mt-1">ACHIEVEMENTS:</div>
            <div>  GET/POST/DELETE /api/achievements</div>
            <div className="text-[#d4ff00] mt-1">QUOTES:</div>
            <div>  GET/POST/DELETE /api/quotes</div>
            <div className="text-[#d4ff00] mt-1">AUTH:</div>
            <div>  GET /api/chaos-token · GET /api/health</div>
          </div>
        </div>
        <div>
          <h3 className="font-bebas text-2xl text-[#00e5ff] mb-2 border-b-2 border-[#00e5ff]/30 pb-1">▸ CHAOS MODE ACCESS</h3>
          <div className="space-y-1 text-[11px]">
            <div>1. Activate Chaos Mode (Shuffle button in navbar)</div>
            <div>2. Enter sequence: <span className="text-[#d4ff00]">↑ ↓ ← → ← ← ↑</span></div>
            <div className="pl-4 text-white/50">📱 Mobile: Swipe gesture</div>
            <div className="pl-4 text-white/50">⌨️ Desktop: Arrow keys</div>
            <div>3. God Mode unlocks → CHAOS MODE button appears</div>
            <div>4. Expires after 1hr 30min inactivity</div>
          </div>
        </div>
        <div>
          <h3 className="font-bebas text-2xl text-[#00e5ff] mb-2 border-b-2 border-[#00e5ff]/30 pb-1">▸ ARCHITECTURE</h3>
          <div className="space-y-1 text-[11px]">
            <div>▸ <span className="text-[#d4ff00]">Hosting:</span> Vercel (Next.js 16)</div>
            <div>▸ <span className="text-[#d4ff00]">Database:</span> Supabase PostgreSQL</div>
            <div>▸ <span className="text-[#d4ff00]">Storage:</span> Supabase Bucket</div>
            <div>▸ <span className="text-[#d4ff00]">Auth:</span> Chaos-mode token</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ChaosModePage };
