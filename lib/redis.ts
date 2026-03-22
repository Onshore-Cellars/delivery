import Redis from 'ioredis'

let redis: Redis | null = null

/**
 * Returns a shared Redis client instance, or null if REDIS_URL is not configured.
 * Callers should fall back to in-memory when null is returned.
 */
export function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.REDIS_URL
  if (!url) return null

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: true,
  })

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })

  return redis
}
