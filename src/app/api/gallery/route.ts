import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { GALLERY_PHOTOS } from "@/lib/undimension/data";
import { requireChaosMode } from "@/lib/chaos-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbPhotos: { id: string; img: string; title: string; date: string; rotate: string; author: string }[] = [];
  if (isDbConfigured()) {
    try {
      const rows = await db.galleryPhoto.findMany({ orderBy: { createdAt: "desc" } });
      dbPhotos = rows.map((p) => ({ id: p.id, img: p.img, title: p.title, date: p.date, rotate: p.rotate, author: p.author }));
    } catch (e) {
      console.warn("[GET /api/gallery] DB unavailable, serving static photos only.", e instanceof Error ? e.message : e);
    }
  }
  // If DB has photos, return ONLY DB photos (static GALLERY_PHOTOS disappear).
  // This lets users replace the static seed data by uploading their own photos.
  // If DB has 0 photos (or unconfigured), return static GALLERY_PHOTOS as fallback.
  if (dbPhotos.length > 0) {
    return NextResponse.json({ photos: dbPhotos, count: dbPhotos.length });
  }
  return NextResponse.json({ photos: GALLERY_PHOTOS, count: GALLERY_PHOTOS.length });
}

export async function PUT(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  try {
    const body = await req.json();
    const { id, title, author, date, rotate } = body as { id?: string; title?: string; author?: string; date?: string; rotate?: string };
    if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
    if (id.startsWith("g") && id.length <= 3) return NextResponse.json({ error: "Foto statis tidak bisa diedit." }, { status: 400 });
    const data: Record<string, string> = {};
    if (title !== undefined) data.title = String(title).trim().slice(0, 40);
    if (author !== undefined) data.author = String(author).trim().slice(0, 40).toUpperCase();
    if (date !== undefined) data.date = String(date);
    if (rotate !== undefined) data.rotate = String(rotate);
    const updated = await db.galleryPhoto.update({ where: { id }, data });
    return NextResponse.json({ id: updated.id, img: updated.img, title: updated.title, author: updated.author, date: updated.date, rotate: updated.rotate });
  } catch (e) { return NextResponse.json({ error: "Gagal update foto." }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib diisi via ?id=" }, { status: 400 });
    if (id.startsWith("g") && id.length <= 3) return NextResponse.json({ error: "Foto statis tidak bisa dihapus." }, { status: 400 });
    await db.galleryPhoto.delete({ where: { id } });
    return NextResponse.json({ success: true, id, message: "Foto dihapus." });
  } catch (e) { return NextResponse.json({ error: "Gagal menghapus foto." }, { status: 500 }); }
}
