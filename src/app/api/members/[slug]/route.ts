import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { MEMBERS } from "@/lib/undimension/data";
import { requireChaosMode } from "@/lib/chaos-auth";
import { cleanText, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapMember(m: any) {
  return {
    id: m.slug, name: m.name, nick: m.nick, role: m.role, img: m.img,
    color: m.color, highlight: m.highlight, bio: m.bio,
    tagline: m.tagline || "", quote: m.quote || "", element: m.element || "", joinYear: m.joinYear || "2020",
    funFacts: safeParse<string[]>(m.funFactsJson, []),
    stats: safeParse<{ label: string; value: string }[]>(m.statsJson, []),
    socials: safeParse<{ label: string; href: string }[]>(m.socialsJson, []),
    taglineCareer: m.taglineCareer || "", location: m.location || "", availability: m.availability || "EMPLOYED",
    education: safeParse(m.educationJson, []),
    workHistory: safeParse(m.workHistoryJson, []),
    skills: safeParse(m.skillsJson, []),
    achievements: [], projects: [],
  };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!isDbConfigured()) {
    const member = MEMBERS.find((m) => m.id === slug);
    return member ? NextResponse.json({ member }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const m = await db.member.findUnique({ where: { slug } });
    if (!m) {
      const staticMember = MEMBERS.find((x) => x.id === slug);
      return staticMember ? NextResponse.json({ member: staticMember }) : NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ member: mapMember(m) });
  } catch (e) {
    console.warn(`[GET /api/members/${slug}] DB error:`, e instanceof Error ? e.message : e);
    const member = MEMBERS.find((x) => x.id === slug);
    return member ? NextResponse.json({ member }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED", step: "auth" }, { status: 403 });
  const { slug } = await ctx.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured.", step: "dbConfig" }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body", detail: e instanceof Error ? e.message : String(e), step: "parseBody" }, { status: 400 });
  }

  // Check member exists
  let existing: any;
  try {
    existing = await db.member.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: `Member '${slug}' not found in DB.`, step: "memberExists" }, { status: 404 });
    }
  } catch (e) {
    return NextResponse.json({ error: "DB query failed", detail: e instanceof Error ? e.message : String(e), step: "findUnique" }, { status: 500 });
  }

  // ── Save current profile as history snapshot BEFORE updating ──
  try {
    await db.memberProfileHistory.create({
      data: {
        memberSlug: slug,
        name: existing.name,
        nick: existing.nick,
        role: existing.role,
        img: existing.img,
        color: existing.color,
        highlight: existing.highlight,
        bio: existing.bio,
        tagline: existing.tagline || "",
        quote: existing.quote || "",
        funFactsJson: existing.funFactsJson || "[]",
        element: existing.element || "",
        joinYear: existing.joinYear || "2020",
        statsJson: existing.statsJson || "[]",
        socialsJson: existing.socialsJson || "[]",
        taglineCareer: existing.taglineCareer || "",
        location: existing.location || "",
        availability: existing.availability || "EMPLOYED",
        educationJson: existing.educationJson || "[]",
        workHistoryJson: existing.workHistoryJson || "[]",
        skillsJson: existing.skillsJson || "[]",
      },
    });

    // Delete oldest history entries if more than 4 exist for this member
    const historyCount = await db.memberProfileHistory.count({ where: { memberSlug: slug } });
    if (historyCount > 4) {
      const oldest = await db.memberProfileHistory.findMany({
        where: { memberSlug: slug },
        orderBy: { createdAt: "asc" },
        take: historyCount - 4, // delete the excess
        select: { id: true },
      });
      if (oldest.length > 0) {
        await db.memberProfileHistory.deleteMany({
          where: { id: { in: oldest.map((h) => h.id) } },
        });
      }
    }
  } catch (e) {
    console.warn(`[PUT /api/members/${slug}] Failed to save history:`, e instanceof Error ? e.message : e);
    // Non-blocking — continue with update even if history save fails
  }

  // ── Build update data ──
  // NOTE: bioPortfolio is EXCLUDED from stringFields + handled separately
  // below. This prevents the ENTIRE update from failing if the bioPortfolio
  // column doesn't exist in the DB (migration 0006 not run yet).
  // All fields use sanitizeText → null bytes (0x00) stripped (22021 fix).
  const data: Record<string, unknown> = {};
  const stringFields = ["name", "nick", "role", "img", "color", "highlight", "bio", "tagline", "quote", "element", "joinYear", "taglineCareer", "location", "availability"];
  for (const f of stringFields) {
    if (body[f] !== undefined) data[f] = sanitizeText(cleanText(body[f], 2000));
  }
  if (body.stats !== undefined) data.statsJson = JSON.stringify(body.stats);
  if (body.socials !== undefined) data.socialsJson = JSON.stringify(body.socials);
  if (body.funFacts !== undefined) data.funFactsJson = JSON.stringify(body.funFacts);
  if (body.workHistory !== undefined) data.workHistoryJson = JSON.stringify(body.workHistory);
  if (body.education !== undefined) data.educationJson = JSON.stringify(body.education);
  if (body.skills !== undefined) data.skillsJson = JSON.stringify(body.skills);

  // ── Update member (without bioPortfolio — guaranteed to work) ──
  let updated: any;
  try {
    updated = await db.member.update({ where: { slug }, data });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`[PUT /api/members/${slug}] Update failed:`, errMsg);
    return NextResponse.json({ error: "DB update failed", detail: errMsg, step: "dbUpdate", fieldsAttempted: Object.keys(data) }, { status: 500 });
  }

  // ── Try to update bioPortfolio separately (won't break the main update) ──
  // If the column doesn't exist (migration 0006 not run), this silently
  // fails + the rest of the member data is already saved.
  if (body.bioPortfolio !== undefined) {
    try {
      updated = await db.member.update({
        where: { slug },
        data: { bioPortfolio: sanitizeText(cleanText(body.bioPortfolio, 2000)) },
      });
    } catch (e) {
      console.warn(`[PUT /api/members/${slug}] bioPortfolio update skipped (column may not exist):`, e instanceof Error ? e.message : e);
    }
  }

  // ── Try to update hidden flag separately (won't break the main update) ──
  if (body.hidden !== undefined) {
    try {
      updated = await db.member.update({
        where: { slug },
        data: { hidden: Boolean(body.hidden) },
      });
    } catch (e) {
      console.warn(`[PUT /api/members/${slug}] hidden update skipped (column may not exist):`, e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ member: mapMember(updated) });
}
