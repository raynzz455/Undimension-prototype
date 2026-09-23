import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Build a hardened DATABASE_URL.
 *
 * Why: Prisma uses prepared statements by default. When the URL points at
 * Supabase's PgBouncer "Transaction" pooler (port 6543), the SAME prepared
 * statement name (s1, s2, …) gets registered on multiple backend connections.
 * PgBouncer then routes a new transaction to a different backend that already
 * has that name → Postgres errors out with:
 *   42P05: prepared statement "s4" already exists
 *   08P01: bind message supplies N parameters, but prepared statement "sM" requires K
 *   26000: prepared statement "s7" does not exist
 *
 * Setting `pgbouncer=true` on the URL tells Prisma (>= 5.0) to DISABLE
 * prepared statements, eliminating the collisions.
 *
 * `connection_limit=1` is added ONLY for pooler URLs (serverless-friendly:
 * each function instance opens at most 1 backend connection, preventing pool
 * exhaustion on the Supabase free tier).
 *
 * If the user already set these params in their env, we don't touch them.
 * If the URL is a direct connection (port 5432, no `pooler.supabase.com`),
 * we still add `pgbouncer=true` (safe — just disables prepared statements
 * client-side) but skip `connection_limit=1` (would be too restrictive for
 * long-running local dev servers).
 */
function buildDbUrl(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url) return undefined
  const sep = url.includes('?') ? '&' : '?'
  let out = url

  // Always ensure pgbouncer=true so Prisma disables prepared statements.
  if (!out.includes('pgbouncer=')) {
    out += `${sep}pgbouncer=true`
  }

  // For Supabase pooler URLs only — limit to 1 connection per instance
  // (serverless-friendly, prevents pool exhaustion).
  if (
    out.includes('pooler.supabase.com') &&
    !out.includes('connection_limit=')
  ) {
    out += out.includes('?') ? '&connection_limit=1' : '?connection_limit=1'
  }

  return out
}

// Create the Prisma client with the hardened URL.
// For Supabase: use the PgBouncer connection pooler (port 6543) in the
// DATABASE_URL to avoid connection exhaustion on the free tier.
// The buildDbUrl() helper above adds `pgbouncer=true` automatically if
// missing — this prevents the "prepared statement sN already exists"
// errors that cause the 503 "server is busy" popups.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: buildDbUrl(),
      },
    },
  })

/**
 * Retry a DB query up to 2 times on failure (with 300ms delay).
 * This handles transient connection errors (Supabase free tier
 * connection pool exhaustion, network blips).
 */
export async function dbRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 300,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      // Check if it's a connection error worth retrying
      const msg = e instanceof Error ? e.message : String(e);
      const isTransient = msg.includes("Can't reach database") ||
        msg.includes("Connection refused") ||
        msg.includes("Connection terminated") ||
        msg.includes("Timed out") ||
        msg.includes("too many connections") ||
        msg.includes("Connection pool") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("prepared statement"); // PgBouncer collision — retry once
      if (!isTransient || attempt === retries - 1) throw e;
      // Wait before retry
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL
  if (!url) return false
  if (url.includes('xxxxx') || url.includes('YOUR_') || url.includes('...')) return false
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) return false
  return true
}
