import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/games/dnd-campaigns — list all campaigns
export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ campaigns: [] });
  try {
    const campaigns = await db.dnDCampaign.findMany({ orderBy: { createdAt: "desc" }, include: { images: true } });
    return NextResponse.json({ campaigns });
  } catch (e) {
    console.warn("[GET /api/games/dnd-campaigns] DB error, returning empty.", e instanceof Error ? e.message : e);
    return NextResponse.json({ campaigns: [] });
  }
}

// POST /api/games/dnd-campaigns — create a campaign
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  let body: { name?: string; dm?: string; status?: string; description?: string; storyOutline?: string; sessions?: number } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const name = sanitizeText(body.name || "").slice(0, 80);
  if (!name) return NextResponse.json({ error: "name wajib diisi." }, { status: 400 });

  try {
    const campaign = await db.dnDCampaign.create({
      data: {
        name,
        dm: sanitizeText(body.dm || "Unknown DM").slice(0, 60),
        status: sanitizeText(body.status || "ONGOING").slice(0, 20),
        description: sanitizeText(body.description || "").slice(0, 500),
        storyOutline: body.storyOutline ? sanitizeText(body.storyOutline).slice(0, 1000) : null,
        sessions: Math.max(0, Math.min(999, Number(body.sessions) || 0)),
      },
    });
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json({ error: "Gagal membuat campaign", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// PUT /api/games/dnd-campaigns?id=xxx — update a campaign
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
  if (body.name !== undefined) data.name = sanitizeText(String(body.name)).slice(0, 80);
  if (body.dm !== undefined) data.dm = sanitizeText(String(body.dm)).slice(0, 60);
  if (body.status !== undefined) data.status = sanitizeText(String(body.status)).slice(0, 20);
  if (body.description !== undefined) data.description = sanitizeText(String(body.description)).slice(0, 500);
  if (body.storyOutline !== undefined) data.storyOutline = body.storyOutline ? sanitizeText(String(body.storyOutline)).slice(0, 1000) : null;
  if (body.sessions !== undefined) data.sessions = Math.max(0, Math.min(999, Number(body.sessions) || 0));

  try {
    const campaign = await db.dnDCampaign.update({ where: { id }, data });
    return NextResponse.json({ campaign });
  } catch (e) {
    return NextResponse.json({ error: "Gagal update campaign", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE /api/games/dnd-campaigns?id=xxx — delete (cascade images)
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
    await db.dnDCampaign.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Gagal hapus campaign", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
