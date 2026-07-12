import { hash, compare } from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const SALT_ROUNDS = 12

let ephemeralDevSecret: string | null = null

function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET must be set in production')
  }

  // Non-production without a configured secret: use a random per-process secret
  // rather than a known hardcoded string. A hardcoded default would let anyone
  // forge an ADMIN token on any deploy where NODE_ENV isn't exactly 'production'
  // (staging, preview, a misconfigured container). Tokens won't survive a
  // restart in this mode — set NEXTAUTH_SECRET to make them stable.
  if (!ephemeralDevSecret) {
    ephemeralDevSecret = crypto.randomBytes(32).toString('hex')
    console.warn('[auth] NEXTAUTH_SECRET is not set — using a random ephemeral dev secret. Set NEXTAUTH_SECRET for stable sessions.')
  }
  return ephemeralDevSecret
}

export interface DecodedToken {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateToken(payload: { userId: string; email: string; role: string }, expiresIn: string = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, getJwtSecret()) as DecodedToken
  } catch {
    return null
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(8)
  let code = 'OD-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(bytes[i] % chars.length)
  }
  return code
}

// Generate a secure random token for password reset / email verification
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
