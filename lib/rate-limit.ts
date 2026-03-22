import type { NextRequest } from 'next/server'
import { getRedis } from './redis'

interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number
  /** Maximum number of requests allowed per interval */
  limit: number
  /** Optional prefix for Redis keys */
  prefix?: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  /** Timestamp (ms) when the current window resets */
  reset: number
}

interface RateLimiter {
  check: (key: string) => RateLimitResult | Promise<RateLimitResult>
}

interface TokenBucket {
  count: number
  resetAt: number
}

const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

// ---------------------------------------------------------------------------
// In-memory rate limiter (single instance fallback)
// ---------------------------------------------------------------------------

function createInMemoryLimiter(config: RateLimitConfig): RateLimiter {
  const { interval, limit } = config
  const tokens = new Map<string, TokenBucket>()

  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    tokens.forEach((bucket, key) => {
      if (bucket.resetAt <= now) tokens.delete(key)
    })
  }, CLEANUP_INTERVAL)

  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now()
      const bucket = tokens.get(key)

      if (!bucket || bucket.resetAt <= now) {
        const resetAt = now + interval
        tokens.set(key, { count: 1, resetAt })
        return { success: true, remaining: limit - 1, reset: resetAt }
      }

      bucket.count += 1

      if (bucket.count > limit) {
        return { success: false, remaining: 0, reset: bucket.resetAt }
      }

      return { success: true, remaining: limit - bucket.count, reset: bucket.resetAt }
    },
  }
}

// ---------------------------------------------------------------------------
// Redis-backed rate limiter (distributed / multi-instance)
// ---------------------------------------------------------------------------

function createRedisLimiter(config: RateLimitConfig): RateLimiter {
  const { interval, limit, prefix = 'rl' } = config

  return {
    async check(key: string): Promise<RateLimitResult> {
      const redis = getRedis()
      if (!redis) {
        // Redis went away — fall back to a permissive response rather than
        // blocking all traffic.
        return { success: true, remaining: limit, reset: Date.now() + interval }
      }

      const redisKey = `${prefix}:${key}`
      const ttlSeconds = Math.ceil(interval / 1000)

      try {
        const count = await redis.incr(redisKey)

        // First request in window — set the expiry
        if (count === 1) {
          await redis.expire(redisKey, ttlSeconds)
        }

        const ttl = await redis.ttl(redisKey)
        const reset = Date.now() + ttl * 1000

        if (count > limit) {
          return { success: false, remaining: 0, reset }
        }

        return { success: true, remaining: limit - count, reset }
      } catch (err) {
        console.error('[RateLimit] Redis error, allowing request:', err)
        return { success: true, remaining: limit, reset: Date.now() + interval }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Factory — picks Redis when available, else in-memory
// ---------------------------------------------------------------------------

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const redis = getRedis()
  if (redis) {
    return createRedisLimiter(config)
  }
  return createInMemoryLimiter(config)
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

/** General API routes — 60 requests per minute */
export const apiLimiter = createRateLimiter({ interval: 60_000, limit: 60, prefix: 'rl:api' })

/** AI endpoints (costly) — 10 requests per minute */
export const aiLimiter = createRateLimiter({ interval: 60_000, limit: 10, prefix: 'rl:ai' })

/** Auth endpoints (login, register, password reset) — 5 requests per minute */
export const authLimiter = createRateLimiter({ interval: 60_000, limit: 5, prefix: 'rl:auth' })

/** Stripe webhook endpoints — 100 requests per minute */
export const webhookLimiter = createRateLimiter({ interval: 60_000, limit: 100, prefix: 'rl:wh' })

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
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
