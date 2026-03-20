import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mmsi = searchParams.get('mmsi')

    if (!mmsi) {
      return NextResponse.json(
        { error: 'Missing required query parameter: mmsi' },
        { status: 400 }
      )
    }

    if (!/^\d{9}$/.test(mmsi)) {
      return NextResponse.json(
        { error: 'Invalid MMSI number. Must be exactly 9 digits.' },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: { yachtMMSI: mmsi },
      select: {
        id: true,
        name: true,
        yachtName: true,
        yachtMMSI: true,
        yachtIMO: true,
        yachtFlag: true,
        yachtLength: true,
        yachtType: true,
        homePort: true,
      },
    })

    const marineTrafficUrl = `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsi}`
    const vesselFinderUrl = `https://www.vesselfinder.com/vessels?name=&mmsi=${mmsi}`

    return NextResponse.json({
      mmsi,
      vessels: users,
      links: {
        marineTraffic: marineTrafficUrl,
        vesselFinder: vesselFinderUrl,
      },
    })
  } catch (error) {
    console.error('Vessel lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
