#!/usr/bin/env npx tsx
/**
 * List all users in the database
 *
 * Usage (run in Railway console or locally with DATABASE_URL set):
 *   npx tsx scripts/list-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true,
      verified: true,
      suspended: true,
      googleId: true,
      password: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (users.length === 0) {
    console.log('No users in database. You need to register an account first at /register')
    return
  }

  console.log(`Found ${users.length} user(s):\n`)
  users.forEach(u => {
    const authMethods = []
    if (u.password) authMethods.push('password')
    if (u.googleId) authMethods.push('google')
    console.log(`  ${u.email}`)
    console.log(`    Name: ${u.name} | Role: ${u.role}`)
    console.log(`    Auth: ${authMethods.join(', ') || 'none'} | Verified: ${u.verified} | Suspended: ${u.suspended}`)
    console.log(`    Created: ${u.createdAt.toISOString()} | Last login: ${u.lastLoginAt?.toISOString() || 'never'}`)
    console.log()
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
