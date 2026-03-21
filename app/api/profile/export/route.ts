import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        bookings: true,
        listings: true,
        reviews: true,
        receivedReviews: true,
        sentMessages: true,
        savedAddresses: true,
        vehicles: true,
        documents: true,
        notifications: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Record the export request timestamp
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { dataExportRequestedAt: new Date() },
    })

    // Structure the export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        company: user.company,
        bio: user.bio,
        website: user.website,
        address: user.address,
        city: user.city,
        country: user.country,
        avatarUrl: user.avatarUrl,
        preferredLanguage: user.preferredLanguage,
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
        verified: user.verified,
        termsAcceptedAt: user.termsAcceptedAt,
        termsVersion: user.termsVersion,
        privacyAcceptedAt: user.privacyAcceptedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      bookings: user.bookings,
      listings: user.listings,
      reviews: user.reviews,
      receivedReviews: user.receivedReviews,
      messages: user.sentMessages,
      savedAddresses: user.savedAddresses,
      vehicles: user.vehicles,
      documents: user.documents,
      notifications: user.notifications,
    }

    // Audit log
    await logAudit({
      userId: decoded.userId,
      targetId: decoded.userId,
      action: 'DATA_EXPORT_REQUESTED',
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    })

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="onshore-deliver-data-export.json"',
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
