import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";

export const dynamic = "force-dynamic";
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED", step: "auth" }, { status: 403 });

  let file: File | null = null;
  let title = "";
  let author = "";
  let date = "";

  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    title = String(formData.get("title") || "").trim().slice(0, 40);
    author = String(formData.get("author") || "ANON").trim().slice(0, 40).toUpperCase();
    date = String(formData.get("date") || String(new Date().getFullYear()));
  } catch (e) {
    return NextResponse.json({ error: "Gagal parse form data", detail: e instanceof Error ? e.message : String(e), step: "formData" }, { status: 400 });
  }

  if (!file || !(file instanceof File)) return NextResponse.json({ error: "File wajib diupload.", step: "fileCheck" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Judul wajib diisi.", step: "titleCheck" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: `Maksimal ${MAX_FILE_BYTES / 1024 / 1024}MB.`, step: "sizeCheck" }, { status: 413 });

  // SECURITY: extension allowlist + content-type validation + magic-byte check.
  // Prevents stored XSS via .svg/.html uploads and content-type spoofing.
  const ALLOWED = new Map([
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
    ["gif", "image/gif"],
  ]);
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    return NextResponse.json({ error: `Ekstensi .${ext} tidak diizinkan. Hanya jpg/jpeg/png/webp/gif.`, step: "extCheck" }, { status: 400 });
  }
  const declaredType = (file.type || "").toLowerCase();
  const expectedType = ALLOWED.get(ext)!;
  if (declaredType && declaredType !== expectedType) {
    return NextResponse.json({ error: `Content-Type ${declaredType} tidak cocok dengan ekstensi .${ext}.`, step: "typeMismatch" }, { status: 400 });
  }

  // Read file into buffer FIRST — needed for magic-byte validation below.
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch (e) {
    return NextResponse.json({ error: "Gagal convert file ke buffer", detail: e instanceof Error ? e.message : String(e), step: "buffer" }, { status: 500 });
  }

  // SECURITY: magic-byte signature check — verify the actual file content is an image,
  // not a script disguised as one (e.g., SVG with <script>, HTML with JS).
  // Done BEFORE the Supabase/DB config checks so malicious files are rejected
  // even when infrastructure is down (defense-in-depth).
  const SIGS: Record<string, number[]> = {
    jpg: [0xff, 0xd8, 0xff],
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    gif: [0x47, 0x49, 0x46, 0x38],  // "GIF8"
  };
  const sig = SIGS[ext];
  if (sig && buffer.length >= sig.length) {
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) {
        return NextResponse.json({ error: "File rusak atau bukan gambar valid (magic byte mismatch).", step: "magicByte" }, { status: 400 });
      }
    }
    // For webp, also verify "WEBP" at offset 8
    if (ext === "webp" && buffer.length >= 12 && buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
      return NextResponse.json({ error: "File .webp tidak valid (bukan WEBP RIFF).", step: "webpVerify" }, { status: 400 });
    }
  }

  // Infra config checks — AFTER security validation.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("xxxxx")) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi.", step: "supabaseConfig" }, { status: 503 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadPath = `gallery/uploads/${fileName}`;

  // DB config check — AFTER security validation so malicious files are rejected
  // even when the DB is down.
  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured.", step: "dbConfig" }, { status: 503 });

  try {
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${uploadPath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": expectedType },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `Supabase upload failed (${uploadRes.status})`, detail: errText, step: "supabaseUpload", uploadPath }, { status: 502 });
    }

    const imgUrl = `${supabaseUrl}/storage/v1/object/public/${uploadPath}`;
    const rotates = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-3", "-rotate-3"];
    const rotate = rotates[Math.floor(Math.random() * rotates.length)];

    const record = await db.galleryPhoto.create({ data: { title: title.toUpperCase(), img: imgUrl, author, date, rotate } });
    return NextResponse.json({ id: record.id, url: imgUrl, title: record.title, author: record.author, date: record.date, rotate: record.rotate });
  } catch (e) {
    return NextResponse.json({ error: "Upload gagal", detail: e instanceof Error ? e.message : String(e), step: "finalUpload" }, { status: 500 });
  }
}
