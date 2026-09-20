import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { rateLimit, getClientIP, sanitizeText } from "@/lib/rate-limit";
import { validateImageUpload, validationErrorResponse } from "@/lib/image-validate";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;

// POST /api/games/players/upload — upload a player photo
// FormData: file, playerId (optional — if provided, updates the player's img field)
// Returns the Supabase URL.
export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });

  const ip = getClientIP(req);
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let file: File | null = null;
  let playerId = "";
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    playerId = sanitizeText(String(formData.get("playerId") || "")).slice(0, 40);
  } catch (e) {
    return NextResponse.json({ error: "Gagal parse form data", detail: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }

  if (!file || !(file instanceof File)) return NextResponse.json({ error: "File wajib diupload." }, { status: 400 });
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

  const fileName = `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadPath = `games/players/${fileName}`;

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

    // If playerId is provided and DB is configured, update the player's img field
    if (playerId && isDbConfigured()) {
      try {
        await db.gamePlayer.update({ where: { id: playerId }, data: { img: imgUrl } });
      } catch {
        // Player not found — still return the URL (caller can use it in a subsequent create)
      }
    }

    return NextResponse.json({ url: imgUrl, playerId: playerId || null });
  } catch (e) {
    return NextResponse.json({ error: "Gagal upload player photo", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
