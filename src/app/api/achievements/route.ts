import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured, dbRetry } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, cleanText, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ achievements: [], count: 0 }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const rows = await dbRetry(() => db.achievement.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: { images: true },
    }));
    // Return image objects with both id (for delete) and img (URL for display)
    // so the frontend can wire up per-image delete without extra round-trips.
    const achievements = rows.map((a) => ({
      id: a.id,
      memberId: a.memberId,
      title: a.title,
      year: a.year,
      description: a.description,
      images: a.images.map((img) => ({ id: img.id, img: img.img })),
    }));
    return NextResponse.json({ achievements, count: achievements.length }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.warn("[GET /api/achievements] DB unavailable, returning 503.", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "DB temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  const rl = rateLimit(getClientIP(req));
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const body = await req.json();
    const title = sanitizeText(cleanText(body.title, 100));
    const year = cleanText(body.year || String(new Date().getFullYear()), 10);
    const description = sanitizeText(cleanText(body.description, 500));
    const memberId = cleanText(body.memberId || "aldi", 50);
    if (!title || !description) return NextResponse.json({ error: "Title dan description wajib diisi." }, { status: 400 });
    const achievement = await db.achievement.create({ data: { title, year, description, memberId } });
    return NextResponse.json({ id: achievement.id, ...achievement, images: [] });
  } catch (e) { return NextResponse.json({ error: "Gagal membuat achievement." }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  const rl = rateLimit(getClientIP(req));
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });
    await db.achievement.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (e) { return NextResponse.json({ error: "Gagal menghapus achievement." }, { status: 500 }); }
}
