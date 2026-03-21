import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import { evaluateSmartAlertMatch } from '@/lib/ai'

// ─── Haversine distance helper ──────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── POST /api/ai/smart-alerts ──────────────────────────────────────────────
// Evaluate new listings against saved alerts. Called by cron or admin panel.

export async function POST(req: NextRequest) {
  try {
    // ── Auth: either JWT token or cron secret header ──
    const cronSecret = req.headers.get('x-cron-secret')
    const isAuthorizedCron = cronSecret && process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET

    if (!isAuthorizedCron) {
      const token = getTokenFromHeader(req.headers.get('authorization'))
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const decoded = verifyToken(token)
      if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // ── 1. Fetch all active saved alerts ──
    const alerts = await prisma.savedAlert.findMany({
      where: { active: true },
    })

    if (alerts.length === 0) {
      return NextResponse.json({ processed: 0, matches: 0 })
    }

    // ── 2. Determine the earliest cutoff (24h ago or oldest lastTriggeredAt) ──
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const listings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { gte: twentyFourHoursAgo },
      },
    })

    if (listings.length === 0) {
      return NextResponse.json({ processed: alerts.length, matches: 0 })
    }

    let totalMatches = 0
    const notificationsToCreate: {
      userId: string
      title: string
      message: string
      linkUrl: string
      metadata: string
    }[] = []
    const alertUpdates: { id: string; triggerCount: number }[] = []

    // ── 3. For each alert, evaluate each new listing ──
    for (const alert of alerts) {
      // Only consider listings created after the alert's last trigger (or 24h ago)
      const alertCutoff = alert.lastTriggeredAt && alert.lastTriggeredAt > twentyFourHoursAgo
        ? alert.lastTriggeredAt
        : twentyFourHoursAgo

      const relevantListings = listings.filter(l => l.createdAt >= alertCutoff)
      let alertMatchCount = 0

      for (const listing of relevantListings) {
        let isMatch = true
        let isReturnLeg = false

        // ── (a) Origin port / location check ──
        if (alert.originPort) {
          if (alert.originLat != null && alert.originLng != null && listing.originLat != null && listing.originLng != null) {
            const distOrigin = haversineKm(alert.originLat, alert.originLng, listing.originLat, listing.originLng)
            if (distOrigin > alert.radiusKm) {
              isMatch = false
            }
          } else {
            // Fallback: exact port name match
            if (listing.originPort.toLowerCase() !== alert.originPort.toLowerCase()) {
              isMatch = false
            }
          }
        }

        // ── (b) Destination port / location check ──
        if (alert.destinationPort) {
          if (alert.destLat != null && alert.destLng != null && listing.destinationLat != null && listing.destinationLng != null) {
            const distDest = haversineKm(alert.destLat, alert.destLng, listing.destinationLat, listing.destinationLng)
            if (distDest > alert.radiusKm) {
              isMatch = false
            }
          } else {
            if (listing.destinationPort.toLowerCase() !== alert.destinationPort.toLowerCase()) {
              isMatch = false
            }
          }
        }

        // ── (c) Return leg logic ──
        // If the alert has an origin but NO destination, also check listings where
        // the listing's DESTINATION is near the alert's origin and the listing is
        // a RETURN or BOTH direction (carrier returning to user's area with empty space)
        if (!isMatch && alert.originPort && !alert.destinationPort) {
          if (listing.routeDirection === 'RETURN' || listing.routeDirection === 'BOTH') {
            let destinationNearAlertOrigin = false

            if (alert.originLat != null && alert.originLng != null && listing.destinationLat != null && listing.destinationLng != null) {
              const distReturnDest = haversineKm(alert.originLat, alert.originLng, listing.destinationLat, listing.destinationLng)
              destinationNearAlertOrigin = distReturnDest <= alert.radiusKm
            } else if (alert.originPort && listing.destinationPort) {
              destinationNearAlertOrigin = listing.destinationPort.toLowerCase() === alert.originPort.toLowerCase()
            }

            if (destinationNearAlertOrigin) {
              isMatch = true
              isReturnLeg = true
            }
          }
        }

        if (!isMatch) continue

        // ── (d) Direction filter ──
        if (alert.direction) {
          const alertDir = alert.direction.toUpperCase()
          const listingDir = listing.routeDirection // already enum string
          if (alertDir === 'OUTBOUND' && listingDir !== 'OUTBOUND' && listingDir !== 'BOTH') {
            continue
          }
          if (alertDir === 'RETURN' && listingDir !== 'RETURN' && listingDir !== 'BOTH') {
            continue
          }
          // 'both' matches everything, so no filter needed
        }

        // ── (e) Vehicle type ──
        if (alert.vehicleType) {
          if (listing.vehicleType.toLowerCase() !== alert.vehicleType.toLowerCase()) {
            continue
          }
        }

        // ── (f) Cargo type ──
        if (alert.cargoType && listing.acceptedCargo) {
          try {
            const acceptedCargo: string[] = JSON.parse(listing.acceptedCargo)
            const hasCargoType = acceptedCargo.some(
              (c: string) => c.toLowerCase() === alert.cargoType!.toLowerCase()
            )
            if (!hasCargoType) continue
          } catch {
            // If acceptedCargo is not valid JSON, skip this check
          }
        }

        // ── (g) Date range ──
        if (alert.dateFrom && listing.departureDate < alert.dateFrom) {
          continue
        }
        if (alert.dateTo && listing.departureDate > alert.dateTo) {
          continue
        }

        // ── (h) Max price per kg ──
        if (alert.maxPricePerKg != null && listing.pricePerKg != null) {
          if (listing.pricePerKg > alert.maxPricePerKg) {
            continue
          }
        }

        // ── (i) Min capacity ──
        if (alert.minCapacityKg != null) {
          if (listing.availableKg < alert.minCapacityKg) {
            continue
          }
        }

        // ── Match found! Create notification ──
        alertMatchCount++

        const routeLabel = `${listing.originPort} → ${listing.destinationPort}`
        const returnLegNote = isReturnLeg ? ' (Return leg opportunity)' : ''

        notificationsToCreate.push({
          userId: alert.userId,
          title: `New matching listing: ${routeLabel}${returnLegNote}`,
          message: isReturnLeg
            ? `A carrier returning to your area has available space on the ${routeLabel} route. Return legs are typically 30-50% cheaper!`
            : `A new listing matching your "${alert.name || 'Saved Alert'}" alert is available on the ${routeLabel} route.`,
          linkUrl: `/marketplace?listing=${listing.id}`,
          metadata: JSON.stringify({
            alertId: alert.id,
            listingId: listing.id,
            isReturnLeg,
            alertName: alert.name,
          }),
        })
      }

      if (alertMatchCount > 0) {
        totalMatches += alertMatchCount
        alertUpdates.push({
          id: alert.id,
          triggerCount: alert.triggerCount + alertMatchCount,
        })
      }
    }

    // ── 4. Batch create notifications ──
    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate.map(n => ({
          userId: n.userId,
          type: 'SYSTEM' as const,
          title: n.title,
          message: n.message,
          linkUrl: n.linkUrl,
          metadata: n.metadata,
        })),
      })
    }

    // ── 5. Batch update alert trigger counts and lastTriggeredAt ──
    if (alertUpdates.length > 0) {
      await Promise.all(
        alertUpdates.map(update =>
          prisma.savedAlert.update({
            where: { id: update.id },
            data: {
              lastTriggeredAt: new Date(),
              triggerCount: update.triggerCount,
            },
          })
        )
      )
    }

    return NextResponse.json({
      processed: alerts.length,
      matches: totalMatches,
    })
  } catch (error) {
    console.error('Smart alerts processing error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
