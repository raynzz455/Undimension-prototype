import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ achievements: [], count: 0 });
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const rows = await db.achievement.findMany({
      where: memberId ? { memberId } : undefined,
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: { images: true },
    });
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
    return NextResponse.json({ achievements, count: achievements.length });
  } catch (e) { return NextResponse.json({ achievements: [], count: 0 }); }
}

export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  const rl = rateLimit(getClientIP(req));
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  try {
    const body = await req.json();
    const title = String(body.title || "").trim().slice(0, 100);
    const year = String(body.year || String(new Date().getFullYear()));
    const description = String(body.description || "").trim().slice(0, 500);
    const memberId = String(body.memberId || "aldi").trim().slice(0, 50);
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
