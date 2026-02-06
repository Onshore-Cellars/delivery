import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

const VALID_ROLES = ['CARRIER', 'CUSTOMER', 'ADMIN']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, phone, company } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be CARRIER or CUSTOMER' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, phone, company },
      select: { id: true, email: true, name: true, role: true, phone: true, company: true, createdAt: true },
    })

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 })
  }
}
