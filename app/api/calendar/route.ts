import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function generateUID(id: string, type: string): string {
  return `${type}-${id}@yachthop.com`
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return new Response('Invalid token', { status: 401 })
    }

    // Fetch user's bookings
    const bookingWhere: Record<string, unknown> = {}
    if (decoded.role === 'CARRIER') {
      bookingWhere.listing = { carrierId: decoded.userId }
    } else {
      bookingWhere.shipperId = decoded.userId
    }

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        listing: {
          include: {
            carrier: { select: { id: true, name: true, company: true } },
          },
        },
        shipper: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch carrier's listings if applicable
    let listings: Awaited<ReturnType<typeof prisma.listing.findMany>> = []
    if (decoded.role === 'CARRIER') {
      listings = await prisma.listing.findMany({
        where: { carrierId: decoded.userId },
        orderBy: { departureDate: 'desc' },
      })
    }

    // Build iCalendar content
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YachtHop//Delivery Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:YachtHop Deliveries',
      'X-WR-TIMEZONE:UTC',
    ]

    const now = formatICSDate(new Date())

    // Add booking events
    for (const booking of bookings) {
      const departure = booking.listing.departureDate
      const arrival = booking.listing.estimatedArrival
      const startDate = formatICSDate(departure)
      const endDate = arrival
        ? formatICSDate(arrival)
        : formatICSDate(new Date(departure.getTime() + 24 * 60 * 60 * 1000))

      const descriptionParts = [
        booking.trackingCode ? `Tracking: ${booking.trackingCode}` : '',
        `Route: ${booking.listing.originPort} -> ${booking.listing.destinationPort}`,
        `Weight: ${booking.weightKg} kg`,
        `Volume: ${booking.volumeM3} m3`,
        `Status: ${booking.status}`,
        booking.specialHandling ? `Special Handling: ${booking.specialHandling}` : '',
      ].filter(Boolean)

      lines.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(booking.id, 'booking')}`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICS(booking.cargoDescription)}`,
        `LOCATION:${escapeICS(booking.listing.destinationPort)}`,
        `DESCRIPTION:${escapeICS(descriptionParts.join('\\n'))}`,
        `STATUS:${booking.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
        'END:VEVENT',
      )
    }

    // Add listing events for carriers
    for (const listing of listings) {
      const startDate = formatICSDate(listing.departureDate)
      const endDate = listing.estimatedArrival
        ? formatICSDate(listing.estimatedArrival)
        : formatICSDate(new Date(listing.departureDate.getTime() + 24 * 60 * 60 * 1000))

      lines.push(
        'BEGIN:VEVENT',
        `UID:${generateUID(listing.id, 'listing')}`,
        `DTSTAMP:${now}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICS(listing.title)}`,
        `LOCATION:${escapeICS(`${listing.originPort} -> ${listing.destinationPort}`)}`,
        `DESCRIPTION:${escapeICS(
          [
            `Route: ${listing.originPort} -> ${listing.destinationPort}`,
            `Vehicle: ${listing.vehicleType}${listing.vehicleName ? ' - ' + listing.vehicleName : ''}`,
            `Capacity: ${listing.availableKg}/${listing.totalCapacityKg} kg | ${listing.availableM3}/${listing.totalCapacityM3} m3`,
            `Status: ${listing.status}`,
          ].join('\\n')
        )}`,
        `STATUS:${listing.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
        'END:VEVENT',
      )
    }

    lines.push('END:VCALENDAR')

    const icsContent = lines.join('\r\n')

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="yachthop-calendar.ics"',
      },
    })
  } catch (error) {
    console.error('Calendar generation error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
