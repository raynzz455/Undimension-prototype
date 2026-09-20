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
  let achievementId = "";
  let caption: string | null = null;

  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    achievementId = String(formData.get("achievementId") || "");
    caption = String(formData.get("caption") || "").slice(0, 200) || null;
  } catch (e) {
    return NextResponse.json({ error: "Gagal parse form data", detail: e instanceof Error ? e.message : String(e), step: "formData" }, { status: 400 });
  }

  if (!file || !(file instanceof File)) return NextResponse.json({ error: "File wajib diupload.", step: "fileCheck" }, { status: 400 });
  if (!achievementId) return NextResponse.json({ error: "Achievement ID wajib diisi.", step: "achievementIdCheck" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: `Maksimal ${MAX_FILE_BYTES / 1024 / 1024}MB.`, step: "sizeCheck" }, { status: 413 });

  // SECURITY: shared 3-layer validation (extension allowlist + content-type +
  // magic-byte). Runs BEFORE infra state checks (defense-in-depth).
  const v = await validateImageUpload(file);
  if (!v.ok) return validationErrorResponse(v);
  const { ext, expectedType, buffer } = v;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("xxxxx")) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi.", step: "supabaseConfig" }, { status: 503 });
  }
  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured.", step: "dbConfig" }, { status: 503 });

  const fileName = `achievement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadPath = `gallery/achievements/${fileName}`;

  try {
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${uploadPath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${supabaseKey}`, "Content-Type": file.type || "image/jpeg" },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `Supabase upload failed (${uploadRes.status})`, detail: errText, step: "supabaseUpload", uploadPath }, { status: 502 });
    }

    const imgUrl = `${supabaseUrl}/storage/v1/object/public/${uploadPath}`;
    const image = await db.achievementImage.create({ data: { achievementId, img: imgUrl, caption } });
    return NextResponse.json({ id: image.id, img: image.img, caption: image.caption, achievementId: image.achievementId });
  } catch (e) {
    return NextResponse.json({ error: "Upload gagal", detail: e instanceof Error ? e.message : String(e), step: "finalUpload" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireChaosMode();
  if (!auth.authorized) return NextResponse.json({ error: "CHAOS MODE REQUIRED" }, { status: 403 });
  if (!isDbConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Image ID wajib diisi." }, { status: 400 });
    await db.achievementImage.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: "Gagal menghapus image.", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
