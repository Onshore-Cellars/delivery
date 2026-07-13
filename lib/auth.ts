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
  /** Session version at issue time — compared to User.sessionVersion to revoke old tokens. */
  sv?: number
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateToken(payload: { userId: string; email: string; role: string; sv?: number }, expiresIn: string = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions)
}

/**
 * Does a decoded token's session version still match the user's current one?
 * Tokens issued before the `sv` claim existed (sv undefined) are treated as
 * version 0, so bumping a user's sessionVersion revokes them too.
 */
export function tokenSessionCurrent(decoded: DecodedToken, userSessionVersion: number): boolean {
  return (decoded.sv ?? 0) === userSessionVersion
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

// ─── Scoped invoice access tokens ────────────────────────────────────────────
// A read-only, single-booking token embedded in emailed invoice/payout links so
// a recipient can open their document without logging in — without ever handing
// out a full-access session JWT. Scoped to one booking and one viewpoint.
export interface InvoiceTokenPayload {
  scope: 'invoice'
  bookingId: string
  as: 'shipper' | 'carrier'
  iat?: number
  exp?: number
}

export function generateInvoiceToken(bookingId: string, as: 'shipper' | 'carrier', expiresIn: string = '120d'): string {
  return jwt.sign({ scope: 'invoice', bookingId, as }, getJwtSecret(), { expiresIn } as jwt.SignOptions)
}

export function verifyInvoiceToken(token: string): InvoiceTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as InvoiceTokenPayload
    return decoded?.scope === 'invoice' && decoded.bookingId ? decoded : null
  } catch {
    return null
  }
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
