/**
 * In-memory sliding-window rate limiter for API routes.
 *
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60_000, max: 20 });
 *   export async function POST(req: NextRequest) {
 *     const limited = limiter.check(req);
 *     if (limited) return limited; // 429 response
 *     ...
 *   }
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60 000 = 1 min) */
  windowMs?: number;
  /** Max requests per window (default: 30) */
  max?: number;
  /** Key extractor — defaults to IP address */
  keyFn?: (req: NextRequest) => string;
}

interface Entry {
  count: number;
  resetAt: number;
}

const defaultKeyFn = (req: NextRequest): string => {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
};

export function rateLimit(opts: RateLimitOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 30;
  const keyFn = opts.keyFn ?? defaultKeyFn;

  const store = new Map<string, Entry>();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  let lastCleanup = Date.now();
  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 300_000) return;
    lastCleanup = now;
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }

  return {
    /**
     * Returns a 429 NextResponse if the client is over the limit,
     * or null if the request is allowed.
     */
    check(req: NextRequest): NextResponse | null {
      cleanup();

      const key = keyFn(req);
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return null;
      }

      entry.count++;
      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(max),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(entry.resetAt),
            },
          }
        );
      }

      return null;
    },
  };
}
