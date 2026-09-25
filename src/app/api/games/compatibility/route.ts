import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/games/compatibility?gameId=minecraft — list member×game compatibility levels
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ compat: [] });
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  try {
    const compat = await db.gameCompatibility.findMany(gameId ? { where: { gameId } } : undefined);
    return NextResponse.json({ compat }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.warn("[GET /api/games/compatibility] DB unavailable, returning 503.", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "DB temporarily unavailable" }, { status: 503 });
  }
}

// POST /api/games/compatibility — upsert a compatibility level (0-3) for a member×game
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { memberId?: string; gameId?: string; level?: number } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const memberId = sanitizeText(body.memberId || "").slice(0, 30);
  const gameId = sanitizeText(body.gameId || "").slice(0, 30);
  const level = Math.max(0, Math.min(3, Number(body.level) || 0));
  if (!memberId || !gameId) return NextResponse.json({ error: "memberId dan gameId wajib diisi." }, { status: 400 });

  try {
    // Upsert: update if exists, create if not (unique constraint on [memberId, gameId])
    const existing = await db.gameCompatibility.findUnique({
      where: { memberId_gameId: { memberId, gameId } },
    });
    let compat;
    if (existing) {
      compat = await db.gameCompatibility.update({ where: { id: existing.id }, data: { level } });
    } else {
      compat = await db.gameCompatibility.create({ data: { memberId, gameId, level } });
    }
    try { revalidatePath("/api/games/compatibility"); } catch {}
    return NextResponse.json({ compat });
  } catch (e) {
    return NextResponse.json({ error: "Gagal set compatibility", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
