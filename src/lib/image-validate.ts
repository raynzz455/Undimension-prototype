import { NextResponse } from "next/server";

/**
 * Shared image upload validation utility.
 *
 * 3-layer defense-in-depth:
 *   1. Extension allowlist (jpg/jpeg/png/webp/gif only)
 *   2. Content-Type vs extension mismatch check (prevent spoofing)
 *   3. Magic-byte signature check (verify actual file content is an image,
 *      not a script disguised as one — e.g. SVG with <script>, HTML with JS)
 *
 * Used by:
 *   - /api/gallery/upload
 *   - /api/achievements/upload
 *   - /api/members/upload (future)
 *
 * The magic-byte check runs BEFORE any DB/Supabase state checks so that
 * malicious files are rejected even when infrastructure is down.
 */

const ALLOWED: Map<string, string> = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
]);

const SIGS: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  gif: [0x47, 0x49, 0x46, 0x38],  // "GIF8"
};

export type ValidationResult = {
  ok: boolean;
  ext: string;
  expectedType: string;
  buffer: Buffer | null;
  error?: { message: string; step: string; status: number };
};

/**
 * Validate an uploaded image File:
 *   - checks extension allowlist
 *   - checks Content-Type matches extension
 *   - reads the buffer
 *   - checks magic-byte signature
 *
 * Returns `{ ok: true, ext, expectedType, buffer }` on success, or
 * `{ ok: false, error: {...} }` with a NextResponse-ready error on failure.
 */
export async function validateImageUpload(file: File): Promise<ValidationResult> {
  // 1. Extension allowlist
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED.has(ext)) {
    return {
      ok: false,
      ext,
      expectedType: "",
      buffer: null,
      error: {
        message: `Ekstensi .${ext} tidak diizinkan. Hanya jpg/jpeg/png/webp/gif.`,
        step: "extCheck",
        status: 400,
      },
    };
  }
  const expectedType = ALLOWED.get(ext)!;

  // 2. Content-Type vs extension mismatch
  const declaredType = (file.type || "").toLowerCase();
  if (declaredType && declaredType !== expectedType) {
    return {
      ok: false,
      ext,
      expectedType,
      buffer: null,
      error: {
        message: `Content-Type ${declaredType} tidak cocok dengan ekstensi .${ext}.`,
        step: "typeMismatch",
        status: 400,
      },
    };
  }

  // 3. Read buffer
  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return {
      ok: false,
      ext,
      expectedType,
      buffer: null,
      error: { message: "Gagal convert file ke buffer.", step: "buffer", status: 500 },
    };
  }

  // 4. Magic-byte signature check
  const sig = SIGS[ext];
  if (sig && buffer.length >= sig.length) {
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) {
        return {
          ok: false,
          ext,
          expectedType,
          buffer: null,
          error: {
            message: "File rusak atau bukan gambar valid (magic byte mismatch).",
            step: "magicByte",
            status: 400,
          },
        };
      }
    }
    // For webp, also verify "WEBP" at offset 8
    if (ext === "webp" && buffer.length >= 12 && buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
      return {
        ok: false,
        ext,
        expectedType,
        buffer: null,
        error: {
          message: "File .webp tidak valid (bukan WEBP RIFF).",
          step: "webpVerify",
          status: 400,
        },
      };
    }
  }

  return { ok: true, ext, expectedType, buffer };
}

/** Helper: convert a ValidationResult error into a NextResponse. */
export function validationErrorResponse(r: ValidationResult): NextResponse {
  if (r.ok || !r.error) {
    return NextResponse.json({ error: "Unknown validation error." }, { status: 500 });
  }
  return NextResponse.json(
    { error: r.error.message, step: r.error.step },
    { status: r.error.status },
  );
}
