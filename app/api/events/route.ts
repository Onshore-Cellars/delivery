import { NextResponse } from 'next/server'
import { yachtEvents, getUpcomingEvents, getEventsNearRegion, getMajorEvents, getEventsByMonth } from '@/lib/yacht-events'

// GET /api/events?region=riviera&month=9&upcoming=6&major=true
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const region = searchParams.get('region')
  const month = searchParams.get('month')
  const upcoming = searchParams.get('upcoming')
  const major = searchParams.get('major')

  let events = yachtEvents

  if (region) {
    events = getEventsNearRegion(region)
  } else if (month) {
    events = getEventsByMonth(parseInt(month))
  } else if (upcoming) {
    const currentMonth = new Date().getMonth() + 1
    events = getUpcomingEvents(currentMonth, parseInt(upcoming) || 6)
  } else if (major === 'true') {
    events = getMajorEvents()
  }

  return NextResponse.json({ events, total: events.length })
}
