import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";
import { validateImageUpload, validationErrorResponse } from "@/lib/image-validate";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;

// GET /api/games/moments?gameId=minecraft — list moments (screenshots) for a game
export async function GET(req: NextRequest) {
  if (!isDbConfigured()) return NextResponse.json({ moments: [] });
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  if (!gameId) return NextResponse.json({ moments: [] });
  try {
    const moments = await db.gameMoment.findMany({
      where: { gameId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ moments });
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal fetch moments", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// POST /api/games/moments — upload a new game moment (screenshot)
// FormData: file, gameId, title, description?
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let file: File | null = null;
  let gameId = "";
  let title = "";
  let description: string | null = null;

  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    gameId = sanitizeText(String(formData.get("gameId") || "")).slice(0, 30);
    title = sanitizeText(String(formData.get("title") || "")).slice(0, 80);
    description = sanitizeText(String(formData.get("description") || "")).slice(0, 300) || null;
  } catch (e) {
    return NextResponse.json({ error: "Gagal parse form data", detail: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }

  if (!file || !(file instanceof File)) return NextResponse.json({ error: "File wajib diupload." }, { status: 400 });
  if (!gameId) return NextResponse.json({ error: "gameId wajib diisi." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Title wajib diisi." }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: `Maksimal ${MAX_FILE_BYTES / 1024 / 1024}MB.` }, { status: 413 });

  // SECURITY: shared 3-layer validation (extension + content-type + magic byte)
  const v = await validateImageUpload(file);
  if (!v.ok) return validationErrorResponse(v);
  const { ext, expectedType, buffer } = v;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("xxxxx")) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi." }, { status: 503 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const fileName = `moment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadPath = `games/moments/${fileName}`;

  try {
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${uploadPath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": expectedType },
      body: buffer,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `Supabase upload failed (${uploadRes.status})`, detail: errText }, { status: 502 });
    }

    const imgUrl = `${supabaseUrl}/storage/v1/object/public/${uploadPath}`;
    // Determine order (append to end)
    const existing = await db.gameMoment.count({ where: { gameId } });
    const moment = await db.gameMoment.create({
      data: { gameId, title, description, img: imgUrl, order: existing },
    });
    return NextResponse.json({ moment });
  } catch (e) {
    return NextResponse.json({ error: "Gagal upload moment", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE /api/games/moments?id=xxx — delete a moment
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
    await db.gameMoment.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Gagal hapus moment", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
