import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
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
      company: 'VanShare',
    },
  })

  const carrier1 = await prisma.user.create({
    data: {
      email: 'carrier@demo.com',
      name: 'Mike Transport',
      password: hashedPassword,
      role: 'CARRIER',
      company: 'Mike\'s Vans',
      phone: '+44 7700 900001',
    },
  })

  const carrier2 = await prisma.user.create({
    data: {
      email: 'carrier2@demo.com',
      name: 'Sarah Logistics',
      password: hashedPassword,
      role: 'CARRIER',
      company: 'Swift Deliveries',
      phone: '+44 7700 900002',
    },
  })

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@demo.com',
      name: 'Jane Smith',
      password: hashedPassword,
      role: 'CUSTOMER',
      company: 'Home Furnishings Ltd',
      phone: '+44 7700 900003',
    },
  })

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@demo.com',
      name: 'Tom Wilson',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+44 7700 900004',
    },
  })

  console.log(`Created ${5} users`)

  // Create listings
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
      licensePlate: 'AB12 CDE',
      originAddress: 'London',
      destinationAddress: 'Manchester',
      departureDate: tomorrow,
      totalWeight: 500,
      totalVolume: 8,
      availableWeight: 350,
      availableVolume: 5.5,
      pricePerKg: 0.50,
      pricePerCubicMeter: 15,
    },
  })

  const listing2 = await prisma.vanListing.create({
    data: {
      carrierId: carrier1.id,
      vehicleType: 'Van',
      originAddress: 'Birmingham',
      destinationAddress: 'Leeds',
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
      carrierId: carrier2.id,
      vehicleType: 'Box Truck',
      originAddress: 'London',
      destinationAddress: 'Bristol',
      departureDate: nextWeek,
      totalWeight: 1000,
      totalVolume: 15,
      availableWeight: 1000,
      availableVolume: 15,
      fixedPrice: 120,
    },
  })

  await prisma.vanListing.create({
    data: {
      carrierId: carrier2.id,
      vehicleType: 'Sprinter',
      originAddress: 'Edinburgh',
      destinationAddress: 'Glasgow',
      departureDate: in5Days,
      totalWeight: 400,
      totalVolume: 7,
      availableWeight: 400,
      availableVolume: 7,
      pricePerKg: 0.40,
      pricePerCubicMeter: 12,
    },
  })

  await prisma.vanListing.create({
    data: {
      carrierId: carrier1.id,
      vehicleType: 'Van',
      originAddress: 'Manchester',
      destinationAddress: 'Liverpool',
      departureDate: in2Weeks,
      totalWeight: 250,
      totalVolume: 4,
      availableWeight: 250,
      availableVolume: 4,
      pricePerKg: 0.55,
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
      itemDescription: '4 boxes of home furnishings',
      pickupAddress: 'London',
      deliveryAddress: 'Manchester',
      totalPrice: 100 * 0.50 + 2 * 15,
      status: 'CONFIRMED',
    },
  })

  await prisma.booking.create({
    data: {
      listingId: listing1.id,
      shipperId: customer2.id,
      weightBooked: 50,
      volumeBooked: 0.5,
      itemDescription: '2 small packages - electronics',
      pickupAddress: 'London',
      deliveryAddress: 'Manchester',
      totalPrice: 50 * 0.50 + 0.5 * 15,
      status: 'PENDING',
    },
  })

  await prisma.booking.create({
    data: {
      listingId: listing2.id,
      shipperId: customer1.id,
      weightBooked: 75,
      volumeBooked: 1.5,
      itemDescription: 'Office supplies for new branch',
      pickupAddress: 'Birmingham',
      deliveryAddress: 'Leeds',
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
  console.log(`  Carrier:   ${carrier1.email}`)
  console.log(`  Carrier 2: ${carrier2.email}`)
  console.log(`  Customer:  ${customer1.email}`)
  console.log(`  Customer 2: ${customer2.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
