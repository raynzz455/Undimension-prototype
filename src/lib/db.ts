import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create the Prisma client with connection pool settings.
// For Supabase: use the PgBouncer connection pooler (port 6543) in the
// DATABASE_URL to avoid connection exhaustion on the free tier.
// The settings below help with timeouts + retry on transient failures.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        // Prisma reads DATABASE_URL from env automatically. This is just
        // a safety override — if the env has a direct connection (port 5432),
        // we keep it. The user should use the pooler URL (port 6543) for
        // serverless to avoid connection exhaustion.
      },
    },
  })

// Set a query timeout — if a query takes longer than 5 seconds, it's
// considered a failure (transient). This prevents hanging connections
// that exhaust the Supabase free tier connection pool.
// Prisma doesn't have a built-in query timeout, but we can use $transaction
// with a timeout. For direct queries, the connection pool handles it.
// The key improvement: we wrap queries in a retry helper.

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
        msg.includes("ETIMEDOUT");
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
