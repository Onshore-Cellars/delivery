import type { NextRequest } from 'next/server'

interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number
  /** Maximum number of requests allowed per interval */
  limit: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  /** Timestamp (ms) when the current window resets */
  reset: number
}

interface RateLimiter {
  check: (key: string) => RateLimitResult
}

interface TokenBucket {
  count: number
  resetAt: number
}

const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

/**
 * Creates an in-memory rate limiter backed by a Map.
 * Expired entries are automatically purged every 5 minutes.
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const { interval, limit } = config
  const tokens = new Map<string, TokenBucket>()

  // Auto-cleanup expired entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    tokens.forEach((bucket, key) => {
      if (bucket.resetAt <= now) {
        tokens.delete(key)
      }
    })
  }, CLEANUP_INTERVAL)

  // Allow the Node process to exit without waiting for the timer
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      const bucket = tokens.get(key)

      // If no bucket exists or the window has expired, start a fresh window
      if (!bucket || bucket.resetAt <= now) {
        const resetAt = now + interval
        tokens.set(key, { count: 1, resetAt })
        return { success: true, remaining: limit - 1, reset: resetAt }
      }

      // Window is still active — increment the counter
      bucket.count += 1

      if (bucket.count > limit) {
        return { success: false, remaining: 0, reset: bucket.resetAt }
      }

      return {
        success: true,
        remaining: limit - bucket.count,
        reset: bucket.resetAt,
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/** General API routes — 60 requests per minute */
export const apiLimiter = createRateLimiter({ interval: 60_000, limit: 60 })

/** AI endpoints (costly) — 10 requests per minute */
export const aiLimiter = createRateLimiter({ interval: 60_000, limit: 10 })

/** Auth endpoints (login, register, password reset) — 5 requests per minute */
export const authLimiter = createRateLimiter({ interval: 60_000, limit: 5 })

/** Stripe webhook endpoints — 100 requests per minute */
export const webhookLimiter = createRateLimiter({ interval: 60_000, limit: 100 })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the client IP address from a Next.js request.
 * Checks `x-forwarded-for` first, then `x-real-ip`, and falls back to
 * `'unknown'` when neither header is present.
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for may contain a comma-separated list; take the first one
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
