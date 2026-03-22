import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Maximum allowed request body size in bytes (10 MB) */
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024

/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Responsibilities:
 *  1. Attach common security headers.
 *  2. Forward the client IP so API routes can apply rate limiting.
 *  3. Reject oversized request bodies early (POST / PATCH / PUT).
 */
export function middleware(request: NextRequest) {
  // --- 1. Request-size guard for mutating methods --------------------------
  const method = request.method.toUpperCase()
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 },
      )
    }
  }

  const response = NextResponse.next()

  // Security headers are set in next.config.ts headers() which also
  // includes the Content-Security-Policy. Avoid duplicating them here.

  // --- 2. Forward client IP for downstream rate limiting -------------------
  // Edge middleware cannot import Node-only modules (the rate-limit Map lives
  // in the Node runtime), so we pass the IP via a header that API route
  // handlers can read when calling the rate limiter.
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = forwarded?.split(',')[0]?.trim() || realIp?.trim() || 'unknown'

  response.headers.set('x-client-ip', clientIp)

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
