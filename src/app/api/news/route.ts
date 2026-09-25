import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireChaosMode } from "@/lib/chaos-auth";
import { db, isDbConfigured } from "@/lib/db";
import { rateLimit, getClientIP, sanitizeText, cleanText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  // Try the database; if it fails (e.g. not pushed / seeded yet),
  // return an empty list so the frontend never 500s.
  if (!isDbConfigured()) {
    return NextResponse.json({ articles: [], count: 0 }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  }
  try {
    const articles = await db.newsArticle.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 20,
    });

    return NextResponse.json({
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        category: a.category,
        author: a.author,
        img: a.img,
        pinned: a.pinned,
        createdAt: a.createdAt.toISOString(),
      })),
      count: articles.length,
    }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (e) {
    console.warn("[GET /api/news] DB unavailable, returning empty list.", e instanceof Error ? e.message : e);
    return NextResponse.json({ articles: [], count: 0 }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  }
}

export async function POST(req: NextRequest) {
  // Rate-limit public submissions to prevent spam.
  // (News POST is unauthenticated in the public form — chaos-mode POST
  // would bypass this, but the public NewsPortal form needs protection.)
  const ip = getClientIP(req);
  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Rate limit tercapai. Coba lagi dalam ${retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ articles: [], count: 0 });
  }
  try {
    const body = await req.json();
    // Sanitize input: strip HTML tags / event handlers to prevent stored XSS.
    const title = sanitizeText(String(body.title || "")).slice(0, 80);
    const text = sanitizeText(String(body.body || "")).slice(0, 500);
    const category = sanitizeText(String(body.category || "UPDATE"))
      .slice(0, 20)
      .toUpperCase();
    const author = sanitizeText(String(body.author || "THE COLLECTIVE"))
      .slice(0, 30)
      .toUpperCase();
    const img = body.img ? cleanText(body.img, 500) : null;

    if (!title || !text) {
      return NextResponse.json({ error: "Title dan body wajib diisi." }, { status: 400 });
    }

    const article = await db.newsArticle.create({
      data: { title, body: text, category, author, img },
    });
    try { revalidatePath("/api/news"); } catch {}

    return NextResponse.json({
      id: article.id,
      title: article.title,
      body: article.body,
      category: article.category,
      author: article.author,
      img: article.img,
      pinned: article.pinned,
      createdAt: article.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[POST /api/news]", e);
    return NextResponse.json({ error: "Gagal membuat artikel." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  try {
    const body = await req.json();
    const { id, title, body: text, category, author, img, pinned } = body as { id?: string; title?: string; body?: string; category?: string; author?: string; img?: string | null; pinned?: boolean };
    if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = sanitizeText(String(title)).slice(0, 80);
    if (text !== undefined) data.body = sanitizeText(String(text)).slice(0, 500);
    if (category !== undefined) data.category = String(category).trim().slice(0, 20).toUpperCase();
    if (author !== undefined) data.author = String(author).trim().slice(0, 30).toUpperCase();
    if (img !== undefined) data.img = img ? cleanText(img, 500) : null;
    if (pinned !== undefined) data.pinned = Boolean(pinned);
    const updated = await db.newsArticle.update({ where: { id }, data });
    try { revalidatePath("/api/news"); } catch {}
    return NextResponse.json({ id: updated.id, title: updated.title, body: updated.body, category: updated.category, author: updated.author, img: updated.img, pinned: updated.pinned, createdAt: updated.createdAt.toISOString() });
  } catch (e) { return NextResponse.json({ error: "Gagal update artikel." }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib diisi via ?id=" }, { status: 400 });
    await db.newsArticle.delete({ where: { id } });
    try { revalidatePath("/api/news"); } catch {}
    return NextResponse.json({ success: true, id, message: "Artikel dihapus." });
  } catch (e) { return NextResponse.json({ error: "Gagal menghapus artikel." }, { status: 500 }); }
}
