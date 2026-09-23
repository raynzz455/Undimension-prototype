import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured, dbRetry } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";
import { GAMES } from "@/lib/undimension/data";

export const dynamic = "force-dynamic";

// GET /api/games — list all games (from DB if configured, fallback to static GAMES)
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ games: GAMES });
  }
  try {
    const games = await dbRetry(() => db.game.findMany({ orderBy: { order: "asc" } }));
    if (games.length === 0) return NextResponse.json({ games: GAMES });
    // Expand each game with its moments (for the carousel)
    const expanded = await Promise.all(
      games.map(async (g) => {
        const moments = await dbRetry(() => db.gameMoment.findMany({
          where: { gameId: g.gameId },
          orderBy: { order: "asc" },
        }));
        return {
          id: g.gameId,
          sector: g.sector,
          title: g.title,
          subtitle: g.subtitle,
          description: g.description,
          bg: g.bgImg,
          accent: g.accent,
          carouselTitle: g.carouselTitle,
          reverse: g.reverse,
          fontClass: g.fontClass || undefined,
          images: moments.map((m) => m.img),
        };
      }),
    );
    return NextResponse.json({ games: expanded });
  } catch (e) {
    console.warn("[GET /api/games] DB unavailable, returning 503.", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "DB temporarily unavailable" }, { status: 503 });
  }
}

// POST /api/games — create a new game (chaos-protected + rate-limited)
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: {
    gameId?: string; sector?: string; title?: string; subtitle?: string;
    description?: string; bgImg?: string; accent?: string; carouselTitle?: string;
    reverse?: boolean; fontClass?: string; order?: number;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const gameId = sanitizeText(body.gameId || "").toLowerCase().slice(0, 30);
  const title = sanitizeText(body.title || "").slice(0, 60);
  if (!gameId || !title) {
    return NextResponse.json({ error: "gameId dan title wajib diisi." }, { status: 400 });
  }

  try {
    const game = await db.game.create({
      data: {
        gameId,
        sector: sanitizeText(body.sector || "SEKTOR").slice(0, 20),
        title,
        subtitle: sanitizeText(body.subtitle || "").slice(0, 80),
        description: sanitizeText(body.description || "").slice(0, 500),
        bgImg: sanitizeText(body.bgImg || "").slice(0, 300),
        accent: sanitizeText(body.accent || "#ff4d4d").slice(0, 20),
        carouselTitle: sanitizeText(body.carouselTitle || "OUR WORLD").slice(0, 40),
        reverse: Boolean(body.reverse),
        fontClass: body.fontClass ? sanitizeText(body.fontClass).slice(0, 30) : null,
        order: Number(body.order) || 0,
      },
    });
    return NextResponse.json({ game });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal membuat game", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
