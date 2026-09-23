import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { MEMBERS } from "@/lib/undimension/data";

export const dynamic = "force-dynamic";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapMember(m: {
  slug: string; name: string; nick: string; role: string; img: string;
  color: string; highlight: string; bio: string; bioPortfolio?: string | null;
  tagline: string; quote: string; funFactsJson: string; element: string; joinYear: string;
  statsJson: string; socialsJson: string;
  taglineCareer: string; location: string; availability: string;
  educationJson: string; workHistoryJson: string; skillsJson: string;
}) {
  return {
    id: m.slug,
    name: m.name,
    nick: m.nick,
    role: m.role,
    img: m.img,
    color: m.color,
    highlight: m.highlight,
    bio: m.bio,
    bioPortfolio: m.bioPortfolio || "",
    tagline: m.tagline || "",
    quote: m.quote || "",
    funFacts: safeParse<string[]>(m.funFactsJson, []),
    element: m.element || "",
    joinYear: m.joinYear || "2020",
    stats: safeParse<{ label: string; value: string }[]>(m.statsJson, []),
    socials: safeParse<{ label: string; href: string }[]>(m.socialsJson, []),
    taglineCareer: m.taglineCareer || "",
    location: m.location || "",
    availability: m.availability || "EMPLOYED",
    education: safeParse(m.educationJson, []),
    workHistory: safeParse(m.workHistoryJson, []),
    skills: safeParse(m.skillsJson, []),
    achievements: [],
    projects: [],
  };
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ members: MEMBERS });
  }
  try {
    const members = await db.member.findMany({ orderBy: { order: "asc" } });
    const data = members.map(mapMember);
    return NextResponse.json({ members: data });
  } catch (e) {
    console.warn("[GET /api/members] DB unavailable, serving static members.", e instanceof Error ? e.message : e);
    return NextResponse.json({ members: MEMBERS });
  }
}
