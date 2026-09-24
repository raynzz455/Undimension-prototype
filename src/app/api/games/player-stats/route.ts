import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/games/player-stats?gameId=minecraft — list player stats for a game
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ stats: [] });
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  try {
    const stats = await db.gamePlayerStat.findMany(
      gameId ? { where: { gameId }, include: { member: true } } : { include: { member: true } },
    );
    return NextResponse.json({ stats });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal fetch player stats", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// POST /api/games/player-stats — create a player stat (ML role/hero/KDA/WR)
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { memberId?: string; gameId?: string; role?: string; favHero?: string; rank?: string; kda?: string; winRate?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const memberId = sanitizeText(body.memberId || "").slice(0, 30);
  const gameId = sanitizeText(body.gameId || "").slice(0, 30);
  if (!memberId || !gameId) return NextResponse.json({ error: "memberId dan gameId wajib diisi." }, { status: 400 });

  try {
    const stat = await db.gamePlayerStat.create({
      data: {
        memberId,
        gameId,
        role: body.role ? sanitizeText(body.role).slice(0, 30) : null,
        favHero: body.favHero ? sanitizeText(body.favHero).slice(0, 40) : null,
        rank: body.rank ? sanitizeText(body.rank).slice(0, 40) : null,
        kda: body.kda ? sanitizeText(body.kda).slice(0, 30) : null,
        winRate: body.winRate ? sanitizeText(body.winRate).slice(0, 20) : null,
      },
    });
    return NextResponse.json({ stat });
  } catch (e) {
    return NextResponse.json({ error: "Gagal membuat player stat", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE /api/games/player-stats?id=xxx — delete a player stat
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
    await db.gamePlayerStat.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Gagal hapus player stat", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
