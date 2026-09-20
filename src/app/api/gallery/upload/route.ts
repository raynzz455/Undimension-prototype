import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { requireChaosMode } from "@/lib/chaos-auth";
import { validateImageUpload, validationErrorResponse } from "@/lib/image-validate";

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

  // SECURITY: shared 3-layer validation (extension allowlist + content-type +
  // magic-byte). Runs BEFORE infra state checks (defense-in-depth).
  const v = await validateImageUpload(file);
  if (!v.ok) return validationErrorResponse(v);
  const { ext, expectedType, buffer } = v;

  // Infra config checks — AFTER security validation.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("xxxxx")) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi.", step: "supabaseConfig" }, { status: 503 });
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadPath = `gallery/uploads/${fileName}`;

  // DB config check — AFTER security validation.
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
