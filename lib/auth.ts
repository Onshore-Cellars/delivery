import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const SALT_ROUNDS = 12

function getJwtSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET must be set in production')
    }
    return 'onshore-dev-secret-not-for-production'
  }
  return secret
}

export interface DecodedToken {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' } as jwt.SignOptions)
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
