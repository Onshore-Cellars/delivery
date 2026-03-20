import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const country = searchParams.get('country')
    const type = searchParams.get('type')
    const popularParam = searchParams.get('popular')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Prisma.PortWhereInput = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (country) {
      where.country = { equals: country, mode: 'insensitive' }
    }

    if (type) {
      where.type = type
    }

    if (popularParam === 'true') {
      where.popular = true
    }

    const ports = await prisma.port.findMany({
      where,
      orderBy: [
        { popular: 'desc' },
        { name: 'asc' },
      ],
      take: Math.min(limit, 100),
    })

    return NextResponse.json({ ports })
  } catch (error) {
    console.error('Ports search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
