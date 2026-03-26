import { NextRequest, NextResponse } from 'next/server'

// Google Distance Matrix proxy — calculates real driving distance & duration
// Falls back to haversine (straight-line × 1.3 road factor) when Google is unavailable

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Accept both naming conventions for flexibility
    const originLat = parseFloat(body.originLat)
    const originLng = parseFloat(body.originLng)
    const destLat = parseFloat(body.destinationLat ?? body.destLat)
    const destLng = parseFloat(body.destinationLng ?? body.destLng)

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return NextResponse.json({ error: 'Missing or invalid coordinates' }, { status: 400 })
    }

    if (originLat < -90 || originLat > 90 || destLat < -90 || destLat > 90 ||
        originLng < -180 || originLng > 180 || destLng < -180 || destLng > 180) {
      return NextResponse.json({ error: 'Coordinates out of range' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (apiKey) {
      try {
        const params = new URLSearchParams({
          origins: `${originLat},${originLng}`,
          destinations: `${destLat},${destLng}`,
          mode: 'driving',
          key: apiKey,
        })

        const res = await fetch(
          `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
        )

        if (res.ok) {
          const data = await res.json()
          const element = data.rows?.[0]?.elements?.[0]

          if (element?.status === 'OK') {
            return NextResponse.json({
              distanceKm: Math.round(element.distance.value / 1000),
              distanceText: element.distance.text,
              durationMinutes: Math.round(element.duration.value / 60),
              durationText: element.duration.text,
              source: 'google',
            })
          }
        }
      } catch {
        // Fall through to haversine
      }
    }

    // Fallback: haversine with 1.3× road factor
    const straightLine = haversineKm(originLat, originLng, destLat, destLng)
    const roadEstimate = Math.round(straightLine * 1.3)
    const durationMinutes = Math.round(roadEstimate / 70 * 60) // ~70km/h average

    return NextResponse.json({
      distanceKm: roadEstimate,
      distanceText: `${roadEstimate} km (estimated)`,
      durationMinutes,
      durationText: `~${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      source: 'estimate',
    })
  } catch (error) {
    console.error('Distance API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
