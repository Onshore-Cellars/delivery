import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

let cachedPorts: unknown[] | null = null
let cacheExpiry = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * GET /api/ports - Smart port search with prioritized results
 *
 * Searching "Barcelona" → Port Vell, Port Olímpic first
 * Searching "Bremen" → Lürssen shipyard first
 * Searching "Antibes" → Port Vauban first
 *
 * Query params:
 *   q - search term (searches name, city, region, country)
 *   country - filter by country
 *   type - filter by type (marina, commercial_port, shipyard, anchorage)
 *   popular - if "true", only popular ports
 *   limit - max results (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const country = searchParams.get('country')
    const type = searchParams.get('type')
    const popularParam = searchParams.get('popular')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (cachedPorts && Date.now() < cacheExpiry) {
      return NextResponse.json({ ports: cachedPorts })
    }

    if (!q && !country && !type && !popularParam) {
      // No filters — return popular ports
      const ports = await prisma.port.findMany({
        where: { popular: true },
        orderBy: { name: 'asc' },
        take: limit,
      })
      cachedPorts = ports
      cacheExpiry = Date.now() + CACHE_TTL
      return NextResponse.json({ ports })
    }

    const where: Prisma.PortWhereInput = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { region: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
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
      take: limit * 3, // Fetch more for re-ranking
    })

    // Smart ranking: exact city match > name starts with > popular > alphabetical
    const ranked = ports.map(port => {
      let score = 0
      const lq = q?.toLowerCase() || ''

      // Exact name match — highest priority
      if (port.name.toLowerCase() === lq) score += 100

      // Name starts with query
      if (port.name.toLowerCase().startsWith(lq)) score += 50

      // City exact match (e.g., searching "Barcelona" matches ports IN Barcelona)
      if (port.city?.toLowerCase() === lq) score += 80

      // City starts with query
      if (port.city?.toLowerCase().startsWith(lq)) score += 40

      // Shipyards get a boost when searching city names (e.g., "Bremen" → Lürssen)
      if (port.type === 'shipyard' && port.city?.toLowerCase().includes(lq)) score += 30

      // Popular ports get a boost
      if (port.popular) score += 20

      // Marinas above commercial ports for yacht-focused results
      if (port.type === 'marina') score += 10
      if (port.type === 'shipyard') score += 5

      return { ...port, _score: score }
    })

    // Sort by score descending, then name
    ranked.sort((a, b) => b._score - a._score || a.name.localeCompare(b.name))

    // Strip score and limit
    const results = ranked.slice(0, limit).map(({ _score, ...port }) => port)

    cachedPorts = results
    cacheExpiry = Date.now() + CACHE_TTL

    return NextResponse.json({ ports: results })
  } catch (error) {
    console.error('Ports search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
