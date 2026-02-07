import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.vanListing.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      company: 'DockDrop',
    },
  })

  const carrier1 = await prisma.user.create({
    data: {
      email: 'carrier@demo.com',
      name: 'Pierre Marine Supplies',
      password: hashedPassword,
      role: 'CARRIER',
      company: 'Pierre Marine Ltd',
      phone: '+33 6 12 34 56 78',
    },
  })

  const carrier2 = await prisma.user.create({
    data: {
      email: 'carrier2@demo.com',
      name: 'Sarah Chandlery',
      password: hashedPassword,
      role: 'CARRIER',
      company: 'Solent Yacht Supplies',
      phone: '+44 7700 900002',
    },
  })

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      name: 'Captain James',
      password: hashedPassword,
      role: 'CUSTOMER',
      company: 'M/Y Blue Horizon',
      phone: '+44 7700 900003',
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@demo.com',
      name: 'Elena Crew',
      password: hashedPassword,
      role: 'CUSTOMER',
      company: 'S/Y Wind Song',
      phone: '+34 612 345 678',
    },
  })

  console.log('Created 5 users')

  // Create listings - yacht supply van routes
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)
  const nextWeek = new Date(now.getTime() + 7 * 86400000)
  const in2Weeks = new Date(now.getTime() + 14 * 86400000)
  const in3Days = new Date(now.getTime() + 3 * 86400000)
  const in5Days = new Date(now.getTime() + 5 * 86400000)

  const listing1 = await prisma.vanListing.create({
    data: {
      carrierId: carrier1.id,
      vehicleType: 'Sprinter',
      licensePlate: 'FR-234-AB',
      originAddress: 'Nice Warehouse',
      destinationAddress: 'Port de Antibes Marina',
      departureDate: tomorrow,
      totalWeight: 500,
      totalVolume: 8,
      availableWeight: 350,
      availableVolume: 5.5,
      pricePerKg: 0.80,
      pricePerCubicMeter: 20,
    },
  })

  const listing2 = await prisma.vanListing.create({
    data: {
      carrierId: carrier2.id,
      vehicleType: 'Van',
      originAddress: 'Southampton Depot',
      destinationAddress: 'Hamble Point Marina',
      departureDate: in3Days,
      totalWeight: 300,
      totalVolume: 5,
      availableWeight: 300,
      availableVolume: 5,
      pricePerKg: 0.65,
    },
  })

  await prisma.vanListing.create({
    data: {
      carrierId: carrier1.id,
      vehicleType: 'Box Truck',
      originAddress: 'Marseille Port',
      destinationAddress: 'Port Vauban, Antibes',
      departureDate: nextWeek,
      totalWeight: 1000,
      totalVolume: 15,
      availableWeight: 1000,
      availableVolume: 15,
      fixedPrice: 150,
    },
  })

  await prisma.vanListing.create({
    data: {
      carrierId: carrier2.id,
      vehicleType: 'Sprinter',
      originAddress: 'Lymington Chandlery',
      destinationAddress: 'Cowes Marina, Isle of Wight',
      departureDate: in5Days,
      totalWeight: 400,
      totalVolume: 7,
      availableWeight: 400,
      availableVolume: 7,
      pricePerKg: 0.55,
      pricePerCubicMeter: 15,
    },
  })

  await prisma.vanListing.create({
    data: {
      carrierId: carrier1.id,
      vehicleType: 'Van',
      originAddress: 'Palma Supplies HQ',
      destinationAddress: 'Club de Mar, Palma',
      departureDate: in2Weeks,
      totalWeight: 350,
      totalVolume: 6,
      availableWeight: 350,
      availableVolume: 6,
      pricePerKg: 0.70,
    },
  })

  console.log('Created 5 listings')

  // Create some bookings
  await prisma.booking.create({
    data: {
      listingId: listing1.id,
      shipperId: customer1.id,
      weightBooked: 100,
      volumeBooked: 2,
      itemDescription: 'Engine filters, impellers and spare belts for M/Y Blue Horizon',
      pickupAddress: 'Nice Warehouse',
      deliveryAddress: 'Port de Antibes, Berth 42',
      totalPrice: 100 * 0.80 + 2 * 20,
      status: 'CONFIRMED',
    },
  })

  await prisma.booking.create({
    data: {
      listingId: listing1.id,
      shipperId: customer2.id,
      weightBooked: 50,
      volumeBooked: 0.5,
      itemDescription: 'Navigation electronics - Garmin chartplotter + mounts',
      pickupAddress: 'Nice Warehouse',
      deliveryAddress: 'Port de Antibes, Berth 15',
      totalPrice: 50 * 0.80 + 0.5 * 20,
      status: 'PENDING',
    },
  })

  await prisma.booking.create({
    data: {
      listingId: listing2.id,
      shipperId: customer1.id,
      weightBooked: 75,
      volumeBooked: 1.5,
      itemDescription: 'Provisioning order - dry goods and galley supplies',
      pickupAddress: 'Southampton Depot',
      deliveryAddress: 'Hamble Point Marina, Pontoon C',
      totalPrice: 75 * 0.65,
      status: 'PENDING',
    },
  })

  console.log('Created 3 bookings')

  // Update listing1 available capacity to reflect bookings
  await prisma.vanListing.update({
    where: { id: listing1.id },
    data: {
      availableWeight: 500 - 100 - 50,
      availableVolume: 8 - 2 - 0.5,
    },
  })

  console.log('')
  console.log('=== Seed Complete ===')
  console.log('')
  console.log('Demo accounts (password: password123):')
  console.log(`  Admin:     ${admin.email}`)
  console.log(`  Supplier:  ${carrier1.email}`)
  console.log(`  Supplier 2: ${carrier2.email}`)
  console.log(`  Crew:      ${customer1.email}`)
  console.log(`  Crew 2:    ${customer2.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
