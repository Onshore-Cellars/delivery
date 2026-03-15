import { NextResponse } from 'next/server'

export async function GET() {
  const status: Record<string, string> = { status: 'ok' }

  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    status.database = 'connected'
  } catch {
    status.database = 'disconnected'
  }

  // Always return 200 so Railway healthcheck passes
  // Database status is reported in the response body
  return NextResponse.json(status)
}
