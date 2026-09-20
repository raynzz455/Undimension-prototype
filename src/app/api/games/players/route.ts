import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/games/players?gameId=minecraft — list players for a game
// Returns players from DB if configured, else empty (caller falls back to static).
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ players: [] });
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ players: [] });
  try {
    const players = await db.gamePlayer.findMany({
      where: { gameId },
      orderBy: [{ isMember: "desc" }, { order: "asc" }],
    });
    return NextResponse.json({ players });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal fetch players", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// POST /api/games/players — create a player (member OR external)
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: {
    gameId?: string; name?: string; nick?: string; img?: string; color?: string;
    role?: string; favHero?: string; rank?: string; kda?: string; winRate?: string;
    dndCharacter?: string; dndRace?: string; dndClass?: string; dndLevel?: number;
    isMember?: boolean; memberSlug?: string; order?: number;
  } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const gameId = sanitizeText(body.gameId || "").slice(0, 30);
  const name = sanitizeText(body.name || "").slice(0, 60);
  const nick = sanitizeText(body.nick || "").slice(0, 30);
  if (!gameId || !name || !nick) {
    return NextResponse.json({ error: "gameId, name, dan nick wajib diisi." }, { status: 400 });
  }

  try {
    const player = await db.gamePlayer.create({
      data: {
        gameId,
        name,
        nick,
        img: body.img ? sanitizeText(body.img).slice(0, 300) : null,
        color: sanitizeText(body.color || "#ff8c00").slice(0, 20),
        role: body.role ? sanitizeText(body.role).slice(0, 30) : null,
        favHero: body.favHero ? sanitizeText(body.favHero).slice(0, 40) : null,
        rank: body.rank ? sanitizeText(body.rank).slice(0, 40) : null,
        kda: body.kda ? sanitizeText(body.kda).slice(0, 30) : null,
        winRate: body.winRate ? sanitizeText(body.winRate).slice(0, 20) : null,
        dndCharacter: body.dndCharacter ? sanitizeText(body.dndCharacter).slice(0, 60) : null,
        dndRace: body.dndRace ? sanitizeText(body.dndRace).slice(0, 40) : null,
        dndClass: body.dndClass ? sanitizeText(body.dndClass).slice(0, 40) : null,
        dndLevel: Math.max(1, Math.min(20, Number(body.dndLevel) || 1)),
        isMember: Boolean(body.isMember),
        memberSlug: body.isMember && body.memberSlug ? sanitizeText(body.memberSlug).slice(0, 30) : null,
        order: Number(body.order) || 0,
      },
    });
    return NextResponse.json({ player });
  } catch (e) {
    return NextResponse.json({ error: "Gagal membuat player", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// PUT /api/games/players?id=xxx — update a player
export async function PUT(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = sanitizeText(String(body.name)).slice(0, 60);
  if (body.nick !== undefined) data.nick = sanitizeText(String(body.nick)).slice(0, 30);
  if (body.img !== undefined) data.img = body.img ? sanitizeText(String(body.img)).slice(0, 300) : null;
  if (body.color !== undefined) data.color = sanitizeText(String(body.color)).slice(0, 20);
  if (body.role !== undefined) data.role = body.role ? sanitizeText(String(body.role)).slice(0, 30) : null;
  if (body.favHero !== undefined) data.favHero = body.favHero ? sanitizeText(String(body.favHero)).slice(0, 40) : null;
  if (body.rank !== undefined) data.rank = body.rank ? sanitizeText(String(body.rank)).slice(0, 40) : null;
  if (body.kda !== undefined) data.kda = body.kda ? sanitizeText(String(body.kda)).slice(0, 30) : null;
  if (body.winRate !== undefined) data.winRate = body.winRate ? sanitizeText(String(body.winRate)).slice(0, 20) : null;
  if (body.dndCharacter !== undefined) data.dndCharacter = body.dndCharacter ? sanitizeText(String(body.dndCharacter)).slice(0, 60) : null;
  if (body.dndRace !== undefined) data.dndRace = body.dndRace ? sanitizeText(String(body.dndRace)).slice(0, 40) : null;
  if (body.dndClass !== undefined) data.dndClass = body.dndClass ? sanitizeText(String(body.dndClass)).slice(0, 40) : null;
  if (body.dndLevel !== undefined) data.dndLevel = Math.max(1, Math.min(20, Number(body.dndLevel) || 1));
  if (body.isMember !== undefined) data.isMember = Boolean(body.isMember);
  if (body.memberSlug !== undefined) data.memberSlug = body.isMember && body.memberSlug ? sanitizeText(String(body.memberSlug)).slice(0, 30) : null;
  if (body.order !== undefined) data.order = Number(body.order) || 0;

  try {
    const player = await db.gamePlayer.update({ where: { id }, data });
    return NextResponse.json({ player });
  } catch (e) {
    return NextResponse.json({ error: "Gagal update player", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE /api/games/players?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });

  try {
    await db.gamePlayer.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Gagal hapus player", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
