import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST() {
  const prisma = new PrismaClient()
  try {
    // Check if database already has users (already seeded)
    const userCount = await prisma.user.count()
    if (userCount > 0) {
      return NextResponse.json({ message: 'Database already initialized', userCount })
    }

    // Seed the database
    const hashedPassword = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.create({
      data: { email: 'admin@demo.com', name: 'Admin User', password: hashedPassword, role: 'ADMIN', company: 'DockDrop' },
    })

    const carrier1 = await prisma.user.create({
      data: { email: 'carrier@demo.com', name: 'Pierre Marine Supplies', password: hashedPassword, role: 'CARRIER', company: 'Pierre Marine Ltd', phone: '+33 6 12 34 56 78' },
    })

    const carrier2 = await prisma.user.create({
      data: { email: 'carrier2@demo.com', name: 'Sarah Chandlery', password: hashedPassword, role: 'CARRIER', company: 'Solent Yacht Supplies', phone: '+44 7700 900002' },
    })

    const customer1 = await prisma.user.create({
      data: { email: 'customer@demo.com', name: 'Captain James', password: hashedPassword, role: 'CUSTOMER', company: 'M/Y Blue Horizon', phone: '+44 7700 900003' },
    })

    const customer2 = await prisma.user.create({
      data: { email: 'customer2@demo.com', name: 'Elena Crew', password: hashedPassword, role: 'CUSTOMER', company: 'S/Y Wind Song', phone: '+34 612 345 678' },
    })

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000)
    const nextWeek = new Date(now.getTime() + 7 * 86400000)
    const in2Weeks = new Date(now.getTime() + 14 * 86400000)
    const in3Days = new Date(now.getTime() + 3 * 86400000)
    const in5Days = new Date(now.getTime() + 5 * 86400000)

    const listing1 = await prisma.vanListing.create({
      data: {
        carrierId: carrier1.id, vehicleType: 'Sprinter', licensePlate: 'FR-234-AB',
        originAddress: 'Nice Warehouse', destinationAddress: 'Port de Antibes Marina',
        departureDate: tomorrow, totalWeight: 500, totalVolume: 8, availableWeight: 350, availableVolume: 5.5,
        pricePerKg: 0.80, pricePerCubicMeter: 20,
      },
    })

    const listing2 = await prisma.vanListing.create({
      data: {
        carrierId: carrier2.id, vehicleType: 'Van',
        originAddress: 'Southampton Depot', destinationAddress: 'Hamble Point Marina',
        departureDate: in3Days, totalWeight: 300, totalVolume: 5, availableWeight: 300, availableVolume: 5,
        pricePerKg: 0.65,
      },
    })

    await prisma.vanListing.create({
      data: {
        carrierId: carrier1.id, vehicleType: 'Box Truck',
        originAddress: 'Marseille Port', destinationAddress: 'Port Vauban, Antibes',
        departureDate: nextWeek, totalWeight: 1000, totalVolume: 15, availableWeight: 1000, availableVolume: 15,
        fixedPrice: 150,
      },
    })

    await prisma.vanListing.create({
      data: {
        carrierId: carrier2.id, vehicleType: 'Sprinter',
        originAddress: 'Lymington Chandlery', destinationAddress: 'Cowes Marina, Isle of Wight',
        departureDate: in5Days, totalWeight: 400, totalVolume: 7, availableWeight: 400, availableVolume: 7,
        pricePerKg: 0.55, pricePerCubicMeter: 15,
      },
    })

    await prisma.vanListing.create({
      data: {
        carrierId: carrier1.id, vehicleType: 'Van',
        originAddress: 'Palma Supplies HQ', destinationAddress: 'Club de Mar, Palma',
        departureDate: in2Weeks, totalWeight: 350, totalVolume: 6, availableWeight: 350, availableVolume: 6,
        pricePerKg: 0.70,
      },
    })

    await prisma.booking.create({
      data: {
        listingId: listing1.id, shipperId: customer1.id, weightBooked: 100, volumeBooked: 2,
        itemDescription: 'Engine filters, impellers and spare belts for M/Y Blue Horizon',
        pickupAddress: 'Nice Warehouse', deliveryAddress: 'Port de Antibes, Berth 42',
        totalPrice: 100 * 0.80 + 2 * 20, status: 'CONFIRMED',
      },
    })

    await prisma.booking.create({
      data: {
        listingId: listing1.id, shipperId: customer2.id, weightBooked: 50, volumeBooked: 0.5,
        itemDescription: 'Navigation electronics - Garmin chartplotter + mounts',
        pickupAddress: 'Nice Warehouse', deliveryAddress: 'Port de Antibes, Berth 15',
        totalPrice: 50 * 0.80 + 0.5 * 20, status: 'PENDING',
      },
    })

    await prisma.booking.create({
      data: {
        listingId: listing2.id, shipperId: customer1.id, weightBooked: 75, volumeBooked: 1.5,
        itemDescription: 'Provisioning order - dry goods and galley supplies',
        pickupAddress: 'Southampton Depot', deliveryAddress: 'Hamble Point Marina, Pontoon C',
        totalPrice: 75 * 0.65, status: 'PENDING',
      },
    })

    await prisma.vanListing.update({
      where: { id: listing1.id },
      data: { availableWeight: 500 - 100 - 50, availableVolume: 8 - 2 - 0.5 },
    })

    return NextResponse.json({
      message: 'Database initialized successfully!',
      created: { users: 5, listings: 5, bookings: 3 },
      demo: {
        accounts: [
          { email: admin.email, role: 'Admin' },
          { email: carrier1.email, role: 'Supplier' },
          { email: carrier2.email, role: 'Supplier' },
          { email: customer1.email, role: 'Yacht Crew' },
          { email: customer2.email, role: 'Yacht Crew' },
        ],
        password: 'password123',
      },
    })
  } catch (error) {
    console.error('Setup error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Setup failed', details: message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  const prisma = new PrismaClient()
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({
      initialized: userCount > 0,
      userCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      initialized: false,
      error: 'Cannot connect to database',
      details: message,
    })
  } finally {
    await prisma.$disconnect()
  }
}
