import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured, dbRetry } from "@/lib/db";
import { RANDOM_QUOTES } from "@/lib/undimension/data";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, cleanText, sanitizeText } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    const staticQuotes = RANDOM_QUOTES.map((q, i) => ({ id: `static-${i}`, ...q, order: i }));
    return NextResponse.json({ quotes: staticQuotes, count: staticQuotes.length }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  }
  try {
    const rows = await dbRetry(() => db.quote.findMany({ orderBy: { order: "asc" } }));
    const quotes = rows.map((q) => ({ id: q.id, text: q.text, author: q.author, order: q.order }));
    const merged = quotes.length > 0 ? quotes : RANDOM_QUOTES.map((q, i) => ({ id: `static-${i}`, ...q, order: i }));
    return NextResponse.json({ quotes: merged, count: merged.length }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.warn("[GET /api/quotes] DB unavailable, returning 503.", e instanceof Error ? e.message : e);
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
    const text = sanitizeText(cleanText(body.text, 500));
    const author = cleanText(body.author || "THE COLLECTIVE", 50);
    if (!text) return NextResponse.json({ error: "Text wajib diisi." }, { status: 400 });
    const quote = await db.quote.create({ data: { text, author } });
    return NextResponse.json({ id: quote.id, text: quote.text, author: quote.author, order: quote.order });
  } catch (e) { return NextResponse.json({ error: "Gagal membuat quote." }, { status: 500 }); }
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
    if (id.startsWith("static-")) return NextResponse.json({ error: "Static quote tidak bisa dihapus" }, { status: 400 });
    await db.quote.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (e) { return NextResponse.json({ error: "Gagal menghapus quote." }, { status: 500 }); }
}
