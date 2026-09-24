import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured, dbRetry } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";
import { GAMES } from "@/lib/undimension/data";

export const dynamic = "force-dynamic";

// GET /api/games — list all games (from DB if configured, fallback to static GAMES)
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ games: GAMES }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }
  try {
    // Single query with `include` — fetches games + their moments in 1 round-trip.
    // (Was: 1 query for games + N queries for moments via Promise.all(map) = N+1.
    // With N=6 games that's 7 queries, and on connection_limit=1 they all queued.)
    const games = await dbRetry(() => db.game.findMany({
      orderBy: { order: "asc" },
      include: { moments: { orderBy: { order: "asc" }, select: { img: true } } },
    }));
    if (games.length === 0) return NextResponse.json({ games: GAMES }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
    const expanded = games.map((g) => ({
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
      images: g.moments.map((m) => m.img),
    }));
    return NextResponse.json({ games: expanded }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
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
