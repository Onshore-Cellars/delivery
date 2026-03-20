import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'

const VALID_DOCUMENT_TYPES = [
  'DRIVERS_LICENSE',
  'PASSPORT',
  'NATIONAL_ID',
  'VEHICLE_REGISTRATION',
  'VEHICLE_INSURANCE',
  'GOODS_IN_TRANSIT_INSURANCE',
  'PORT_ACCESS_PERMIT',
  'DANGEROUS_GOODS_CERT',
  'OTHER',
]

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

    const documents = await prisma.document.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Documents fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      name,
      fileUrl,
      documentNumber,
      issuingCountry,
      issueDate,
      expiryDate,
    } = body

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: type and name are required' },
        { status: 400 }
      )
    }

    if (!VALID_DOCUMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const document = await prisma.document.create({
      data: {
        userId: decoded.userId,
        type,
        name,
        fileUrl: fileUrl || null,
        documentNumber: documentNumber || null,
        issuingCountry: issuingCountry || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('Document creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
