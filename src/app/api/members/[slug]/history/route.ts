import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { cleanText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mapHistory(h: any) {
  return {
    id: h.id,
    memberSlug: h.memberSlug,
    name: h.name,
    nick: h.nick,
    role: h.role,
    img: h.img,
    color: h.color,
    highlight: h.highlight,
    bio: h.bio,
    tagline: h.tagline || "",
    quote: h.quote || "",
    element: h.element || "",
    joinYear: h.joinYear || "2020",
    funFacts: safeParse<string[]>(h.funFactsJson, []),
    stats: safeParse<{ label: string; value: string }[]>(h.statsJson, []),
    socials: safeParse<{ label: string; href: string }[]>(h.socialsJson, []),
    taglineCareer: h.taglineCareer || "",
    location: h.location || "",
    availability: h.availability || "EMPLOYED",
    education: safeParse(h.educationJson, []),
    workHistory: safeParse(h.workHistoryJson, []),
    skills: safeParse(h.skillsJson, []),
    createdAt: h.createdAt.toISOString(),
  };
}

// GET /api/members/[slug]/history — list profile history (max 4)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!isDbConfigured()) {
    return NextResponse.json({ history: [], count: 0 });
  }
  try {
    const history = await db.memberProfileHistory.findMany({
      where: { memberSlug: slug },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return NextResponse.json({
      history: history.map(mapHistory),
      count: history.length,
    });
  } catch (e) {
    return NextResponse.json({ history: [], count: 0 });
  }
}

// POST /api/members/[slug]/history — restore a profile from history
// Body: { historyId: "xxx" }
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const auth = await requireChaosMode();
  if (!auth.authorized) {
    return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  }
  const { slug } = await ctx.params;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const historyId = cleanText(body.historyId, 100);

    if (!historyId) {
      return NextResponse.json({ error: "historyId wajib diisi." }, { status: 400 });
    }

    // Find the history snapshot
    const history = await db.memberProfileHistory.findUnique({ where: { id: historyId } });
    if (!history) {
      return NextResponse.json({ error: "History snapshot not found." }, { status: 404 });
    }

    // Save current profile as new history before restoring
    const current = await db.member.findUnique({ where: { slug } });
    if (current) {
      await db.memberProfileHistory.create({
        data: {
          memberSlug: slug,
          name: current.name, nick: current.nick, role: current.role,
          img: current.img, color: current.color, highlight: current.highlight,
          bio: current.bio, tagline: current.tagline || "", quote: current.quote || "",
          funFactsJson: current.funFactsJson || "[]", element: current.element || "",
          joinYear: current.joinYear || "2020", statsJson: current.statsJson || "[]",
          socialsJson: current.socialsJson || "[]", taglineCareer: current.taglineCareer || "",
          location: current.location || "", availability: current.availability || "EMPLOYED",
          educationJson: current.educationJson || "[]", workHistoryJson: current.workHistoryJson || "[]",
          skillsJson: current.skillsJson || "[]",
        },
      });

      // Trim to max 4
      const count = await db.memberProfileHistory.count({ where: { memberSlug: slug } });
      if (count > 4) {
        const oldest = await db.memberProfileHistory.findMany({
          where: { memberSlug: slug },
          orderBy: { createdAt: "asc" },
          take: count - 4,
          select: { id: true },
        });
        if (oldest.length > 0) {
          await db.memberProfileHistory.deleteMany({
            where: { id: { in: oldest.map((h) => h.id) } },
          });
        }
      }
    }

    // Restore the member from history snapshot
    const restored = await db.member.update({
      where: { slug },
      data: {
        name: history.name, nick: history.nick, role: history.role,
        img: history.img, color: history.color, highlight: history.highlight,
        bio: history.bio, tagline: history.tagline, quote: history.quote,
        funFactsJson: history.funFactsJson, element: history.element,
        joinYear: history.joinYear, statsJson: history.statsJson,
        socialsJson: history.socialsJson, taglineCareer: history.taglineCareer,
        location: history.location, availability: history.availability,
        educationJson: history.educationJson, workHistoryJson: history.workHistoryJson,
        skillsJson: history.skillsJson,
      },
    });
    try { revalidatePath("/api/members"); revalidatePath("/api/members/" + slug); } catch {}

    return NextResponse.json({
      success: true,
      message: `Profile restored from ${new Date(history.createdAt).toLocaleString("id-ID")}`,
      member: {
        id: restored.slug, name: restored.name, nick: restored.nick, role: restored.role,
        img: restored.img, color: restored.color, highlight: restored.highlight, bio: restored.bio,
        tagline: restored.tagline || "", quote: restored.quote || "",
        element: restored.element || "", joinYear: restored.joinYear || "2020",
        funFacts: safeParse(restored.funFactsJson, []),
        stats: safeParse(restored.statsJson, []),
        socials: safeParse(restored.socialsJson, []),
        taglineCareer: restored.taglineCareer || "", location: restored.location || "",
        availability: restored.availability || "EMPLOYED",
        education: safeParse(restored.educationJson, []),
        workHistory: safeParse(restored.workHistoryJson, []),
        skills: safeParse(restored.skillsJson, []),
        achievements: [], projects: [],
      },
    });
  } catch (e) {
    return NextResponse.json({
      error: "Gagal restore profile.",
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
