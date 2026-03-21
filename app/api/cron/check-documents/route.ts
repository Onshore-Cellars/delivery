import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = request.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) return true
  const token = getTokenFromHeader(request.headers.get('authorization'))
  if (token) {
    const decoded = verifyToken(token)
    if (decoded?.role === 'ADMIN') return true
  }
  return false
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // 1. Find documents expiring within 30 days (still VERIFIED)
    const expiringDocs = await prisma.document.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow, gt: now },
        status: 'VERIFIED',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    for (const doc of expiringDocs) {
      const daysLeft = Math.ceil((doc.expiryDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      await prisma.notification.create({
        data: {
          userId: doc.userId,
          type: 'SYSTEM',
          title: 'Document Expiring Soon',
          message: `Your ${doc.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Please upload an updated document to maintain your verified status.`,
          linkUrl: '/profile',
        },
      }).catch(() => {})
    }

    // 2. Find expired documents — mark as EXPIRED
    const expiredDocs = await prisma.document.findMany({
      where: {
        expiryDate: { lte: now },
        status: 'VERIFIED',
      },
    })

    const expiredUserIds = new Set<string>()
    for (const doc of expiredDocs) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'EXPIRED', reviewNotes: 'Automatically expired by system' },
      })
      expiredUserIds.add(doc.userId)

      await prisma.notification.create({
        data: {
          userId: doc.userId,
          type: 'DOCUMENT_REJECTED',
          title: 'Document Expired',
          message: `Your ${doc.name} has expired. Please upload an updated document to continue operating on the platform.`,
          linkUrl: '/profile',
        },
      }).catch(() => {})
    }

    // 3. Unverify users with no valid documents left
    for (const userId of expiredUserIds) {
      const validDocs = await prisma.document.count({
        where: { userId, status: 'VERIFIED' },
      })
      if (validDocs === 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { verified: false },
        })
      }
    }

    // 4. Check vehicle MOT/insurance expiry
    const expiringVehicles = await prisma.vehicle.findMany({
      where: {
        active: true,
        OR: [
          { motExpiry: { lte: thirtyDaysFromNow, gt: now } },
          { insuranceExpiry: { lte: thirtyDaysFromNow, gt: now } },
        ],
      },
      include: { owner: { select: { id: true, name: true } } },
    })

    for (const vehicle of expiringVehicles) {
      const issues: string[] = []
      if (vehicle.motExpiry && vehicle.motExpiry <= thirtyDaysFromNow) {
        const days = Math.ceil((vehicle.motExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        issues.push(`MOT expires in ${days} day${days === 1 ? '' : 's'}`)
      }
      if (vehicle.insuranceExpiry && vehicle.insuranceExpiry <= thirtyDaysFromNow) {
        const days = Math.ceil((vehicle.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        issues.push(`Insurance expires in ${days} day${days === 1 ? '' : 's'}`)
      }

      await prisma.notification.create({
        data: {
          userId: vehicle.ownerId,
          type: 'SYSTEM',
          title: `Vehicle ${vehicle.registrationPlate}: Expiry Warning`,
          message: `${issues.join('. ')}. Update your vehicle details to continue listing.`,
          linkUrl: '/profile',
        },
      }).catch(() => {})
    }

    return NextResponse.json({
      processed: {
        expiringDocuments: expiringDocs.length,
        expiredDocuments: expiredDocs.length,
        usersUnverified: expiredUserIds.size,
        expiringVehicles: expiringVehicles.length,
      },
    })
  } catch (error) {
    console.error('[cron/check-documents] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
