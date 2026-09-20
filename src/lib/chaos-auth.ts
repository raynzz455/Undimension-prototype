import { headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Chaos-mode authentication.
 *
 * SECURITY DESIGN (rewritten — the old version had a hardcoded default
 * secret, a substring `.includes()` check vulnerable to timing attacks, and
 * embedded the secret directly inside the token):
 *
 *   - The secret is read from CHAOS_SECRET env var. In production, if it's
 *     missing, ALL chaos-mode requests are rejected (fail-closed). In dev,
 *     a known insecure default is used so local dev still works.
 *   - Tokens are HMAC-signed: `token = "${timestamp}-${random}"+"."+${hmac(payload, secret)}`.
 *     The secret is NEVER embedded in the token — only an HMAC of the payload.
 *   - Verification recomputes the HMAC and compares with `crypto.timingSafeEqual`
 *     (constant-time, prevents timing side-channels).
 *   - Tokens expire after 24h (the timestamp is checked).
 *
 * The token is generated when the user enters the Konami code, stored in
 * localStorage, and sent via the `x-chaos-token` header on chaos-mode API calls.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const s = process.env.CHAOS_SECRET;
  if (!s || s.includes("xxxxx") || s === "undimension-chaos-2024") {
    // Fail-closed in production; allow a dev-only default for local convenience.
    if (process.env.NODE_ENV === "production") {
      throw new Error("CHAOS_SECRET env var is not set — chaos mode disabled in production.");
    }
    return "dev-insecure-chaos-secret";
  }
  return s;
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

    // Verify HMAC (constant-time)
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

export function requireChaosMode(): Promise<{ authorized: boolean; response?: Response }> {
  return isChaosAuthorized().then((authorized) => {
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
  });
}
