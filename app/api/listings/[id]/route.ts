import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET a single listing by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const listing = await prisma.vanListing.findUnique({
      where: { id },
      include: {
        carrier: {
          select: {
            id: true, name: true, company: true, email: true, phone: true, createdAt: true,
            _count: { select: { listings: true } },
          },
        },
        bookings: {
          include: {
            shipper: { select: { id: true, name: true } },
            review: { select: { id: true, rating: true, comment: true, reviewerId: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { bookings: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Calculate average rating from reviews on this listing's bookings
    const reviews = listing.bookings
      .map(b => b.review)
      .filter((r): r is NonNullable<typeof r> => r !== null)
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

    return NextResponse.json({ listing, avgRating, reviewCount: reviews.length })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
