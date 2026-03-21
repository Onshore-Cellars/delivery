import crypto from 'crypto'
import prisma from '@/lib/prisma'

/**
 * Hash an API key for storage (SHA-256).
 * We never store raw keys — only their hash.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Generate a new API key with a recognisable prefix.
 * Format: od_live_<32 random hex chars>  (total ~40 chars)
 */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const randomPart = crypto.randomBytes(24).toString('hex')
  const raw = `od_live_${randomPart}`
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12),
  }
}

export interface ValidatedApiKey {
  id: string
  userId: string
  scopes: string[]
  user: { id: string; email: string; company: string | null; role: string }
}

/**
 * Validate an API key from the Authorization header.
 * Returns the key record + user, or null if invalid.
 */
export async function validateApiKey(
  authHeader: string | null,
): Promise<ValidatedApiKey | null> {
  if (!authHeader) return null

  // Support both "Bearer <key>" and raw key
  const key = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim()

  if (!key || !key.startsWith('od_live_')) return null

  const keyHash = hashApiKey(key)

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: { select: { id: true, email: true, company: true, role: true } },
    },
  })

  if (!apiKey) return null

  // Check if revoked
  if (apiKey.revokedAt) return null

  // Check if expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  // Update last used timestamp (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return {
    id: apiKey.id,
    userId: apiKey.userId,
    scopes: apiKey.scopes,
    user: apiKey.user,
  }
}

/**
 * Check if a validated key has a specific scope.
 */
export function hasScope(key: ValidatedApiKey, scope: string): boolean {
  return key.scopes.includes(scope) || key.scopes.includes('*')
}
