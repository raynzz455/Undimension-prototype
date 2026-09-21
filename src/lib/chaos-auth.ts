import { headers } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Chaos-mode authentication (HMAC-based, NON-THROWING).
 *
 * SECURITY DESIGN:
 *   - The secret is read from CHAOS_SECRET env var. If set, use it.
 *   - If NOT set, generate a RANDOM ephemeral secret at module load.
 *     This means:
 *       ✓ No hardcoded secret in source (security)
 *       ✓ No 500 if env var missing (the token endpoint ALWAYS works)
 *       ✓ Tokens are valid for the server's lifetime
 *       ✓ After server restart, old tokens are invalidated (new random)
 *     For serverless (Vercel), each invocation may be a new module instance,
 *     so set CHAOS_SECRET env var for stable tokens across invocations.
 *
 * Token format: `${payload}.${hmac(payload, secret)}` where
 * payload = `${timestamp}-${random}`. The secret is NEVER in the token.
 *
 * Verification: recompute HMAC + compare with `crypto.timingSafeEqual`
 * (constant-time, prevents timing side-channels) + check 24h TTL.
 *
 * BUG FIX (Task 39): the previous version (Task 33) had getSecret() that
 * THREW in production if CHAOS_SECRET was not set → caused /api/chaos-token
 * to return 500 → useChaosFetch couldn't get a token → all CRUD returned 403.
 * This version NEVER throws — it uses an ephemeral random secret instead.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generate a random ephemeral secret ONCE at module load if CHAOS_SECRET
// is not configured. This survives for the server's lifetime.
const EPHEMERAL_SECRET = randomBytes(32).toString("hex");

function getSecret(): string {
  const s = process.env.CHAOS_SECRET;
  if (s && !s.includes("xxxxx") && s !== "undimension-chaos-2024") {
    return s;  // use the configured secret
  }
  // CHAOS_SECRET not set (or placeholder/old-default) → use the ephemeral
  // random secret. NON-THROWING so the token endpoint never 500s.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[chaos-auth] CHAOS_SECRET env var not set. Using an ephemeral random secret. " +
        "Tokens will NOT survive server restart. Set CHAOS_SECRET for stable tokens " +
        "(generate with: openssl rand -hex 32)."
    );
  }
  return EPHEMERAL_SECRET;
}

function hmac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Generate a chaos-mode token (HMAC-signed, no secret embedded). */
export function generateChaosToken(): string {
  const secret = getSecret();
  const payload = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const sig = hmac(payload, secret);
  return `${payload}.${sig}`;
}

/** Verify a chaos-mode token (constant-time HMAC comparison + TTL check). */
export async function isChaosAuthorized(): Promise<boolean> {
  try {
    const h = await headers();
    const token = h.get("x-chaos-token");
    if (!token) return false;

    const secret = getSecret();
    const dot = token.lastIndexOf(".");
    if (dot < 1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    // Verify HMAC (constant-time — prevents timing side-channels)
    const expected = hmac(payload, secret);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return false;
    }

    // Check TTL — payload starts with a timestamp
    const ts = parseInt(payload.split("-")[0], 10);
    if (!Number.isFinite(ts)) return false;
    if (Date.now() - ts > TOKEN_TTL_MS) return false;

    return true;
  } catch {
    return false;
  }
}

export async function requireChaosMode(): Promise<{ authorized: boolean; response?: Response }> {
  const authorized = await isChaosAuthorized();
  if (!authorized) {
    return {
      authorized: false,
      response: new Response(
        JSON.stringify({ error: "CHAOS MODE REQUIRED", message: "Activate chaos mode with ↑↓←→←←↑" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      ),
    };
  }
  return { authorized: true };
}
