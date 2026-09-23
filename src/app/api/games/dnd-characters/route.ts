import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/games/dnd-characters?memberId=razka — list D&D characters for a member
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ characters: [] });
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  try {
    const characters = await db.dnDCharacter.findMany(memberId ? { where: { memberId } } : undefined);
    return NextResponse.json({ characters });
  } catch (e) {
    console.warn("[GET /api/games/dnd-characters] DB unavailable, returning 503.", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "DB temporarily unavailable" }, { status: 503 });
  }
}

// POST /api/games/dnd-characters — create a D&D character
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
    memberId?: string; characterName?: string; race?: string; charClass?: string;
    level?: number; img?: string;
    str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number;
  } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const memberId = sanitizeText(body.memberId || "").slice(0, 30);
  const characterName = sanitizeText(body.characterName || "").slice(0, 60);
  if (!memberId || !characterName) return NextResponse.json({ error: "memberId dan characterName wajib diisi." }, { status: 400 });

  const clamp = (n: unknown, d = 10) => Math.max(1, Math.min(30, Number(n) || d));
  try {
    const character = await db.dnDCharacter.create({
      data: {
        memberId,
        characterName,
        race: sanitizeText(body.race || "Unknown").slice(0, 40),
        charClass: sanitizeText(body.charClass || "Adventurer").slice(0, 40),
        level: Math.max(1, Math.min(20, Number(body.level) || 1)),
        img: body.img ? sanitizeText(body.img).slice(0, 300) : null,
        str: clamp(body.str),
        dex: clamp(body.dex),
        con: clamp(body.con),
        int: clamp(body.int),
        wis: clamp(body.wis),
        cha: clamp(body.cha),
      },
    });
    return NextResponse.json({ character });
  } catch (e) {
    return NextResponse.json({ error: "Gagal membuat DnD character", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// PUT /api/games/dnd-characters?id=xxx — update a D&D character
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
  if (body.characterName !== undefined) data.characterName = sanitizeText(String(body.characterName)).slice(0, 60);
  if (body.race !== undefined) data.race = sanitizeText(String(body.race)).slice(0, 40);
  if (body.charClass !== undefined) data.charClass = sanitizeText(String(body.charClass)).slice(0, 40);
  if (body.level !== undefined) data.level = Math.max(1, Math.min(20, Number(body.level) || 1));
  if (body.img !== undefined) data.img = body.img ? sanitizeText(String(body.img)).slice(0, 300) : null;
  const clamp = (n: unknown, d = 10) => Math.max(1, Math.min(30, Number(n) || d));
  if (body.str !== undefined) data.str = clamp(body.str);
  if (body.dex !== undefined) data.dex = clamp(body.dex);
  if (body.con !== undefined) data.con = clamp(body.con);
  if (body.int !== undefined) data.int = clamp(body.int);
  if (body.wis !== undefined) data.wis = clamp(body.wis);
  if (body.cha !== undefined) data.cha = clamp(body.cha);

  try {
    const character = await db.dnDCharacter.update({ where: { id }, data });
    return NextResponse.json({ character });
  } catch (e) {
    return NextResponse.json({ error: "Gagal update DnD character", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE /api/games/dnd-characters?id=xxx
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
    await db.dnDCharacter.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Gagal hapus DnD character", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
