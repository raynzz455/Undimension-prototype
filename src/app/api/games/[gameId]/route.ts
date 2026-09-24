import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// PUT /api/games/[gameId] — update an existing game (chaos-protected + rate-limited)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { gameId } = await params;
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Build the update payload — only allow known fields, sanitized.
  const data: Record<string, unknown> = {};
  if (body.sector !== undefined) data.sector = sanitizeText(String(body.sector)).slice(0, 20);
  if (body.title !== undefined) data.title = sanitizeText(String(body.title)).slice(0, 60);
  if (body.subtitle !== undefined) data.subtitle = sanitizeText(String(body.subtitle)).slice(0, 80);
  if (body.description !== undefined) data.description = sanitizeText(String(body.description)).slice(0, 500);
  if (body.bgImg !== undefined) data.bgImg = sanitizeText(String(body.bgImg)).slice(0, 300);
  if (body.accent !== undefined) data.accent = sanitizeText(String(body.accent)).slice(0, 20);
  if (body.carouselTitle !== undefined) data.carouselTitle = sanitizeText(String(body.carouselTitle)).slice(0, 40);
  if (body.reverse !== undefined) data.reverse = Boolean(body.reverse);
  if (body.fontClass !== undefined) data.fontClass = body.fontClass ? sanitizeText(String(body.fontClass)).slice(0, 30) : null;
  if (body.order !== undefined) data.order = Number(body.order) || 0;

  try {
    const game = await db.game.update({ where: { gameId }, data });
    return NextResponse.json({ game });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal update game", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// DELETE /api/games/[gameId] — delete a game (cascade deletes moments)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const { gameId } = await params;
  try {
    // Cascade: delete moments first (GameMoment has no onDelete cascade in schema)
    await db.gameMoment.deleteMany({ where: { gameId } });
    await db.gamePlayerStat.deleteMany({ where: { gameId } });
    await db.gameCompatibility.deleteMany({ where: { gameId } });
    await db.game.delete({ where: { gameId } });
    return NextResponse.json({ ok: true, gameId });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal hapus game", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
